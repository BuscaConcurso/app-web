import { describe, expect, it } from "vitest";
import { secaoDoHash } from "./secaoDaConta";

describe("secaoDoHash", () => {
  it("devolve a seção da conta nomeada no hash", () => {
    expect(secaoDoHash("#avisos")).toBe("avisos");
    expect(secaoDoHash("#senha")).toBe("senha");
  });

  it("hash vazio ou desconhecido não rola nada", () => {
    expect(secaoDoHash("")).toBeNull();
    expect(secaoDoHash("#")).toBeNull();
    expect(secaoDoHash("#qualquer")).toBeNull();
  });
});
