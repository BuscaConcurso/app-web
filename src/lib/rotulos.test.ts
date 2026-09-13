import { describe, expect, it } from "vitest";
import type { ConcursoDetalhe } from "./dominio";
import { linhaDeContexto, textoDeRodape, tituloComOrgao } from "./rotulos";

describe("tituloComOrgao", () => {
  it("órgão sem sigla não deixa dois-pontos solto no começo", () => {
    // Era assim que o título da aba e o `og:title` saíam com o acervo real:
    // ": EDITAL Nº 1, DE 12 DE MAIO DE 2026".
    expect(tituloComOrgao(null, "EDITAL Nº 1")).toBe("EDITAL Nº 1");
  });

  it("com sigla, o título continua o do canvas", () => {
    expect(tituloComOrgao("TJSP", "Analista judiciário")).toBe(
      "TJSP: Analista judiciário",
    );
  });
});

/**
 * A linha de contexto do cartão ("Estadual · Judiciário · São Paulo, SP") com
 * o órgão como o acervo do engine o entrega hoje: sem esfera em nenhum dos
 * 1.332 órgãos, e sem `poder`, que não existe no banco. Os dois campos são
 * anuláveis no tipo justamente por isso, e este teste fixa o que a tela faz
 * com a ausência.
 */
describe("linhaDeContexto", () => {
  it("órgão sem esfera e sem poder não vira separador vazio", () => {
    const linha = linhaDeContexto({
      esfera: null,
      poder: null,
      uf: null,
      municipio: null,
    });

    expect(linha).toBe("Nacional");
    expect(linha).not.toContain(" · ");
  });

  it("com esfera e poder, a linha continua a do canvas", () => {
    expect(
      linhaDeContexto({
        esfera: "estadual",
        poder: "judiciario",
        uf: "SP",
        municipio: "São Paulo",
      }),
    ).toBe("Estadual · Judiciário · São Paulo, SP");
  });
});

describe("textoDeRodape", () => {
  const BASE = {
    slug: "x",
    titulo: "Edital nº 1",
    tipo: "concurso_publico",
    status: "previsto",
    orgao: {
      slug: "o",
      nome: "Órgão",
      sigla: null,
      esfera: null,
      poder: null,
      uf: null,
      municipio: null,
    },
    banca: null,
    uf: null,
    inscricoesDe: null,
    inscricoesAte: null,
    publicadoEm: null,
    previstoPara: null,
    vagas: null,
    cadastroReserva: false,
    salarioAte: null,
    taxaInscricao: null,
    escolaridades: [],
    editalUrl: null,
    cronograma: [],
    cargos: [],
    origens: [],
  } satisfies ConcursoDetalhe;

  const CARGO = {
    nome: "Professor",
    codigo: null,
    escolaridade: null,
    area: null,
    jornadaHoras: null,
    requisitos: [],
    taxaInscricao: null,
    vagas: [],
    remuneracoes: [],
    evidencia: [],
  };

  const EVENTO = {
    tipo: "publicacao_edital",
    inicio: "2026-05-13",
    fim: null,
    hora: null,
    localidades: [],
    observacao: null,
    evidencia: "EDITAL Nº 1",
  } satisfies ConcursoDetalhe["cronograma"][number];

  it("não fala mais de API não conectada, e manda conferir na banca", () => {
    const texto = textoDeRodape({ ...BASE, cronograma: [EVENTO] });

    expect(texto).not.toContain("API");
    expect(texto).not.toContain("PDF do edital");
    expect(texto).toContain("site da banca");
    expect(texto).toContain("o cronograma");
  });

  it("diz o que existe neste concurso, não o que existe em geral", () => {
    const so_cargos = textoDeRodape({ ...BASE, cargos: [CARGO] });
    const os_dois = textoDeRodape({
      ...BASE,
      cargos: [CARGO],
      cronograma: [EVENTO],
    });

    expect(so_cargos).toContain("os cargos");
    expect(so_cargos).not.toContain("o cronograma");
    expect(os_dois).toContain("o cronograma e os cargos");
  });

  it("concurso ainda não lido não promete conteúdo nenhum", () => {
    const texto = textoDeRodape(BASE);

    expect(texto).toContain("ainda não foi lido");
    expect(texto).not.toContain("Esta página mostra");
  });

  it("remuneração ausente é dita, em vez de ficar por conta do leitor", () => {
    const sem = textoDeRodape({ ...BASE, cargos: [CARGO] });
    const com = textoDeRodape({
      ...BASE,
      cargos: [
        {
          ...CARGO,
          remuneracoes: [
            { base: 9000, total: null, tipo: "mensal", observacao: null },
          ],
        },
      ],
    });

    expect(sem).toContain("O ato não informou remuneração.");
    expect(com).not.toContain("não informou remuneração");
  });
});
