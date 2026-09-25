import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Icone, ICONES } from "./Icone";

describe("Icone", () => {
  it("sem rótulo é decorativo", () => {
    const html = renderToStaticMarkup(createElement(Icone, { nome: "busca" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('stroke-width="1.75"');
    expect(html).toContain('width="20"');
  });

  it("com rótulo vira imagem com nome", () => {
    const html = renderToStaticMarkup(createElement(Icone, { nome: "salvar", rotulo: "Salvar" }));
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Salvar"');
  });

  it("todo ícone tem ao menos um traço", () => {
    for (const [nome, partes] of Object.entries(ICONES)) {
      expect(partes.length, nome).toBeGreaterThan(0);
    }
  });
});
