/**
 * Se a pessoa já escolheu o estado à mão, para a busca não pedir a
 * localização sozinha de novo.
 *
 * A barra de busca pede a localização ao carregar quando ainda não sabe o
 * estado. Isso resolve quem chega; atrapalha quem já decidiu. O caso que
 * este módulo existe para cobrir: a pessoa escolhe "Todo o Brasil" no
 * seletor. A memória do estado (`ufLembrada`) fica vazia — "Todo o Brasil"
 * é ausência de estado —, e sem esta marca o próximo carregamento veria
 * "não sabemos o estado" e pediria a localização de novo, contra a escolha
 * que ela acabou de fazer. Decisão do parceiro humano: trocar o estado à mão
 * desliga o pedido automático até a pessoa voltar a pedir a localização.
 *
 * É lido só dentro de efeito e escrito só em resposta a clique, nunca na
 * renderização — por isso não precisa do `useSyncExternalStore` que
 * `ufLembrada` usa: o servidor nunca lê, e não há o que divergir na
 * hidratação.
 *
 * Armazenamento bloqueado (janela anônima, cookies desligados) degrada para
 * o comportamento de antes: sem marca, o pedido automático volta a valer.
 * Nada aqui pode quebrar a barra.
 */

const CHAVE = "buscaconcurso.uf.manual";

export function escolheuManualmente(): boolean {
  try {
    return window.localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

export function marcarEscolhaManual(): void {
  try {
    window.localStorage.setItem(CHAVE, "1");
  } catch {
    // Sem armazenamento, vale só para esta navegação.
  }
}

/** A pessoa voltou a pedir a localização: o pedido automático volta a valer. */
export function liberarDeteccao(): void {
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // Idem.
  }
}
