import { describe, expect, it } from "vitest";
import { faceDoSelo } from "./selo";

const logo = "https://api.buscaconcurso.com.br/logos/ab/cd/" + "a".repeat(64) + ".webp";

describe("faceDoSelo", () => {
  it("logo quando há URL https", () => {
    expect(faceDoSelo({ logoUrl: logo, sigla: "STJ" })).toEqual({ tipo: "logo", url: logo });
  });

  it("aceita http só em localhost, para o ambiente de desenvolvimento", () => {
    const local = "http://localhost:8788/logos/ab/cd/x.webp";
    expect(faceDoSelo({ logoUrl: local, sigla: null })).toEqual({ tipo: "logo", url: local });
    expect(faceDoSelo({ logoUrl: "http://exemplo.com/x.webp", sigla: "STJ" })).toEqual({
      tipo: "sigla",
      letras: "STJ",
    });
  });

  it("aceita caminho da mesma origem, e só ele entre os relativos", () => {
    expect(faceDoSelo({ logoUrl: "/icone-32.png", sigla: null })).toEqual({
      tipo: "logo",
      url: "/icone-32.png",
    });
    expect(faceDoSelo({ logoUrl: "//outro.site/x.png", sigla: null })).toEqual({ tipo: "vazio" });
  });

  it("recusa o que não é URL de imagem na web", () => {
    for (const logoUrl of ["javascript:alert(1)", "data:image/png;base64,AAAA", "nao e url", "  "]) {
      expect(faceDoSelo({ logoUrl, sigla: null })).toEqual({ tipo: "vazio" });
    }
  });

  it("sigla quando não há logo, sem espaço em volta", () => {
    expect(faceDoSelo({ logoUrl: null, sigla: " UFMG " })).toEqual({ tipo: "sigla", letras: "UFMG" });
    expect(faceDoSelo({ sigla: "MD" })).toEqual({ tipo: "sigla", letras: "MD" });
  });

  it("vazio sem logo e sem sigla, inclusive sigla só de espaço", () => {
    expect(faceDoSelo({ logoUrl: null, sigla: null })).toEqual({ tipo: "vazio" });
    expect(faceDoSelo({ logoUrl: null, sigla: "   " })).toEqual({ tipo: "vazio" });
  });
});
