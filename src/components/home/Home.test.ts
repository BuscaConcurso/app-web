import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EncerramSemana } from "./EncerramSemana";
import { PorEstado } from "./PorEstado";
import { TabelaAbertos } from "./TabelaAbertos";
import { ComoFunciona } from "./ComoFunciona";
import { destinoPertoDeMim } from "./PertoDeMim";
import { CONCURSOS } from "@/mocks/concursos";

// `PertoDeMim` (dentro de `PorEstado`) chama `useRouter()`, que lança fora
// de um `<AppRouterProvider>`; ver o mesmo mock em `Hero.test.ts`.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const HOJE = new Date(2026, 8, 24);

describe("destinoPertoDeMim", () => {
  it("abre os abertos do estado, ou de todo o Brasil sem estado", () => {
    expect(destinoPertoDeMim("RJ")).toBe("/concursos?situacao=abertas&uf=RJ");
    expect(destinoPertoDeMim(null)).toBe("/concursos?situacao=abertas");
  });
});

describe("blocos da home", () => {
  it("encerram esta semana some sem concurso", () => {
    expect(renderToStaticMarkup(createElement(EncerramSemana, { concursos: [], hoje: HOJE }))).toBe("");
  });

  it("a tabela mostra o total e leva para a lista completa", () => {
    const html = renderToStaticMarkup(createElement(TabelaAbertos, { concursos: CONCURSOS.slice(0, 6), total: 113, hoje: HOJE }));
    expect(html).toContain("113 concursos abertos agora");
    expect(html).toContain('href="/concursos?situacao=abertas"');
  });

  it("o mapa desenha as 27 UFs mesmo sem aberto nenhum", () => {
    const html = renderToStaticMarkup(createElement(PorEstado, { ufs: [], orgaos: [], bancas: [] }));
    expect(html.match(/data-uf=/g)).toHaveLength(27);
    expect(html).toContain('id="estados"');
  });

  it("como funciona sem aviso não fala em atos fora da lista", () => {
    const html = renderToStaticMarkup(createElement(ComoFunciona, { aviso: null }));
    expect(html).toContain("Da fonte oficial para a sua tela");
    expect(html).not.toContain("ficaram fora");
  });
});
