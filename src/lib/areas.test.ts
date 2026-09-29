import { describe, expect, it } from "vitest";
import { AREAS, areaDoSlug, casaComArea, hrefDaArea } from "./areas";
import type { ConcursoResumo } from "./dominio";
import { CONCURSOS } from "@/mocks/concursos";

/**
 * Um concurso só com o que a regra lê: título, órgão (nome e sigla) e cargos.
 * O resto vem do primeiro do mock, que a regra não olha.
 */
function concurso({
  titulo = "Edital nº 1/2026",
  orgao = "Órgão qualquer",
  sigla = null,
  cargos = [],
}: {
  titulo?: string;
  orgao?: string;
  sigla?: string | null;
  cargos?: string[];
}): ConcursoResumo {
  const base = CONCURSOS[0];
  return {
    ...base,
    slug: `teste-${titulo}-${orgao}`,
    titulo,
    orgao: { ...base.orgao, nome: orgao, sigla },
    nomesDeCargo: cargos,
  };
}

function area(slug: string) {
  const encontrada = areaDoSlug(slug);
  if (!encontrada) throw new Error(`área ${slug} não existe`);
  return encontrada;
}

describe("AREAS", () => {
  it("são as 12 do protótipo, na ordem", () => {
    expect(AREAS.map((a) => a.nome)).toEqual([
      "Tribunais", "Polícia e segurança", "Educação", "Saúde", "Fiscal e controle",
      "Bancos e estatais", "Forças Armadas", "Prefeituras", "Conselhos", "Tecnologia",
      "Administrativo", "Ambiente e agro",
    ]);
  });

  it("os slugs são únicos, minúsculos e sem acento", () => {
    const slugs = AREAS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(12);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("toda área tem pelo menos um termo de órgão, cargo ou título", () => {
    for (const a of AREAS) {
      const { orgao = [], cargo = [], titulo = [] } = a.regra;
      expect(orgao.length + cargo.length + titulo.length, a.slug).toBeGreaterThan(0);
    }
  });

  it("cada área leva à própria página", () => {
    expect(hrefDaArea(AREAS[0])).toBe("/areas/tribunais");
    for (const a of AREAS) expect(hrefDaArea(a)).toBe(`/areas/${a.slug}`);
  });
});

describe("areaDoSlug", () => {
  it("acha a área pelo slug", () => {
    expect(areaDoSlug("saude")?.nome).toBe("Saúde");
  });

  it("slug desconhecido, com maiúscula ou herdado do protótipo é null", () => {
    expect(areaDoSlug("banana")).toBeNull();
    expect(areaDoSlug("Saude")).toBeNull();
    expect(areaDoSlug("constructor")).toBeNull();
    expect(areaDoSlug("")).toBeNull();
  });
});

describe("casaComArea", () => {
  it("casa por palavra inteira, não por pedaço de palavra", () => {
    const tecnologia = area("tecnologia");
    expect(casaComArea(concurso({ cargos: ["Analista de Tecnologia da Informação"] }), tecnologia)).toBe(true);
    // "informatica" não pode casar dentro de "desinformatica".
    expect(casaComArea(concurso({ cargos: ["Técnico em Desinformática"] }), tecnologia)).toBe(false);
  });

  it("ignora acento e caixa", () => {
    expect(casaComArea(concurso({ orgao: "TRIBUNAL REGIONAL FEDERAL DA 1ª REGIÃO" }), area("tribunais"))).toBe(true);
  });

  it("hífen e pontuação viram espaço", () => {
    expect(
      casaComArea(
        concurso({ titulo: "Concurso para Técnico-Administrativo em Educação" }),
        area("administrativo"),
      ),
    ).toBe(true);
  });

  it("exceto tira o concurso, casando em qualquer campo", () => {
    // Tribunal de Contas é fiscal e controle, não tribunal do Judiciário.
    expect(casaComArea(concurso({ orgao: "Tribunal de Contas da União" }), area("tribunais"))).toBe(false);
    expect(casaComArea(concurso({ orgao: "Tribunal de Contas da União" }), area("fiscal-e-controle"))).toBe(true);
  });

  it("um concurso pode estar em mais de uma área", () => {
    const tribunalComTi = concurso({
      orgao: "Tribunal Regional Eleitoral de Minas Gerais",
      cargos: ["Analista Judiciário - Tecnologia da Informação"],
    });
    expect(casaComArea(tribunalComTi, area("tribunais"))).toBe(true);
    expect(casaComArea(tribunalComTi, area("tecnologia"))).toBe(true);
  });

  it("concurso sem cargo e sem sigla não lança e casa pelo que tem", () => {
    const semNada = concurso({ orgao: "Polícia Federal", sigla: null, cargos: [] });
    expect(casaComArea(semNada, area("policia-e-seguranca"))).toBe(true);
    expect(() => AREAS.map((a) => casaComArea(concurso({}), a))).not.toThrow();
  });

  it("a sigla do órgão conta como o nome", () => {
    expect(casaComArea(concurso({ orgao: "Autarquia qualquer", sigla: "ICMBio" }), area("ambiente-e-agro"))).toBe(true);
  });
});
