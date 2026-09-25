/**
 * O endereço de uma busca: `/busca/<slug>`.
 *
 * O slug é o texto como a busca já o compara (`normalizar`: sem acento, em
 * minúscula), com toda sequência que não é letra nem número trocada por um
 * hífen. A volta troca hífen por espaço. Como a busca separa os termos por
 * espaço e ignora acento, o slug devolve a mesma lista que o texto: a única
 * diferença é símbolo dentro de uma palavra ("11/2026" procura o pedaço, o
 * slug procura "11" e "2026" separados), e ela só alarga. `enderecoDaBusca.test.ts`
 * cobra as duas coisas.
 *
 * Nada aqui importa `parametros.ts` nem `cargos.ts`: os dois importam este
 * arquivo, e o ciclo viria na primeira linha.
 */
import type { Metadata } from "next";
import { normalizar } from "./consulta";

const PREFIXO = "/busca/";

/** Parâmetro que o próprio Next põe na URL das requisições de RSC. */
const PARAMETRO_INTERNO = "_rsc";

/**
 * Teto do slug. Um texto enorme colado na barra não pode virar um `location`
 * e um canônico do mesmo tamanho; cem caracteres cabem com folga qualquer
 * cargo do acervo.
 */
const MAXIMO_DO_SLUG = 100;

export function slugDaBusca(q: string): string {
  const inteiro = normalizar(q)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (inteiro.length <= MAXIMO_DO_SLUG) return inteiro;
  // Corta entre palavras: o hífen logo depois do teto conta como fronteira.
  // Uma palavra só, maior que o teto, não tem fronteira e é cortada nele.
  const corte = inteiro.lastIndexOf("-", MAXIMO_DO_SLUG);
  return corte > 0 ? inteiro.slice(0, corte) : inteiro.slice(0, MAXIMO_DO_SLUG);
}

export function termoDoSlug(slug: string): string {
  return slug.split("-").filter(Boolean).join(" ");
}

/** O caminho da busca por `q`, ou `null` quando `q` não tem o que buscar. */
export function urlDoTermo(q: string): string | null {
  const slug = slugDaBusca(q);
  return slug ? `${PREFIXO}${slug}` : null;
}

/**
 * O segmento chega percent-encoded quando alguém digitou acento ou espaço na
 * barra de endereço, e um escape torto (`%E0%A4%A`) não pode derrubar a rota.
 */
export function decodificarSegmento(segmento: string): string {
  try {
    return decodeURIComponent(segmento);
  } catch {
    return segmento;
  }
}

/** O termo que a barra do cabeçalho mostra quando a página é uma busca. */
export function termoDaPagina(caminho: string): string | undefined {
  if (!caminho.startsWith(PREFIXO)) return undefined;
  const slug = slugDaBusca(decodificarSegmento(caminho.slice(PREFIXO.length)));
  return slug ? termoDoSlug(slug) : undefined;
}

function comQuery(caminho: string, busca: URLSearchParams): string {
  const texto = busca.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

/**
 * Para onde o `proxy.ts` manda um endereço, ou `null` quando ele já é o
 * certo.
 *
 * - `/concursos?q=<texto>&...` vira `/busca/<slug>?...`: o texto sai da query
 *   e o resto fica, na mesma ordem. Texto sem letra nem número só sai.
 * - `/busca/<qualquer coisa>` vira a forma canônica do slug, com a query.
 * - Slug vazio não redireciona: a página responde 404.
 *
 * Mora aqui, e não no `proxy.ts`, para ser testável sem servidor.
 */
export function destinoCanonico(
  caminho: string,
  busca: URLSearchParams,
): string | null {
  const resto = new URLSearchParams(busca);
  resto.delete(PARAMETRO_INTERNO);

  if (caminho === "/concursos") {
    const q = resto.get("q")?.trim();
    if (!q) return null;
    resto.delete("q");
    return comQuery(urlDoTermo(q) ?? "/concursos", resto);
  }

  const trecho = caminho.match(/^\/busca\/([^/]+)$/);
  if (!trecho) return null;
  const canonico = slugDaBusca(decodificarSegmento(trecho[1]));
  if (!canonico || canonico === trecho[1]) return null;
  return comQuery(`${PREFIXO}${canonico}`, resto);
}

/** O que o título precisa de um cargo medido. Estrutural, para não importar `cargos.ts`. */
export interface CargoComRotulo {
  termo: string;
  rotulo: string;
}

/**
 * "Concursos de <Termo>". Quando o slug é o de um cargo que `medirCargos`
 * escolheu, o termo é o rótulo como o ato escreveu, com acento ("Soldado de
 * 1ª classe"); senão é o slug com inicial maiúscula em cada palavra, que é o
 * melhor que dá para fazer sem saber onde iam os acentos.
 */
export function tituloDoTermo(
  slug: string,
  cargos: readonly CargoComRotulo[],
): string {
  const cargo = cargos.find((candidato) => slugDaBusca(candidato.termo) === slug);
  const nome =
    cargo?.rotulo ??
    termoDoSlug(slug)
      .split(" ")
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  return `Concursos de ${nome}`;
}

/**
 * Se o slug é o de um cargo que `medirCargos` escolheu: o mesmo conjunto que
 * entra no mapa do site, pela mesma conta de `urlDoCargo`.
 */
export function ehCargoMedido(
  slug: string,
  cargos: readonly CargoComRotulo[],
): boolean {
  return cargos.some((cargo) => slugDaBusca(cargo.termo) === slug);
}

/**
 * Metadados de `/busca/<slug>`. O canônico não leva query: filtro e página
 * são recortes da mesma busca. Busca sem resultado responde 200 (é resposta
 * verdadeira) e fica fora do índice.
 *
 * Só entra no índice o slug de um cargo medido (o mesmo conjunto do mapa do
 * site). Busca por texto livre responde, é seguida, mas fica `noindex`: sem
 * isso, /busca/a, /busca/a-a e toda variação digitada na barra viravam
 * milhares de páginas finas e quase iguais disputando o mesmo acervo. O
 * custo é que uma busca livre popular só entra no Google quando a medição a
 * escolher como cargo.
 */
export function metadadosDaBusca(
  slug: string,
  total: number,
  cargos: readonly CargoComRotulo[],
): Metadata {
  const titulo = tituloDoTermo(slug, cargos);
  const indexavel = total > 0 && ehCargoMedido(slug, cargos);
  return {
    title: titulo,
    description:
      `Vagas, salário, taxa e prazo de inscrição de ${titulo.toLowerCase()}. ` +
      "Dados extraídos do edital original, com link para o documento.",
    alternates: { canonical: `${PREFIXO}${slug}` },
    robots: { index: indexavel, follow: true },
  };
}
