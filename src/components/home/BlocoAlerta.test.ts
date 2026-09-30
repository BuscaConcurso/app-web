import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderizarComSalvos } from "@/components/salvos/renderizarComSalvos";
import { BlocoAlerta } from "./BlocoAlerta";

const bloco = (estado: "anonimo" | "carregando" | "pronto" | "falhou", compacto = false) =>
  renderizarComSalvos({ estado }, createElement(BlocoAlerta, { compacto }));

describe("BlocoAlerta", () => {
  it("logado, leva às preferências da conta", () => {
    expect(bloco("pronto")).toContain('href="/conta#avisos"');
    expect(bloco("falhou", true)).toContain('href="/conta#avisos"');
  });

  it("sem sessão, ou enquanto carrega, leva ao cadastro com retorno", () => {
    expect(bloco("anonimo")).toContain('href="/cadastrar?retorno=%2Fconta%23avisos"');
    expect(bloco("carregando", true)).toContain('href="/cadastrar?retorno=%2Fconta%23avisos"');
  });
});
