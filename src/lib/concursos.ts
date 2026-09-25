/**
 * A única porta de entrada de dados do front.
 *
 * Lê a API Nest quando `BC_API_URL` está definida, e o mock quando não
 * está ou quando a API não responde. As funções já eram assíncronas por isso:
 * a troca aconteceu aqui dentro e nenhum componente mudou, porque nenhum
 * componente importa mock direto.
 *
 * Tudo o que o buscador faz (filtro, ordenação, paginação, contagem de
 * faceta) continua rodando aqui, sobre o array que `acervo()` devolve. É por
 * isso que a listagem usa `/acervo`, sem duplicar na API as consultas já
 * testadas em `consulta.test.ts` e `concursos.test.ts`.
 */
import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { lembrarPor } from "./memoria";
import type {
  Banca,
  ConcursoDetalhe,
  ConcursoResumo,
  Orgao,
  Uf,
} from "./dominio";
import {
  contarFacetas,
  filtrar,
  ordenar,
  paginar,
  POR_PAGINA,
  ultimasAtualizacoes,
  type ContagensDeFaceta,
  type Filtro,
  type Ordem,
  type Pagina,
} from "./consulta";
import { medirCargos, type CargoMedido } from "./cargos";
import { tomDoConcurso } from "./situacao";
import { NOME_UF } from "./rotulos";
import { acharOrgao, agruparPorOrgao, type OrgaoDoAcervo } from "./orgaos";
import { CONCURSOS } from "@/mocks/concursos";

export interface Consulta extends Filtro {
  ordem?: Ordem;
  pagina?: number;
  porPagina?: number;
}

export type { ContagensDeFaceta, OpcaoDeFaceta, Pagina } from "./consulta";

/**
 * Raiz da API Nest, incluindo o prefixo `/v1` e sem barra no fim.
 * No desenvolvimento local: `http://127.0.0.1:8788/v1`.
 *
 * Variável ausente é "usar o mock", não erro: o design do front foi feito
 * contra o mock e continua demonstrável sem o engine no ar. É também o que
 * mantém a suíte de testes determinística e sem rede (ver `vitest.config.mts`).
 */
const URL_DA_API = process.env.BC_API_URL?.replace(/\/+$/, "");

/** O corpo de `GET /acervo`. Só o que este arquivo usa. */
interface RespostaDeAcervo {
  concursos: ConcursoResumo[];
  /** Quantos concursos o engine tem, com dado ou sem. */
  total: number;
  /**
   * Quantos o engine tem e não mandou porque não têm cargo nem evento: 189
   * de 4.838 na carga de 2026-09-14. A lista traz só quem tem dado, e esta
   * contagem é o que impede a tela de fingir que o acervo tem só o que ela
   * lista. Sai por `avisoDoAcervo()`, aqui embaixo.
   */
  semDado: number;
  /**
   * Por que cada um dos `semDado` está fora, repartido em três. Os campos
   * somam `semDado` e são excludentes; o que cada um quer dizer está na
   * classe `ForaDaLista` de `engine/src/buscaconcurso/api.py`.
   *
   * A repartição existe porque o número sozinho fazia a tela mentir: ela
   * dizia que os que estão fora "entram na lista conforme forem lidos", e
   * hoje isso não vale para nenhum deles: a fila está vazia.
   * `acervoIncompletoEmPartes()` (src/lib/rotulos.ts) é quem transforma
   * estes três números em frase, e deixa de fora a parte que estiver zerada.
   *
   * Opcional no tipo porque um engine mais velho não manda o campo: é o
   * estado normal do mundo, API e app sobem separados. Quem lê valida.
   */
  foraDaLista?: {
    total: number;
    naFila: number;
    naoAbreConcurso: number;
    lacuna: number;
  };
  /** Preenchido aqui, não pela API: é quem leu que sabe de onde leu. */
  origem: OrigemDoAcervo;
}

