import { describe, expect, it } from "vitest";
import { hrefEmBreve, RECURSOS_EM_BREVE, recursoEmBreve } from "./emBreve";

describe("emBreve", () => {
  it("todo recurso tem título e frase sem travessão", () => {
    for (const [chave, { titulo, frase }] of Object.entries(RECURSOS_EM_BREVE)) {
      expect(titulo.length, chave).toBeGreaterThan(0);
      expect(frase.length, chave).toBeGreaterThan(0);
      expect(`${titulo}${frase}`).not.toContain("\u2014");
    }
  });

  it("o endereço é /em-breve/<recurso>", () => {
    expect(hrefEmBreve("diario-oficial")).toBe("/em-breve/diario-oficial");
  });

  it("recurso desconhecido é null", () => {
    expect(recursoEmBreve("banana")).toBeNull();
    expect(recursoEmBreve("salvos")).toBe("salvos");
  });
});
