import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { BotaoSalvar } from "./BotaoSalvar";
import { renderizarComSalvos } from "./renderizarComSalvos";

describe("BotaoSalvar", () => {
  it("sem sessão é um link para entrar, sem aria-pressed", () => {
    const html = renderizarComSalvos({ estado: "anonimo" }, createElement(BotaoSalvar, { slug: "a", comTexto: true }));
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="/entrar');
    expect(html).not.toContain("aria-pressed");
    expect(html).toContain("Salvar");
  });

  it("não salvo é botão desligado com o rótulo Salvar", () => {
    const html = renderizarComSalvos({}, createElement(BotaoSalvar, { slug: "a" }));
    expect(html).toMatch(/^<button/);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Salvar"');
  });

  it("salvo é botão ligado, rótulo Salvo e marcador preenchido", () => {
    const html = renderizarComSalvos(
      { mapa: new Map([["a", false]]) },
      createElement(BotaoSalvar, { slug: "a", comTexto: true }),
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Salvo");
    expect(html).toContain('fill="currentColor"');
  });
});
