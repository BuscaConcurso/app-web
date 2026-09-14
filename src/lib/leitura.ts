/**
 * O ato em parágrafos, sem tocar num caractere.
 *
 * O texto do Diário chega **sem nenhuma quebra de linha**. Medido em 420 atos
 * de 400 concursos sorteados do acervo em 2026-09-14: mediana de 1.482
 * caracteres, p90 de 9.310, maior com 86.434 — e `\n`, `\r`, `\t` e espaço
 * duplo em **zero** deles. O separador do documento inteiro é um espaço só.
 * Renderizado como um parágrafo, o ato de 86 mil caracteres é uma parede.
 *
 * A estrutura existe no texto, mas como **marcador** e não como quebra:
 * `1.`, `3.2.1.`, `Art. 5º`, `II - `, `a)`, `ANEXO I`. Este módulo acha esses
 * marcadores e devolve onde o parágrafo começa.
 *
 * ## O limite duro: o texto exibido não pode mudar
 *
 * O que a gaveta mostra é o ato como saiu publicado, e a página do concurso
 * inteira se apoia em mostrar a fonte sem tocá-la. Quebrar em parágrafos é
 * apresentação e pode; inserir, remover ou reordenar caractere não pode.
 *
 * Por isso a quebra **não substitui nada**: ela cai *entre* dois caracteres
 * que já existiam, e o espaço que separava o marcador do texto anterior fica
 * onde estava — no fim do parágrafo de cima. A invariante é uma só e está no
 * teste: `partirEmParagrafos(t).map(p => p.texto).join("") === t`.
 *
 * É também por isso que cada parágrafo carrega o seu `inicio`: as posições do
 * grifo (`inicioChar`/`fimChar`) são deslocamentos no **texto original**, e
 * quem pinta precisa saber quanto descontar para o grifo continuar caindo no
 * mesmo lugar depois da partição.
 *
 * ## A regra, e por que cada condição está lá
 *
 * Abre-se parágrafo antes de um marcador quando as três valem juntas:
 *
 * 1. **O marcador vem logo depois de um espaço.** Sem isso `1.2` seria
 *    achado dentro de `Decreto nº 9.508`.
 * 2. **O caractere antes desse espaço é `.`, `;`, `:`, `?` ou `!`** — fim de
 *    frase ou de item. É o que separa o item de verdade da referência no meio
 *    da frase: medido, era esta condição que impedia `Fica divulgado no `
 *    **`ANEXO II`** e `Art. 1º O `**`Anexo II`** de virarem quebra.
 * 3. **O marcador é um dos seis, e o numerado exige maiúscula depois.** Item
 *    e subitem do edital são frases, e frase começa com maiúscula; foi esta
 *    condição que recusou `Nº Vagas: `**`01. `**`d) Localização` (onde `01.`
 *    é uma quantidade) e `às 14.30 horas`.
 *
 * O numerado ainda **exige o ponto final** (`3.`, `2.1.`) e no máximo quatro
 * níveis de um ou dois dígitos. Os dois limites são o que mantém fora `1.500`,
 * `12.772/2012`, `R$ 6.180,86` e o ano `2011.` no fim de uma frase — este
 * último é o perigoso, porque tem ponto, tem espaço e tem maiúscula depois.
 *
 * ## Os dois lados, medidos nos mesmos 420 atos
 *
 * | | |
 * |---|---|
 * | ganham estrutura | **148** (mediana de 3.292 caracteres, 4 parágrafos) |
 * | ficam iguais | **272** (mediana de 1.252 caracteres) |
 * | dos 46 acima do p90 (8.904), ganham | **43** |
 * | dos caracteres do acervo sorteado, em atos que ganham | **68%** |
 *
 * É o formato que se queria: o ato curto — que não tem o que quebrar — sai
 * intacto, e é o ato longo, onde ler dói, que ganha parágrafo. **Nenhum
 * parágrafo é forçado**: não há limite de tamanho nem corte por contagem de
 * caracteres, só marcador. Um ato sem marcador continua sendo um parágrafo,
 * e isso é a regra funcionando, não falhando.
 *
 * Conferidos à mão, os 43 parágrafos com menos de 25 caracteres que a regra
 * produz na amostra são todos legítimos: `4. DAS PROVAS.`, `b) RG ou CNH;`,
 * `II - dentro do prazo;`.
 *
 * **O que ficou de fora, de propósito.** Os dois maiores atos da amostra
 * (86.434 e 85.171 caracteres) são listas de resultado no formato
 * `10001063, Nome, 175.00, 1 / ` e continuam num parágrafo só: o separador
 * deles é ` / `, que é um sétimo marcador, e ele aparece também dentro de
 * frase (`(Institucional / Concursos, Estágios, .../ Concurso Público /`),
 * onde quebrar estaria errado. São 7 atos da amostra; a regra fica com os
 * seis marcadores que o documento usa como estrutura declarada.
 */

