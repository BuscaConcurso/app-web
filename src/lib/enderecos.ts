/**
 * Achar endereço — URL e e-mail — dentro do trecho do ato, sem tocar no texto.
 *
 * O trecho de uma resposta do FAQ é citação literal do Diário: o motor o
 * confere palavra por palavra contra o documento e `inicioChar`/`fimChar`
 * grifam esse mesmo pedaço lá embaixo, no texto do ato. Então a regra que
 * governa este arquivo é uma só: **a soma dos `texto` devolvidos é idêntica à
 * entrada, caractere por caractere**. O link muda o que é clicável, nunca o
 * que está escrito. Se um dia isso escorregar, o grifo passa a marcar a frase
 * errada e a citação deixa de ser citação.
 *
 * ## Por que devolver pedaços e não HTML
 *
 * Este texto vem de fora: é ato público lido por um modelo e chega aqui como
 * string. Montar marcação com ele e entregar a `dangerouslySetInnerHTML` seria
 * dar ao conteúdo do Diário o poder de escrever HTML na nossa página — é o
 * caminho clássico de injeção, e não é hipótese distante: o acervo já mostrou
 * entidade HTML crua (`&amp;lt;`) chegando na tela. Aqui o texto **nunca vira
 * marcação**. Ele é partido em pedaços e quem renderiza cria nós de React, que
 * escapam tudo sozinhos. `&`, `<` e aspas dentro de uma URL saem na tela como
 * os caracteres que são.
 *
 * **Não troque isto por `innerHTML` para "simplificar".** A simplificação
 * devolve exatamente o buraco que este desenho fecha.
 *
 * ## Aparar é o trabalho
 *
 * Endereço em edital quase nunca vem sozinho: ele está no meio de uma frase e
 * a pontuação da frase encosta nele. Medido no acervo (2.666 trechos aceitos,
 * 652 ocorrências de URL em 635 trechos), **421 das 652 terminam em pontuação
 * do ato** — `.` 200, `,` 178, `)` 20, `>` 12, `;` 4, `_` 4, `?` 2, `:` 1. Uma
 * varredura de `\S+` leva essa pontuação para dentro do `href` e produz dois
 * terços de links quebrados.
 *
 * Aparar bem também não é aparar tudo. Vírgula e parêntese aparecem dentro de
 * URL legítima (`?a=1,2`, caminho com `(...)`), e ponto final é indistinguível
 * de ponto de caminho sem olhar o que vem depois. Por isso o corte é só **no
 * fim do achado**, nunca no meio, e o fecha-parêntese só cai quando não tem
 * abre-parêntese que o justifique.
 *
 * Contra as 652 ocorrências reais, esta regra corta 447 caracteres em 402
 * delas (`.` 200, `,` 175, `)` 65, `;` 4, `?` 2, `:` 1) e **não deixa nenhuma
 * de fora**: 652 de 652 viram link. Preserva a barra final de 186 delas, as
 * consultas (`?nivel=L&aba=p-lato`), as âncoras (`#b_start=0`) e o `_` que
 * terminou 4 URLs que o diário quebrou com espaço no meio — `_` não é
 * pontuação de frase, e cortá-lo não tornaria o link melhor. Nos e-mails, 420
 * dos 424 achados com `@` viram `mailto:`; os 4 de fora são os dois que não
 * são endereço.
 */

export interface PedacoDeEndereco {
  texto: string;
  /**
   * `null` em texto comum. Quando o pedaço é endereço, é para onde o link
   * aponta — e é a **única** coisa que pode diferir de `texto`: `www.x.br` é
   * exibido como está e aberto como `https://www.x.br`.
   */
  href: string | null;
}

/**
 * Pontuação de frase que nunca termina um endereço útil.
 *
 * `?` e `!` entram junto com `.` e `,` porque em português eles fecham a frase
 * ("já viu www.x.br?"), e uma URL que termina em `?` é uma consulta vazia, que
 * não muda para onde ela aponta. Fora da lista, de propósito: `/` (fecha
 * caminho e precisa ficar), `_`, `-`, `=`, `&`, `#`, `%`, `~`, `+`.
 */
const PONTUACAO_DE_FRASE = [".", ",", ";", ":", "!", "?", "…"];

/** Fecha e o seu abre, para decidir se o fecha é da URL ou da frase do ato. */
const FECHAMENTOS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

/**
 * Um endereço: URL primeiro, e-mail depois.
 *
 * A URL começa em `http://`, `https://` ou `www.` — e só. Domínio nu
 * (`ifce.edu.br` solto na frase) fica fora por medida: no acervo ele aparece
 * quase sempre já precedido de `www.` ou de esquema, e reconhecê-lo exigiria
 * apostar que `art. 5º` e `Lei nº 8.112` não são domínios. Um link a menos é
 * menos caro que um link onde não havia endereço.
 *
 * O corpo da URL exclui espaço, aspas e `<>`: no ato esses caracteres
 * **delimitam** o endereço em vez de fazer parte dele — 12 das 652 ocorrências
 * vêm escritas `<www.x.br>`, e o `>` some aqui, antes mesmo de aparar.
 * Parêntese e vírgula ficam dentro do achado, e quem decide é `aparar`.
 *
 * No e-mail a validação já está na forma: parte local, `@`, domínio com ponto
 * e TLD de duas letras ou mais. Quem não casa não é endereço e continua texto
 * — é o caso de `concursoanatomia2026@gmail,com`, erro de digitação do órgão
 * que está no acervo hoje, e de `@gmail.com` sem parte local. **Nada disso é
 * consertado**: o trecho é citação, e um e-mail que o ato escreveu errado
 * aparece errado, sem virar link que não entrega.
 */
