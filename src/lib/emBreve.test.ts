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
    expect(hrefEmBreve("salvos")).toBe("/em-breve/salvos");
  });

  it("o Diário Oficial saiu da lista: a página existe", () => {
    expect(recursoEmBreve("diario-oficial")).toBeNull();
  });

  it("áreas saiu da lista: tem página própria em /areas", () => {
    expect(recursoEmBreve("areas")).toBeNull();
  });

  it("recurso desconhecido é null", () => {
    expect(recursoEmBreve("banana")).toBeNull();
    expect(recursoEmBreve("salvos")).toBe("salvos");
  });

  it("não aceita nome herdado do protótipo do objeto", () => {
    expect(recursoEmBreve("constructor")).toBeNull();
    expect(recursoEmBreve("toString")).toBeNull();
    expect(recursoEmBreve("__proto__")).toBeNull();
    expect(recursoEmBreve("hasOwnProperty")).toBeNull();
  });
});
