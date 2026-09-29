import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Origem } from "@/lib/dominio";
import { AtosPublicados, enderecoLegivel, temSeloConferido } from "./AtosPublicados";

describe("enderecoLegivel", () => {
  it("tira protocolo, query e barra final", () => {
    expect(
      enderecoLegivel("https://servicos.ufrrj.br/concursos/?acao=concursos_andamento&tipo=9"),
    ).toBe("servicos.ufrrj.br/concursos");
  });

  it("mantém o caminho", () => {
    expect(enderecoLegivel("http://www.banca.org.br/edital/2026/01")).toBe(
      "www.banca.org.br/edital/2026/01",
    );
  });

  it("devolve o texto sem protocolo quando não é URL", () => {
    expect(enderecoLegivel("banca.org.br/edital")).toBe("banca.org.br/edital");
  });
});

describe("selo \"Conferido por nós\"", () => {
  const origem = (texto: string | null): Origem =>
    ({
      chave: "1",
      url: null,
      titulo: "Edital 1",
      fonte: "DOU",
      vistoEm: "2026-09-20T10:00:00Z",
      texto,
      caracteres: texto?.length ?? null,
      faq: [],
    }) as unknown as Origem;

  it("só vale quando o texto do ato está guardado", () => {
    expect(temSeloConferido(origem("Edital de abertura."))).toBe(true);
    expect(temSeloConferido(origem(null))).toBe(false);
    expect(temSeloConferido(origem("  "))).toBe(false);
  });

  it("some da tela quando o texto não está guardado", () => {
    const html = renderToStaticMarkup(createElement(AtosPublicados, { origens: [origem(null)] }));
    expect(html).not.toContain("CONFERIDO POR NÓS");
    expect(html).toContain("O texto deste ato não está guardado.");
  });
});