/** Um parágrafo e onde ele começa **no texto original**. */
export interface Paragrafo {
  texto: string;
  /** Deslocamento do primeiro caractere deste parágrafo no texto inteiro. */
  inicio: number;
}

/**
 * Item e subitem: `3.`, `2.1.`, `3.2.1.`. O ponto final é obrigatório e cada
 * nível tem um ou dois dígitos — é o que deixa `1.500`, `12.772` e `2011.`
 * de fora.
 */
const ITEM = /\d{1,2}(?:\.\d{1,2}){0,3}\./y;

/** `Art. 1º`, `ART. 12`. O número entra no marcador para que a quebra não
 *  caia entre `Art.` e o número dele — era o que acontecia com `Art. 10.`,
 *  em que o `10.` era lido como item novo. */
const ARTIGO = /(?:Art|ART)\.\s?\d{1,3}[º°o]?/y;

/** Inciso: `I - `, `VII - `. O travessão faz parte do marcador. */
const INCISO = /[IVXLCDM]{1,6}\s[-–—]\s/y;

/** Alínea: `a) `, `k) `. */
const ALINEA = /[a-z]\)\s/y;

/** `ANEXO I`, `Anexo 2`. */
const ANEXO = /(?:ANEXO|Anexo)\s(?:[IVXLCDM]{1,5}|\d{1,2})\b/y;

/** O que precede o espaço para que o que vem depois seja começo de item. */
const ABERTURA = new Set([".", ";", ":", "?", "!"]);

/** Maiúscula de qualquer alfabeto — o acervo tem `ÊNFASE`, `ÓRGÃO`. */
const MAIUSCULA = /\p{Lu}/u;

/**
 * O fim do marcador que começa em `i`, ou `null` se não houver marcador ali.
 *
 * Devolver o fim, e não só um sim/não, é o que permite ao varredor pular o
 * marcador inteiro: sem isso, `Art. 10.` abriria duas quebras, uma no `Art.`
 * e outra no `10.`.
 */
function marcador(texto: string, i: number): number | null {
  for (const molde of [ARTIGO, INCISO, ALINEA, ANEXO]) {
    molde.lastIndex = i;
    const achado = molde.exec(texto);
    if (achado) return i + achado[0].length;
  }

  ITEM.lastIndex = i;
  const item = ITEM.exec(texto);
  if (item) {
    const fim = i + item[0].length;
    let depois = fim;
    while (texto[depois] === " ") depois += 1;
    if (MAIUSCULA.test(texto[depois] ?? "")) return fim;
  }

  return null;
}

/**
 * Parte o ato nos parágrafos que ele já tem, sem mudar o texto.
 *
 * A soma dos pedaços é a entrada, caractere por caractere, e cada pedaço sabe
 * em que posição do original ele começa.
 */
export function partirEmParagrafos(texto: string): Paragrafo[] {
  if (texto.length === 0) return [];

  const paragrafos: Paragrafo[] = [];
  let inicio = 0;
  let i = 1;

  while (i < texto.length) {
    if (texto[i - 1] !== " ") {
      i += 1;
      continue;
    }
    // `i - 2` é o caractere antes do espaço. Em `i === 1` ele não existe, e
    // um marcador colado no começo do texto não abre parágrafo novo: o
    // primeiro parágrafo já começa em 0.
    if (!ABERTURA.has(texto[i - 2] ?? "")) {
      i += 1;
      continue;
    }
    const fim = marcador(texto, i);
    if (fim === null) {
      i += 1;
      continue;
    }
    paragrafos.push({ texto: texto.slice(inicio, i), inicio });
    inicio = i;
    i = Math.max(fim, i + 1);
  }

  paragrafos.push({ texto: texto.slice(inicio), inicio });
  return paragrafos;
}
