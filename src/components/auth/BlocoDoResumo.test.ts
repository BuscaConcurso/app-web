import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlocoDoResumo } from "./BlocoDoResumo";

function html(props: Partial<Parameters<typeof BlocoDoResumo>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(BlocoDoResumo, {
      ligado: true,
      areas: [],
      uf: null,
      ocupado: false,
      aoAlternar: () => {},
      aoAlternarArea: () => {},
      aoMudarUf: () => {},
      ...props,
    }),
  );
}

describe("BlocoDoResumo", () => {
  it("o interruptor é rotulado pelo título do bloco", () => {
    const bloco = html({ ligado: false });
    expect(bloco).toContain('id="t-resumo"');
    expect(bloco).toContain(">Resumo semanal</h3>");
    expect(bloco).toMatch(/role="switch" aria-checked="false" aria-labelledby="t-resumo"/u);
    expect(bloco).toContain("Um e-mail por semana, às segundas.");
  });

  it("desligado não mostra áreas nem estado", () => {
    const bloco = html({ ligado: false });
    expect(bloco).not.toContain("aria-pressed");
    expect(bloco).not.toContain("<select");
    expect(bloco).not.toContain("ÁREAS DE INTERESSE");
  });

  it("ligado mostra as 12 áreas, com as marcadas pressionadas", () => {
    const bloco = html({ areas: ["saude", "educacao"] });
    expect(bloco.match(/aria-pressed="/gu)).toHaveLength(12);
    expect(bloco.match(/aria-pressed="true"/gu)).toHaveLength(2);
    expect(bloco).toMatch(/aria-pressed="true"[^>]*>Saúde<\/button>/u);
    expect(bloco).toMatch(/aria-pressed="false"[^>]*>Tribunais<\/button>/u);
    expect(bloco).toContain("Nenhuma marcada: o resumo traz todas as áreas.");
    expect(bloco).toContain("<legend");
  });

  it("o estado: Todo o Brasil e as 27 UFs, com a escolhida selecionada", () => {
    const bloco = html({ uf: "SP" });
    expect(bloco).toMatch(/<label[^>]*for="resumo-uf"[^>]*>ESTADO<\/label>/u);
    expect(bloco.match(/<option/gu)).toHaveLength(28);
    expect(bloco).toContain('<option value="">Todo o Brasil</option>');
    expect(bloco).toContain('<option value="SP" selected="">São Paulo</option>');
  });

  it("enquanto salva, os controles avisam que estão ocupados", () => {
    const bloco = html({ ocupado: true });
    expect(bloco).toMatch(/aria-disabled="true"[^>]*>Saúde<\/button>|aria-pressed="false" aria-disabled="true"/u);
    expect(bloco).toMatch(/<select[^>]*aria-disabled="true"/u);
  });
});