/**
 * De onde veio o que está na tela.
 *
 * - `api`: o acervo do engine, dado de verdade.
 * - `mock`: `BC_API_URL` não está configurada. É o modo de desenhar a tela
 *   sem o engine no ar, e é escolha de quem rodou.
 * - `falha`: a API estava configurada e não respondeu, e a tela caía no
 *   mock com cara de acervo real. `carregar` não produz mais este valor: com
 *   a API configurada, a falha devolve a última leitura boa ou lança (ver
 *   `carregar`). Fica no tipo enquanto `AvisoDeOrigem` o trata.
 */
export type OrigemDoAcervo = "api" | "mock" | "falha";

/**
 * O que o mock é, na forma da resposta da API. `semDado: 0` porque o mock é
 * um acervo completo de mentira, não um acervo real pela metade: aviso de
 * "293 estão fora desta lista" sobre o mock seria falso.
 */
const ACERVO_DE_MOCK: RespostaDeAcervo = {
  concursos: CONCURSOS,
  total: CONCURSOS.length,
  semDado: 0,
  origem: "mock",
};

/**
 * Cinco minutos, o mesmo `revalidate` das páginas ISR: o acervo que a página
 * regenerada mostra nunca é mais velho do que a própria página.
 */
const VALIDADE_DO_ACERVO_S = 300;

/**
 * Quinze segundos. Sem teto, uma API pendurada seguraria cada regeneração
 * (e o build) até o `fetch` desistir sozinho, e a última leitura boa, que é
 * o que a página mostraria de qualquer jeito, esperaria junto.
 */
const TEMPO_MAXIMO_DA_LEITURA_MS = 15_000;

/**
 * Regra do parceiro humano contra o travessao em qualquer texto visivel do
 * site (acentuacao solta de proposito nesta nota, adiante ela volta).
 * `semTravessao.test.ts` cobre o que esta escrito no proprio
 * codigo-fonte, varrendo `src/`; mas titulo de concurso e nome de orgao nao
 * vem do codigo-fonte, vem da API, e o acervo ja mostrou o travessao nos
 * dois campos: "ENFAM", seguido dele, "Edital numero 2". Esta funcao troca
 * o travessao por " - " no limite em que o dado da API entra no app, em
 * `lerAcervoDaApi` e `obterDetalhe`, logo abaixo, para que nenhuma tela
 * nova precise lembrar de chama-la de novo.
 *
 * O caractere e o escape `\u2014`, nao o glifo: e o mesmo travessao, so
 * escrito de um jeito que este arquivo nao precisa se excluir da propria
 * varredura.
 */
export function semTravessao(texto: string): string {
  return texto.replace(/\s*\u2014\s*/g, " - ").trim();
}

function normalizarOrgao(orgao: Orgao): Orgao {
  return { ...orgao, nome: semTravessao(orgao.nome) };
}

/**
 * O título, o nome do órgão, o nome da banca, o nome de cada cargo buscável
 * e o título do último ato: todo "título ou nome" do resumo
 * do concurso. `T extends ConcursoResumo` para que chamar com um
 * `ConcursoDetalhe` devolva um `ConcursoDetalhe` (`cronograma`, `cargos`,
 * `origens` e `editalCitadoUrl` seguem juntos no `...concurso`), sem outra
 * cópia desta função lá embaixo.
 */
function normalizarNomeacao<T extends ConcursoResumo>(concurso: T): T {
  return {
    ...concurso,
    titulo: semTravessao(concurso.titulo),
    orgao: normalizarOrgao(concurso.orgao),
    banca: concurso.banca
      ? { ...concurso.banca, nome: semTravessao(concurso.banca.nome) }
      : concurso.banca,
    nomesDeCargo: concurso.nomesDeCargo.map(semTravessao),
    ultimoAto: concurso.ultimoAto
      ? {
          ...concurso.ultimoAto,
          titulo: concurso.ultimoAto.titulo
            ? semTravessao(concurso.ultimoAto.titulo)
            : concurso.ultimoAto.titulo,
        }
      : concurso.ultimoAto,
  };
}

