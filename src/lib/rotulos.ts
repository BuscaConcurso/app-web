/**
 * Os enums do banco em português de tela.
 *
 * O canvas manda caixa alta só na sigla: "TJSP" sim, "TRIBUNAL DE JUSTIÇA"
 * não, e cargo em caixa baixa. Por isso nada aqui é gritado.
 */
import type {
  ConcursoStatus,
  Escolaridade,
  Esfera,
  Poder,
  Uf,
} from "./dominio";

export const ROTULO_STATUS: Record<ConcursoStatus, string> = {
  previsto: "Previsto",
  autorizado: "Autorizado",
  banca_definida: "Banca definida",
  inscricoes_abertas: "Inscrições abertas",
  inscricoes_encerradas: "Inscrições encerradas",
  provas: "Em fase de provas",
  resultado: "Resultado publicado",
  homologado: "Homologado",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
};

export const ROTULO_ESCOLARIDADE: Record<Escolaridade, string> = {
  fundamental_incompleto: "Fundamental incompleto",
  fundamental: "Fundamental",
  medio: "Médio",
  medio_tecnico: "Médio técnico",
  superior: "Superior",
  pos_graduacao: "Pós-graduação",
  mestrado: "Mestrado",
  doutorado: "Doutorado",
};

export const ROTULO_ESFERA: Record<Esfera, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  distrital: "Distrital",
};

export const ROTULO_PODER: Record<Poder, string> = {
  judiciario: "Judiciário",
  executivo: "Executivo",
  legislativo: "Legislativo",
  ministerio_publico: "Ministério Público",
  tribunal_de_contas: "Tribunal de Contas",
  militar: "Militar",
  autarquia: "Autarquia",
};

export const NOME_UF: Record<Uf, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

/** "Estadual · Judiciário · São Paulo, SP", a linha de contexto do cartão. */
export function linhaDeContexto(orgao: {
  esfera: Esfera;
  poder: Poder;
  uf: Uf | null;
  municipio: string | null;
}): string {
  const partes: string[] = [
    ROTULO_ESFERA[orgao.esfera],
    ROTULO_PODER[orgao.poder],
  ];
  if (orgao.municipio && orgao.uf) partes.push(`${orgao.municipio}, ${orgao.uf}`);
  else if (orgao.uf) partes.push(NOME_UF[orgao.uf]);
  else partes.push("Nacional");
  return partes.join(" · ");
}
