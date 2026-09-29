import { describe, expect, it } from "vitest";
import { areaDoSlug } from "./areas";
import { ordenar, situacaoDoConcurso } from "./consulta";
import {
  POR_PAGINA_DA_AREA,
  hrefDaListaDaArea,
  lerConsultaDaArea,
  listaDaArea,
} from "./paginaDaArea";
import { CONCURSOS } from "@/mocks/concursos";

const HOJE = new Date(2026, 3, 10, 9, 0);
const saude = areaDoSlug("saude")!;

describe("lerConsultaDaArea", () => {
  it("lê situação e página válidas", () => {
    expect(lerConsultaDaArea({ pagina: "2", situacao: "abertas" })).toEqual({ situacao: "abertas", pagina: 2 });
  });

  it("descarta o que não vale: página negativa, texto, situação desconhecida", () => {
    expect(lerConsultaDaArea({ pagina: "-3", situacao: "banana" })).toEqual({ situacao: null, pagina: 1 });
    expect(lerConsultaDaArea({ pagina: "abc" })).toEqual({ situacao: null, pagina: 1 });
    expect(lerConsultaDaArea({ pagina: "1.5" })).toEqual({ situacao: null, pagina: 1 });
    expect(lerConsultaDaArea({})).toEqual({ situacao: null, pagina: 1 });
  });

  it("parâmetro repetido vale o primeiro", () => {
    expect(lerConsultaDaArea({ situacao: ["previstos", "abertas"], pagina: ["3", "9"] })).toEqual({
      situacao: "previstos",
      pagina: 3,
    });
  });

  it("não aceita nome herdado do protótipo como situação", () => {
    expect(lerConsultaDaArea({ situacao: "constructor" }).situacao).toBeNull();
  });
});

describe("hrefDaListaDaArea", () => {
  it("página 1 sem situação é o endereço limpo", () => {
    expect(hrefDaListaDaArea(saude, { situacao: null, pagina: 1 })).toBe("/areas/saude");
  });

  it("situação e página entram na query, página 1 fica de fora", () => {
    expect(hrefDaListaDaArea(saude, { situacao: "previstos", pagina: 3 })).toBe("/areas/saude?situacao=previstos&pagina=3");
    expect(hrefDaListaDaArea(saude, { situacao: "abertas", pagina: 1 })).toBe("/areas/saude?situacao=abertas");
    expect(hrefDaListaDaArea(saude, { situacao: null, pagina: 2 })).toBe("/areas/saude?pagina=2");
  });
});

describe("listaDaArea", () => {
  it("ordena como a busca, encerrando primeiro, e pagina", () => {
    const { pagina } = listaDaArea(CONCURSOS, { situacao: null, pagina: 1 }, HOJE);
    expect(pagina.itens.map((c) => c.slug)).toEqual(
      ordenar(CONCURSOS, "encerrando", HOJE).slice(0, POR_PAGINA_DA_AREA).map((c) => c.slug),
    );
    expect(pagina.total).toBe(CONCURSOS.length);
  });

  it("a situação filtra, e as contagens de cada aba são o que ela mostra", () => {
    const { contagens, total } = listaDaArea(CONCURSOS, { situacao: null, pagina: 1 }, HOJE);
    expect(total).toBe(CONCURSOS.length);
    expect(contagens.abertas + contagens.previstos + contagens.encerrados).toBe(total);
    for (const situacao of ["abertas", "previstos", "encerrados"] as const) {
      const { pagina } = listaDaArea(CONCURSOS, { situacao, pagina: 1 }, HOJE);
      expect(pagina.total, situacao).toBe(contagens[situacao]);
      for (const concurso of pagina.itens) expect(situacaoDoConcurso(concurso, HOJE)).toBe(situacao);
    }
  });

  it("página além do fim vira a última, e não uma lista vazia", () => {
    const { pagina } = listaDaArea(CONCURSOS.slice(0, 3), { situacao: null, pagina: 999 }, HOJE);
    expect(pagina.pagina).toBe(1);
    expect(pagina.itens).toHaveLength(3);
  });

  it("lista vazia é página 1 de 1, sem lançar", () => {
    const { pagina, total } = listaDaArea([], { situacao: "abertas", pagina: 4 }, HOJE);
    expect(total).toBe(0);
    expect(pagina.pagina).toBe(1);
    expect(pagina.paginas).toBe(1);
  });
});
