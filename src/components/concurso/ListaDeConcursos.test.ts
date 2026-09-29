import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONCURSOS } from "@/mocks/concursos";
import { ListaDeConcursos } from "./ListaDeConcursos";

describe("ListaDeConcursos", () => {
  it("o extra de cada concurso aparece na linha e no cartão", () => {
    const [concurso] = CONCURSOS;
    const html = renderToStaticMarkup(
      createElement(ListaDeConcursos, {
        itens: [concurso!],
        hoje: new Date("2026-09-28T12:00:00Z"),
        extra: (c) => createElement("span", null, `extra de ${c.slug}`),
      }),
    );
    expect(html.split(`extra de ${concurso!.slug}`).length - 1).toBe(2);
  });

  it("sem extra, nada muda", () => {
    const html = renderToStaticMarkup(
      createElement(ListaDeConcursos, { itens: CONCURSOS.slice(0, 1), hoje: new Date("2026-09-28T12:00:00Z") }),
    );
    expect(html).not.toContain("extra de");
    expect(html).toContain("h-[5.5rem]");
  });
});