/** A forma exportada de `normalizarNomeacao`, para o resumo da lista. */
export function normalizarResumo(concurso: ConcursoResumo): ConcursoResumo {
  return normalizarNomeacao(concurso);
}

/**
 * O mesmo corte do resumo, mais o nome de cada cargo do detalhe e o titulo
 * de cada ato (`origens[].titulo`, o que o Diario chamou o ato: e o que
 * aparece em "ver em: <titulo>" no FAQ, `Faq.tsx`).
 *
 * **`origens[].texto` e `faq[].trecho` NAO passam por `semTravessao`.** Sao
 * citacao literal do ato (ver o cabecalho de `enderecos.ts`: "a soma dos
 * `texto` devolvidos e identica a entrada, caractere por caractere"), e
 * `inicioChar`/`fimChar` do FAQ grifam um trecho de `texto` pela posicao do
 * caractere: trocar um caractere por tres (`\u2014` por ` - `) desalinha
 * todo grifo depois da troca. O mesmo vale, por design, para
 * `cronograma[].evidencia` e `cargos[].evidencia[].trecho`: tambem sao
 * trecho literal do ato, e esta funcao nao os toca.
 */
export function normalizarDetalhe(detalhe: ConcursoDetalhe): ConcursoDetalhe {
  const base = normalizarNomeacao(detalhe);
  return {
    ...base,
    cargos: detalhe.cargos.map((cargo) => ({
      ...cargo,
      nome: semTravessao(cargo.nome),
    })),
    origens: detalhe.origens.map((origem) => ({
      ...origem,
      titulo: origem.titulo ? semTravessao(origem.titulo) : origem.titulo,
    })),
  };
}

/**
 * A leitura da API, guardada no processo por `lembrarPor` (ver lá o porquê:
 * o corpo passa de 2 MB e o Data Cache do Next não o guarda). O `fetch`
 * continua com `revalidate` e não com `no-store`: `no-store` dentro de rota
 * estática é o 500 `DYNAMIC_SERVER_USAGE` que o commit c31d46c contornou
 * tornando o site inteiro dinâmico.
 *
 * Uma leitura que falha depois de uma boa devolve a boa (`lembrarPor`), e o
 * erro sai aqui no log, porque quem chama não vai vê-lo.
 */
const lerAcervoDaApi = lembrarPor(
  VALIDADE_DO_ACERVO_S * 1000,
  async (): Promise<RespostaDeAcervo> => {
    try {
      const resposta = await fetch(`${URL_DA_API}/acervo`, {
        next: { revalidate: VALIDADE_DO_ACERVO_S },
        signal: AbortSignal.timeout(TEMPO_MAXIMO_DA_LEITURA_MS),
      });
      if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);
      const corpo: RespostaDeAcervo = await resposta.json();
      if (!Array.isArray(corpo?.concursos)) {
        throw new Error("a resposta não tem a lista `concursos`");
      }
      // Título e nome de órgão sem travessão (`semTravessao`), aqui e não em cada
      // componente. Ver `normalizarNomeacao`, logo abaixo.
      return { ...corpo, concursos: corpo.concursos.map(normalizarResumo), origem: "api" };
    } catch (erro) {
      // Sinal do próprio Next (a lista está em
      // node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_rethrow.md)
      // não é falha da API e não vai para o log.
      unstable_rethrow(erro);
      console.error(
        `[concursos] ${URL_DA_API}/acervo falhou (${
          erro instanceof Error ? erro.message : erro
        }). Sem leitura boa anterior, a página falha; com ela, a anterior vale.`,
      );
      throw erro;
    }
  },
);

