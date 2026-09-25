/**
 * Filtro e ordenação, como funções puras.
 *
 * Ficam separadas da fachada de dados porque é aqui que mora o
 * comportamento que dá para errar: a busca sem acento, o E entre termos, e
 * sobretudo a ordenação "encerrando primeiro", onde um concurso sem data de
 * fim precisa ir para o fim da lista e não para o começo, que é onde
 * qualquer comparação ingênua o coloca.
 *
 * As dimensões de faceta aceitam vários valores. Dentro de uma dimensão a
 * relação é OU, entre dimensões é E: quem marca superior e médio quer os
 * dois, e quem marca São Paulo junto quer os dois em São Paulo. É como busca
 * por faceta funciona em qualquer lugar, e é o que os quadradinhos de
 * seleção do canvas prometem.
 */
import type {
  ConcursoResumo,
  Escolaridade,
  Esfera,
  Uf,
} from "./dominio";
import { tomDoConcurso } from "./situacao";
import { ROTULO_ESCOLARIDADE } from "./rotulos";

export type Ordem = "encerrando" | "recentes" | "vagas" | "salario";

export const ORDENS: Record<Ordem, string> = {
  encerrando: "Encerrando primeiro",
  recentes: "Publicados recentemente",
  vagas: "Mais vagas",
  salario: "Maior salário",
};

/** Os três grupos que o painel de filtros oferece. */
export type Situacao = "abertas" | "previstos" | "encerrados";

export const SITUACOES: Record<Situacao, string> = {
  abertas: "Inscrições abertas",
  previstos: "Previstos",
  encerrados: "Encerrados",
};

export interface Filtro {
  q?: string;
  /** Um só: vem do seletor da barra de busca, não da coluna de facetas. */
  uf?: Uf;
  escolaridades?: Escolaridade[];
  situacoes?: Situacao[];
  bancas?: string[];
  esferas?: Esfera[];
  salarioMin?: number;
  salarioMax?: number;
}

/** Minúscula e sem acento, para "sao paulo" achar "São Paulo". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * O texto que a busca varre. Exportado porque `cargos.ts` mede, no acervo, o
 * que cada link do rodapé devolveria, e medir contra outro texto que não
 * este faria a contagem ao lado do link discordar da página que ele abre.
 */
export function textoBuscavel(concurso: ConcursoResumo): string {
  return normalizar(
    [
      concurso.titulo,
      concurso.orgao.nome,
      concurso.orgao.sigla ?? "",
      concurso.orgao.municipio ?? "",
      concurso.banca?.nome ?? "",
      // O nome do cargo e a cidade da vaga. Sem os dois, procurar
      // "professor" ou o nome de uma cidade no acervo do engine não acha
      // nada: o título é o cabeçalho do ato e a cidade não está no órgão.
      //
      // `?? []` porque um `bc api` de versão anterior não manda estes
      // campos, e uma lista inteira em branco por causa de um servidor
      // desatualizado é caro demais para o que custa esta guarda.
      (concurso.nomesDeCargo ?? []).join(" "),
      (concurso.localidades ?? []).join(" "),
    ].join(" "),
  );
}

/** As palavras que o texto precisa conter para casar com uma busca. */
export function termosDaBusca(q: string): string[] {
  return normalizar(q).split(/\s+/).filter(Boolean);
}

/**
 * Todos os termos precisam aparecer. Quem digita "analista judiciario" quer
 * as duas palavras, não a união de tudo que tem "analista".
 *
 * Recebe o texto já normalizado e os termos já separados, e não o concurso e
 * a busca, porque quem mede dezenas de termos contra o acervo inteiro
 * (`cargos.ts`) precisa pagar cada normalização uma vez só: eram 181 mil
 * chamadas de `normalizar` e 50 ms a mais por página. Que a medição e o
 * filtro entrem pela mesma porta é o que garante que o número ao lado do
 * link seja o tamanho da lista que ele abre.
 */
