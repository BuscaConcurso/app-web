/**
 * O feed do Diário Oficial: os atos que o motor coletou, um por linha, do
 * mais recente para o mais antigo (`GET /diario-oficial` da API). Os tipos
 * são a cópia do contrato da API; a página e `concursos.ts` leem daqui.
 */
import type { ConcursoResumo } from "./dominio";
import { paraDataLocal } from "./formato";

/**
 * O tamanho de página do mock, e só dele: com a API, o tamanho é o
 * `porPagina` que ela manda, e o app não repete a constante.
 */
const ATOS_POR_PAGINA_DO_MOCK = 30;

export interface AtoDoDiario {
  /** `AAAA-MM-DD`: a data da edição do Diário em que o ato saiu. */
  publicadoEm: string;
  /** Como o Diário publicou; vai para a tela por `tituloDoAto`. */
  titulo: string | null;
  /** Onde ler o ato no DOU. Nulo quando a listagem não guardou o endereço. */
  url: string | null;
  secao: string | null;
  concurso: ConcursoResumo;
}

export interface FeedDoDiario {
  itens: AtoDoDiario[];
  pagina: number;
  /** Quantos atos cabem numa página, como a API decidiu. */
  porPagina: number;
  totalDePaginas: number;
  total: number;
}

export interface DiaDoFeed {
  data: string;
  rotulo: string;
  atos: AtoDoDiario[];
}

const DIAS_DA_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * "Sexta, 25 de setembro". O ano só aparece quando não é o de `hoje`
 * (`AAAA-MM-DD`, de `hojeEmSaoPaulo`): sem ele, um ato de dezembro passado
 * lido em janeiro parece de onze meses à frente. Nomes escritos à mão, e não
 * `Intl`, para o rótulo não depender do ICU do servidor.
 */
export function rotuloDoDia(iso: string, hoje: string): string {
  const data = paraDataLocal(iso);
  const base = `${DIAS_DA_SEMANA[data.getDay()]}, ${data.getDate()} de ${MESES[data.getMonth()]}`;
  return iso.slice(0, 4) === hoje.slice(0, 4) ? base : `${base} de ${data.getFullYear()}`;
}

/**
 * Os atos da página em blocos por dia, na ordem em que a API mandou. Só
 * junta vizinhos: a API já ordena por data, e reordenar aqui esconderia um
 * defeito dela em vez de mostrá-lo.
 */
export function agruparPorDia(itens: AtoDoDiario[], hoje: string): DiaDoFeed[] {
  const dias: DiaDoFeed[] = [];
  for (const ato of itens) {
    const ultimo = dias.at(-1);
    if (ultimo?.data === ato.publicadoEm) ultimo.atos.push(ato);
    else dias.push({ data: ato.publicadoEm, rotulo: rotuloDoDia(ato.publicadoEm, hoje), atos: [ato] });
  }
  return dias;
}

/**
 * O feed sem API (desenvolvimento e testes): o último ato de cada concurso
 * do mock. Sem endereço, porque o mock não tem nenhum de verdade, e a tela
 * não inventa um.
 */
export function feedDeMock(concursos: ConcursoResumo[], pagina: number): FeedDoDiario {
  const itens = concursos
    .flatMap((concurso): AtoDoDiario[] =>
      concurso.ultimoAto?.data
        ? [{ publicadoEm: concurso.ultimoAto.data, titulo: concurso.ultimoAto.titulo, url: null, secao: null, concurso }]
        : [],
    )
    // ISO curto compara como texto na mesma ordem que como data.
    .sort((a, b) => (a.publicadoEm === b.publicadoEm ? 0 : a.publicadoEm < b.publicadoEm ? 1 : -1));
  const inicio = (pagina - 1) * ATOS_POR_PAGINA_DO_MOCK;
  return {
    itens: itens.slice(inicio, inicio + ATOS_POR_PAGINA_DO_MOCK),
    pagina,
    porPagina: ATOS_POR_PAGINA_DO_MOCK,
    totalDePaginas: Math.ceil(itens.length / ATOS_POR_PAGINA_DO_MOCK),
    total: itens.length,
  };
}
