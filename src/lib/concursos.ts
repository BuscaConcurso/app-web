/**
 * A única porta de entrada de dados do front.
 *
 * Hoje lê o mock; amanhã faz `fetch` da API que o engine vai expor. As
 * funções já são assíncronas por isso: quando a troca acontecer, nenhum
 * componente muda, porque nenhum componente importa mock direto.
 */
import type { ConcursoResumo, Uf } from "./dominio";
import { filtrar, ordenar, type Filtro, type Ordem } from "./consulta";
import { tomDoConcurso } from "./situacao";
import { NOME_UF } from "./rotulos";
import { CONCURSOS } from "@/mocks/concursos";
import { ORGAOS } from "@/mocks/orgaos";
import { BANCAS } from "@/mocks/bancas";

export interface Consulta extends Filtro {
  ordem?: Ordem;
  pagina?: number;
  porPagina?: number;
}

export interface Pagina {
  itens: ConcursoResumo[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

const POR_PAGINA = 20;

async function acervo(): Promise<ConcursoResumo[]> {
  return CONCURSOS;
}

export async function listarConcursos(
  consulta: Consulta = {},
  hoje: Date = new Date(),
): Promise<Pagina> {
  const { ordem = "encerrando", pagina = 1, porPagina = POR_PAGINA, ...filtro } =
    consulta;
  const encontrados = ordenar(
    filtrar(await acervo(), filtro, hoje),
    ordem,
    hoje,
  );
  const inicio = (Math.max(pagina, 1) - 1) * porPagina;
  return {
    itens: encontrados.slice(inicio, inicio + porPagina),
    total: encontrados.length,
    pagina: Math.max(pagina, 1),
    porPagina,
    paginas: Math.max(Math.ceil(encontrados.length / porPagina), 1),
  };
}

export async function contarConcursos(
  filtro: Filtro = {},
  hoje: Date = new Date(),
): Promise<number> {
  return filtrar(await acervo(), filtro, hoje).length;
}

export interface Destaques {
  encerrando: ConcursoResumo[];
  abertos: ConcursoResumo[];
  previstos: ConcursoResumo[];
  totalAbertos: number;
}

/**
 * As três faixas da home. `encerrando` sai da lista de abertos para que o
 * mesmo concurso não apareça duas vezes na mesma página.
 */
export async function obterDestaques(hoje: Date = new Date()): Promise<Destaques> {
  const todos = await acervo();
  const abertos = ordenar(
    filtrar(todos, { situacao: "abertas" }, hoje),
    "encerrando",
    hoje,
  );
  const encerrando = abertos.filter(
    (concurso) => tomDoConcurso(concurso, hoje) === "urgente",
  );
  const slugsEmDestaque = new Set(encerrando.slice(0, 4).map((c) => c.slug));

  return {
    encerrando: encerrando.slice(0, 4),
    abertos: abertos
      .filter((concurso) => !slugsEmDestaque.has(concurso.slug))
      .slice(0, 6),
    previstos: ordenar(
      filtrar(todos, { situacao: "previstos" }, hoje),
      "vagas",
      hoje,
    ).slice(0, 4),
    totalAbertos: abertos.length,
  };
}

export interface LinkDeFaceta {
  rotulo: string;
  href: string;
  total: number;
}

/**
 * Os links internos dos blocos de SEO. São âncoras de verdade para
 * `/concursos?uf=SP`, não botões com JavaScript, porque o valor delas é
 * exatamente serem rastreáveis.
 */
export async function facetas(hoje: Date = new Date()): Promise<{
  ufs: LinkDeFaceta[];
  bancas: LinkDeFaceta[];
  orgaos: LinkDeFaceta[];
}> {
  const abertos = filtrar(await acervo(), { situacao: "abertas" }, hoje);

  const porUf = new Map<Uf, number>();
  const porBanca = new Map<string, number>();
  const porOrgao = new Map<string, number>();
  for (const concurso of abertos) {
    if (concurso.uf) porUf.set(concurso.uf, (porUf.get(concurso.uf) ?? 0) + 1);
    if (concurso.banca) {
      porBanca.set(
        concurso.banca.slug,
        (porBanca.get(concurso.banca.slug) ?? 0) + 1,
      );
    }
    porOrgao.set(
      concurso.orgao.slug,
      (porOrgao.get(concurso.orgao.slug) ?? 0) + 1,
    );
  }

  const maisFrequentes = <T>(mapa: Map<T, number>, limite: number) =>
    [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite);

  return {
    ufs: maisFrequentes(porUf, 12).map(([uf, total]) => ({
      rotulo: NOME_UF[uf],
      href: `/concursos?uf=${uf}`,
      total,
    })),
    bancas: maisFrequentes(porBanca, 8).map(([slug, total]) => ({
      rotulo: BANCAS[slug as keyof typeof BANCAS].nome,
      href: `/concursos?banca=${slug}`,
      total,
    })),
    orgaos: maisFrequentes(porOrgao, 10).map(([slug, total]) => ({
      rotulo: ORGAOS[slug as keyof typeof ORGAOS].nome,
      href: `/concursos?q=${encodeURIComponent(
        ORGAOS[slug as keyof typeof ORGAOS].sigla,
      )}`,
      total,
    })),
  };
}

export async function obterConcurso(
  slug: string,
): Promise<ConcursoResumo | null> {
  return (await acervo()).find((concurso) => concurso.slug === slug) ?? null;
}

/** Todos os slugs, para prerenderizar as páginas de concurso. */
export async function listarSlugs(): Promise<string[]> {
  return (await acervo()).map((concurso) => concurso.slug);
}
