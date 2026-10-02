import type { ConcursoResumo, Origem } from "./dominio";
import { normalizarResumo, semTravessao } from "./nomeacao";

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

/** O ato de origem como o artigo o mostra: sem o texto nem o FAQ da ficha. */
export type OrigemCitada = Pick<Origem, "chave" | "url" | "titulo" | "fonte">;

/** Um concurso citado: o resumo, os atos de origem e o edital. */
export interface ConcursoCitado extends ConcursoResumo {
  origens: OrigemCitada[];
  editalCitadoUrl: string | null;
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

/**
 * Um dia. O artigo publicado não é editado: o que muda na página dele é a
 * situação dos concursos, lida à parte (`concursosCitadosDoArtigo`).
 */
const VALIDADE_DO_ARTIGO_S = 86_400;
/** Cinco minutos, o `revalidate` da página do artigo e do acervo. */
const VALIDADE_DOS_CITADOS_S = 300;

/**
 * Sem API, não há conteúdo editorial. Falhas configuradas seguem ao error.tsx.
 *
 * Com `validadeS` o `fetch` guarda a resposta; sem, é `no-store`. A página do
 * artigo é estática (ISR) e só pode ler com validade: `no-store` dentro de
 * rota estática é o 500 `DYNAMIC_SERVER_USAGE` de produção.
 */
async function respostaDosArtigos(caminho: string, validadeS?: number): Promise<Response | null> {
  const base = process.env.BC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) return null;
  return fetch(`${base}/artigos${caminho}`, {
    ...(validadeS ? { next: { revalidate: validadeS } } : { cache: "no-store" as const }),
    signal: AbortSignal.timeout(15_000),
  });
}

function exigirSucesso(resposta: Response) {
  if (!resposta.ok) throw new Error(`A API de artigos respondeu ${resposta.status}`);
}

export async function listarArtigos(filtro: FiltroDeArtigos, { validadeS }: { validadeS?: number } = {}): Promise<PaginaDeArtigos> {
  const parametros = new URLSearchParams({ pagina: String(filtro.pagina) });
  for (const chave of ["tipo", "uf", "q", "ordem", "concursoSlug"] as const) {
    if (filtro[chave]) parametros.set(chave, filtro[chave]);
  }
  const resposta = await respostaDosArtigos(`?${parametros}`, validadeS);
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
  const resposta = await respostaDosArtigos(`/${encodeURIComponent(slug)}`, VALIDADE_DO_ARTIGO_S);
  if (!resposta || resposta.status === 404) return null;
  exigirSucesso(resposta);
  const corpo: ArtigoDetalhe = await resposta.json();
  if (typeof corpo?.slug !== "string" || !Array.isArray(corpo.secoes) || !Array.isArray(corpo.emResumo) || !Array.isArray(corpo.concursosCitados)) {
    throw new Error("Resposta inválida do artigo");
  }
  return corpo;
}

/**
 * Os concursos que o artigo cita, na ordem do artigo, numa requisição só. Um
 * resumo de prazos cita uns 30, e pedir a ficha de cada um (oito consultas
 * na API, com o texto integral dos atos) fazia a página levar 4 s.
 */
export async function concursosCitadosDoArtigo(slug: string): Promise<ConcursoCitado[]> {
  const resposta = await respostaDosArtigos(`/${encodeURIComponent(slug)}/concursos`, VALIDADE_DOS_CITADOS_S);
  if (!resposta) return [];
  exigirSucesso(resposta);
  const corpo: { itens: ConcursoCitado[] } = await resposta.json();
  if (!Array.isArray(corpo?.itens)) throw new Error("Resposta inválida dos concursos citados");
  // O mesmo corte do travessão de `normalizarDetalhe`.
  return corpo.itens.map(concurso => ({
    ...normalizarResumo(concurso),
    origens: concurso.origens.map(origem => ({ ...origem, titulo: origem.titulo ? semTravessao(origem.titulo) : origem.titulo })),
    editalCitadoUrl: concurso.editalCitadoUrl,
  }));
}

export async function mapaDeArtigos(): Promise<EntradaDoMapa[]> {
  const resposta = await respostaDosArtigos("/mapa");
  if (!resposta) return [];
  exigirSucesso(resposta);
  const corpo: { itens: EntradaDoMapa[] } = await resposta.json();
  if (!Array.isArray(corpo?.itens)) throw new Error("Resposta inválida do mapa de artigos");
  return corpo.itens;
}
