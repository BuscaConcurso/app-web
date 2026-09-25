import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Cargo } from "@/lib/dominio";
import { Cargos } from "./Cargos";

const cargo = (nome: string, total: number): Cargo => ({
  nome, codigo: null, escolaridade: "superior", area: null, jornadaHoras: 60, requisitos: [], taxaInscricao: 100,
  vagas: [{ localidade: null, uf: null, ampla: total, pcd: 0, negros: 0, outras: 0, total, cadastroReserva: false, crQuantidade: null }],
  remuneracoes: [], evidencia: [],
});

describe("Cargos", () => {
  it("mostra 8 áreas e o botão com o total", () => {
    const html = renderToStaticMarkup(createElement(Cargos, { cargos: Array.from({ length: 16 }, (_, i) => cargo(`Área ${i + 1}`, 2)) }));
    expect(html).toContain("Área 8");
    // As áreas além da 8ª ficam no HTML do servidor com `hidden`, para SEO:
    // o servidor manda todas as 16, e só o cliente esconde depois de montar.
    expect(html).toMatch(/<li[^>]*hidden[^>]*>[\s\S]*?Área 9</);
    expect(html).toContain("Mostrar as 16 áreas");
    expect(html).toContain("Vale para todas as 16 áreas:");
  });

  it("até 8 áreas não tem botão", () => {
    const html = renderToStaticMarkup(createElement(Cargos, { cargos: [cargo("A", 1), cargo("B", 3)] }));
    expect(html).not.toContain("Mostrar as");
    expect(html).toContain("1 vaga");
    expect(html).toContain("3 vagas");
  });
});
