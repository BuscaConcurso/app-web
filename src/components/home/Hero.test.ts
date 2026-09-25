import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Hero } from "./Hero";
import { Numeros } from "./Numeros";
import { CONCURSOS } from "@/mocks/concursos";

describe("Hero", () => {
  it("mostra a contagem de abertos e o título do protótipo", () => {
    const html = renderToStaticMarkup(
      createElement(Hero, {
        totalAbertos: 113,
        ufs: [],
        cargos: [],
        destaque: CONCURSOS[0],
        novoAto: null,
      }),
    );
    expect(html).toContain("113");
    expect(html).toContain("Encontre seu concurso.");
    expect(html).toContain("Direto do edital.");
  });

  it("sem concurso de destaque não desenha o cartão flutuante", () => {
    const html = renderToStaticMarkup(
      createElement(Hero, {
        totalAbertos: 0,
        ufs: [],
        cargos: [],
        destaque: null,
        novoAto: null,
      }),
    );
    expect(html).not.toContain("Conferido no edital original");
  });
});

describe("Numeros", () => {
  it("formata com separador de milhar e esconde vagas previstas sem dado", () => {
    const html = renderToStaticMarkup(
      createElement(Numeros, { totalAbertos: 113, vagasPrevistas: null, atosLidos: 5016 }),
    );
    expect(html).toContain("5.016");
    expect(html).not.toContain("vagas nos 4 maiores previstos");
  });
});
