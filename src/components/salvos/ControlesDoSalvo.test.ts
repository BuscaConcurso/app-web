import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { ControlesDoSalvo } from "./ControlesDoSalvo";
import { renderizarComSalvos } from "./renderizarComSalvos";

const SALVO = { mapa: new Map([["a", true]]) };

describe("ControlesDoSalvo", () => {
  it("no cartão do celular dá para remover e mudar o lembrete", () => {
    const html = renderizarComSalvos(SALVO, createElement(ControlesDoSalvo, { slug: "a", forma: "cartao" }));
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Salvo");
  });

  it("na linha só o interruptor: o marcador de remover já está na linha", () => {
    const html = renderizarComSalvos(SALVO, createElement(ControlesDoSalvo, { slug: "a", forma: "linha" }));
    expect(html).toContain('role="switch"');
    expect(html).not.toContain("aria-pressed");
  });
});
