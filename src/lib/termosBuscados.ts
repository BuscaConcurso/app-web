/**
 * Os termos que a pessoa buscou e que deram resultado, guardados entre
 * visitas.
 *
 * É irmão de `ufLembrada.ts` e segue a mesma forma: um `localStorage`
 * embrulhado como origem externa, para ser lido com `useSyncExternalStore`.
 * O motivo está escrito lá por extenso — ler direto na renderização quebra a
 * hidratação, e ler num efeito traz um piscar. O cache aqui existe pela mesma
 * razão: `getSnapshot` precisa devolver **a mesma referência** entre
 * renderizações, e um `JSON.parse` por chamada devolveria um array novo toda
 * vez, o que deixa o React em laço infinito.
 *
 * Nada disto vai para o servidor. É o que a pessoa digitou, no navegador
 * dela, e fica lá.
 *
 * ## O que é "o termo", e por que não é a busca inteira
 *
 * A busca tem `q` e sete filtros. Guardar a busca inteira preservaria o
 * contexto e teria custado a lista: **medido no acervo de 4.648 concursos, a
 * partir de `?q=analista` existem 17 refinamentos de um clique que ainda
 * devolvem resultado** — 3 situações, 3 escolaridades e 11 bancas, sem contar
 * as 27 UFs. Cada um deles é uma navegação nova com resultado, e portanto uma
 * entrada nova. Como refinar filtro é exatamente o gesto que a coluna de
 * facetas convida a fazer, uma única sessão de busca encheria os dez lugares
 * com dez variações do mesmo "analista", e a memória de dez buscas viraria a
 * memória de uma.
 *
 * Então o termo é só o texto, normalizado. **O que se perde** é o contexto: a
 * sugestão devolve "analista", não "analista em São Paulo, nível superior".
 * Duas coisas aliviam isso. A UF, que é o filtro de longe mais usado, já é
 * lembrada por conta própria em `ufLembrada.ts` e volta preenchida no seletor
 * ao lado — guardá-la de novo aqui seria lembrar a mesma coisa duas vezes. E
 * o resto dos filtros continua a um clique de distância na coluna, que é onde
 * a pessoa os pôs da primeira vez.
 *
 * A consequência fica declarada: busca **só de filtro**, sem texto, não
 * guarda nada. O pedido é por "termos buscados", e uma navegação por faceta
 * não é um termo.
 *
 * ## Identidade, ordem e limite
 *
 * Dois termos são o mesmo termo quando `normalizar` os iguala — a mesma
 * função que a busca usa para achar "São Paulo" com "sao paulo". Se os dois
 * acham a mesma coisa, não podem ocupar dois dos dez lugares. Repetir
 * **promove** a entrada existente em vez de criar outra, e a grafia que fica
 * é a mais recente, porque é a que a pessoa acabou de escolher.
 *
 * A ordem é do mais recente para o mais antigo. A alternativa era por
 * frequência, e ela perde numa janela de dez: exigiria guardar contagem para
 * ordenar uma lista curta, e o que a pessoa espera de uma caixa de busca que
 * abre ao focar é "o que eu estava fazendo", não "o que eu mais faço".
 */
import { normalizar } from "./consulta";

const CHAVE = "buscaconcurso.termos";

/** Dez é o teto pedido. */
export const LIMITE = 10;

/**
 * Um termo é o que cabe numa caixa de busca, não um documento colado nela.
 * O corte é do que se guarda; o que a pessoa buscou já foi buscado inteiro.
 */
const TAMANHO_MAXIMO = 120;

/**
 * A lista vazia, uma vez só. `getSnapshot` e `getServerSnapshot` têm de
 * devolver a mesma referência quando nada mudou, e `[]` escrito em cada
 * retorno seria um array novo a cada chamada.
 */
const VAZIA: readonly string[] = [];

const ouvintes = new Set<() => void>();

/** `undefined` marca "ainda não li do armazenamento". */
let cache: readonly string[] | undefined;

/**
 * O texto como ele vai ser guardado: sem espaço sobrando, numa linha só e do
 * tamanho de um termo. Devolve `""` para o que não é termo nenhum.
 */
export function limparTermo(termo: string): string {
  return termo.replace(/\s+/g, " ").trim().slice(0, TAMANHO_MAXIMO).trim();
}

/** A identidade do termo: a mesma que a busca usa para casar texto. */
function identidade(termo: string): string {
  return normalizar(termo);
}

/**
 * Lê e saneia. O conteúdo do `localStorage` é editável por quem quiser e
 * sobrevive a versões nossas: pode não ser JSON, pode não ser lista, pode ter
 * número no meio e pode ter crescido além do limite de uma versão anterior.
 * Nada disso pode derrubar a barra, então tudo que não é termo é descartado
 * em silêncio.
 */
