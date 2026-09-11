import { describe, expect, it } from "vitest";
import type { ConcursoStatus } from "./dominio";
import { rotuloDeSituacao, tomDoConcurso } from "./situacao";

const HOJE = new Date(2026, 3, 10, 9, 0);

function concurso(status: ConcursoStatus, inscricoesAte: string | null = null) {
  return { status, inscricoesAte };
}

describe("tomDoConcurso", () => {
  it("trata como previsto tudo que ainda não virou edital", () => {
    expect(tomDoConcurso(concurso("previsto"), HOJE)).toBe("previsto");
    expect(tomDoConcurso(concurso("autorizado"), HOJE)).toBe("previsto");
    expect(tomDoConcurso(concurso("banca_definida"), HOJE)).toBe("previsto");
  });

  it("trata como encerrado tudo em que não dá mais para entrar", () => {
    const semAcao: ConcursoStatus[] = [
      "inscricoes_encerradas",
      "provas",
      "resultado",
      "homologado",
      "suspenso",
      "cancelado",
      "encerrado",
    ];
    for (const status of semAcao) {
      expect(tomDoConcurso(concurso(status), HOJE)).toBe("encerrado");
    }
  });

  it("é urgente no sétimo dia e deixa de ser no oitavo", () => {
    expect(tomDoConcurso(concurso("inscricoes_abertas", "2026-04-17"), HOJE)).toBe(
      "urgente",
    );
    expect(tomDoConcurso(concurso("inscricoes_abertas", "2026-04-18"), HOJE)).toBe(
      "aberto",
    );
  });

  it("continua urgente no último dia", () => {
    expect(tomDoConcurso(concurso("inscricoes_abertas", "2026-04-10"), HOJE)).toBe(
      "urgente",
    );
  });

  it("encerra quando a data já passou, mesmo com o status desatualizado", () => {
    expect(tomDoConcurso(concurso("inscricoes_abertas", "2026-04-09"), HOJE)).toBe(
      "encerrado",
    );
  });

  it("não chama de urgente o que está aberto sem data de fim", () => {
    expect(tomDoConcurso(concurso("inscricoes_abertas", null), HOJE)).toBe(
      "aberto",
    );
  });
});

describe("rotuloDeSituacao", () => {
  it("troca o status pelo prazo quando é urgente", () => {
    expect(
      rotuloDeSituacao(concurso("inscricoes_abertas", "2026-04-13"), HOJE),
    ).toBe("Encerra em 3 dias");
  });

  it("usa o status quando há folga no prazo", () => {
    expect(
      rotuloDeSituacao(concurso("inscricoes_abertas", "2026-05-30"), HOJE),
    ).toBe("Inscrições abertas");
  });

  it("não anuncia como aberto um prazo que já venceu", () => {
    expect(
      rotuloDeSituacao(concurso("inscricoes_abertas", "2026-04-01"), HOJE),
    ).toBe("Inscrições encerradas");
  });

  it("mantém o rótulo próprio de cada status sem ação", () => {
    expect(rotuloDeSituacao(concurso("cancelado"), HOJE)).toBe("Cancelado");
    expect(rotuloDeSituacao(concurso("resultado"), HOJE)).toBe(
      "Resultado publicado",
    );
  });
});
