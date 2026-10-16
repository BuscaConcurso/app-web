import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CONCURSOS } from "@/mocks/concursos";
import { LinhaConcurso, orgaoECargo } from "./LinhaConcurso";

const HOJE = new Date("2026-09-28T12:00:00Z");

function linha(tipo: (typeof CONCURSOS)[number]["tipo"]) {
  const [concurso] = CONCURSOS;
  return renderToStaticMarkup(
    createElement(LinhaConcurso, { concurso: { ...concurso!, tipo }, hoje: HOJE, as: "div" }),
  );
}

type Concurso = (typeof CONCURSOS)[number];

function comCargos(nomesDeCargo: string[], sigla: string | null = null): Concurso {
  const [concurso] = CONCURSOS;
  return {
    ...concurso!,
    nomesDeCargo,
    orgao: { ...concurso!.orgao, nome: "Polícia Federal", sigla },
  };
}

describe("orgaoECargo", () => {
  // A sigla vem nula na maior parte do acervo. Com o cargo no título, a lista
  // da busca mostrava "Agente de Polícia Federal" sem dizer de que órgão.
  it("com cargo informado, o título é o órgão e o cargo vai para a linha de baixo", () => {
    const { titulo, subtitulo } = orgaoECargo(comCargos(["Agente de Polícia Federal"]));
    expect(titulo).toBe("Polícia Federal");
    expect(subtitulo).toContain("Agente de Polícia Federal");
  });

  it("o título é o nome do órgão mesmo quando a sigla existe", () => {
    expect(orgaoECargo(comCargos(["Delegado"], "PF")).titulo).toBe("Polícia Federal");
  });

  it("na página do órgão o cargo continua sendo o título", () => {
    expect(orgaoECargo(comCargos(["Delegado"]), true).titulo).toBe("Delegado");
  });
});

describe("LinhaConcurso", () => {
  it("a linha inteira leva ao concurso, e salvar e Ver continuam por cima", () => {
    const html = linha("concurso_publico");
    expect(html).toMatch(/role="row" class="relative /);
    expect(html).toMatch(/<a [^>]*class="[^"]*after:absolute after:inset-0[^"]*"[^>]*href="\/concursos\//);
  });

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
