/**
 * Marcar trechos dentro do texto do ato.
 *
 * As respostas do FAQ não são prosa do modelo: são pedaços literais do ato,
 * conferidos palavra por palavra, e cada uma diz em que posição do texto
 * começa e termina. Como a página já mostra o ato inteiro, o trecho é
 * destacado no lugar em vez de repetido fora de contexto: o leitor vê a
 * resposta na frase que a produziu.
 *
 * O trabalho real é a sobreposição: uma frase só costuma responder mais de
 * uma pergunta. Medido no acervo: 19 pares de trechos aceitos se sobrepõem,
 * e há casos de faixas idênticas: "as inscrições serão realizadas ... no
 * endereço eletrônico X" responde ao mesmo tempo "até quando", "onde" e
 * "como". Pintar cada faixa por conta própria produziria marcas aninhadas e
 * texto repetido; unir antes de pintar produz uma marca só.
 *
 * ## Sobre uma lista de parágrafos, e não mais sobre um texto contínuo
 *
 * O ato deixou de ser um parágrafo só (`lib/leitura.ts`), e isto aqui não
 * mudou de forma por causa disso: continua recebendo **um** texto e faixas
 * medidas nesse texto. Quem parte é quem chama: para cada parágrafo, desconta
 * o `inicio` dele das faixas e chama esta função com o resultado.
 *
 * O que faz isso funcionar sem nenhum caso especial é o descarte que já
 * existia: a faixa que cai **antes** do parágrafo encolhe para `{0, 0}` e a
 * que cai **depois** para `{fim, fim}`, e as duas saem no `fim > inicio`. A
 * faixa que atravessa a quebra sobrevive dos dois lados, recortada, e vira
 * uma marca em cada parágrafo: que é o desenho certo, porque `<mark>` não
 * pode cruzar `<p>`.
 *
 * A única coisa que o parágrafo obriga quem chama a decidir é a **âncora**:
 * ela pertence ao começo da faixa, então só vai junto no parágrafo em que a
 * faixa de fato começa; no recorte da continuação, não.
 */
export interface Faixa {
  inicio: number;
  fim: number;
  /**
   * O `id` que o grifo desta faixa leva no HTML, para que a âncora do FAQ
   * caia **no trecho** e não no começo do ato.
   *
   * Vai na faixa e não fora dela porque é a união que decide onde ele cai:
   * três perguntas respondidas pela mesma frase viram uma marca só, e as três
   * âncoras têm de apontar para essa marca. Quem une, acumula.
   */
  ancora?: string;
}

export interface Pedaco {
  texto: string;
  destacado: boolean;
  /**
   * As âncoras das faixas que produziram esta marca, em ordem de entrada.
   * Só existe no primeiro pedaço destacado de cada marca, e só quando alguma
   * faixa trouxe `ancora`.
   */
  ancoras?: string[];
}

/** Uma faixa já unida: o que vira uma marca só na tela, com as âncoras que
 *  entraram nela. */
interface Marca {
  inicio: number;
  fim: number;
  ancoras: string[];
}

/**
 * Quebra o texto em pedaços alternando fora e dentro de destaque.
 *
 * Faixa inválida (invertida, vazia, fora do texto) é descartada em vez de
 * deslocar o resto: a posição vem do banco, e se um dia ela não casar com o
 * texto, o defeito certo é o destaque faltar, não a página mostrar o texto
 * picado no lugar errado.
 */
export function destacar(texto: string, faixas: Faixa[]): Pedaco[] {
  const validas = faixas
    .map((faixa) => ({
      inicio: Math.max(0, Math.min(faixa.inicio, texto.length)),
      fim: Math.max(0, Math.min(faixa.fim, texto.length)),
      ancoras: faixa.ancora === undefined ? [] : [faixa.ancora],
    }))
    .filter((faixa) => faixa.fim > faixa.inicio)
    .sort((a, b) => a.inicio - b.inicio || a.fim - b.fim);

  const unidas: Marca[] = [];
  for (const faixa of validas) {
    const ultima = unidas[unidas.length - 1];
    // `<=` e não `<`: duas faixas que se encostam viram uma marca só, senão o
    // navegador desenharia duas bordas coladas no meio de uma frase.
    if (ultima && faixa.inicio <= ultima.fim) {
      ultima.fim = Math.max(ultima.fim, faixa.fim);
      ultima.ancoras.push(...faixa.ancoras);
    } else {
      unidas.push({ ...faixa, ancoras: [...faixa.ancoras] });
    }
  }

  const pedacos: Pedaco[] = [];
  let cursor = 0;
  for (const faixa of unidas) {
    if (faixa.inicio > cursor) {
      pedacos.push({ texto: texto.slice(cursor, faixa.inicio), destacado: false });
    }
    pedacos.push({
      texto: texto.slice(faixa.inicio, faixa.fim),
      destacado: true,
      ...(faixa.ancoras.length > 0 ? { ancoras: faixa.ancoras } : {}),
    });
    cursor = faixa.fim;
  }
  if (cursor < texto.length) {
    pedacos.push({ texto: texto.slice(cursor), destacado: false });
  }
  return pedacos;
}

/**
 * O `id` do grifo de uma resposta dentro do texto do ato.
 *
 * Mora aqui, e não em cada componente, porque são **dois** que precisam dele
 * e eles não podem discordar: o FAQ escreve o endereço, o bloco dos atos
 * escreve o `id`. Um sufixo diferente de cada lado seria um link para lugar
 * nenhum, e sem erro nenhum na tela.
 *
 * O sufixo é a pergunta, e não um número de ordem: ele sobrevive a mudar a
 * ordem das respostas e é o que o FAQ tem em mãos ao montar o link. A âncora
 * antiga do ato (`ato-{chave}`) continua existindo e continua sendo o alvo do
 * cronograma, que sabe de qual ato saiu a data mas não de qual trecho.
 */
export function ancoraDoTrecho(chaveDoAto: string, pergunta: string): string {
  return `ato-${chaveDoAto}-${pergunta}`;
}

/**
 * A faixa vai mesmo virar marca no texto?
 *
 * É a pergunta que o FAQ precisa fazer antes de apontar para a âncora: uma
 * posição que `destacar` descarta (invertida, vazia, fora do texto, ou de um
 * ato cujo texto não está guardado) não produz `<mark>` nenhum, e o link
 * cairia num `id` que não existe. Nesse caso o FAQ volta a apontar para o
 * ato inteiro, que é o que ele fazia antes.
 */
export function grifavel(
  texto: string | null | undefined,
  inicio: number | null,
  fim: number | null,
): boolean {
  if (!texto || inicio === null || fim === null) return false;
  const de = Math.max(0, Math.min(inicio, texto.length));
  const ate = Math.max(0, Math.min(fim, texto.length));
  return ate > de;
}
