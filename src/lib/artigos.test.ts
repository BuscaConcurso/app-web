import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarArtigos, obterArtigo, mapaDeArtigos } from "./artigos";

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
