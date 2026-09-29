import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BotaoSalvar } from "./BotaoSalvar";
import { ContextoDeSalvos, type ValorDeSalvos } from "./contexto";

function renderizar(valor: Partial<ValorDeSalvos>, props: Parameters<typeof BotaoSalvar>[0]) {
  const completo: ValorDeSalvos = {
    estado: "pronto",
    mapa: new Map(),
    resposta: null,
    emailConfirmado: true,
    recarregar: async () => {},
    salvar: async () => true,
    remover: async () => true,
    lembrar: async () => true,
    ...valor,
  };
  return renderToStaticMarkup(
    createElement(ContextoDeSalvos.Provider, { value: completo }, createElement(BotaoSalvar, props)),
  );
}

describe("BotaoSalvar", () => {
  it("sem sessão é um link para entrar, sem aria-pressed", () => {
    const html = renderizar({ estado: "anonimo" }, { slug: "a", comTexto: true });
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="/entrar');
    expect(html).not.toContain("aria-pressed");
    expect(html).toContain("Salvar");
  });

  it("não salvo é botão desligado com o rótulo Salvar", () => {
    const html = renderizar({}, { slug: "a" });
    expect(html).toMatch(/^<button/);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Salvar"');
  });

  it("salvo é botão ligado, rótulo Salvo e marcador preenchido", () => {
    const html = renderizar({ mapa: new Map([["a", false]]) }, { slug: "a", comTexto: true });
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Salvo");
    expect(html).toContain('fill="currentColor"');
  });
});
