/**
 * Contraste WCAG entre os tokens de cor de `globals.css`.
 *
 * Existe para o teste ler as cores do próprio CSS, e não de uma cópia: uma
 * tabela de valores escrita no teste envelheceria no primeiro ajuste de tom
 * e continuaria passando. A fórmula é a do WCAG 2.2 (luminância relativa
 * sRGB e razão (L1 + 0,05) / (L2 + 0,05)).
 */
export type Rgb = readonly [number, number, number];
export interface Cor {
  rgb: Rgb;
  alfa: number;
}
export type Tokens = Record<string, string>;

/** `#rrggbb` e `rgb(r g b / a)`, as duas formas que `globals.css` usa. */
export function lerCor(valor: string): Cor {
  const texto = valor.trim();
  const hex = texto.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [n >> 16, (n >> 8) & 255, n & 255], alfa: 1 };
  }
  const rgb = texto.match(
    /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+)\s*)?\)$/,
  );
  if (rgb) {
    return {
      rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])],
      alfa: rgb[4] === undefined ? 1 : Number(rgb[4]),
    };
  }
  throw new Error(`cor que o teste não sabe ler: ${valor}`);
}

/**
 * A cor que o olho vê: a translúcida composta sobre o fundo. O rodapé claro
 * escreve em branco a 75% e 48%, e medir o branco puro diria 18:1 onde a tela
 * mostra 4,9:1.
 */
export function sobre(cor: Cor, fundo: Rgb): Rgb {
  const [r, g, b] = cor.rgb.map(
    (canal, i) => canal * cor.alfa + fundo[i] * (1 - cor.alfa),
  );
  return [r, g, b];
}

function linear(canal: number): number {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminancia([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function razaoDeContraste(a: Rgb, b: Rgb): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (maior + 0.05) / (menor + 0.05);
}

function tokensDe(bloco: string): Tokens {
  const tokens: Tokens = {};
  for (const [, nome, valor] of bloco.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[nome] = valor.trim();
  }
  return tokens;
}

/** O miolo entre a chave que abre depois de `abertura` e a que a fecha. */
function blocoApos(css: string, abertura: RegExp): string {
  const inicio = css.search(abertura);
  if (inicio < 0) throw new Error(`bloco não encontrado: ${abertura}`);
  const chave = css.indexOf("{", inicio);
  let profundidade = 0;
  for (let i = chave; i < css.length; i += 1) {
    if (css[i] === "{") profundidade += 1;
    else if (css[i] === "}") {
      profundidade -= 1;
      if (profundidade === 0) return css.slice(chave + 1, i);
    }
  }
  throw new Error(`bloco sem fim: ${abertura}`);
}

/**
 * Os dois temas como o navegador os resolve: o escuro só sobrescreve, então
 * o que ele não declara (o amarelo, por exemplo) é o do claro. O escuro
 * aparece duas vezes em `globals.css`, na escolha explícita e dentro da
 * media query do "sistema", e é por isso que os dois são devolvidos.
 */
export function temasDoCss(css: string): {
  claro: Tokens;
  escuro: Tokens;
  escuroDoSistema: Tokens;
} {
  const claro = tokensDe(blocoApos(css, /@theme\s*\{/));
  const escuro = tokensDe(blocoApos(css, /:root\[data-tema="escuro"\]/));
  const escuroDoSistema = tokensDe(blocoApos(css, /:root\[data-tema="sistema"\]/));
  return {
    claro,
    escuro: { ...claro, ...escuro },
    escuroDoSistema: { ...claro, ...escuroDoSistema },
  };
}
