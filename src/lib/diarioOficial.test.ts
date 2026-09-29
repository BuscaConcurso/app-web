import { describe, expect, it } from "vitest";
import { CONCURSOS } from "@/mocks/concursos";
import { agruparPorDia, feedDeMock, rotuloDoDia, type AtoDoDiario } from "./diarioOficial";

const concurso = CONCURSOS[0];
const ato = (publicadoEm: string, titulo: string): AtoDoDiario => ({
  publicadoEm,
  titulo,
  url: null,
  secao: null,
  concurso,
});

describe("rotuloDoDia", () => {
  it("dia da semana e dia do mês, sem o ano do ano corrente", () => {
    expect(rotuloDoDia("2026-09-25", "2026-09-28")).toBe("Sexta, 25 de setembro");
    expect(rotuloDoDia("2026-09-27", "2026-09-28")).toBe("Domingo, 27 de setembro");
    expect(rotuloDoDia("2026-03-02", "2026-09-28")).toBe("Segunda, 2 de março");
  });

  it("com o ano quando o ato é de outro ano", () => {
    expect(rotuloDoDia("2025-12-31", "2026-01-02")).toBe("Quarta, 31 de dezembro de 2025");
  });
});

describe("agruparPorDia", () => {
  it("junta atos seguidos do mesmo dia e mantém a ordem da API", () => {
    const dias = agruparPorDia(
      [ato("2026-09-25", "A"), ato("2026-09-25", "B"), ato("2026-09-24", "C")],
      "2026-09-28",
    );
    expect(dias.map((dia) => [dia.data, dia.rotulo, dia.atos.map((a) => a.titulo)])).toEqual([
      ["2026-09-25", "Sexta, 25 de setembro", ["A", "B"]],
      ["2026-09-24", "Quinta, 24 de setembro", ["C"]],
    ]);
  });

  it("lista vazia não tem dia", () => {
    expect(agruparPorDia([], "2026-09-28")).toEqual([]);
  });
});

describe("feedDeMock", () => {
  it("um ato por concurso com último ato, do mais recente para o mais antigo", () => {
    const feed = feedDeMock(CONCURSOS, 1);
    expect(feed.total).toBe(CONCURSOS.filter((c) => c.ultimoAto?.data).length);
    expect(feed.total).toBeGreaterThan(0);
    expect(feed.itens.every((item) => item.url === null)).toBe(true);
    const datas = feed.itens.map((item) => item.publicadoEm);
    expect(datas).toEqual([...datas].sort().reverse());
  });

  it("página além do fim vem vazia com os totais", () => {
    const feed = feedDeMock(CONCURSOS, 99);
    expect(feed.itens).toEqual([]);
    expect(feed.pagina).toBe(99);
    expect(feed.total).toBe(feedDeMock(CONCURSOS, 1).total);
  });
});
