import { describe, expect, it } from "vitest";
import { enderecoSemToken } from "./tokenDaUrl";

describe("enderecoSemToken", () => {
  it("tira o token e mantém o caminho, os outros parâmetros e o hash", () => {
    expect(enderecoSemToken({ pathname: "/emails/descadastro", search: "?token=abc-_1&tipo=lembretes", hash: "" }))
      .toBe("/emails/descadastro?tipo=lembretes");
    expect(enderecoSemToken({ pathname: "/redefinir-senha", search: "?token=abc", hash: "#x" }))
      .toBe("/redefinir-senha#x");
  });

  it("sem token na URL não há o que trocar", () => {
    expect(enderecoSemToken({ pathname: "/verificar-email", search: "", hash: "" })).toBeNull();
    expect(enderecoSemToken({ pathname: "/busca/x", search: "?q=token", hash: "" })).toBeNull();
  });
});
