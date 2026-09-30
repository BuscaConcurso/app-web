/**
 * O corpo de `GET /api/areas`: cada uma das 12 áreas com os slugs dos
 * concursos dela que estão abertos ou previstos.
 *
 * Existe para o resumo semanal da api (spec do resumo semanal, §5): a regra
 * das áreas mora só aqui (`casaComArea`), e a api filtra o resumo pelas
 * áreas que a pessoa marcou lendo esta lista, em vez de copiar a regra.
 * Encerrado não entra: o resumo só fala do que ainda dá para fazer, e a
 * resposta fica menor.
 */
import { AREAS, casaComArea } from "./areas";
import { situacaoDoConcurso } from "./consulta";
import type { ConcursoResumo } from "./dominio";

export interface AreaDaApi {
  slug: string;
  nome: string;
  concursos: string[];
}

export interface RespostaDasAreas {
  areas: AreaDaApi[];
}

export function areasDaApi(concursos: ConcursoResumo[], hoje: Date): RespostaDasAreas {
  const vivos = concursos.filter((concurso) => situacaoDoConcurso(concurso, hoje) !== "encerrados");
  return {
    areas: AREAS.map((area) => ({
      slug: area.slug,
      nome: area.nome,
      concursos: vivos.filter((concurso) => casaComArea(concurso, area)).map((concurso) => concurso.slug),
    })),
  };
}
