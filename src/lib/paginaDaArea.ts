/**
 * A lista de `/areas/<slug>`: a consulta da busca presa ao caminho da área,
 * e o recorte da lista com as contagens de cada filtro.
 *
 * Função pura, com teste, pelo mesmo motivo de `consulta.ts`: o que dá para
 * errar aqui (página de estranho na URL, filtro que conta fora da área,
 * contagem da aba que não bate com a lista) não se confere olhando a
 * página. A página só chama.
 *
 * A área usa a consulta inteira da busca (`parametros.ts`), com o caminho
 * fixado em `/areas/<slug>`: é isso que faz a coluna de filtros, os chips,
 * as abas, a ordem e a paginação ficarem na área sem código próprio. Termo
 * livre não entra: a área já é o recorte.
 */
import type { Area } from "./areas";
import { hrefDaArea } from "./areas";
import {
  contarFacetas,
  filtrar,
  ordenar,
  paginar,
  situacaoDoConcurso,
  type ContagensDeFaceta,
  type Pagina,
  type Situacao,
} from "./consulta";
import type { ConcursoResumo } from "./dominio";
import {
  filtroDaConsulta,
  lerConsulta,
  quantosFiltros,
  type ConsultaDaUrl,
  type Parametros,
} from "./parametros";

/** O mesmo tamanho de página da busca e do órgão. */
export const POR_PAGINA_DA_AREA = 20;

/** A consulta da URL, presa à área: caminho dela e nenhum termo livre. */
export function consultaDaArea(area: Area, parametros: Parametros): ConsultaDaUrl {
  return { ...lerConsulta(parametros), q: undefined, caminho: hrefDaArea(area) };
}

/**
 * Só a área inteira, na ordem padrão e na primeira página, entra no índice:
 * todo o resto é a mesma lista recortada, com o canônico na área.
 */
export function indexavelDaArea(consulta: ConsultaDaUrl): boolean {
  return quantosFiltros(consulta) === 0 && consulta.ordem === "encerrando" && consulta.pagina === 1;
}

export interface ListaDaArea {
  /** A página pedida, já filtrada. */
  resultado: Pagina;
  /** O número de cada opção de filtro, contado dentro da área. */
  contagens: ContagensDeFaceta;
  /** Todos os concursos da área, sem filtro nenhum. */
  total: number;
  /** Quantos concursos da área, sem filtro, há em cada situação: os cartões do topo. */
  porSituacao: Record<Situacao, number>;
}

/** O posto de cada situação na lista "Todas". */
const POSTO: Record<Situacao, number> = { abertas: 0, previstos: 1, encerrados: 2 };

/**
 * Abertos primeiro, depois previstos, depois encerrados, e dentro de cada
 * situação a ordem "encerrando" da busca (prazo mais perto primeiro).
 *
 * `ordenar` sozinho não basta: ele olha só `inscricoesAte`, então um aberto
 * sem data ia para o fim e um homologado com data futura subia. No acervo
 * real, o primeiro de `/areas/conselhos` era o CRM-PR homologado, e havia
 * aberto da UFMG sem data na posição 795 de Educação. O `sort` é estável,
 * então o posto só separa as situações e mantém a ordem de `ordenar` dentro
 * delas. É a ordem padrão da área; as outras ordens são as da busca.
 */
function ordenarPorSituacao(itens: ConcursoResumo[], hoje: Date): ConcursoResumo[] {
  return ordenar(itens, "encerrando", hoje)
    .map((concurso) => ({ concurso, posto: POSTO[situacaoDoConcurso(concurso, hoje)] }))
    .sort((a, b) => a.posto - b.posto)
    .map(({ concurso }) => concurso);
}

/**
 * A lista da área, com os filtros da busca aplicados e paginada. Página
 * além do fim vira a última, como na página do órgão: um `?pagina=999` velho
 * num link não é lista vazia.
 */
export function listaDaArea(
  itens: ConcursoResumo[],
  consulta: ConsultaDaUrl,
  hoje: Date,
): ListaDaArea {
  const porSituacao: Record<Situacao, number> = { abertas: 0, previstos: 0, encerrados: 0 };
  for (const concurso of itens) porSituacao[situacaoDoConcurso(concurso, hoje)] += 1;

  const filtro = filtroDaConsulta(consulta);
  const filtrados = filtrar(itens, filtro, hoje);
  const ordenados =
    consulta.ordem === "encerrando"
      ? ordenarPorSituacao(filtrados, hoje)
      : ordenar(filtrados, consulta.ordem, hoje);
  const ultima = Math.max(Math.ceil(filtrados.length / POR_PAGINA_DA_AREA), 1);
  return {
    resultado: paginar(ordenados, Math.min(consulta.pagina, ultima), POR_PAGINA_DA_AREA),
    contagens: contarFacetas(itens, filtro, hoje),
    total: itens.length,
    porSituacao,
  };
}
