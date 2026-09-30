import { describe, expect, it } from "vitest";
import { AREAS } from "./areas";
import { areasDaApi } from "./areasDaApi";
import type { ConcursoResumo } from "./dominio";
import { CONCURSOS } from "@/mocks/concursos";

const HOJE = new Date(2026, 8, 29);

/** Um concurso com o que a regra da área e a situação leem; o resto vem do mock. */
function concurso(
  slug: string,
  { orgao, cargos = [], status = "inscricoes_abertas", ate = "2026-10-10" }: {
    orgao: string;
    cargos?: string[];
    status?: ConcursoResumo["status"];
    ate?: string | null;
  },
): ConcursoResumo {
  const base = CONCURSOS[0];
  return {
    ...base,
    slug,
    titulo: `Edital de ${orgao}`,
    orgao: { ...base.orgao, nome: orgao, sigla: null },
    nomesDeCargo: cargos,
    status,
    inscricoesAte: ate,
  };
}

function concursosDa(resposta: ReturnType<typeof areasDaApi>, slug: string): string[] {
  return resposta.areas.find((area) => area.slug === slug)?.concursos ?? [];
}

describe("areasDaApi", () => {
  const acervo = [
    concurso("tj-aberto", { orgao: "Tribunal de Justiça do Acre" }),
    concurso("hospital-previsto", { orgao: "Hospital Universitário X", status: "previsto", ate: null }),
    concurso("trf-encerrado", { orgao: "Tribunal Regional Federal", status: "homologado" }),
    concurso("trt-vencido", { orgao: "Tribunal Regional do Trabalho", ate: "2026-09-01" }),
    concurso("tre-ti", { orgao: "Tribunal Regional Eleitoral", cargos: ["Analista de Tecnologia da Informação"] }),
  ];
  const resposta = areasDaApi(acervo, HOJE);

  it("traz as 12 áreas na ordem do app, com slug e nome", () => {
    expect(resposta.areas.map(({ slug, nome }) => ({ slug, nome }))).toEqual(
      AREAS.map(({ slug, nome }) => ({ slug, nome })),
    );
  });

  it("põe abertos e previstos na área deles", () => {
    expect(concursosDa(resposta, "tribunais")).toEqual(["tj-aberto", "tre-ti"]);
    expect(concursosDa(resposta, "saude")).toEqual(["hospital-previsto"]);
  });

  it("deixa de fora o encerrado e o aberto com prazo vencido", () => {
    const todos = resposta.areas.flatMap((area) => area.concursos);
    expect(todos).not.toContain("trf-encerrado");
    expect(todos).not.toContain("trt-vencido");
  });

  it("um concurso pode estar em mais de uma área", () => {
    expect(concursosDa(resposta, "tecnologia")).toEqual(["tre-ti"]);
  });

  it("área sem concurso vem com lista vazia", () => {
    expect(concursosDa(resposta, "conselhos")).toEqual([]);
  });
});
