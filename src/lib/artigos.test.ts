import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { concursosCitadosDoArtigo, listarArtigos, obterArtigo, mapaDeArtigos } from "./artigos";
import { CONCURSOS } from "@/mocks/concursos";

const vazia = { itens: [], pagina: 1, porPagina: 12, total: 0, totalDePaginas: 0, contagemPorTipo: { concurso: 0, semanal_nacional: 0, semanal_uf: 0, prazos_semana: 0, mensal_escolaridade: 0 } };
const fetchApi = vi.fn<typeof fetch>();
beforeEach(() => { vi.stubGlobal("fetch", fetchApi); fetchApi.mockReset(); vi.stubEnv("BC_API_URL", "https://api.example/v1/"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("artigos da API", () => {
  it("sem API não inventa artigos nem consulta a rede", async () => {
    vi.stubEnv("BC_API_URL", "");
    expect(await listarArtigos({ pagina: 1 })).toEqual(vazia);
    expect(await obterArtigo("inexistente")).toBeNull();
    expect(await mapaDeArtigos()).toEqual([]);
    expect(fetchApi).not.toHaveBeenCalled();
  });
  it("usa o contrato paginado e preserva a busca escapada na URL", async () => {
    fetchApi.mockResolvedValue(Response.json(vazia));
    expect(await listarArtigos({ pagina: 1, q: "a & uf=SP", tipo: "concurso" })).toEqual(vazia);
    const [url, options] = fetchApi.mock.calls[0];
    const parsed = new URL(String(url));
    expect(parsed.pathname).toBe("/v1/artigos");
    expect(parsed.searchParams.get("q")).toBe("a & uf=SP");
    expect(parsed.searchParams.has("uf")).toBe(false);
    expect(options?.cache).toBe("no-store");
  });
  it("404 só significa ausência no detalhe", async () => {
    fetchApi.mockImplementation(async () => new Response(null, { status: 404 }));
    expect(await obterArtigo("sumiu")).toBeNull();
    await expect(listarArtigos({ pagina: 1 })).rejects.toThrow("404");
    await expect(mapaDeArtigos()).rejects.toThrow("404");
  });
  it("codifica o slug e extrai itens do mapa", async () => {
    fetchApi.mockResolvedValueOnce(Response.json({ slug: "a/b", secoes: [], emResumo: [], concursosCitados: [] }));
    expect((await obterArtigo("a/b"))?.slug).toBe("a/b");
    expect(fetchApi.mock.calls[0][0]).toBe("https://api.example/v1/artigos/a%2Fb");
    fetchApi.mockResolvedValueOnce(Response.json({ itens: [{ slug: "a" }] }));
    expect(await mapaDeArtigos()).toEqual([{ slug: "a" }]);
  });
  it("propaga erro de rede e sinais do Next sem mascará-los", async () => {
    const sinal = Object.assign(new Error("interrupção"), { digest: "NEXT_REDIRECT;replace;/;307;" });
    fetchApi.mockRejectedValue(sinal);
    await expect(listarArtigos({ pagina: 1 })).rejects.toBe(sinal);
    await expect(obterArtigo("a")).rejects.toBe(sinal);
    await expect(mapaDeArtigos()).rejects.toBe(sinal);
  });
  it("rejeita falhas HTTP e respostas sem o envelope esperado", async () => {
    fetchApi.mockImplementation(async () => new Response(null, { status: 503 }));
    await expect(obterArtigo("a")).rejects.toThrow("503");
    fetchApi.mockImplementation(async () => Response.json({}));
    await expect(listarArtigos({ pagina: 1 })).rejects.toThrow();
    await expect(obterArtigo("a")).rejects.toThrow();
    await expect(mapaDeArtigos()).rejects.toThrow();
  });
});

it("serializa concursoSlug para o link reverso sem alterar o caminho", async () => {
  fetchApi.mockResolvedValue(Response.json(vazia));
  await listarArtigos({ pagina: 1, concursoSlug: "orgao/concurso & uf=SP" });
  const url = new URL(String(fetchApi.mock.calls[0][0]));
  expect(url.pathname).toBe("/v1/artigos");
  expect(url.searchParams.get("concursoSlug")).toBe("orgao/concurso & uf=SP");
  expect(url.searchParams.has("uf")).toBe(false);
});

it("slug com NUL é ausência sem enviar a entrada inválida para a API", async () => {
  expect(await obterArtigo("concurso\u0000sp")).toBeNull();
  expect(fetchApi).not.toHaveBeenCalled();
});

describe("leituras da página do artigo", () => {
  const artigo = { slug: "a", secoes: [], emResumo: [], concursosCitados: [] };
  it("o artigo fica guardado por um dia: o texto publicado não muda", async () => {
    fetchApi.mockResolvedValue(Response.json(artigo));
    await obterArtigo("a");
    const opcoes = fetchApi.mock.calls[0][1];
    expect(opcoes?.next).toEqual({ revalidate: 86_400 });
    expect(opcoes?.cache).toBeUndefined();
  });
  it("a lista aceita validade, para a página guardada não ler com no-store", async () => {
    fetchApi.mockResolvedValue(Response.json(vazia));
    await listarArtigos({ pagina: 1, tipo: "prazos_semana" }, { validadeS: 300 });
    const opcoes = fetchApi.mock.calls[0][1];
    expect(opcoes?.next).toEqual({ revalidate: 300 });
    expect(opcoes?.cache).toBeUndefined();
  });
  it("lê os concursos citados numa requisição só, guardada por cinco minutos, sem travessão", async () => {
    const citado = { ...CONCURSOS[0], slug: "c1", titulo: "Edital \u2014 abertura", origens: [{ chave: "ato-1", url: null, titulo: "Ato \u2014 extrato", fonte: "DOU" }], editalCitadoUrl: "https://banca.example/edital" };
    fetchApi.mockResolvedValue(Response.json({ itens: [citado] }));
    const itens = await concursosCitadosDoArtigo("a/b");
    expect(fetchApi).toHaveBeenCalledTimes(1);
    expect(fetchApi.mock.calls[0][0]).toBe("https://api.example/v1/artigos/a%2Fb/concursos");
    expect(fetchApi.mock.calls[0][1]?.next).toEqual({ revalidate: 300 });
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({ slug: "c1", titulo: "Edital - abertura", editalCitadoUrl: "https://banca.example/edital" });
    expect(itens[0].origens).toEqual([{ chave: "ato-1", url: null, titulo: "Ato - extrato", fonte: "DOU" }]);
  });
  it("sem API não há citados; falha HTTP e envelope inválido lançam", async () => {
    fetchApi.mockImplementation(async () => new Response(null, { status: 404 }));
    await expect(concursosCitadosDoArtigo("a")).rejects.toThrow("404");
    fetchApi.mockImplementation(async () => Response.json({}));
    await expect(concursosCitadosDoArtigo("a")).rejects.toThrow("Resposta inválida");
    vi.stubEnv("BC_API_URL", "");
    expect(await concursosCitadosDoArtigo("a")).toEqual([]);
  });
});
