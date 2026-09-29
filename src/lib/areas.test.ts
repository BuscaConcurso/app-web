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

  it("exceto no órgão ou no título tira o concurso inteiro", () => {
    // Tribunal de Contas é fiscal e controle, não tribunal do Judiciário.
    expect(casaComArea(concurso({ orgao: "Tribunal de Contas da União" }), area("tribunais"))).toBe(false);
    expect(casaComArea(concurso({ orgao: "Tribunal de Contas da União" }), area("fiscal-e-controle"))).toBe(true);
  });

  it("exceto num cargo tira só aquele cargo", () => {
    const saude = area("saude");
    expect(casaComArea(concurso({ cargos: ["Médico Veterinário"] }), saude)).toBe(false);
    expect(casaComArea(concurso({ cargos: ["Médico Veterinário", "Médico/Clínico Geral"] }), saude)).toBe(true);
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

/**
 * Casos tirados da conferência contra o acervo local (28/09/2026), com
 * título, órgão e cargos copiados do `/acervo`. O que cada área errava antes
 * do ajuste, e por quê, está na tabela de aceite do plano
 * (`docs/superpowers/plans/2026-09-28-concursos-por-area.md`).
 */
describe("casos reais do acervo", () => {
  function casa(slug: string, dados: Parameters<typeof concurso>[0]): boolean {
    return casaComArea(concurso(dados), area(slug));
  }

  it("Tribunais: TRE e TRF entram; TCU e o fundo de pensão do Judiciário não", () => {
    expect(casa("tribunais", { orgao: "Tribunal Regional Eleitoral do Mato Grosso do Sul", cargos: ["Analista Judiciário - Área Judiciária"] })).toBe(true);
    expect(casa("tribunais", { titulo: "Tribunal Regional Eleitoral de Mato Grosso do Sul", orgao: "Poder Judiciário" })).toBe(true);
    expect(casa("tribunais", { orgao: "Tribunal de Contas da União" })).toBe(false);
    expect(
      casa("tribunais", {
        titulo: "Funpresp-Jud \u2014 Edital nº 8",
        orgao: "Fundação de Previdência Complementar do Servidor Público Federal do Poder Judiciário",
        cargos: ["Advogado", "Analista de Tecnologia da Informação"],
      }),
    ).toBe(false);
  });

  it("Polícia: PF, polícia penal e polícia judicial entram; conselheiro do MJSP não", () => {
    expect(casa("policia-e-seguranca", { orgao: "Polícia Rodoviária Federal", cargos: ["Policial Rodoviário Federal"] })).toBe(true);
    expect(casa("policia-e-seguranca", { titulo: "DEPEN \u2014 Edital nº 91", orgao: "Ministério da Justiça e Segurança Pública", cargos: ["Agente Federal de Execução Penal"] })).toBe(true);
    expect(casa("policia-e-seguranca", { orgao: "Tribunal Regional Federal da 6ª Região", cargos: ["Técnico Judiciário - Agente da Polícia Judicial"] })).toBe(true);
    expect(
      casa("policia-e-seguranca", {
        titulo: "Ministério da Justiça e Segurança Pública \u2014 Edital nº 1/2026",
        orgao: "Ministério da Justiça e Segurança Pública",
        cargos: ["Conselheiro do CNPD - Representante de Entidades da Sociedade Civil com Atuação em Proteção de Dados Pessoais"],
      }),
    ).toBe(false);
  });

  it("Educação: universidade, IF e professor fora deles entram; órgão sem ensino não", () => {
    expect(casa("educacao", { orgao: "Universidade Tecnológica Federal do Paraná", cargos: ["Professor do Magistério Federal Substituto"] })).toBe(true);
    expect(casa("educacao", { orgao: "Colégio Pedro II" })).toBe(true);
    expect(casa("educacao", { orgao: "Instituto Benjamin Constant", cargos: ["Professor Substituto"] })).toBe(true);
    expect(casa("educacao", { orgao: "Agência Nacional de Transportes Terrestres", cargos: ["Especialista em Regulação"] })).toBe(false);
  });

  it("Saúde: hospital e médico entram; só veterinário não", () => {
    expect(casa("saude", { orgao: "Associação das Pioneiras Sociais", cargos: ["Médico - especialidade Urologia"] })).toBe(true);
    expect(casa("saude", { orgao: "Universidade Federal de Pernambuco", cargos: ["ODONTÓLOGO - 30 HORAS - DL 1445-76/ Área: Cirurgia"] })).toBe(true);
    expect(casa("saude", { orgao: "Fundação Universidade Federal de Viçosa", cargos: ["Médico Veterinário/Clínica Médica de Cães e Gatos"] })).toBe(false);
    expect(casa("saude", { orgao: "Conselho Regional de Medicina Veterinária do Estado de São Paulo", cargos: ["Fiscal Médico Veterinário"] })).toBe(false);
  });

  it("Fiscal e controle: Receita, TCU e auditor entram; analista comum não", () => {
    expect(casa("fiscal-e-controle", { orgao: "Secretaria Especial da Receita Federal do Brasil" })).toBe(true);
    expect(casa("fiscal-e-controle", { orgao: "Ministério do Trabalho e Emprego", cargos: ["Auditor-Fiscal do Trabalho"] })).toBe(true);
    expect(casa("fiscal-e-controle", { orgao: "Ministério da Fazenda", cargos: ["Auditor Federal de Finanças de Controle"] })).toBe(true);
    expect(casa("fiscal-e-controle", { orgao: "Ministério da Fazenda", cargos: ["Analista Técnico-Administrativo"] })).toBe(false);
  });

  it("Bancos e estatais: banco e empresa pública entram; banco de talentos não", () => {
    expect(casa("bancos-e-estatais", { orgao: "Caixa Econômica Federal" })).toBe(true);
    expect(casa("bancos-e-estatais", { orgao: "BANCO REGIONAL DE DESENVOLVIMENTO DO EXTREMO SUL" })).toBe(true);
    expect(casa("bancos-e-estatais", { orgao: "Empresa de Tecnologia e Informações da Previdência" })).toBe(true);
    expect(casa("bancos-e-estatais", { titulo: "Banco de Talentos \u2014 Edital nº 2/2026", orgao: "Prefeitura Municipal de Sabará" })).toBe(false);
  });

  it("Forças Armadas: comandos e colégio militar entram; Superior Tribunal Militar não", () => {
    expect(casa("forcas-armadas", { orgao: "Comando de Operações Navais" })).toBe(true);
    expect(casa("forcas-armadas", { orgao: "Colégio Militar de Belém" })).toBe(true);
    expect(casa("forcas-armadas", { orgao: "Superior Tribunal Militar", cargos: ["Analista Judiciário - Área: Judiciária"] })).toBe(false);
  });

  it("Prefeituras: prefeitura e município entram; órgão federal não", () => {
    expect(casa("prefeituras", { orgao: "PREFEITURA MUNICIPAL DE GUIMARÂNIA" })).toBe(true);
    expect(casa("prefeituras", { titulo: "Município de Caldas Novas \u2014 Edital nº 33/2026", orgao: "Município de Caldas Novas" })).toBe(true);
    expect(casa("prefeituras", { orgao: "Ministério das Cidades" })).toBe(false);
  });

  it("Conselhos: conselho profissional entra; CNJ e CNPq não", () => {
    expect(casa("conselhos", { orgao: "CONSELHO REGIONAL DE ENFERMAGEM DO PIAUÍ" })).toBe(true);
    expect(casa("conselhos", { orgao: "Conselho de Arquitetura e Urbanismo do Brasil", sigla: "CAU/BR" })).toBe(true);
    expect(casa("conselhos", { orgao: "Conselho Nacional de Justiça" })).toBe(false);
    expect(casa("conselhos", { orgao: "Conselho Nacional de Desenvolvimento Científico e Tecnológico" })).toBe(false);
  });

  it("Tecnologia: analista e técnico de TI entram; professor de informática não", () => {
    expect(casa("tecnologia", { orgao: "Fundação Instituto Brasileiro de Geografia e Estatística", cargos: ["Agente Censitário de Informática"] })).toBe(true);
    expect(casa("tecnologia", { orgao: "Universidade Federal do Rio de Janeiro", cargos: ["Técnico de Tecnologia da Informação"] })).toBe(true);
    expect(casa("tecnologia", { orgao: "Instituto Federal de Educação, Ciência e Tecnologia do Paraná", cargos: ["Professor Substituto - Informática"] })).toBe(false);
    expect(casa("tecnologia", { orgao: "Instituto Federal de Educação, Ciência e Tecnologia do Paraná", cargos: ["Informática"] })).toBe(false);
  });

  it("Administrativo: assistente e administrador entram; administrador de redes não", () => {
    expect(casa("administrativo", { orgao: "Universidade Federal do Rio de Janeiro", cargos: ["Assistente em Administração"] })).toBe(true);
    expect(casa("administrativo", { orgao: "Fundação Escola Nacional de Administração Pública", cargos: ["Analista Técnico-Administrativo"] })).toBe(true);
    expect(casa("administrativo", { orgao: "Companhia Docas do Pará", cargos: ["PAS - Analista de TI - Administrador de Redes"] })).toBe(false);
  });

  it("Ambiente e agro: IBAMA, agrônomo e veterinário entram; engenheiro civil não", () => {
    expect(casa("ambiente-e-agro", { orgao: "Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis" })).toBe(true);
    expect(casa("ambiente-e-agro", { orgao: "Universidade Federal Rural do Rio de Janeiro", cargos: ["Médico Veterinário e Zootecnista"] })).toBe(true);
    expect(casa("ambiente-e-agro", { orgao: "Ministério da Pesca e Aquicultura", cargos: ["Engenheiro de Pesca"] })).toBe(true);
    expect(casa("ambiente-e-agro", { orgao: "Universidade Federal do Paraná", cargos: ["Engenheiro/Área: Civil"] })).toBe(false);
  });
});
