/**
 * A busca que roda no navegador, em `/busca/<slug>`.
 *
 * A página é estática (ISR), então o servidor não lê a query: ele entrega os
 * concursos do termo e este arquivo aplica o resto (estado, facetas,
 * salário, ordenação, página) com as mesmas funções puras que o servidor usa
 * em `/concursos`. `buscaLocal.test.ts` compara as duas saídas.
 */
import type { ConcursoResumo } from "./dominio";
import {
  contarFacetas,
  filtrar,
  ordenar,
  paginar,
  type ContagensDeFaceta,
  type Pagina,
} from "./consulta";
import { filtroDaConsulta, type ConsultaDaUrl } from "./parametros";

export function aplicarConsulta(
  itensDoTermo: ConcursoResumo[],
  consulta: ConsultaDaUrl,
  hoje: Date,
): { resultado: Pagina; contagens: ContagensDeFaceta } {
  // Sem o termo: a lista já é a dele, e refazer a busca por texto seria
  // normalizar milhares de títulos a cada clique de filtro.
  const filtro = { ...filtroDaConsulta(consulta), q: undefined };
  return {
    resultado: paginar(ordenar(filtrar(itensDoTermo, filtro, hoje), consulta.ordem, hoje), consulta.pagina),
    contagens: contarFacetas(itensDoTermo, filtro, hoje),
  };
}
