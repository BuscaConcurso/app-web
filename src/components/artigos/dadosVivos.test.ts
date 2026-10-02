import { beforeEach, describe, expect, it, vi } from "vitest";
import { carregarDadosDoArtigo } from "./dadosVivos";
import { artigoDeTeste } from "./artigos.fixtures";
import { CONCURSOS } from "@/mocks/concursos";
const { obterDetalhe, concursosCitadosDoArtigo } = vi.hoisted(() => ({ obterDetalhe: vi.fn(), concursosCitadosDoArtigo: vi.fn() }));
vi.mock("@/lib/concursos", () => ({ obterDetalhe }));
vi.mock("@/lib/artigos", () => ({ concursosCitadosDoArtigo }));
const canonico = { ...CONCURSOS[0], slug: "concurso-canonico", cargos: [], cronograma: [], origens: [], editalCitadoUrl: null };
const citado = (slug: string) => ({ ...CONCURSOS[0], slug, origens: [], editalCitadoUrl: null });
beforeEach(() => { obterDetalhe.mockReset(); concursosCitadosDoArtigo.mockReset(); });
describe("dados vivos editoriais", () => {
  it("resumo com 30 citados faz uma leitura só, sem pedir ficha nenhuma", async () => {
    const slugs = Array.from({ length: 30 }, (_, i) => `concurso-${i}`);
    concursosCitadosDoArtigo.mockResolvedValue(slugs.slice(0, 28).map(citado));
    const dados = await carregarDadosDoArtigo({ ...artigoDeTeste, tipo: "prazos_semana", concursoSlug: null, concursosCitados: slugs });
    expect(concursosCitadosDoArtigo).toHaveBeenCalledTimes(1);
    expect(concursosCitadosDoArtigo).toHaveBeenCalledWith(artigoDeTeste.slug);
    expect(obterDetalhe).not.toHaveBeenCalled();
    expect(dados.principal).toBeNull();
    expect(dados.citados.map(c => c.slug)).toEqual(slugs.slice(0, 28));
    expect(dados.indisponiveis).toBe(2);
  });
  it("artigo de concurso lê a ficha do principal, guardada, e os citados em lote", async () => {
    obterDetalhe.mockResolvedValue(canonico);
    concursosCitadosDoArtigo.mockResolvedValue([citado("concurso-canonico")]);
    const dados = await carregarDadosDoArtigo(artigoDeTeste);
    expect(obterDetalhe).toHaveBeenCalledTimes(1);
    expect(obterDetalhe).toHaveBeenCalledWith("concurso-antigo", { validadeS: 300 });
    expect(dados.principal?.slug).toBe("concurso-canonico");
    expect(dados.citados.map(c => c.slug)).toEqual(["concurso-canonico"]);
    expect(dados.indisponiveis).toBe(1);
  });
  it("artigo sem citados não consulta a rota dos citados", async () => {
    const dados = await carregarDadosDoArtigo({ ...artigoDeTeste, concursoSlug: null, concursosCitados: [] });
    expect(concursosCitadosDoArtigo).not.toHaveBeenCalled();
    expect(dados).toEqual({ principal: null, citados: [], indisponiveis: 0 });
  });
  it("falhas de concurso preservam artigo com aviso, interrupções Next propagam", async () => {
    obterDetalhe.mockRejectedValue(new Error("offline"));
    concursosCitadosDoArtigo.mockRejectedValue(new Error("offline"));
    expect(await carregarDadosDoArtigo(artigoDeTeste)).toEqual({ principal: null, citados: [], indisponiveis: 2 });
    const sinal = Object.assign(new Error("not found"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    obterDetalhe.mockRejectedValue(sinal);
    await expect(carregarDadosDoArtigo(artigoDeTeste)).rejects.toBe(sinal);
    obterDetalhe.mockResolvedValue(canonico);
    concursosCitadosDoArtigo.mockRejectedValue(sinal);
    await expect(carregarDadosDoArtigo(artigoDeTeste)).rejects.toBe(sinal);
  });
});
