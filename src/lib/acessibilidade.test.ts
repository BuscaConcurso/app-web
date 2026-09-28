import { describe, expect, it } from "vitest";
import { degrauDaFonte, FONTE_MAXIMA, FONTE_MINIMA, SCRIPT_DE_ACESSIBILIDADE } from "./acessibilidade";

describe("degrauDaFonte", () => {
  it("sem valor, ou valor que não é inteiro, é o padrão", () => {
    expect(degrauDaFonte(undefined)).toBe(0);
    expect(degrauDaFonte(null)).toBe(0);
    expect(degrauDaFonte("banana")).toBe(0);
    expect(degrauDaFonte("1.5")).toBe(0);
  });

  it("prende o degrau na faixa", () => {
    expect(degrauDaFonte("2")).toBe(2);
    expect(degrauDaFonte("99")).toBe(FONTE_MAXIMA);
    expect(degrauDaFonte("-99")).toBe(FONTE_MINIMA);
  });
});

describe("SCRIPT_DE_ACESSIBILIDADE", () => {
  it("é JavaScript válido", () => {
    expect(() => new Function(SCRIPT_DE_ACESSIBILIDADE)).not.toThrow();
  });
});
