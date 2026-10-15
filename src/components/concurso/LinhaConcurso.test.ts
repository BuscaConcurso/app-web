import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONCURSOS } from "@/mocks/concursos";
import { LinhaConcurso } from "./LinhaConcurso";

const HOJE = new Date("2026-09-28T12:00:00Z");

function linha(tipo: (typeof CONCURSOS)[number]["tipo"]) {
  const [concurso] = CONCURSOS;
  return renderToStaticMarkup(
    createElement(LinhaConcurso, { concurso: { ...concurso!, tipo }, hoje: HOJE, as: "div" }),
  );
}

describe("LinhaConcurso", () => {
  // No md+ a lista é a linha, não o cartão: sem isto o desktop não mostrava
  // a natureza em lugar nenhum da lista.
  it("processo seletivo e estágio aparecem na frente da linha de baixo", () => {
    expect(linha("processo_seletivo")).toMatch(/text-tinta-600">Processo seletivo · /);
    expect(linha("estagio")).toMatch(/text-tinta-600">Estágio · /);
  });

  it("concurso público não ganha rótulo", () => {
    const html = linha("concurso_publico");
    expect(html).not.toContain("Processo seletivo");
    expect(html).not.toContain("Estágio");
  });
});
