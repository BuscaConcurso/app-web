import { describe, expect, it } from "vitest";
import { trilhaEstruturada, type Degrau } from "./trilha";
import { URL_SITE } from "./site";

/**
 * O `BreadcrumbList` da trilha.
 *
 * O defeito que estes testes guardam é o que já aconteceu: a lista
 * estruturada declarava três degraus enquanto a tela mostrava dois. Ele só
 * foi possível porque havia duas listas. Aqui há uma, e o que resta a
 * conferir é que a conversão não perca nem invente degrau, e que a forma seja
 * a que o schema.org pede: posição a partir de 1 e `item` absoluto.
 */
const DEGRAUS: Degrau[] = [
  { nome: "Concursos", href: "/concursos" },
  { nome: "CRA-RJ", href: "/orgaos/cra-rj" },
  { nome: "Conselho Regional de Administração \u2014 Edital nº 1/2026", href: "/concursos/edital-1-2026" },
];

describe("trilhaEstruturada", () => {
  it("declara exatamente os degraus que recebeu, na ordem", () => {
    const { itemListElement } = trilhaEstruturada(DEGRAUS);

    expect(itemListElement).toHaveLength(DEGRAUS.length);
    expect(itemListElement.map((item) => item.name)).toEqual(
      DEGRAUS.map((degrau) => degrau.nome),
    );
  });

  it("é um BreadcrumbList com o contexto do schema.org", () => {
    const trilha = trilhaEstruturada(DEGRAUS);

    expect(trilha["@context"]).toBe("https://schema.org");
    expect(trilha["@type"]).toBe("BreadcrumbList");
  });

  it("conta degraus a partir de 1, e não índices a partir de 0", () => {
    const { itemListElement } = trilhaEstruturada(DEGRAUS);

    expect(itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  it("dá a todo degrau um item absoluto, o corrente incluído", () => {
    const { itemListElement } = trilhaEstruturada(DEGRAUS);

    expect(itemListElement.map((item) => item.item)).toEqual([
      `${URL_SITE}/concursos`,
      `${URL_SITE}/orgaos/cra-rj`,
      `${URL_SITE}/concursos/edital-1-2026`,
    ]);
    for (const item of itemListElement) {
      expect(item.item.startsWith("http")).toBe(true);
    }
  });

  it("todo degrau é um ListItem", () => {
    for (const item of trilhaEstruturada(DEGRAUS).itemListElement) {
      expect(item["@type"]).toBe("ListItem");
    }
  });

  it("uma trilha de dois degraus declara dois, e não três", () => {
    // A forma exata do defeito de origem, ao contrário: a lista estruturada
    // não tem como declarar um degrau que a tela não vai desenhar, porque
    // ela sai da mesma lista que a tela.
    const { itemListElement } = trilhaEstruturada(DEGRAUS.slice(0, 2));

    expect(itemListElement).toHaveLength(2);
    expect(itemListElement[1].name).toBe("CRA-RJ");
  });

  it("não inventa degrau para uma trilha vazia", () => {
    expect(trilhaEstruturada([]).itemListElement).toEqual([]);
  });
});
