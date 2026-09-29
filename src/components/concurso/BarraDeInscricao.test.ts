import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Cargo } from "@/lib/dominio";
import { taxaDoConcurso } from "@/lib/fatos";
import { moeda } from "@/lib/formato";
import { BarraDeInscricao } from "./BarraDeInscricao";

const DESTINO = { href: "https://banca.org.br/inscricao", host: "banca.org.br", rotulo: "Ir para a inscrição" };

function cargoComTaxa(taxaInscricao: number | null): Cargo {
  return {
    nome: "Área X", codigo: null, escolaridade: "superior", area: null, jornadaHoras: null,
    requisitos: [], taxaInscricao, vagas: [], remuneracoes: [], evidencia: [],
  };
}

function barra(taxa: string | null): string {
  return renderToStaticMarkup(createElement(BarraDeInscricao, { slug: "tj-sp-2026", taxa, destino: DESTINO }));
}

describe("BarraDeInscricao", () => {
  it("o botão leva a marca do clique na inscrição, vindo da barra do celular", () => {
    const html = barra("R$ 100,00");
    expect(html).toContain('data-analitica="inscricao_clicada"');
    expect(html).toContain('data-analitica-slug="tj-sp-2026"');
    expect(html).toContain('data-analitica-local="barra"');
  });

  it("sem taxa informada diz 'Não informada', e não 'Sem taxa'", () => {
    const taxa = taxaDoConcurso({ taxaInscricao: null, cargos: [cargoComTaxa(null)] });
    expect(taxa).toBeNull();
    const html = barra(taxa);
    expect(html).toContain("Não informada");
    expect(html).not.toContain("Sem taxa");
  });

  // `fatosDoConcurso` monta o fato TAXA com esta mesma `taxaDoConcurso`: a
  // barra e o fato não têm como discordar.
  it("taxa só no cargo aparece na barra", () => {
    const concurso = { taxaInscricao: null, cargos: [cargoComTaxa(240)] };
    const taxa = taxaDoConcurso(concurso);
    expect(taxa).toBe(moeda(240));
    expect(barra(taxa)).toContain(moeda(240));
  });

  it("taxas diferentes por cargo viram faixa", () => {
    expect(taxaDoConcurso({ taxaInscricao: null, cargos: [cargoComTaxa(100), cargoComTaxa(150)] })).toBe(
      `${moeda(100)} a ${moeda(150)}`,
    );
  });
});

