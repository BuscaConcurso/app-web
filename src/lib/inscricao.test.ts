import { describe, expect, it } from "vitest";
import type { ConcursoDetalhe } from "./dominio";
import { destinoDaInscricao, passosDaInscricao, periodoDaInscricao, prazoPorExtenso } from "./inscricao";

const HOJE = new Date(2026, 8, 24);
const base = {
  slug: "ufrrj-51-2026", titulo: "Residência", inscricoesDe: "2026-08-24", inscricoesAte: "2026-09-25",
  taxaInscricao: 100, editalUrl: null, editalCitadoUrl: "https://sigaa.ufrrj.br/inscricao",
  cronograma: [{ tipo: "fim_inscricao", ato: null, inicio: "2026-09-25", fim: null, hora: "23:59", localidades: [], observacao: null, evidencia: null }],
  origens: [{ url: "https://in.gov.br/ato/1" }], cargos: [],
} as unknown as ConcursoDetalhe;

describe("passosDaInscricao", () => {
  it("são três com taxa, e o último traz o prazo", () => {
    expect(passosDaInscricao(base)).toEqual([
      { titulo: "Leia o edital", detalhe: "requisitos e documentos pedidos." },
      { titulo: "Pague a taxa de R$ 100,00", detalhe: "pela guia indicada no edital." },
      { titulo: "Faça a inscrição", detalhe: "até 25/09, 23h59." },
    ]);
  });

  it("sem taxa pula o pagamento, sem prazo não inventa data", () => {
    const passos = passosDaInscricao({ ...base, taxaInscricao: null, inscricoesAte: null, cronograma: [] });
    expect(passos.map((p) => p.titulo)).toEqual(["Leia o edital", "Faça a inscrição"]);
    expect(passos[1].detalhe).toBe("no endereço indicado no edital.");
  });
});

describe("periodoDaInscricao", () => {
  it("conta os dias do período já passados, como no protótipo", () => {
    expect(periodoDaInscricao(base, HOJE)).toEqual({ passados: 31, total: 32, fracao: 31 / 32 });
  });

  it("é null sem as duas datas", () => {
    expect(periodoDaInscricao({ ...base, inscricoesDe: null }, HOJE)).toBeNull();
  });
});

describe("prazoPorExtenso", () => {
  it("amanhã, com dia da semana e hora de Brasília", () => {
    expect(prazoPorExtenso(base, HOJE)).toEqual({ titulo: "Encerra amanhã", detalhe: "sexta, às 23h59 (Brasília)" });
  });

  it("hoje e daqui a alguns dias", () => {
    expect(prazoPorExtenso(base, new Date(2026, 8, 25))?.titulo).toBe("Encerra hoje");
    expect(prazoPorExtenso(base, new Date(2026, 8, 20))?.titulo).toBe("Encerra em 5 dias");
  });

  it("sem hora não inventa 23h59", () => {
    expect(prazoPorExtenso({ ...base, cronograma: [] }, HOJE)?.detalhe).toBe("sexta");
  });

  it("inicio_inscricao com hora não fornece o horário do fim", () => {
    const comInicio = { ...base, cronograma: [{ tipo: "inicio_inscricao", ato: null, inicio: "2026-08-24", fim: null, hora: "10:00", localidades: [], observacao: null, evidencia: null }] } as unknown as ConcursoDetalhe;
    expect(prazoPorExtenso(comInicio, HOJE)?.detalhe).toBe("sexta");
  });
});

describe("destinoDaInscricao", () => {
  it("prefere o endereço do edital e mostra o host", () => {
    expect(destinoDaInscricao(base)).toEqual({ href: "https://sigaa.ufrrj.br/inscricao", host: "sigaa.ufrrj.br", rotulo: "Ir para a inscrição" });
  });

  it("sem endereço cai no ato publicado", () => {
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: null })).toMatchObject({ href: "https://in.gov.br/ato/1", rotulo: "Ver o ato publicado" });
  });
});
