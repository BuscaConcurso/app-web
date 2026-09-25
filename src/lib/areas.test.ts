import { describe, expect, it } from "vitest";
import { AREAS, hrefDaArea } from "./areas";

describe("AREAS", () => {
  it("são as 12 do protótipo, na ordem", () => {
    expect(AREAS.map((a) => a.nome)).toEqual([
      "Tribunais", "Polícia e segurança", "Educação", "Saúde", "Fiscal e controle",
      "Bancos e estatais", "Forças Armadas", "Prefeituras", "Conselhos", "Tecnologia",
      "Administrativo", "Ambiente e agro",
    ]);
  });

  it("cada área leva à busca pelo termo dela", () => {
    expect(hrefDaArea(AREAS[0])).toBe("/busca/tribunal");
    for (const area of AREAS) expect(hrefDaArea(area)).toMatch(/^\/busca\/[a-z0-9-]+$/);
  });
});
