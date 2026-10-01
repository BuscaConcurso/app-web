import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { EventoDoCronograma } from "@/lib/dominio";
import { Cronograma } from "./Cronograma";
import { CorpoDoArtigo } from "@/components/artigos/CorpoDoArtigo";
import { artigoDeTeste } from "@/components/artigos/artigos.fixtures";
import { CONCURSOS } from "@/mocks/concursos";

const evento: EventoDoCronograma = { tipo: "fim_inscricao", ato: "dou-123", inicio: "2026-10-10", fim: null, hora: null, localidades: [], observacao: null, evidencia: "Inscrições até 10 de outubro." };

describe("origem do cronograma", () => {
  it("mantém a âncora local quando não recebe página de origem", () => {
    const html = renderToStaticMarkup(createElement(Cronograma, { eventos: [evento], hoje: "2026-10-01" }));
    expect(html).toContain('href="#ato-dou-123"');
  });
  it("atravessa para a ficha quando recebe hrefBaseDaOrigem", () => {
    const html = renderToStaticMarkup(createElement(Cronograma, { eventos: [evento], hoje: "2026-10-01", hrefBaseDaOrigem: "/concursos/canonico" }));
    expect(html).toContain('href="/concursos/canonico#ato-dou-123"');
    expect(html).not.toContain('href="#ato-dou-123"');
  });
  it("o artigo encaminha para o slug canônico, mesmo sem fontes locais", () => {
    const concurso = { ...CONCURSOS[0], slug: "canonico", cargos: [], cronograma: [evento], origens: [], editalCitadoUrl: null };
    const html = renderToStaticMarkup(createElement(CorpoDoArtigo, { artigo: artigoDeTeste, vivos: { principal: concurso, citados: [], indisponiveis: 0 }, hoje: "2026-10-01" }));
    expect(html).toContain('href="/concursos/canonico#ato-dou-123"');
    expect(html).not.toContain('href="#ato-dou-123"');
  });
});
