import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EncerramSemana } from "./EncerramSemana";
import { PorEstado } from "./PorEstado";
import { TabelaAbertos } from "./TabelaAbertos";
import { ComoFunciona } from "./ComoFunciona";
import { CONCURSOS } from "@/mocks/concursos";

const HOJE = new Date(2026, 8, 24);

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
