import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Hero } from "./Hero";
import { destinoDaBuscaDoHero } from "./BuscaDoHero";
import { Numeros } from "./Numeros";
import { CONCURSOS } from "@/mocks/concursos";

/**
 * `BuscaDoHero` (filho cliente de `Hero`) chama `useRouter()` para navegar
 * em SPA. Fora de um `<AppRouterProvider>` isso lança "invariant expected
 * app router to be mounted" (`node_modules/next/dist/client/components/
 * navigation.js`), e `renderToStaticMarkup` abaixo não monta provider
 * nenhum. O mock troca o hook por um `push` inofensivo, só para o
 * componente renderizar; nenhuma asserção deste arquivo depende dele.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

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

describe("destinoDaBuscaDoHero", () => {
  it("monta /busca/<slug> com uf e escolaridade, sem parâmetro vazio", () => {
    expect(destinoDaBuscaDoHero("professor", "SP", "medio")).toBe(
      "/busca/professor?uf=SP&escolaridade=medio",
    );
  });

  it("sem termo, uf nem escolaridade, vai para /concursos sem query", () => {
    expect(destinoDaBuscaDoHero("", "", "")).toBe("/concursos");
  });

  it("uf ou escolaridade inválida (fora da lista) não aparece na URL", () => {
    expect(destinoDaBuscaDoHero("", "XX", "banana")).toBe("/concursos");
  });
});
