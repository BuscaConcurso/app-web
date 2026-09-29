import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedDoDiario } from "./FeedDoDiario";
import { agruparPorDia, type AtoDoDiario } from "@/lib/diarioOficial";
import { CONCURSOS } from "@/mocks/concursos";

const ato = (titulo: string, url: string | null): AtoDoDiario => ({
  publicadoEm: "2026-09-25",
  titulo,
  url,
  secao: "DO3",
  concurso: CONCURSOS[0],
});

function desenhar(atos: AtoDoDiario[]): string {
  return renderToStaticMarkup(createElement(FeedDoDiario, { dias: agruparPorDia(atos, "2026-09-28") }));
}

/** O nome acessível de cada link externo: o texto dele, sem as marcas. */
function nomesDosLinksDoDou(html: string): string[] {
  return [...html.matchAll(/<a [^>]*target="_blank"[^>]*>(.*?)<\/a>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  );
}

describe("FeedDoDiario", () => {
  it("cada Ler no DOU tem nome próprio, com o título do ato", () => {
    const html = desenhar([
      ato("EDITAL DE ABERTURA Nº 1/2026", "https://dou/1"),
      ato("RETIFICAÇÃO DO EDITAL Nº 1/2026", "https://dou/2"),
    ]);
    expect(nomesDosLinksDoDou(html)).toEqual([
      "Ler no DOU: Edital de abertura nº 1/2026",
      "Ler no DOU: Retificação do edital nº 1/2026",
    ]);
  });

  it("ato sem endereço não ganha link para o DOU", () => {
    expect(nomesDosLinksDoDou(desenhar([ato("EDITAL Nº 2/2026", null)]))).toEqual([]);
  });
});
