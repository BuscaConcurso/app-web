import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerCor, razaoDeContraste, sobre, temasDoCss, type Tokens } from "./contraste";

const { claro, altoContraste } = temasDoCss(
  readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"),
);

/** WCAG AA. Texto grande (3:1) não aparece: nenhum par abaixo depende dele. */
const TEXTO = 4.5;
const NAO_TEXTO = 3;
/** WCAG AAA, o piso de texto no modo de alto contraste. */
const TEXTO_ALTO = 7;

const SUPERFICIES = ["pagina", "cartao", "rebaixada"];

interface Par {
  texto: string;
  fundo: string;
  minimo: number;
}

const PARES: Par[] = [
  ...["tinta-900", "tinta-600", "tinta-500"].flatMap((texto) =>
    SUPERFICIES.map((fundo) => ({ texto, fundo, minimo: TEXTO })),
  ),
  ...["link", "link-hover"].flatMap((texto) =>
    ["pagina", "cartao"].map((fundo) => ({ texto, fundo, minimo: TEXTO })),
  ),
  // "acao" é só superfície (fundo do botão
  // primário, com texto branco fixo). Texto verde usa `verde-texto`, o
  // mesmo token do sinal "verde" (ver `ESTILO_DO_TOM`/rótulos verdes em
  // `AccountScreen.tsx` e `Cronograma.tsx`).
  ...["pagina", "cartao", "rebaixada"].map((fundo) => ({
    texto: "verde-texto", fundo, minimo: TEXTO,
  })),
  { texto: "acao-texto", fundo: "acao", minimo: TEXTO },
  { texto: "acao-texto", fundo: "acao-hover", minimo: TEXTO },
  { texto: "ouro-texto", fundo: "ouro", minimo: TEXTO },
  { texto: "ouro-texto", fundo: "ouro-hover", minimo: TEXTO },
  // O sinal ouro tem par próprio: o texto sobre o fundo claro do sinal não é
  // o mesmo que segura leitura sobre o ouro cheio.
  { texto: "ouro-sinal-texto", fundo: "ouro-fundo", minimo: TEXTO },
  ...["verde", "anil", "urucum", "neutro"].map((sinal) => ({
    texto: `${sinal}-texto`, fundo: `${sinal}-fundo`, minimo: TEXTO,
  })),
  { texto: "urucum-texto", fundo: "cartao", minimo: TEXTO },
  { texto: "faixa-texto", fundo: "faixa", minimo: TEXTO },
  { texto: "utilitaria-texto", fundo: "utilitaria", minimo: TEXTO },
  { texto: "acao-texto", fundo: "urucum", minimo: TEXTO },
  { texto: "acao-texto", fundo: "anil", minimo: TEXTO },
  { texto: "rodape-texto", fundo: "rodape", minimo: TEXTO },
  { texto: "rodape-suave", fundo: "rodape", minimo: TEXTO },
  // Não texto: a superfície do botão primário, o anel de foco e os ícones.
  //
  // `acao` é só superfície (botão, anel de foco, ponto do cronograma,
  // marcador do filtro): texto verde usa `verde-texto`, que tem par de texto
  // logo acima. Por isso `acao` só aparece nos pares de não-texto abaixo.
  { texto: "acao", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "acao", fundo: "pagina", minimo: NAO_TEXTO },
  { texto: "ouro", fundo: "faixa", minimo: NAO_TEXTO },
  // `ouro` também é TEXTO sobre `faixa` no herói, a
  // segunda linha do título ("Direto do edital."). O par de não-texto acima
  // cobre a superfície (o quadrado do número na pílula, que usa
  // `ouro-texto` como letra, já coberto por outro par); este cobre a letra
  // dourada direto sobre o verde da faixa.
  { texto: "ouro", fundo: "faixa", minimo: TEXTO },
  { texto: "contorno", fundo: "cartao", minimo: 1.3 },
  // `tinta-900`/`cartao` ocupam o lugar dos antigos `inverso`/`inverso-texto`,
  // como par de leitura direta, e não só um alias, porque
  // `MenuConta.tsx` usa a combinação como superfície de contraste máximo
  // (filtro ativo, ícone marcado).
  { texto: "cartao", fundo: "tinta-900", minimo: TEXTO },
  { texto: "cartao", fundo: "tinta-600", minimo: TEXTO },
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
  it("todo token dos pares existe nos dois modos", () => {
    const nomes = new Set(PARES.flatMap(({ texto, fundo }) => [texto, fundo]));
    for (const nome of nomes) {
      expect(claro[nome], nome).toBeDefined();
      expect(altoContraste[nome], nome).toBeDefined();
    }
  });

  it("no tema claro, todo par usado passa do mínimo AA", () => {
    const falhas = PARES.filter((par) => razao(claro, par) < par.minimo).map(
      (par) => `${par.texto} sobre ${par.fundo}: ${razao(claro, par).toFixed(2)} < ${par.minimo}`,
    );
    expect(falhas).toEqual([]);
  });

  it("no alto contraste, todo par de texto passa de 7:1 (AAA) e o resto do mínimo AA", () => {
    const minimo = (par: Par) => (par.minimo === TEXTO ? TEXTO_ALTO : par.minimo);
    const falhas = PARES.filter((par) => razao(altoContraste, par) < minimo(par)).map(
      (par) =>
        `${par.texto} sobre ${par.fundo}: ${razao(altoContraste, par).toFixed(2)} < ${minimo(par)}`,
    );
    expect(falhas).toEqual([]);
  });
});
