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

  it("Diário Oficial e Áreas acendem na página em breve deles", () => {
    expect(ativo("Diário Oficial", "/em-breve/diario-oficial")).toBe(true);
    expect(ativo("Áreas", "/em-breve/areas")).toBe(true);
  });

  it("nenhuma acende na home", () => {
    expect(ITENS_DA_NAV.some((item) => item.ativo("/", new URLSearchParams()))).toBe(false);
  });
});

describe("abas da nav interna", () => {
  it("são Abertos, Previstos e Diário Oficial, como em Concurso.dc.html", () => {
    expect(ITENS_DA_NAV.filter((item) => !item.soNaHome).map((item) => item.rotulo)).toEqual([
      "Abertos",
      "Previstos",
      "Diário Oficial",
    ]);
  });
});

describe("Estados no celular", () => {
  it("abaixo de md leva aos estados do rodapé, porque o mapa da home some ali", () => {
    const estados = ITENS_DA_NAV.find((item) => item.rotulo === "Estados");
    expect(estados?.href).toBe("/#estados");
    expect(estados && "hrefCelular" in estados ? estados.hrefCelular : null).toBe("#por-estado");
  });
});
