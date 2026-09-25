import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PassosDaInscricao } from "./PassosDaInscricao";

describe("PassosDaInscricao", () => {
  it("renderiza no servidor com todos desmarcados", () => {
    const html = renderToStaticMarkup(createElement(PassosDaInscricao, {
      slug: "x", passos: [{ titulo: "Leia o edital", detalhe: "requisitos." }, { titulo: "Faça a inscrição", detalhe: "até 25/09." }],
    }));
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
    expect(html).toContain("Leia o edital");
  });
});
