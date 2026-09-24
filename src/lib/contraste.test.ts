import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerCor, razaoDeContraste, sobre, temasDoCss, type Tokens } from "./contraste";

const { claro, escuro, escuroDoSistema } = temasDoCss(
  readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"),
);

/** WCAG AA. Texto grande (3:1) não aparece: nenhum par abaixo depende dele. */
const TEXTO = 4.5;
const NAO_TEXTO = 3;

/** Toda superfície onde texto de tinta aparece: página, cartões e os chips de tom. */
const SUPERFICIES = [
  "pagina", "cartao", "rebaixada", "bloco",
  "encerrado", "urgente", "previsto",
  "encerrado-chip", "urgente-chip", "previsto-chip", "tinta-100",
];

interface Par {
  texto: string;
  fundo: string;
  minimo: number;
}

const PARES: Par[] = [
  ...["tinta-900", "tinta-800", "tinta-600", "tinta-500"].flatMap((texto) =>
    SUPERFICIES.map((fundo) => ({ texto, fundo, minimo: TEXTO })),
  ),
  ...["link", "link-hover"].flatMap((texto) =>
    ["pagina", "cartao", "rebaixada", "bloco"].map((fundo) => ({ texto, fundo, minimo: TEXTO })),
  ),
  // Os chips do acesso rápido da home no `hover`: rótulo e número sobre tinta-200.
  { texto: "tinta-800", fundo: "tinta-200", minimo: TEXTO },
  { texto: "tinta-600", fundo: "tinta-200", minimo: TEXTO },
  { texto: "acao-texto", fundo: "acao", minimo: TEXTO },
  { texto: "acao-texto", fundo: "acao-hover", minimo: TEXTO },
  { texto: "inverso-texto", fundo: "inverso", minimo: TEXTO },
  { texto: "inverso-texto", fundo: "inverso-hover", minimo: TEXTO },
  { texto: "amarelo-texto", fundo: "amarelo", minimo: TEXTO },
  { texto: "amarelo-texto", fundo: "amarelo-hover", minimo: TEXTO },
  { texto: "vermelho-800", fundo: "cartao", minimo: TEXTO },
  { texto: "vermelho-800", fundo: "urgente", minimo: TEXTO },
  { texto: "vermelho-800", fundo: "urgente-chip", minimo: TEXTO },
  { texto: "urgente-apoio", fundo: "urgente", minimo: TEXTO },
  { texto: "previsto-texto", fundo: "previsto", minimo: TEXTO },
  { texto: "previsto-texto", fundo: "previsto-chip", minimo: TEXTO },
  { texto: "previsto-apoio", fundo: "previsto", minimo: TEXTO },
  { texto: "rodape-texto", fundo: "rodape", minimo: TEXTO },
  { texto: "rodape-suave", fundo: "rodape", minimo: TEXTO },
  { texto: "rodape-tenue", fundo: "rodape", minimo: TEXTO },
  // Não texto: pontos de situação dentro do chip, ícones, a superfície do
  // botão primário contra o cartão e o anel de foco contra a página.
  { texto: "verde-500", fundo: "tinta-100", minimo: NAO_TEXTO },
  { texto: "verde-500", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "ocre", fundo: "previsto-chip", minimo: NAO_TEXTO },
  { texto: "vermelho", fundo: "urgente-chip", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "encerrado-chip", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "tinta-100", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "rebaixada", minimo: NAO_TEXTO },
  // O seletor de tema: o ícone inativo contra o ativo é o que diz o estado.
  { texto: "tinta-400", fundo: "tinta-900", minimo: NAO_TEXTO },
  { texto: "acao", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "acao", fundo: "pagina", minimo: NAO_TEXTO },
];

function razao(tokens: Tokens, { texto, fundo }: Par): number {
  const base = lerCor(tokens[fundo]).rgb;
  return razaoDeContraste(sobre(lerCor(tokens[texto]), base), base);
}

describe("razaoDeContraste", () => {
  it("preto no branco é 21:1, e a cor com ela mesma é 1:1", () => {
    expect(razaoDeContraste([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(razaoDeContraste([80, 80, 80], [80, 80, 80])).toBe(1);
  });

  it("bate com a referência conhecida: #767676 no branco é 4,54:1", () => {
    expect(razaoDeContraste(lerCor("#767676").rgb, [255, 255, 255])).toBeCloseTo(4.54, 2);
  });

  it("compõe a transparência sobre o fundo antes de medir", () => {
    expect(sobre(lerCor("rgb(255 255 255 / 0.5)"), [0, 0, 0])).toEqual([127.5, 127.5, 127.5]);
  });
});

describe("tokens de globals.css", () => {
  it("o escuro do sistema é o mesmo escuro da escolha explícita", () => {
    expect(escuroDoSistema).toEqual(escuro);
  });

  it("todo token dos pares existe nos dois temas", () => {
    const nomes = new Set(PARES.flatMap(({ texto, fundo }) => [texto, fundo]));
    for (const nome of nomes) {
      expect(claro[nome], nome).toBeDefined();
      expect(escuro[nome], nome).toBeDefined();
    }
  });

  for (const [tema, tokens] of [["claro", claro], ["escuro", escuro]] as const) {
    it(`no tema ${tema}, todo par usado passa do mínimo AA`, () => {
      const falhas = PARES.filter((par) => razao(tokens, par) < par.minimo).map(
        (par) => `${par.texto} sobre ${par.fundo}: ${razao(tokens, par).toFixed(2)} < ${par.minimo}`,
      );
      expect(falhas).toEqual([]);
    });
  }
});