export function casaComTermos(
  textoNormalizado: string,
  termos: string[],
): boolean {
  return termos.every((termo) => textoNormalizado.includes(termo));
}

function combinaComTermos(concurso: ConcursoResumo, q: string): boolean {
  return casaComTermos(textoBuscavel(concurso), termosDaBusca(q));
}

/** Lista vazia ou ausente não filtra nada. */
function vazia<T>(valores: T[] | undefined): valores is undefined {
  return !valores || valores.length === 0;
}

export function situacaoDoConcurso(
  concurso: ConcursoResumo,
  hoje: Date,
): Situacao {
  const tom = tomDoConcurso(concurso, hoje);
  if (tom === "aberto" || tom === "urgente") return "abertas";
  if (tom === "previsto") return "previstos";
  return "encerrados";
}

export function filtrar(
  itens: ConcursoResumo[],
  filtro: Filtro = {},
  hoje: Date = new Date(),
): ConcursoResumo[] {
  return itens.filter((concurso) => {
    if (filtro.q && !combinaComTermos(concurso, filtro.q)) return false;
    // Casa contra o CONJUNTO de estados, não contra o valor único que o
    // cartão mostra. `concurso.uf` é nula quando o concurso tem vaga em mais
    // de um estado, e comparar com ela deixava os multiestaduais fora de
    // todo filtro: o concurso do IBGE, com vaga em 23 estados, não aparecia
    // em nenhum deles.
    //
    // `?? []` porque um `bc api` de versão anterior não manda `ufs`: sem a
    // guarda, o filtro derrubaria a lista inteira contra um servidor
    // desatualizado.
    if (filtro.uf && !(concurso.ufs ?? []).includes(filtro.uf)) return false;

    if (!vazia(filtro.esferas)) {
      // Órgão sem esfera não casa com nenhuma esfera pedida: continua fora,
      // que é o que já acontecia quando o campo era declarado não anulável e
      // chegava nulo assim mesmo. Hoje isso é todo o acervo do engine, e o
      // aviso disso está em `/diagnostico`.
      const esfera = concurso.orgao.esfera;
      if (!esfera || !filtro.esferas.includes(esfera)) return false;
    }
    if (
      !vazia(filtro.bancas) &&
      (!concurso.banca || !filtro.bancas.includes(concurso.banca.slug))
    ) {
      return false;
    }
    if (
      !vazia(filtro.escolaridades) &&
      !concurso.escolaridades.some((e) => filtro.escolaridades!.includes(e))
    ) {
      return false;
    }
    if (
      !vazia(filtro.situacoes) &&
      !filtro.situacoes.includes(situacaoDoConcurso(concurso, hoje))
    ) {
      return false;
    }

    // Sem salário publicado não dá para afirmar que cabe na faixa pedida.
    if (filtro.salarioMin != null) {
      if (concurso.salarioAte == null) return false;
      if (concurso.salarioAte < filtro.salarioMin) return false;
    }
    if (filtro.salarioMax != null) {
      if (concurso.salarioAte == null) return false;
      if (concurso.salarioAte > filtro.salarioMax) return false;
    }

    return true;
  });
}

/** Valor ausente vai sempre para o fim, em qualquer ordenação. */
function comparar(
  a: number | null,
  b: number | null,
  direcao: "asc" | "desc",
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direcao === "asc" ? a - b : b - a;
}

function tempoDe(iso: string | null): number | null {
  return iso === null ? null : new Date(`${iso}T00:00:00`).getTime();
}

