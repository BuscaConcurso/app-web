import { describe, expect, it } from "vitest";
import type { ConcursoDetalhe } from "./dominio";
import { icsDoPrazo } from "./agenda";

const concurso = { slug: "ufrrj-51-2026", titulo: "Residência em Medicina Veterinária", inscricoesAte: "2026-09-25", cronograma: [], orgao: { sigla: "UFRRJ", nome: "Universidade" } } as unknown as ConcursoDetalhe;

describe("icsDoPrazo", () => {
  it("gera um evento de dia inteiro no fim das inscrições", () => {
    const ics = icsDoPrazo(concurso, "https://buscaconcurso.com.br/concursos/ufrrj-51-2026")!;
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260925");
    expect(ics).toContain("DTEND;VALUE=DATE:20260926");
    expect(ics).toContain("SUMMARY:Fim das inscrições: UFRRJ");
    expect(ics).toContain("UID:ufrrj-51-2026-fim@buscaconcurso.com.br");
    expect(ics.split("\r\n").length).toBeGreaterThan(5);
  });

  it("sem data de fim não gera nada", () => {
    expect(icsDoPrazo({ ...concurso, inscricoesAte: null }, "x")).toBeNull();
  });
});
