import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ID_DO_CONTEUDO, PularParaConteudo } from "./PularParaConteudo";

describe("PularParaConteudo", () => {
  it("é um link para o conteúdo principal, escondido até receber foco", () => {
    const html = renderToStaticMarkup(createElement(PularParaConteudo));
    expect(html).toContain(`href="#${ID_DO_CONTEUDO}"`);
    expect(html).toContain("Pular para o conteúdo");
    expect(html).toContain("sr-only-foco");
  });
});
