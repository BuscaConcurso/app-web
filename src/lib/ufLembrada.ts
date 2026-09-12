/**
 * O estado que a pessoa está usando, guardado entre visitas.
 *
 * É um `localStorage` embrulhado como origem externa, para ser lido com
 * `useSyncExternalStore`. Ler direto na renderização quebraria a hidratação,
 * porque o servidor não tem `localStorage` e devolveria vazio enquanto o
 * navegador devolveria a sigla; ler dentro de um efeito e chamar `setState`
 * resolveria a hidratação e traria um piscar. O `useSyncExternalStore` existe
 * exatamente para este caso: o servidor recebe um instantâneo próprio e o
 * cliente sincroniza depois, sem divergência e sem efeito.
 */
import { UFS, type Uf } from "./dominio";

const CHAVE = "buscaconcurso.uf";

const ouvintes = new Set<() => void>();

/**
 * `undefined` marca "ainda não li do armazenamento". O cache existe porque
 * `getSnapshot` precisa devolver o mesmo valor entre renderizações; ir ao
 * `localStorage` toda vez devolveria strings novas e deixaria o React em
 * laço infinito.
 */
let cache: Uf | null | undefined;

function ler(): Uf | null {
  try {
    const guardada = window.localStorage.getItem(CHAVE);
    return guardada && (UFS as readonly string[]).includes(guardada)
      ? (guardada as Uf)
      : null;
  } catch {
    // Aba anônima ou armazenamento bloqueado: seguir sem memória é aceitável.
    return null;
  }
}

export function assinarUfLembrada(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function ufLembrada(): Uf | null {
  if (cache === undefined) cache = ler();
  return cache;
}

/** No servidor não há o que lembrar. */
export function ufLembradaNoServidor(): Uf | null {
  return null;
}

export function lembrarUf(uf: Uf | null): void {
  cache = uf;
  try {
    if (uf) window.localStorage.setItem(CHAVE, uf);
    else window.localStorage.removeItem(CHAVE);
  } catch {
    // Idem: a memória em processo continua valendo para esta navegação.
  }
  for (const ouvinte of ouvintes) ouvinte();
}
