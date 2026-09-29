import { describe, expect, it } from "vitest";
import { mudancaDeConta } from "./contaNaAnalitica";

describe("mudancaDeConta", () => {
  it("entrou: identifica pelo id", () => {
    expect(mudancaDeConta(null, "authenticated", "c1")).toEqual({ acao: "identificar", id: "c1" });
  });

  it("a mesma conta de novo não repete", () => {
    expect(mudancaDeConta("c1", "authenticated", "c1")).toBeNull();
  });

  it("saiu: esquece", () => {
    expect(mudancaDeConta("c1", "anonymous", null)).toEqual({ acao: "esquecer" });
  });

  it("trocou de conta: identifica a nova", () => {
    expect(mudancaDeConta("c1", "authenticated", "c2")).toEqual({ acao: "identificar", id: "c2" });
  });

  it("carregando ou visitante que nunca entrou: nada", () => {
    expect(mudancaDeConta(null, "loading", null)).toBeNull();
    expect(mudancaDeConta("c1", "loading", null)).toBeNull();
    expect(mudancaDeConta(null, "anonymous", null)).toBeNull();
  });
});