function ler(): readonly string[] {
  try {
    const guardado = window.localStorage.getItem(CHAVE);
    if (!guardado) return VAZIA;

    const cru: unknown = JSON.parse(guardado);
    if (!Array.isArray(cru)) return VAZIA;

    const vistos = new Set<string>();
    const termos: string[] = [];
    for (const item of cru) {
      if (typeof item !== "string") continue;
      const limpo = limparTermo(item);
      const chave = identidade(limpo);
      if (!limpo || !chave || vistos.has(chave)) continue;
      vistos.add(chave);
      termos.push(limpo);
      if (termos.length === LIMITE) break;
    }
    return termos.length > 0 ? termos : VAZIA;
  } catch {
    // Aba anônima, armazenamento bloqueado ou conteúdo estragado: seguir sem
    // memória é aceitável, e é o que `ufLembrada` já faz.
    return VAZIA;
  }
}

export function assinarTermosBuscados(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function termosBuscados(): readonly string[] {
  if (cache === undefined) cache = ler();
  return cache;
}

/** No servidor não há o que lembrar, e a lista nasce fechada. */
export function termosBuscadosNoServidor(): readonly string[] {
  return VAZIA;
}

function gravar(termos: readonly string[]): void {
  cache = termos.length > 0 ? termos : VAZIA;
  try {
    if (termos.length > 0) {
      window.localStorage.setItem(CHAVE, JSON.stringify(termos));
    } else {
      window.localStorage.removeItem(CHAVE);
    }
  } catch {
    // Idem: a memória em processo continua valendo para esta navegação.
  }
  for (const ouvinte of ouvintes) ouvinte();
}

/**
 * Põe o termo na frente da lista, promovendo-o se ele já estava lá.
 *
 * Quem chama é `registrarBusca`, que é quem conhece a política. Esta função
 * é só o mecanismo.
 */
export function lembrarTermo(termo: string): void {
  const limpo = limparTermo(termo);
  const chave = identidade(limpo);
  if (!limpo || !chave) return;

  const atuais = termosBuscados();
  const proximos = [
    limpo,
    ...atuais.filter((guardado) => identidade(guardado) !== chave),
  ].slice(0, LIMITE);

  // Buscar de novo o que já estava em primeiro não muda nada, e avisar os
  // ouvintes de uma lista igual é renderizar à toa.
  if (
    proximos.length === atuais.length &&
    proximos.every((termo, indice) => termo === atuais[indice])
  ) {
    return;
  }

  gravar(proximos);
}

export function esquecerTermo(termo: string): void {
  const chave = identidade(limparTermo(termo));
  if (!chave) return;

  const atuais = termosBuscados();
  const proximos = atuais.filter(
    (guardado) => identidade(guardado) !== chave,
  );
  if (proximos.length === atuais.length) return;

  gravar(proximos);
}

/**
 * A política: o que uma busca que acabou de acontecer faz com a memória.
 *
 * Fica aqui, e não no componente que a chama, porque é a regra do pedido — e
 * regra que dá para errar é regra que precisa de teste. Quem chama só
 * entrega os três fatos.
 *
 * 1. **Só entra o que deu resultado.** `resultados === 0` não guarda nada.
 *    Sugerir um termo que devolve lista vazia é a caixa de busca convidando
 *    para o vazio.
 *
 * 2. **Filtro só estreita**, então um total maior que zero *com* filtro é
 *    garantidamente maior que zero sem ele. Por isso a entrada não precisa
 *    perguntar se a busca estava filtrada.
 *
 * 3. **A saída precisa perguntar.** Um termo que já estava guardado e agora
 *    devolve zero deixou de servir — o acervo muda, concurso encerra e sai da
 *    lista, e uma sugestão morta é exatamente a armadilha que a regra "só
 *    entra o que deu resultado" existe para evitar. Mas `resultados === 0`
 *    **com filtro** não acusa o termo: quem buscou "analista" no Acre recebeu
 *    zero por causa do Acre. Então só sai o termo cujo zero é dele: busca sem
 *    nenhum filtro.
 */
export function registrarBusca({
  termo,
  resultados,
  filtrada,
}: {
  /** O `q` da busca. Ausente quando a pessoa só navegou por filtro. */
  termo?: string;
  /** Quantos concursos a busca devolveu. Quem sabe isto é a página. */
  resultados: number;
  /** Se havia algum filtro além do texto — UF, faceta ou faixa de salário. */
  filtrada: boolean;
}): void {
  if (!termo || !limparTermo(termo)) return;
  if (resultados > 0) {
    lembrarTermo(termo);
    return;
  }
  if (!filtrada) esquecerTermo(termo);
}
