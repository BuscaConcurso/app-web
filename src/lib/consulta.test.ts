import { describe, expect, it } from "vitest";
import type { ConcursoResumo, Escolaridade, Uf } from "./dominio";
import { filtrar, normalizar, ordenar } from "./consulta";

const HOJE = new Date(2026, 3, 10, 9, 0);

let contador = 0;

function fixture(parcial: Partial<ConcursoResumo> = {}): ConcursoResumo {
  contador += 1;
  return {
    slug: `concurso-${contador}`,
    titulo: "Analista judiciário",
    tipo: "concurso_publico",
    status: "inscricoes_abertas",
    orgao: {
      slug: "tjsp",
      nome: "Tribunal de Justiça de São Paulo",
      sigla: "TJSP",
      esfera: "estadual",
      poder: "judiciario",
      uf: "SP",
      municipio: "São Paulo",
    },
    banca: { slug: "vunesp", nome: "Vunesp" },
    uf: "SP",
    inscricoesDe: "2026-03-01",
    inscricoesAte: "2026-05-01",
    publicadoEm: "2026-02-20",
    previstoPara: null,
    vagas: 100,
    cadastroReserva: false,
    salarioAte: 10000,
    taxaInscricao: 90,
    escolaridades: ["superior"],
    editalUrl: null,
    ...parcial,
  };
}

describe("normalizar", () => {
  it("tira acento e caixa", () => {
    expect(normalizar("São Paulo")).toBe("sao paulo");
    expect(normalizar("  JUDICIÁRIO ")).toBe("judiciario");
  });
});

describe("filtrar", () => {
  it("acha sem acento e exige todos os termos", () => {
    const itens = [
      fixture({ titulo: "Analista judiciário" }),
      fixture({ titulo: "Técnico judiciário" }),
    ];
    expect(filtrar(itens, { q: "analista judiciario" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "judiciario" }, HOJE)).toHaveLength(2);
    expect(filtrar(itens, { q: "analista fiscal" }, HOJE)).toHaveLength(0);
  });

  it("busca também pelo órgão e pela banca", () => {
    const itens = [fixture()];
    expect(filtrar(itens, { q: "tjsp" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "vunesp" }, HOJE)).toHaveLength(1);
  });

  it("combina estado com escolaridade", () => {
    const itens = [
      fixture({ uf: "SP", escolaridades: ["superior"] }),
      fixture({ uf: "SP", escolaridades: ["medio"] }),
      fixture({ uf: "RJ" as Uf, escolaridades: ["superior"] }),
    ];
    const achados = filtrar(
      itens,
      { uf: "SP", escolaridade: "superior" as Escolaridade },
      HOJE,
    );
    expect(achados).toHaveLength(1);
    expect(achados[0].uf).toBe("SP");
    expect(achados[0].escolaridades).toContain("superior");
  });

  it("agrupa urgente e aberto sob inscrições abertas", () => {
    const itens = [
      fixture({ inscricoesAte: "2026-04-12" }),
      fixture({ inscricoesAte: "2026-06-12" }),
      fixture({ status: "previsto", inscricoesAte: null }),
      fixture({ status: "encerrado", inscricoesAte: "2026-01-10" }),
    ];
    expect(filtrar(itens, { situacao: "abertas" }, HOJE)).toHaveLength(2);
    expect(filtrar(itens, { situacao: "previstos" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { situacao: "encerrados" }, HOJE)).toHaveLength(1);
  });

  it("descarta salário desconhecido quando há piso pedido", () => {
    const itens = [
      fixture({ salarioAte: 12000 }),
      fixture({ salarioAte: 4000 }),
      fixture({ salarioAte: null }),
    ];
    const achados = filtrar(itens, { salarioMin: 5000 }, HOJE);
    expect(achados).toHaveLength(1);
    expect(achados[0].salarioAte).toBe(12000);
  });
});

describe("ordenar", () => {
  it("põe quem encerra antes na frente e quem não tem prazo no fim", () => {
    const itens = [
      fixture({ slug: "sem-prazo", inscricoesAte: null, status: "previsto" }),
      fixture({ slug: "maio", inscricoesAte: "2026-05-20" }),
      fixture({ slug: "abril", inscricoesAte: "2026-04-14" }),
    ];
    expect(ordenar(itens, "encerrando", HOJE).map((c) => c.slug)).toEqual([
      "abril",
      "maio",
      "sem-prazo",
    ]);
  });

  // Quem tem prazo correndo vem primeiro, depois quem ainda pode abrir, e
  // por último o que já venceu. Um previsto sem data continua sendo notícia
  // útil; um edital encerrado, não.
  it("põe o vencido depois de tudo que ainda pode acontecer", () => {
    const itens = [
      fixture({ slug: "vencido", inscricoesAte: "2026-03-01", status: "encerrado" }),
      fixture({ slug: "aberto", inscricoesAte: "2026-05-20" }),
      fixture({ slug: "sem-prazo", inscricoesAte: null, status: "previsto" }),
    ];
    expect(ordenar(itens, "encerrando", HOJE).map((c) => c.slug)).toEqual([
      "aberto",
      "sem-prazo",
      "vencido",
    ]);
  });

  it("desempata por número de vagas", () => {
    const itens = [
      fixture({ slug: "poucas", inscricoesAte: "2026-04-20", vagas: 10 }),
      fixture({ slug: "muitas", inscricoesAte: "2026-04-20", vagas: 900 }),
    ];
    expect(ordenar(itens, "encerrando", HOJE)[0].slug).toBe("muitas");
  });

  it("ordena por vagas, salário e publicação com nulos no fim", () => {
    const itens = [
      fixture({ slug: "a", vagas: null, salarioAte: null, publicadoEm: null }),
      fixture({ slug: "b", vagas: 50, salarioAte: 9000, publicadoEm: "2026-01-01" }),
      fixture({ slug: "c", vagas: 500, salarioAte: 20000, publicadoEm: "2026-03-01" }),
    ];
    expect(ordenar(itens, "vagas", HOJE).map((c) => c.slug)).toEqual(["c", "b", "a"]);
    expect(ordenar(itens, "salario", HOJE).map((c) => c.slug)).toEqual(["c", "b", "a"]);
    expect(ordenar(itens, "recentes", HOJE).map((c) => c.slug)).toEqual(["c", "b", "a"]);
  });

  it("não altera o vetor recebido", () => {
    const itens = [
      fixture({ slug: "maio", inscricoesAte: "2026-05-20" }),
      fixture({ slug: "abril", inscricoesAte: "2026-04-14" }),
    ];
    ordenar(itens, "encerrando", HOJE);
    expect(itens.map((c) => c.slug)).toEqual(["maio", "abril"]);
  });
});
