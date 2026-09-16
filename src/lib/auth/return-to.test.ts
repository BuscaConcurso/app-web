import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("mantém somente destinos internos absolutos", () => {
    expect(safeReturnTo("/concursos?uf=SP")).toBe("/concursos?uf=SP");
    expect(safeReturnTo("/conta#senha")).toBe("/conta#senha");
  });

  it.each([
    undefined,
    null,
    "",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "javascript:alert(1)",
  ])("descarta destino externo ou inválido: %s", (value) => {
    expect(safeReturnTo(value)).toBe("/");
  });
});
