/**
 * A única porta de entrada de dados do front.
 *
 * Lê a API do engine quando `BC_API_URL` está definida, e o mock quando não
 * está ou quando a API não responde. As funções já eram assíncronas por isso:
 * a troca aconteceu aqui dentro e nenhum componente mudou, porque nenhum
 * componente importa mock direto.
 *
 * Tudo o que o buscador faz — filtro, ordenação, paginação, contagem de
 * faceta — continua rodando aqui, sobre o array que `acervo()` devolve. É por
 * isso que a API tem uma rota só: uma rota por função duplicaria em Python o
 * que já está testado em `consulta.test.ts` e `concursos.test.ts`.
 */
import { unstable_rethrow } from "next/navigation";
import type { Banca, ConcursoResumo, Escolaridade, Orgao, Uf } from "./dominio";
import {
  filtrar,
  ordenar,
  SITUACOES,
  type Filtro,
  type Ordem,
  type Situacao,
} from "./consulta";
import { tomDoConcurso } from "./situacao";
import { NOME_UF, ROTULO_ESCOLARIDADE } from "./rotulos";
import { CONCURSOS } from "@/mocks/concursos";

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

/**
 * Onde a API do engine está ouvindo, sem barra no fim. Suba com `bc api`, que
 * amarra em `127.0.0.1:8787` — o serviço não tem autenticação, e é por isso
 * que ele só atende o laço local.
 *
 * Variável ausente é "usar o mock", não erro: o design do front foi feito
 * contra o mock e continua demonstrável sem o engine no ar. É também o que
 * mantém a suíte de testes determinística e sem rede (ver `vitest.config.mts`).
 */
const URL_DA_API = process.env.BC_API_URL?.replace(/\/+$/, "");

/** O corpo de `GET /acervo`. Só o que este arquivo usa. */
interface RespostaDeAcervo {
  concursos: ConcursoResumo[];
  /**
   * Quantos concursos o engine tem e não mandou porque não têm cargo nem
   * evento — 9.309 de 9.311 na carga de hoje. Chega até aqui e para aqui:
   * mostrar isso na tela exigiria um componente novo, e nenhuma função
   * exportada deste arquivo tem por onde devolver o número. Está em
   * `GET /diagnostico` e no aviso que `bc api` imprime ao subir.
   */
  semDado: number;
}

async function acervo(): Promise<ConcursoResumo[]> {
  if (!URL_DA_API) return CONCURSOS;
  try {
    // `no-store` porque o acervo muda debaixo do app: o engine reprocessa
    // atos enquanto o app roda, e uma resposta cacheada mostraria um acervo
    // que não existe mais. Chamadas iguais dentro do mesmo render continuam
    // sendo uma requisição só, por memoização do `fetch` do Next.
    const resposta = await fetch(`${URL_DA_API}/acervo`, { cache: "no-store" });
    if (!resposta.ok) {
      throw new Error(`a API respondeu ${resposta.status}`);
    }
    const corpo: RespostaDeAcervo = await resposta.json();
    if (!Array.isArray(corpo?.concursos)) {
      throw new Error("a resposta não tem a lista `concursos`");
    }
    return corpo.concursos;
  } catch (erro) {
    // `fetch(..., { cache: "no-store" })` é uma das APIs que o Next usa
    // levantando erro próprio para sair do caminho estático (a lista está em
    // node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_rethrow.md).
    // Sem esta linha, o `catch` abaixo engolia esse sinal e o `next build`
    // renderizava o MOCK dentro da tentativa de prerender, com a API no ar e
    // respondendo — medido: sete avisos "usando o mock" num build limpo.
    // Erro de aplicação (API fora do ar, resposta torta) não é afetado:
    // `unstable_rethrow` só relança o que é do framework.
    unstable_rethrow(erro);
    // Cair no mock em silêncio seria pior do que a tela vazia: alguém
    // demonstraria o mock achando que está vendo o acervo do engine.
    console.warn(
      `[concursos] ${URL_DA_API}/acervo falhou (${
        erro instanceof Error ? erro.message : erro
      }); usando o mock. Suba a API com \`bc api\` no repositório engine.`,
    );
    return CONCURSOS;
  }
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
    filtrar(todos, { situacoes: ["abertas"] }, hoje),
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
      filtrar(todos, { situacoes: ["previstos"] }, hoje),
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
 * Os links internos dos blocos de SEO da home. São âncoras de verdade para
 * `/concursos?uf=SP`, não botões com JavaScript, porque o valor delas é
 * exatamente serem rastreáveis.
 */
export async function facetas(hoje: Date = new Date()): Promise<{
  ufs: LinkDeFaceta[];
  bancas: LinkDeFaceta[];
  orgaos: LinkDeFaceta[];
}> {
  const abertos = filtrar(await acervo(), { situacoes: ["abertas"] }, hoje);

  const porUf = new Map<Uf, number>();
  const porBanca = new Map<string, number>();
  const porOrgao = new Map<string, number>();
  // O rótulo sai do próprio concurso, não de `@/mocks/bancas` e
  // `@/mocks/orgaos` como antes: o acervo do engine tem 1.332 órgãos e
  // nenhum deles está no mock, então a busca pelo slug voltava `undefined` e
  // `undefined.nome` derrubava a home inteira na primeira linha real.
  const bancas = new Map<string, Banca>();
  const orgaos = new Map<string, Orgao>();
  for (const concurso of abertos) {
    if (concurso.uf) porUf.set(concurso.uf, (porUf.get(concurso.uf) ?? 0) + 1);
    if (concurso.banca) {
      porBanca.set(
        concurso.banca.slug,
        (porBanca.get(concurso.banca.slug) ?? 0) + 1,
      );
      bancas.set(concurso.banca.slug, concurso.banca);
    }
    porOrgao.set(
      concurso.orgao.slug,
      (porOrgao.get(concurso.orgao.slug) ?? 0) + 1,
    );
    orgaos.set(concurso.orgao.slug, concurso.orgao);
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
      rotulo: bancas.get(slug)!.nome,
      href: `/concursos?banca=${slug}`,
      total,
    })),
    orgaos: maisFrequentes(porOrgao, 10).map(([slug, total]) => ({
      rotulo: orgaos.get(slug)!.nome,
      // A sigla é o termo de busca porque é curta e casa com o texto
      // buscável do cartão. Órgão do engine ainda não tem sigla (nenhum dos
      // 1.332), e aí o termo é o nome: `q=` vazio traria o acervo inteiro
      // atrás de um link que promete um órgão.
      href: `/concursos?q=${encodeURIComponent(
        orgaos.get(slug)!.sigla || orgaos.get(slug)!.nome,
      )}`,
      total,
    })),
  };
}

