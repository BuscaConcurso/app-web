import { describe, expect, it } from "vitest";
import { atributosDeAnalitica, eventoDoElemento } from "./eventosNaPagina";

/** O que o navegador faz com `data-*`: `data-analitica-slug` vira `dataset.analiticaSlug`. */
function comoDataset(atributos: Record<string, string>): DOMStringMap {
  const dataset: DOMStringMap = {};
  for (const [nome, valor] of Object.entries(atributos)) {
    const chave = nome.slice("data-".length).replace(/-([a-z])/g, (_, letra: string) => letra.toUpperCase());
    dataset[chave] = valor;
  }
  return dataset;
}

describe("atributosDeAnalitica", () => {
  it("vira atributos data-analitica-*, só com valor preenchido", () => {
    expect(
      atributosDeAnalitica("inscricao_clicada", { slug: "tj-sp-2026", destino: "inscricao", local: null }),
    ).toEqual({
      "data-analitica": "inscricao_clicada",
      "data-analitica-slug": "tj-sp-2026",
      "data-analitica-destino": "inscricao",
    });
  });
});

describe("eventoDoElemento", () => {
  it("lê de volta o evento e as propriedades", () => {
    const dataset = comoDataset(
      atributosDeAnalitica("filtro_aplicado", { filtro: "escolaridade", valor: "superior", acao: "marcar" }),
    );
    expect(eventoDoElemento(dataset)).toEqual({
      evento: "filtro_aplicado",
      propriedades: { filtro: "escolaridade", valor: "superior", acao: "marcar" },
    });
  });

  it("nome de evento fora da lista não vira evento", () => {
    expect(eventoDoElemento({ analitica: "qualquer_coisa", analiticaSlug: "x" })).toBeNull();
    expect(eventoDoElemento({ analitica: "constructor" })).toBeNull();
    expect(eventoDoElemento({})).toBeNull();
  });

  it("outros data-* do elemento não entram nas propriedades", () => {
    expect(eventoDoElemento({ analitica: "inscricao_clicada", analiticaSlug: "a", testid: "botao" })).toEqual({
      evento: "inscricao_clicada",
      propriedades: { slug: "a" },
    });
  });
});
