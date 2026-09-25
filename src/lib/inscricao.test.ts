import { describe, expect, it } from "vitest";
import type { ConcursoDetalhe } from "./dominio";
import { hojeCivilEmSaoPaulo } from "./formato";
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

  it("só conta os dias de quem está com inscrição aberta", () => {
    expect(prazoPorExtenso({ ...base, status: "previsto" }, HOJE)).toBeNull();
    expect(prazoPorExtenso({ ...base, status: "homologado" }, HOJE)).toBeNull();
    expect(prazoPorExtenso({ ...base, status: "inscricoes_abertas" }, HOJE)?.titulo).toBe(
      "Encerra amanhã",
    );
  });

  it("sem hora não inventa 23h59", () => {
    expect(prazoPorExtenso({ ...base, cronograma: [] }, HOJE)?.detalhe).toBe("sexta");
  });

  it("inicio_inscricao com hora não fornece o horário do fim", () => {
    const comInicio = { ...base, cronograma: [{ tipo: "inicio_inscricao", ato: null, inicio: "2026-08-24", fim: null, hora: "10:00", localidades: [], observacao: null, evidencia: null }] } as unknown as ConcursoDetalhe;
    expect(prazoPorExtenso(comInicio, HOJE)?.detalhe).toBe("sexta");
  });

  it("um instante de 23h30 em Brasília no dia 24 (2h30 UTC do dia 25) ainda é 24 para o prazo", () => {
    // Prazo no fuso de São Paulo: `hojeCivilEmSaoPaulo` é o que `page.tsx` passa
    // adiante para `prazoPorExtenso`, `tomDoConcurso` e `periodoDaInscricao`,
    // no lugar do `new Date()` cru. Um servidor em UTC roda este instante já
    // no dia 25 (`2026-09-25T02:30:00Z`); em Brasília (UTC-3) ainda são
    // 23h30 do dia 24, e o prazo de amanhã (25/09) não pode ter virado "hoje"
    // só porque o processo mora noutro fuso.
    const hoje = hojeCivilEmSaoPaulo(new Date("2026-09-25T02:30:00Z"));
    expect(prazoPorExtenso(base, hoje)).toEqual({
      titulo: "Encerra amanhã",
      detalhe: "sexta, às 23h59 (Brasília)",
    });
  });
});

describe("destinoDaInscricao", () => {
  it("só aceita http e https com domínio", () => {
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: "javascript:alert(1)", origens: [] })).toBeNull();
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: "data:text/html,<p>oi</p>", origens: [] })).toBeNull();
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: "file:///etc/passwd", origens: [] })).toBeNull();
    // Sem domínio: "http://" nem vira URL, e o teste de `host` vazio cobre
    // o que o analisador aceitar com host vazio.
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: "http://", origens: [] })).toBeNull();
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: "http://banca.org.br/x" })?.host).toBe("banca.org.br");
  });

  it("prefere o endereço do edital e mostra o host", () => {
    expect(destinoDaInscricao(base)).toEqual({ href: "https://sigaa.ufrrj.br/inscricao", host: "sigaa.ufrrj.br", rotulo: "Ir para a inscrição" });
  });

  it("sem endereço cai no ato publicado", () => {
    expect(destinoDaInscricao({ ...base, editalCitadoUrl: null })).toMatchObject({ href: "https://in.gov.br/ato/1", rotulo: "Ver o ato publicado" });
  });
});
