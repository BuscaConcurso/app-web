import { describe, expect, it } from "vitest";
import { listaEstruturada } from "./listaEstruturada";
import { urlAbsoluta } from "./site";

describe("listaEstruturada", () => {
  const lista = listaEstruturada("Concursos de Saúde", 151, [
    { nome: "HCPA: Edital nº 1/2026", href: "/concursos/hcpa-1" },
    { nome: "UFSM: Edital nº 40/2026", href: "/concursos/ufsm-40" },
  ]);

  it("é um ItemList com o contexto do schema.org, o nome e o total da lista inteira", () => {
    expect(lista["@context"]).toBe("https://schema.org");
    expect(lista["@type"]).toBe("ItemList");
    expect(lista.name).toBe("Concursos de Saúde");
    // O total da lista, não o da página: a página mostra 20 de 151.
    expect(lista.numberOfItems).toBe(151);
  });

  it("posição começa em 1 e a URL é absoluta", () => {
    expect(lista.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, url: urlAbsoluta("/concursos/hcpa-1"), name: "HCPA: Edital nº 1/2026" },
      { "@type": "ListItem", position: 2, url: urlAbsoluta("/concursos/ufsm-40"), name: "UFSM: Edital nº 40/2026" },
    ]);
  });

  it("a posição continua de onde a página começa", () => {
    const segunda = listaEstruturada("x", 30, [{ nome: "a", href: "/a" }], 21);
    expect(segunda.itemListElement[0].position).toBe(21);
  });
});
