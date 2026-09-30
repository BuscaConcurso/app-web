import { describe, expect, it } from "vitest";
import { destinoDaChamada } from "./chamadaDoResumo";

describe("destinoDaChamada", () => {
  it("com sessão, leva direto às preferências", () => {
    expect(destinoDaChamada(true)).toEqual({ href: "/conta#avisos", rotulo: "Ligar o resumo semanal", entrar: null });
  });

  it("sem sessão, cria a conta e volta às preferências, com a opção de entrar", () => {
    expect(destinoDaChamada(false)).toEqual({
      href: "/cadastrar?retorno=%2Fconta%23avisos",
      rotulo: "Criar conta e receber",
      entrar: "/entrar?retorno=%2Fconta%23avisos",
    });
  });
});