const ENDERECO =
  /((?:https?:\/\/|www\.)[^\s<>"'`«»“”‘’]+)|([A-Za-z0-9_%+-][A-Za-z0-9._%+-]*@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/gi;

/** Os dois grupos de `ENDERECO`, por número: o alvo é ES2017, sem grupo nomeado. */
const GRUPO_EMAIL = 2;

/** Um `href` de URL sempre começa por um destes. Ver `hrefDaUrl`. */
const COM_ESQUEMA = /^https?:\/\//i;

/**
 * Tira do fim do achado a pontuação que é da frase, não do endereço.
 *
 * Repete porque a pontuação se acumula: `(www.marinha.mil.br/sspm/node/23);`
 * está no acervo e precisa perder `;` e `)`, nessa ordem.
 */
function aparar(bruto: string): string {
  let url = bruto;
  while (url.length > 0) {
    const ultimo = url[url.length - 1];

    if (PONTUACAO_DE_FRASE.includes(ultimo)) {
      url = url.slice(0, -1);
      continue;
    }

    // Fecha-parêntese só cai se estiver sobrando. `http://x/a_(b)` mantém o
    // seu; `(www.x.br/p)` perde o que é da frase — e `(http://x/a_(b))`
    // perde um e mantém o outro, que é o caso que uma regra de "sempre
    // apara" erraria.
    const abre = FECHAMENTOS[ultimo];
    if (abre && contar(url, ultimo) > contar(url, abre)) {
      url = url.slice(0, -1);
      continue;
    }

    break;
  }
  return url;
}

function contar(texto: string, caractere: string): number {
  let total = 0;
  for (const atual of texto) if (atual === caractere) total += 1;
  return total;
}

/**
 * Sobrou endereço depois de aparar?
 *
 * Depois do corte pode restar `https://` pelado, ou um hospedeiro sem ponto.
 * Link para isso não abre lugar nenhum, e um link que não abre é pior que
 * texto: promete uma porta que não existe. O hospedeiro precisa ser nome de
 * domínio mesmo — letras, dígitos, ponto e hífen, terminando em TLD.
 */
function hospedeiroServe(url: string): boolean {
  const hospedeiro = url.replace(COM_ESQUEMA, "").split(/[/?#]/)[0];
  return /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(hospedeiro);
}

/**
 * O `href` da URL. O texto exibido continua o do ato; só o destino é montado.
 *
 * `www.x.br` sem esquema não é endereço absoluto para o navegador — sem
 * prefixo ele viraria caminho relativo e abriria `/concursos/www.x.br`. O
 * prefixo é `https://` e não `http://` porque enviar quem clica para texto
 * claro quando o site aceita TLS é rebaixar a conexão à toa; site que só fala
 * `http` continua respondendo pelo redirecionamento dele.
 *
 * Repare que o esquema nunca vem do texto: ou já casou `https?://` na
 * expressão, ou é escrito aqui. Não há caminho por onde um `javascript:` do
 * Diário chegue a um `href` desta página.
 */
function hrefDaUrl(url: string): string {
  return COM_ESQUEMA.test(url) ? url : `https://${url}`;
}

/**
 * Quebra o texto em pedaços alternando texto comum e endereço.
 *
 * Devolve um pedaço só, sem `href`, quando não há endereço nenhum — e devolve
 * lista vazia para texto vazio.
 */
export function partirEmEnderecos(texto: string): PedacoDeEndereco[] {
  const pedacos: PedacoDeEndereco[] = [];
  let cursor = 0;

  // `lastIndex` é estado da expressão: ela é global e vive no módulo, então o
  // laço precisa zerar antes de começar, ou uma chamada herdaria a posição em
  // que a anterior parou.
  ENDERECO.lastIndex = 0;
  let achado: RegExpExecArray | null;
  while ((achado = ENDERECO.exec(texto)) !== null) {
    const bruto = achado[0];
    const inicio = achado.index;

    // Qual das duas formas casou, pelo grupo — e não por procurar `@` no
    // achado: `www.x.br/a@b` tem arroba e é URL.
    const eEmail = achado[GRUPO_EMAIL] !== undefined;
    const endereco = eEmail ? bruto : aparar(bruto);

    // A expressão avança até o fim do achado bruto; o que foi aparado precisa
    // voltar a ser candidato, senão a próxima varredura começaria depois da
    // pontuação e perderia um endereço colado nela.
    ENDERECO.lastIndex = inicio + endereco.length;

    if (endereco.length === 0 || (!eEmail && !hospedeiroServe(endereco))) {
      // Não é endereço: segue como texto. Não avançamos o cursor, então ele
      // sai inteiro no próximo pedaço de texto comum.
      ENDERECO.lastIndex = inicio + bruto.length;
      continue;
    }

    if (inicio > cursor) {
      pedacos.push({ texto: texto.slice(cursor, inicio), href: null });
    }
    pedacos.push({
      texto: endereco,
      href: eEmail ? `mailto:${endereco}` : hrefDaUrl(endereco),
    });
    cursor = inicio + endereco.length;
  }

  if (cursor < texto.length) {
    pedacos.push({ texto: texto.slice(cursor), href: null });
  }
  return pedacos;
}
