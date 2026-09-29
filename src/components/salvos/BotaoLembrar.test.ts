import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { BotaoLembrar } from "./BotaoLembrar";
import { InterruptorDeLembrete } from "./InterruptorDeLembrete";
import { renderizarComSalvos } from "./renderizarComSalvos";

describe("BotaoLembrar", () => {
  it("sem sessão leva para entrar", () => {
    const html = renderizarComSalvos(
      { estado: "anonimo" },
      createElement(BotaoLembrar, { slug: "a", rotulo: "Lembrar amanhã" }),
    );
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="/entrar');
    expect(html).toContain("Lembrar amanhã");
  });

  it("desligado mostra o rótulo do lugar e aria-pressed falso", () => {
    const html = renderizarComSalvos(
      { mapa: new Map([["a", false]]) },
      createElement(BotaoLembrar, { slug: "a", rotulo: "Avisar quando abrir" }),
    );
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Avisar quando abrir");
  });

  it("ligado diz Lembrete ligado, também no nome acessível do botão compacto", () => {
    const html = renderizarComSalvos(
      { mapa: new Map([["a", true]]) },
      createElement(BotaoLembrar, {
        slug: "a",
        rotulo: "Avisar quando abrir",
        texto: "Avisar",
        textoSoAPartirDeSm: true,
        tamanhoDoIcone: 16,
      }),
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Lembrete ligado"');
    expect(html).toContain("Lembrete ligado");
    expect(html).not.toContain("Avisar quando abrir");
  });
});

describe("InterruptorDeLembrete", () => {
  it("é um switch com o estado do lembrete", () => {
    const desligado = renderizarComSalvos(
      { mapa: new Map([["a", false]]) },
      createElement(InterruptorDeLembrete, { slug: "a" }),
    );
    expect(desligado).toContain('role="switch"');
    expect(desligado).toContain('aria-checked="false"');
    expect(desligado).toContain("Lembrete por e-mail");
    const ligado = renderizarComSalvos(
      { mapa: new Map([["a", true]]) },
      createElement(InterruptorDeLembrete, { slug: "a" }),
    );
    expect(ligado).toContain('aria-checked="true"');
  });
});
