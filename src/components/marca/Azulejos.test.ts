import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Azulejos, FAIXA_MARCA, MOSAICO_HERO } from "./Azulejos";

describe("Azulejos", () => {
  it("o mosaico do hero é 4×4 e a faixa da marca é 6×2", () => {
    expect(MOSAICO_HERO).toHaveLength(16);
    expect(FAIXA_MARCA).toHaveLength(12);
  });

  it("é decorativo e desenha um círculo por ladrilho", () => {
    const html = renderToStaticMarkup(
      createElement(Azulejos, { ladrilhos: MOSAICO_HERO, colunas: 4 }),
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/rounded-full/g)).toHaveLength(16);
  });
});
