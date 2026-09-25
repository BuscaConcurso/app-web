import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FatosDoConcurso } from "./FatosDoConcurso";

describe("FatosDoConcurso", () => {
  it("fato não informado sai em cinza e com o apoio", () => {
    const html = renderToStaticMarkup(createElement(FatosDoConcurso, {
      fatos: [{ rotulo: "REMUNERAÇÃO", valor: "Não informada", apoio: "o ato não diz", informado: false }],
    }));
    expect(html).toContain("Não informada");
    expect(html).toContain("o ato não diz");
    expect(html).toContain("text-tinta-600");
  });
});