/**
 * `cache` do React, e não só a memoização do `fetch` do Next.
 *
 * O `fetch` memorizado poupa a requisição, mas devolve uma resposta clonada a
 * cada chamada: cada `await resposta.json()` **reanalisa os 3,6 MB do
 * acervo**. Uma renderização da home chama esta função seis vezes (a faixa de
 * origem no layout, os destaques, as facetas, o aviso, as dimensões e agora os
 * cargos do rodapé), e as cinco últimas eram análise repetida de um texto
 * idêntico. Medido no dev contra a API de verdade, medianas de 15: a home
 * caiu de 722 ms para 585 ms e a busca de 823 ms para 702 ms.
 *
 * Fora de uma renderização (o sitemap, por exemplo) `cache` não memoriza
 * nada, e quem poupa a rede e a análise é `lerAcervoDaApi`, que devolve o
 * mesmo objeto por cinco minutos.
 *
 * **Com `BC_API_URL` definida, não há mock.** A API fora do ar e sem leitura
 * boa anterior faz esta função lançar: no build, o build falha; numa
 * regeneração ISR, o Next continua servindo a página velha; numa rota
 * dinâmica, cai na página de erro. Cair no mock aqui era pior do que tudo
 * isso: a regeneração guardava o mock no cache por cinco minutos, com
 * concursos inventados, para todo mundo. O mock é só de quem não configurou
 * a API (desenvolvimento e testes).
 */
const carregar = cache(async (): Promise<RespostaDeAcervo> => {
  if (!URL_DA_API) return ACERVO_DE_MOCK;
  return lerAcervoDaApi();
});

/**
 * De onde veio o acervo que está na tela, para a tela poder dizer.
 *
 * Sem isto, uma API fora do ar parece um app funcionando com dado errado: o
 * `console.warn` fica no terminal de quem roda o servidor, e quem olha a
 * página vê um acervo pequeno e plausível. Aconteceu de verdade nesta
 * integração, com quem sabia da existência do mock.
 */
export async function origemDoAcervo(): Promise<OrigemDoAcervo> {
  return (await carregar()).origem;
}

/**
 * O que a lista consegue filtrar hoje, contado sobre o acervo de verdade.
 *
 * Os campos contados são exatamente os que `filtrar` lê (`consulta.ts`):
 * `concurso.uf` para o filtro de estado e `concurso.orgao.esfera` para o de
 * esfera. Contar outro campo (`orgao.uf`, por exemplo) faria a tela
 * prometer um filtro que o filtro não entrega.
 */
export interface DimensoesDoAcervo {
  total: number;
  comUf: number;
  comEsfera: number;
}

export async function dimensoesDoAcervo(): Promise<DimensoesDoAcervo> {
  const todos = await acervo();
  return {
    total: todos.length,
    // O que o filtro lê é `ufs`, não `uf`: contar `uf` diria que 249 dos 325
    // são filtráveis quando são 256, e esconderia justamente os
    // multiestaduais, que são os que só o conjunto alcança.
    comUf: todos.filter((concurso) => (concurso.ufs ?? []).length > 0).length,
    comEsfera: todos.filter((concurso) => concurso.orgao.esfera !== null).length,
  };
}

async function acervo(): Promise<ConcursoResumo[]> {
  return (await carregar()).concursos;
}

/**
 * Quantos concursos do acervo do engine estão fora da lista, e por quê, para
 * a tela dizer isso em vez de calar, ou, pior, em vez de adivinhar.
 *
 * `null` quando não há nada a avisar: acervo completo, ou mock. A lista traz
 * só quem tem cargo ou evento, e sem este aviso uma página que mostra 4.649
 * concursos afirmaria, por omissão, que o acervo tem 4.649: tem 4.838.
 *
 * **O aviso carrega a repartição, não só o total.** Um número só descreve
 * quatro mil e tantos concursos como se fossem uma coisa, e eles não são:
 * uns esperam leitura, outros nunca vão entrar porque o ato nem abre
 * concurso, e outros são falha nossa. `acervoIncompletoEmPartes()` é quem
 * decide o que disso vira frase: aqui o trabalho é passar os números
 * adiante sem perder nenhum.
 *
 * Não custa requisição: lê o mesmo acervo que `acervo()`, guardado no
 * render por `cache` e no processo por `lerAcervoDaApi`.
 */
