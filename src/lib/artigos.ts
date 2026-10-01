// O contrato dos artigos. Os valores de `TIPOS_DE_ARTIGO` batem, um a um, com
// o enum `artigo_tipo` da migração 014 do engine.
export const TIPOS_DE_ARTIGO = [
  "concurso",
  "semanal_nacional",
  "semanal_uf",
  "prazos_semana",
  "mensal_escolaridade",
] as const;
export type TipoDeArtigo = (typeof TIPOS_DE_ARTIGO)[number];

export const ORDENS_DOS_ARTIGOS = ["recentes", "relevantes"] as const;
export type OrdemDosArtigos = (typeof ORDENS_DOS_ARTIGOS)[number];

export const ARTIGOS_POR_PAGINA = 12;
/** O teto de URLs de um sitemap. */
export const LIMITE_DO_MAPA = 50_000;
export const TAMANHO_MAXIMO_DA_BUSCA = 200;

export interface OrgaoDoArtigo {
  slug: string;
  nome: string;
  sigla: string | null;
}

/** Um pedaço do trecho da busca. Quem desenha decide a marcação. */
export interface TrechoDestacado {
  texto: string;
  destaque: boolean;
}

export interface PeriodoDoArtigo {
  inicio: string;
  fim: string;
}

export interface ArtigoResumo {
  slug: string;
  tipo: TipoDeArtigo;
  titulo: string;
  descricao: string;
  /** Entra no sitemap de notícias e sai como NewsArticle. */
  noticia: boolean;
  minutosDeLeitura: number;
  /** Instantes em ISO 8601, UTC. */
  publicadoEm: string;
  atualizadoEm: string;
  uf: string | null;
  /** Os estados do artigo: os do concurso, ou o do resumo por estado. */
  ufs: string[];
  escolaridade: string | null;
  periodo: PeriodoDoArtigo | null;
  /** Só no artigo de concurso. */
  concursoSlug: string | null;
  orgao: OrgaoDoArtigo | null;
  /** Só na busca por texto. */
  trecho: TrechoDestacado[] | null;
}

export type Bloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  // Marca onde a página desenha um quadro com o dado vivo do acervo.
  | { tipo: "dado"; qual: "cargos" | "cronograma" | "concursos" };

export interface Secao {
  titulo: string;
  blocos: Bloco[];
}

export interface ArtigoDetalhe extends ArtigoResumo {
  lide: string;
  emResumo: string[];
  secoes: Secao[];
  /** Slugs canônicos dos concursos que o artigo analisa ou lista. */
  concursosCitados: string[];
}

export interface FiltroDeArtigos {
  concursoSlug?: string;
  pagina: number;
  tipo?: TipoDeArtigo;
  uf?: string;
  q?: string;
  ordem?: OrdemDosArtigos;
}

export interface PaginaDeArtigos {
  itens: ArtigoResumo[];
  pagina: number;
  porPagina: number;
  totalDePaginas: number;
  total: number;
  /** Quantos artigos de cada tipo o filtro traria, ignorando o filtro de tipo. */
  contagemPorTipo: Record<TipoDeArtigo, number>;
}

export interface EntradaDoMapa {
  slug: string;
  titulo: string;
  publicadoEm: string;
  atualizadoEm: string;
  noticia: boolean;
}

/** Sem API, não há conteúdo editorial. Falhas configuradas seguem ao error.tsx. */
async function respostaDosArtigos(caminho: string): Promise<Response | null> {
  const base = process.env.BC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return null;
  return fetch(`${base}/artigos${caminho}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

function exigirSucesso(resposta: Response) {
  if (!resposta.ok) throw new Error(`A API de artigos respondeu ${resposta.status}`);
}

export async function listarArtigos(filtro: FiltroDeArtigos): Promise<PaginaDeArtigos> {
  const parametros = new URLSearchParams({ pagina: String(filtro.pagina) });
  for (const chave of ["tipo", "uf", "q", "ordem", "concursoSlug"] as const) {
    if (filtro[chave]) parametros.set(chave, filtro[chave]);
  }
  const resposta = await respostaDosArtigos(`?${parametros}`);
  if (!resposta) return {
    itens: [], pagina: filtro.pagina, porPagina: ARTIGOS_POR_PAGINA, total: 0, totalDePaginas: 0,
    contagemPorTipo: { concurso: 0, semanal_nacional: 0, semanal_uf: 0, prazos_semana: 0, mensal_escolaridade: 0 },
  };
  exigirSucesso(resposta);
  const corpo: PaginaDeArtigos = await resposta.json();
  if (!Array.isArray(corpo?.itens) || !Number.isSafeInteger(corpo.totalDePaginas) || !Number.isSafeInteger(corpo.pagina) || !corpo.contagemPorTipo) {
    throw new Error("Resposta inválida da lista de artigos");
  }
  return corpo;
}

export async function obterArtigo(slug: string): Promise<ArtigoDetalhe | null> {
  if (slug.includes("\u0000")) return null;
  const resposta = await respostaDosArtigos(`/${encodeURIComponent(slug)}`);
  if (!resposta || resposta.status === 404) return null;
  exigirSucesso(resposta);
  const corpo: ArtigoDetalhe = await resposta.json();
  if (typeof corpo?.slug !== "string" || !Array.isArray(corpo.secoes) || !Array.isArray(corpo.emResumo) || !Array.isArray(corpo.concursosCitados)) {
    throw new Error("Resposta inválida do artigo");
  }
  return corpo;
}

export async function mapaDeArtigos(): Promise<EntradaDoMapa[]> {
  const resposta = await respostaDosArtigos("/mapa");
  if (!resposta) return [];
  exigirSucesso(resposta);
  const corpo: { itens: EntradaDoMapa[] } = await resposta.json();
  if (!Array.isArray(corpo?.itens)) throw new Error("Resposta inválida do mapa de artigos");
  return corpo.itens;
}