export interface OpcaoDeFaceta {
  valor: string;
  rotulo: string;
  total: number;
}

export interface ContagensDeFaceta {
  situacoes: OpcaoDeFaceta[];
  escolaridades: OpcaoDeFaceta[];
  bancas: OpcaoDeFaceta[];
}

/** Ordem em que a escolaridade aparece na coluna: da mais baixa à mais alta. */
const ORDEM_DE_ESCOLARIDADE: Escolaridade[] = [
  "fundamental_incompleto",
  "fundamental",
  "medio",
  "medio_tecnico",
  "superior",
  "pos_graduacao",
  "mestrado",
  "doutorado",
];

/**
 * Quantos resultados cada opção da coluna traria.
 *
 * A contagem de uma opção é feita com todas as outras dimensões do filtro
 * atual valendo, e com a própria dimensão reduzida àquela opção sozinha. É
 * a contagem que responde "quantos, se eu escolher exatamente este", e é o
 * que impede alguém marcar um filtro e cair numa lista vazia.
 *
 * Opção que zeraria o resultado continua na lista: sumir com a linha faria
 * a coluna mudar de tamanho a cada clique, e saber que não há nenhum
 * também é resposta.
 */
export async function contagensDeFaceta(
  filtro: Filtro = {},
  hoje: Date = new Date(),
): Promise<ContagensDeFaceta> {
  const todos = await acervo();
  const contar = (sozinha: Filtro) =>
    filtrar(todos, { ...filtro, ...sozinha }, hoje).length;

  const escolaridadesNoAcervo = ORDEM_DE_ESCOLARIDADE.filter((escolaridade) =>
    todos.some((concurso) => concurso.escolaridades.includes(escolaridade)),
  );

  // Slug para nome, tirado do próprio acervo pelo mesmo motivo de `facetas`:
  // banca do engine não está em `@/mocks/bancas`.
  const bancasNoAcervo = new Map<string, string>();
  for (const concurso of todos) {
    if (concurso.banca) bancasNoAcervo.set(concurso.banca.slug, concurso.banca.nome);
  }

  return {
    situacoes: (Object.keys(SITUACOES) as Situacao[]).map((situacao) => ({
      valor: situacao,
      rotulo: SITUACOES[situacao],
      total: contar({ situacoes: [situacao] }),
    })),
    escolaridades: escolaridadesNoAcervo.map((escolaridade) => ({
      valor: escolaridade,
      rotulo: ROTULO_ESCOLARIDADE[escolaridade],
      total: contar({ escolaridades: [escolaridade] }),
    })),
    bancas: [...bancasNoAcervo]
      .map(([slug, nome]) => ({
        valor: slug,
        rotulo: nome,
        total: contar({ bancas: [slug] }),
      }))
      .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo)),
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
