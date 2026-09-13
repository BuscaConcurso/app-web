/**
 * Marcar trechos dentro do texto do ato.
 *
 * As respostas do FAQ não são prosa do modelo: são pedaços literais do ato,
 * conferidos palavra por palavra, e cada uma diz em que posição do texto
 * começa e termina. Como a página já mostra o ato inteiro, o trecho é
 * destacado no lugar em vez de repetido fora de contexto — o leitor vê a
 * resposta na frase que a produziu.
 *
 * O trabalho real é a sobreposição: uma frase só costuma responder mais de
 * uma pergunta. Medido no acervo: 19 pares de trechos aceitos se sobrepõem,
 * e há casos de faixas idênticas — "as inscrições serão realizadas ... no
 * endereço eletrônico X" responde ao mesmo tempo "até quando", "onde" e
 * "como". Pintar cada faixa por conta própria produziria marcas aninhadas e
 * texto repetido; unir antes de pintar produz uma marca só.
 */
export interface Faixa {
  inicio: number;
  fim: number;
}

export interface Pedaco {
  texto: string;
  destacado: boolean;
}

/**
 * Quebra o texto em pedaços alternando fora e dentro de destaque.
 *
 * Faixa inválida — invertida, vazia, fora do texto — é descartada em vez de
 * deslocar o resto: a posição vem do banco, e se um dia ela não casar com o
 * texto, o defeito certo é o destaque faltar, não a página mostrar o texto
 * picado no lugar errado.
 */
export function destacar(texto: string, faixas: Faixa[]): Pedaco[] {
  const validas = faixas
    .map((faixa) => ({
      inicio: Math.max(0, Math.min(faixa.inicio, texto.length)),
      fim: Math.max(0, Math.min(faixa.fim, texto.length)),
    }))
    .filter((faixa) => faixa.fim > faixa.inicio)
    .sort((a, b) => a.inicio - b.inicio || a.fim - b.fim);

  const unidas: Faixa[] = [];
  for (const faixa of validas) {
    const ultima = unidas[unidas.length - 1];
    // `<=` e não `<`: duas faixas que se encostam viram uma marca só, senão o
    // navegador desenharia duas bordas coladas no meio de uma frase.
    if (ultima && faixa.inicio <= ultima.fim) {
      ultima.fim = Math.max(ultima.fim, faixa.fim);
    } else {
      unidas.push({ ...faixa });
    }
  }

  const pedacos: Pedaco[] = [];
  let cursor = 0;
  for (const faixa of unidas) {
    if (faixa.inicio > cursor) {
      pedacos.push({ texto: texto.slice(cursor, faixa.inicio), destacado: false });
    }
    pedacos.push({ texto: texto.slice(faixa.inicio, faixa.fim), destacado: true });
    cursor = faixa.fim;
  }
  if (cursor < texto.length) {
    pedacos.push({ texto: texto.slice(cursor), destacado: false });
  }
  return pedacos;
}
