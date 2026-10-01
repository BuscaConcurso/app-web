import { beforeEach, describe, expect, it, vi } from "vitest";
import { carregarDadosDoArtigo } from "./dadosVivos";
import { artigoDeTeste } from "./artigos.fixtures";
import { CONCURSOS } from "@/mocks/concursos";
const { obterDetalhe } = vi.hoisted(() => ({ obterDetalhe: vi.fn() }));
vi.mock("@/lib/concursos", () => ({ obterDetalhe }));
const canonico = { ...CONCURSOS[0], slug: "concurso-canonico", cargos: [], cronograma: [], origens: [], editalCitadoUrl: null };
beforeEach(() => { obterDetalhe.mockReset(); });
describe("dados vivos editoriais", () => {
  it("usa o slug canônico retornado, deduplica aliases e respeita ausência", async () => {
    obterDetalhe.mockImplementation(async (slug) => slug === "concurso-ausente" ? null : canonico);
    const dados = await carregarDadosDoArtigo({ ...artigoDeTeste, concursosCitados: ["concurso-antigo", "outro-alias", "concurso-ausente"] });
    expect(dados.principal?.slug).toBe("concurso-canonico");
    expect(dados.citados.map(c => c.slug)).toEqual(["concurso-canonico"]);
    expect(dados.indisponiveis).toBe(1);
  });
  it("falhas de concurso preservam artigo com aviso, interrupções Next propagam", async () => {
    obterDetalhe.mockRejectedValue(new Error("offline"));
    expect(await carregarDadosDoArtigo(artigoDeTeste)).toEqual({ principal: null, citados: [], indisponiveis: 2 });
    const sinal = Object.assign(new Error("not found"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    obterDetalhe.mockRejectedValue(sinal);
    await expect(carregarDadosDoArtigo(artigoDeTeste)).rejects.toBe(sinal);
  });
});
