import { describe, expect, it } from "vitest";
import { consultaDeArtigos, parametrosDosArtigos, hrefDosArtigos } from "./artigosConsulta";

describe("consulta de artigos", () => {
  it.each(["0", "-1", "1.5", "1e2", "9007199254740992", ["2", "3"]])("recusa página insegura %s", (pagina) => {
    expect(consultaDeArtigos({ pagina }).pagina).toBe(1);
  });
  it("normaliza filtros conhecidos e apara busca", () => {
    expect(consultaDeArtigos({ pagina: "2", tipo: "semanal_uf", uf: " sp ", q: "  professor & médico  ", ordem: "relevantes" }))
      .toEqual({ pagina: 2, tipo: "semanal_uf", uf: "SP", q: "professor & médico", ordem: "relevantes" });
    expect(consultaDeArtigos({ tipo: "outro", uf: "ZZ", ordem: "salario", q: ["a", "b"] }))
      .toEqual({ pagina: 1, ordem: "recentes" });
    expect(consultaDeArtigos({ q: "a".repeat(201) }).q).toHaveLength(200);
  });
  it("serializa texto sem injetar parâmetros e preserva os filtros ao paginar", () => {
    const filtro = { pagina: 2, tipo: "concurso" as const, uf: "RJ", q: "<b>&tipo=falso", ordem: "relevantes" as const };
    expect(parametrosDosArtigos(filtro).get("q")).toBe("<b>&tipo=falso");
    expect(hrefDosArtigos("/artigos/busca", filtro, 3)).toBe("/artigos/busca?pagina=3&tipo=concurso&uf=RJ&q=%3Cb%3E%26tipo%3Dfalso&ordem=relevantes");
    expect(hrefDosArtigos("/artigos", { pagina: 1, ordem: "recentes" })).toBe("/artigos");
  });
});

it("remove NUL antes de limitar a busca sem perder acentos", () => {
  expect(consultaDeArtigos({ q: "  médico\u0000 & ação  " }).q).toBe("médico & ação");
  expect(consultaDeArtigos({ q: "\u0000" }).q).toBeUndefined();
  expect(consultaDeArtigos({ q: "\u0000".repeat(200) + "educação" }).q).toBe("educação");
});
