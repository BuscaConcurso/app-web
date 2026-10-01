import { describe, expect, it } from "vitest";
// De `./itensDaNav` e não de `./NavPrincipal`: este importa a sessão, que
// exige `NEXT_PUBLIC_BC_API_URL` ao carregar.
import { ITENS_DA_NAV } from "./itensDaNav";

const ativo = (rotulo: string, caminho: string, busca = "") =>
  ITENS_DA_NAV.find((item) => item.rotulo === rotulo)!.ativo(caminho, new URLSearchParams(busca));

describe("ITENS_DA_NAV", () => {
  it("Abertos acende na lista com situação aberta", () => {
    expect(ativo("Abertos", "/concursos", "situacao=abertas")).toBe(true);
    expect(ativo("Abertos", "/concursos", "situacao=previstos")).toBe(false);
  });

  it("Previstos acende na lista com situação prevista", () => {
    expect(ativo("Previstos", "/concursos", "situacao=previstos")).toBe(true);
  });

  it("Diário Oficial leva ao feed e acende nele, com ou sem página", () => {
    expect(ITENS_DA_NAV.find((item) => item.rotulo === "Diário Oficial")!.href).toBe("/diario-oficial");
    expect(ativo("Diário Oficial", "/diario-oficial")).toBe(true);
    expect(ativo("Diário Oficial", "/diario-oficial", "pagina=3")).toBe(true);
  });

  it("Áreas leva a /areas e acende nela e em cada área", () => {
    expect(ITENS_DA_NAV.find((item) => item.rotulo === "Áreas")?.href).toBe("/areas");
    expect(ativo("Áreas", "/areas")).toBe(true);
    expect(ativo("Áreas", "/areas/saude")).toBe(true);
    expect(ativo("Áreas", "/areasx")).toBe(false);
  });

  it("nenhuma acende na home", () => {
    expect(ITENS_DA_NAV.some((item) => item.ativo("/", new URLSearchParams()))).toBe(false);
  });
});

describe("abas da nav interna", () => {
  it("oferece concursos, Diário Oficial e Artigos nas páginas internas", () => {
    expect(ITENS_DA_NAV.filter((item) => !item.soNaHome).map((item) => item.rotulo)).toEqual([
      "Abertos",
      "Previstos",
      "Diário Oficial",
      "Artigos",
    ]);
  });
  it("Artigos acende no catálogo, na busca e na leitura", () => {
    expect(ITENS_DA_NAV.find(item => item.rotulo === "Artigos")?.href).toBe("/artigos");
    for (const caminho of ["/artigos", "/artigos/busca", "/artigos/leitura"]) expect(ativo("Artigos", caminho)).toBe(true);
    expect(ativo("Artigos", "/artigosx")).toBe(false);
  });
});

describe("Estados no celular", () => {
  it("abaixo de md leva aos estados do rodapé, porque o mapa da home some ali", () => {
    const estados = ITENS_DA_NAV.find((item) => item.rotulo === "Estados");
    expect(estados?.href).toBe("/#estados");
    expect(estados && "hrefCelular" in estados ? estados.hrefCelular : null).toBe("#por-estado");
  });
});