export interface AvisoDoAcervo {
  /** Sem cargo nem evento extraído. */
  semDado: number;
  /** Total no acervo do engine, os com dado e os sem. */
  total: number;
  /**
   * Há job pendente ou rodando que ainda pode render cargo ou evento. Os
   * únicos de quem a tela pode dizer "entram quando forem lidos".
   */
  naFila: number;
  /**
   * Lidos com sucesso, e o ato é retificação, anexo, complementar,
   * homologação ou "outro". Nunca viram linha da lista.
   */
  naoAbreConcurso: number;
  /**
   * Leitura que falhou, documento que ninguém baixou nem enfileirou, ou ato
   * de abertura que não rendeu cargo nem cronograma. Deveriam estar na
   * lista, e é isso que os separa dos de cima.
   */
  lacuna: number;
}

export async function avisoDoAcervo(): Promise<AvisoDoAcervo | null> {
  const { semDado, total, foraDaLista } = await carregar();
  if (semDado <= 0) return null;
  // Zeros quando a API não mandou a repartição: são números legítimos, e por
  // isso `acervoIncompletoEmPartes()` confere a SOMA em vez de conferir a
  // presença. Três zeros não somam `semDado`, a repartição é descartada, e a
  // tela cai na frase que não afirma repartição nenhuma. Inventar aqui um
  // `naFila: semDado` seria refazer, do lado do front, exatamente a promessa
  // que este trabalho existe para desfazer.
  return {
    semDado,
    total,
    naFila: foraDaLista?.naFila ?? 0,
    naoAbreConcurso: foraDaLista?.naoAbreConcurso ?? 0,
    lacuna: foraDaLista?.lacuna ?? 0,
  };
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
  return paginar(encontrados, pagina, porPagina);
}

/**
 * Os concursos de um termo, sem nenhum outro recorte. É o que a página
 * `/busca/<slug>` entrega pronta: filtro, ordenação e página são do
 * navegador (ver `buscaLocal.ts`), e é isso que deixa a página estática.
 */
export async function concursosDoTermo(termo: string): Promise<ConcursoResumo[]> {
  return filtrar(await acervo(), { q: termo });
}

/**
 * O que a lista do navegador lê, e nada mais, antes de viajar.
 *
 * Fica o que `CartaoConcurso`, `filtrar`, `ordenar` e `contarFacetas` leem.
 * Sai o resto: `localidades` só serve à busca por texto, que o servidor já
 * fez; `ultimoAto` só aparece na home; `tipo`, `uf` (o cartão e o filtro
 * leem `ufs`), `inscricoesDe`, `editalUrl` e, no órgão, `resolvido` e
 * `nomeEhCaminho` não são lidos por ninguém da lista. Medido em 2026-09-24:
 * "professor" devolve 2.631 concursos, e o JSON deles caiu de 2,08 MB (só
 * sem `localidades` e `ultimoAto`) para 1,69 MB.
 *
 * O tipo continua `ConcursoResumo` para o cartão e as funções de consulta
 * servirem às duas listas sem cópia de tipo; os campos que faltam são
 * justamente os que nenhum deles lê, e `concursos.test.ts` prova isso
 * desenhando cada cartão com e sem eles.
 */
export function paraALista(itens: ConcursoResumo[]): ConcursoResumo[] {
  // Lista do que fica, e não do que sai: campo novo da API não viaja sem
  // alguém decidir que a lista precisa dele.
  return itens.map(
    (concurso) =>
      ({
        slug: concurso.slug,
        titulo: concurso.titulo,
        status: concurso.status,
        orgao: {
          slug: concurso.orgao.slug,
          nome: concurso.orgao.nome,
          sigla: concurso.orgao.sigla,
          esfera: concurso.orgao.esfera,
          poder: concurso.orgao.poder,
          uf: concurso.orgao.uf,
          municipio: concurso.orgao.municipio,
          // O selo do cartão desenha o logo oficial quando há um revisado.
          logoUrl: concurso.orgao.logoUrl,
        },
        banca: concurso.banca,
        ufs: concurso.ufs,
        inscricoesAte: concurso.inscricoesAte,
        publicadoEm: concurso.publicadoEm,
        previstoPara: concurso.previstoPara,
        vagas: concurso.vagas,
        vagasPcd: concurso.vagasPcd,
        vagasNegros: concurso.vagasNegros,
        cadastroReserva: concurso.cadastroReserva,
        salarioAte: concurso.salarioAte,
        taxaInscricao: concurso.taxaInscricao,
        escolaridades: concurso.escolaridades,
        nomesDeCargo: concurso.nomesDeCargo,
      }) as ConcursoResumo,
  );
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
  /** Os de ato mais recente no Diário: ver `ultimasAtualizacoes`. */
  atualizados: ConcursoResumo[];
  totalAbertos: number;
}