export function ordenar(
  itens: ConcursoResumo[],
  ordem: Ordem = "encerrando",
  hoje: Date = new Date(),
): ConcursoResumo[] {
  const copia = [...itens];
  if (ordem === "recentes") {
    return copia.sort((a, b) =>
      comparar(tempoDe(a.publicadoEm), tempoDe(b.publicadoEm), "desc"),
    );
  }
  if (ordem === "vagas") {
    return copia.sort((a, b) => comparar(a.vagas, b.vagas, "desc"));
  }
  if (ordem === "salario") {
    return copia.sort((a, b) => comparar(a.salarioAte, b.salarioAte, "desc"));
  }

  // Encerrando primeiro. Prazo que já passou não é iminente, então os
  // encerrados descem para depois de tudo que ainda tem prazo aberto.
  const corte = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  ).getTime();
  return copia.sort((a, b) => {
    const pa = tempoDe(a.inscricoesAte);
    const pb = tempoDe(b.inscricoesAte);
    const vencidoA = pa !== null && pa < corte;
    const vencidoB = pb !== null && pb < corte;
    if (vencidoA !== vencidoB) return vencidoA ? 1 : -1;
    const porPrazo = comparar(pa, pb, vencidoA ? "desc" : "asc");
    if (porPrazo !== 0) return porPrazo;
    return comparar(a.vagas, b.vagas, "desc");
  });
}

/**
 * A faixa "Últimas atualizações" da home: os concursos cujo ato mais recente
 * no Diário saiu por último, pela data da edição (`ultimoAto.data`).
 *
 * Quem não tem ato datado fica fora, com `ultimoAto` nulo ou **ausente**, que
 * é como uma API anterior ao campo responde (ver o campo em `dominio.ts`).
 * Fora, e não no fim: numa faixa de dez itens, "no fim" é sumir do mesmo
 * jeito, e a data que faltasse viraria texto inválido na linha.
 *
 * A mesma edição desempata pelo slug. O Diário publica dezenas de atos por
 * dia, e sem desempate a ordem entre eles seguiria a ordem do acervo, que é a
 * do `id` no banco e não diz nada a quem lê.
 */
export function ultimasAtualizacoes(
  itens: ConcursoResumo[],
  limite = 6,
): ConcursoResumo[] {
  return itens
    .flatMap((concurso) => {
      const data = concurso.ultimoAto?.data;
      return typeof data === "string" ? [{ concurso, data }] : [];
    })
    .sort((a, b) => {
      // ISO curto compara como texto na mesma ordem que como data.
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      return a.concurso.slug < b.concurso.slug ? -1 : 1;
    })
    .slice(0, limite)
    .map(({ concurso }) => concurso);
}

export const POR_PAGINA = 20;

export interface Pagina {
  itens: ConcursoResumo[];
  total: number;
  pagina: number;
  porPagina: number;
  paginas: number;
}

/**
 * Uma página da lista. Página pedida abaixo de 1 vira 1; além do fim vem
 * vazia com o total certo, e não quebra.
 */
export function paginar(
  itens: ConcursoResumo[],
  pagina: number,
  porPagina: number = POR_PAGINA,
): Pagina {
  const atual = Math.max(pagina, 1);
  const inicio = (atual - 1) * porPagina;
  return {
    itens: itens.slice(inicio, inicio + porPagina),
    total: itens.length,
    pagina: atual,
    porPagina,
    paginas: Math.max(Math.ceil(itens.length / porPagina), 1),
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
 *
 * `todos` é a lista sobre a qual se conta: o acervo inteiro em `/concursos`,
 * os concursos do termo em `/busca/<slug>` (ver `buscaLocal.ts`).
 */
export function contarFacetas(
  todos: ConcursoResumo[],
  filtro: Filtro,
  hoje: Date,
): ContagensDeFaceta {
  const contar = (sozinha: Filtro) =>
    filtrar(todos, { ...filtro, ...sozinha }, hoje).length;

  const escolaridadesNoAcervo = ORDEM_DE_ESCOLARIDADE.filter((escolaridade) =>
    todos.some((concurso) => concurso.escolaridades.includes(escolaridade)),
  );

  // Slug para nome, tirado do próprio acervo pelo mesmo motivo de `facetas`
  // (concursos.ts): banca do engine não está em `@/mocks/bancas`.
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
