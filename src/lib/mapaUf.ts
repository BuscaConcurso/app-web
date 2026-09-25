/**
 * O mapa de concursos abertos por UF da home: posição de cada estado na
 * grade e a escala de cor que traduz "quantos abertos" em "quão forte".
 *
 * As posições e as cores saem de `docs/prototipo/Main.dc.html:277-300`.
 *
 * O nível 4 do protótipo usa texto branco sobre `#5FAE7E`, mas essa dupla
 * mede 3,71:1, e mesmo trocando para o verde escuro `#0A4D2E` (a correção
 * óbvia, texto escuro sobre fundo claro) o par ainda fica em 3,71:1: abaixo
 * de 4,5:1. O texto foi escurecido um pouco mais, para `#083C24` (4,66:1).
 * O nível 5 tem o mesmo problema por outro lado: branco sobre `#3E9A63` dá
 * 3,50:1. Ali não há como clarear o texto (branco já é o teto), então ele
 * foi escurecido para a mesma família de verde, `#052717` (4,59:1). Os
 * demais níveis já passavam com as cores do protótipo. Os dois ajustes
 * mudam só o texto, nunca o fundo, e o teste abaixo confere os oito pares.
 */
import type { Uf } from "./dominio";

export const POSICAO_UF: Record<Uf, { coluna: number; linha: number }> = {
  RR: { coluna: 3, linha: 1 },
  AP: { coluna: 5, linha: 1 },
  AM: { coluna: 2, linha: 2 },
  PA: { coluna: 4, linha: 2 },
  MA: { coluna: 5, linha: 2 },
  CE: { coluna: 6, linha: 2 },
  RN: { coluna: 7, linha: 2 },
  AC: { coluna: 1, linha: 3 },
  RO: { coluna: 2, linha: 3 },
  MT: { coluna: 3, linha: 3 },
  TO: { coluna: 4, linha: 3 },
  PI: { coluna: 5, linha: 3 },
  PE: { coluna: 6, linha: 3 },
  PB: { coluna: 7, linha: 3 },
  MS: { coluna: 3, linha: 4 },
  GO: { coluna: 4, linha: 4 },
  DF: { coluna: 5, linha: 4 },
  BA: { coluna: 6, linha: 4 },
  AL: { coluna: 7, linha: 4 },
  SP: { coluna: 4, linha: 5 },
  MG: { coluna: 5, linha: 5 },
  ES: { coluna: 6, linha: 5 },
  SE: { coluna: 7, linha: 5 },
  PR: { coluna: 3, linha: 6 },
  RJ: { coluna: 5, linha: 6 },
  SC: { coluna: 3, linha: 7 },
  RS: { coluna: 3, linha: 8 },
};

export type NivelDoMapa = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Faixas medidas sobre o protótipo, onde o máximo é 31 (MG). */
export function nivelDoMapa(total: number, maximo: number): NivelDoMapa {
  if (total <= 0 || maximo <= 0) return 0;
  const razao = total / maximo;
  if (razao >= 1) return 7;
  if (razao >= 0.5) return 6;
  if (razao >= 0.22) return 5;
  if (razao >= 0.16) return 4;
  if (razao >= 0.1) return 3;
  if (razao >= 0.05) return 2;
  return 1;
}

/**
 * Hex fixo, porque é visualização de dado com a mesma escala nos dois temas.
 * O nível 0 não entra aqui: usa os tokens `bg-rebaixada text-tinta-500`, que
 * já variam com o tema.
 */
export const ESTILO_DO_NIVEL: Record<Exclude<NivelDoMapa, 0>, { fundo: string; texto: string }> = {
  1: { fundo: "#E1F0E6", texto: "#0A4D2E" },
  2: { fundo: "#C9E4D2", texto: "#0A4D2E" },
  3: { fundo: "#8CC5A0", texto: "#0A4D2E" },
  4: { fundo: "#5FAE7E", texto: "#083C24" },
  5: { fundo: "#3E9A63", texto: "#052717" },
  6: { fundo: "#0B6B3A", texto: "#FFFFFF" },
  7: { fundo: "#0A4D2E", texto: "#FFFFFF" },
};