/**
 * As faixas da home. `encerrando` sai da lista de abertos para que o mesmo
 * concurso não apareça duas vezes na mesma página.
 *
 * `atualizados` NÃO sai das outras, e a diferença é o motivo: "encerrando" e
 * "abertos" são dois recortes da mesma pergunta (o que dá para se inscrever),
 * e repetir seria ruído. "Últimas atualizações" responde outra (o que saiu no
 * Diário), e um concurso que fecha esta semana e acabou de ser retificado é
 * notícia nas duas.
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
    atualizados: ultimasAtualizacoes(todos, 6),
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
 *
 * `ufs` é o limite de UFs no resultado (padrão 12, como sempre foi). O mapa
 * da home passa `{ ufs: 27 }` porque precisa de todas, mesmo as com zero
 * abertos, para desenhar a grade inteira.
 */
export async function facetas(
  hoje: Date = new Date(),
  { ufs: limiteUfs = 12 }: { ufs?: number } = {},
): Promise<{
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
    ufs: maisFrequentes(porUf, limiteUfs).map(([uf, total]) => ({
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
      // O endereço do próprio órgão, e não mais `?q=<sigla ou nome>`. A busca
      // por texto respondia por aproximação: ela varre `textoBuscavel`, que
      // inclui título, banca, cargo e cidade, então "IFPR" também trazia os
      // concursos de quem só cita o IFPR no título, e um órgão sem sigla caía
      // no nome inteiro: que casa com as unidades dele e com mais nada
      // previsível. O link aqui promete "os concursos deste órgão", e agora é
      // o slug do órgão que responde, que é a mesma chave que agrupa a
      // página.
      href: `/orgaos/${slug}`,
      total,
    })),
  };
}

const medirCargosDoAcervo = cache(
  async (): Promise<CargoMedido[]> => medirCargos(await acervo()).escolhidos,
);

/**
 * Os cargos que a medição escolheu, todos. Uma medição por render: o rodapé,
 * o título da busca e o sitemap perguntam a mesma coisa, e `medirCargos`
 * varre o acervo inteiro.
 */
export async function cargosEscolhidos(): Promise<CargoMedido[]> {
  return medirCargosDoAcervo();
}

/**
 * Quantos resultados cada opção da coluna traria, sobre o acervo inteiro. A
 * regra está em `contarFacetas` (consulta.ts).
 */
export async function contagensDeFaceta(
  filtro: Filtro = {},
  hoje: Date = new Date(),
): Promise<ContagensDeFaceta> {
  return contarFacetas(await acervo(), filtro, hoje);
}

/**
 * Um concurso inteiro: o resumo, o cronograma com a evidência de cada data,
 * os cargos e de onde tudo veio.
 *
 * Rota própria, e não uma busca no acervo, porque o detalhe é o único lugar
 * que precisa de cronograma, cargo, vaga e remuneração: carregar isso para
 * os 181 concursos só para mostrar um seria pagar a lista inteira por página.
 *
 * **Com `BC_API_URL` definida, não há mock** (a mesma regra de `carregar`).
 * 404 da API é resposta: o slug não existe e a página mostra não
 * encontrado. Qualquer outra falha (rede, 5xx, resposta sem concurso, mais de
 * `TEMPO_MAXIMO_DA_LEITURA_MS`) lança, e a página de erro aparece. Cair no
 * mock aqui fazia todo slug real que o mock não tem virar 404 com `noindex`
 * enquanto a API estivesse fora: o Google aprendia que o concurso sumiu.
 *
 * Sem `BC_API_URL` (desenvolvimento e testes), o mock: o resumo que ele tem,
 * com cronograma, cargos e origens vazios. A página trata vazio, e não
 * inventa um cronograma que o mock não tem.
 */
