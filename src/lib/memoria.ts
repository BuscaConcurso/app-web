/**
 * Guarda o resultado de uma busca assíncrona por um tempo, no processo.
 *
 * Existe por causa de um limite do Next: o Data Cache recusa entrada acima de
 * 2 MB (`node_modules/next/dist/server/lib/incremental-cache/index.js`), e o
 * corpo de `/acervo` tem 4,2 MB. Com `next: { revalidate }` sozinho, cada
 * regeneração de cada página ISR baixava e analisava o acervo inteiro de
 * novo, e o log ganhava um "items over 2MB can not be cached" por vez.
 *
 * A promessa é guardada, e não o valor: duas páginas regenerando juntas
 * dividem uma requisição. Falha não é guardada, para a próxima chamada
 * tentar de novo em vez de repetir o erro por cinco minutos.
 */
export function lembrarPor<T>(
  validadeMs: number,
  buscar: () => Promise<T>,
  agora: () => number = Date.now,
): () => Promise<T> {
  let guardado: { valor: Promise<T>; ate: number } | null = null;
  return () => {
    const instante = agora();
    if (guardado && instante < guardado.ate) return guardado.valor;
    const este = { valor: buscar(), ate: instante + validadeMs };
    guardado = este;
    este.valor.catch(() => {
      if (guardado === este) guardado = null;
    });
    return este.valor;
  };
}
