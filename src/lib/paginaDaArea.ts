/**
 * A lista de `/areas/<slug>`: o que a query pede, o endereço de cada aba e
 * de cada página, e o recorte da lista.
 *
 * Função pura, com teste, pelo mesmo motivo de `consulta.ts`: o que dá para
 * errar aqui (página de estranho na URL, aba que não volta à página 1,
 * contagem da aba que não bate com a lista) não se confere olhando a
 * página. A página só chama.
 *
 * A área tem dois parâmetros e não a consulta inteira da busca
 * (`parametros.ts`): a página da área é um índice, não um buscador, e o
 * filtro que o spec pede é o de situação.
 */
import type { Area } from "./areas";
import { hrefDaArea } from "./areas";
import {
  filtrar,
  ordenar,
  paginar,
  situacaoDoConcurso,
  SITUACOES,
  type Pagina,
  type Situacao,
} from "./consulta";
import type { ConcursoResumo } from "./dominio";
import type { Parametros } from "./parametros";

/** O mesmo tamanho de página da busca e do órgão. */
export const POR_PAGINA_DA_AREA = 20;

export interface ConsultaDaArea {
  /** `null` é "todas". */
  situacao: Situacao | null;
  pagina: number;
}

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/**
 * `Object.hasOwn` e não `in`, pela razão de `recursoEmBreve` (`emBreve.ts`):
 * `in` sobe pelo protótipo e aceitaria `?situacao=constructor`.
 */
function ehSituacao(valor: string | undefined): valor is Situacao {
  return valor !== undefined && Object.hasOwn(SITUACOES, valor);
}

/** O que vem da URL é texto de estranho: o que não vale vira o padrão. */
export function lerConsultaDaArea(parametros: Parametros): ConsultaDaArea {
  const situacao = primeiro(parametros.situacao);
  const pagina = Number(primeiro(parametros.pagina));
  return {
    situacao: ehSituacao(situacao) ? situacao : null,
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

/** Situação antes de página, e página 1 fora da URL: um endereço por lista. */
export function hrefDaListaDaArea(area: Area, consulta: ConsultaDaArea): string {
  const query = new URLSearchParams();
  if (consulta.situacao) query.set("situacao", consulta.situacao);
  if (consulta.pagina > 1) query.set("pagina", String(consulta.pagina));
  const texto = query.toString();
  return texto ? `${hrefDaArea(area)}?${texto}` : hrefDaArea(area);
}

export interface ListaDaArea {
  /** A página pedida, já filtrada pela situação. */
  pagina: Pagina;
  /** Quantos concursos de cada situação a área tem: o número de cada aba. */
  contagens: Record<Situacao, number>;
  /** Todos os concursos da área, de qualquer situação. */
  total: number;
}

/**
 * Ordem "encerrando", a padrão da busca: o que ainda tem prazo primeiro,
 * depois o previsto, depois o encerrado. Página além do fim vira a última,
 * como na página do órgão: um `?pagina=999` velho num link não é lista vazia.
 */
export function listaDaArea(
  itens: ConcursoResumo[],
  consulta: ConsultaDaArea,
  hoje: Date,
): ListaDaArea {
  const contagens: Record<Situacao, number> = { abertas: 0, previstos: 0, encerrados: 0 };
  for (const concurso of itens) contagens[situacaoDoConcurso(concurso, hoje)] += 1;

  const filtrados = consulta.situacao
    ? filtrar(itens, { situacoes: [consulta.situacao] }, hoje)
    : itens;
  const ultima = Math.max(Math.ceil(filtrados.length / POR_PAGINA_DA_AREA), 1);
  return {
    pagina: paginar(
      ordenar(filtrados, "encerrando", hoje),
      Math.min(consulta.pagina, ultima),
      POR_PAGINA_DA_AREA,
    ),
    contagens,
    total: itens.length,
  };
}