export async function obterDetalhe(
  slug: string,
): Promise<ConcursoDetalhe | null> {
  if (URL_DA_API) {
    try {
      const resposta = await fetch(
        `${URL_DA_API}/concursos/${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(TEMPO_MAXIMO_DA_LEITURA_MS),
        },
      );
      // 404 é resposta, não falha: o slug não existe, e quem chamou mostra a
      // página de não encontrado em vez do mock.
      if (resposta.status === 404) return null;
      if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);
      const corpo: ConcursoDetalhe = await resposta.json();
      if (typeof corpo?.slug !== "string") {
        throw new Error("a resposta não tem um concurso");
      }
      // O mesmo corte do travessão de `lerAcervoDaApi`, para o detalhe.
      return normalizarDetalhe(corpo);
    } catch (erro) {
      unstable_rethrow(erro);
      console.error(
        `[concursos] ${URL_DA_API}/concursos/${slug} falhou (${
          erro instanceof Error ? erro.message : erro
        }); a página de erro responde.`,
      );
      throw erro;
    }
  }
  const resumo = CONCURSOS.find((concurso) => concurso.slug === slug);
  return resumo
    ? normalizarDetalhe({
        ...resumo,
        cronograma: [],
        cargos: [],
        origens: [],
        editalCitadoUrl: null,
      })
    : null;
}

/** Todos os slugs. Alimenta o sitemap; a página do concurso rende na requisição. */
export async function listarSlugs(): Promise<string[]> {
  return (await acervo()).map((concurso) => concurso.slug);
}

/**
 * Um órgão e os concursos dele, ou `null` quando nenhum concurso do acervo o
 * nomeia.
 *
 * Sai do mesmo `acervo()` que a busca lê, e é isso que garante que a página
 * do órgão liste exatamente o que a busca lista. O porquê de não haver rota
 * de órgão na API, com a medição, está no cabeçalho de `orgaos.ts`; em uma
 * linha: isto não custa requisição nenhuma, porque lê o acervo já guardado
 * no render por `cache` e no processo por `lerAcervoDaApi`.
 */
export async function obterOrgao(slug: string): Promise<OrgaoDoAcervo | null> {
  return acharOrgao(await acervo(), slug);
}

/** Todos os órgãos do acervo, do maior para o menor. Alimenta o sitemap. */
export async function listarOrgaos(): Promise<OrgaoDoAcervo[]> {
  return agruparPorOrgao(await acervo());
}

/**
 * "Também abertos em {UF}" na página do concurso: outros concursos com
 * inscrição aberta na mesma UF, sem o próprio, mais perto de encerrar
 * primeiro.
 *
 * A UF é a do cartão quando existe, e a primeira de `ufs` quando o concurso é
 * multiestadual (`uf` nula por desenho nesse caso, ver `dominio.ts`). Sem UF
 * nenhuma não há o que comparar, e a função devolve lista vazia em vez de
 * inventar um "também aberto" nacional.
 */
export async function tambemAbertos(
  concurso: ConcursoResumo,
  hoje: Date = new Date(),
  limite = 3,
): Promise<ConcursoResumo[]> {
  const uf = concurso.uf ?? concurso.ufs[0];
  if (!uf) return [];
  return ordenar(filtrar(await acervo(), { situacoes: ["abertas"], uf }, hoje), "encerrando", hoje)
    .filter((c) => c.slug !== concurso.slug)
    .slice(0, limite);
}
