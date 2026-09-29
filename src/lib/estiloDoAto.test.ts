import { describe, expect, it } from "vitest";
import { estiloDoAto } from "./estiloDoAto";

describe("estiloDoAto", () => {
  it("homologado e inscrições abertas em verde, cada um com o seu ícone", () => {
    expect(estiloDoAto("homologado")).toEqual({ icone: "homologado", classe: "bg-verde-fundo text-verde-texto" });
    expect(estiloDoAto("inscricoes_abertas")).toEqual({ icone: "aberto", classe: "bg-verde-fundo text-verde-texto" });
  });

  it("o resto em ouro, com o ícone de previsto", () => {
    expect(estiloDoAto("autorizado")).toEqual({ icone: "previsto", classe: "bg-ouro-fundo text-ouro-sinal-texto" });
  });
});
