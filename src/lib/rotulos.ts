/**
 * Os enums do banco em português de tela.
 *
 * O canvas manda caixa alta só na sigla: "TJSP" sim, "TRIBUNAL DE JUSTIÇA"
 * não, e cargo em caixa baixa. Por isso nada aqui é gritado.
 */
import type {
  ConcursoDetalhe,
  ConcursoStatus,
  Escolaridade,
  Esfera,
  EventoTipo,
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
  esfera: Esfera | null;
  poder: Poder | null;
  uf: Uf | null;
  municipio: string | null;
}): string {
  // Esfera e poder chegam nulos em todo o acervo do engine (nenhum dos 1.332
  // órgãos tem esfera; `poder` não existe no banco). A linha mostra o que
  // existe e cala sobre o resto: sem este filtro ela saía como
  // " ·  · Nacional", três separadores e nenhuma informação.
  const partes: string[] = [
    orgao.esfera && ROTULO_ESFERA[orgao.esfera],
    orgao.poder && ROTULO_PODER[orgao.poder],
  ].filter((parte): parte is string => Boolean(parte));
  if (orgao.municipio && orgao.uf) partes.push(`${orgao.municipio}, ${orgao.uf}`);
  else if (orgao.uf) partes.push(NOME_UF[orgao.uf]);
  else partes.push("Nacional");
  return partes.join(" · ");
}

/**
 * "TJSP: Analista judiciário", ou só o título quando o órgão não tem sigla.
 *
 * Vive aqui, e não na página, para ter teste: com a sigla nula — o caso de
 * todos os 1.332 órgãos do acervo do engine — a interpolação direta produzia
 * ": EDITAL Nº 1, DE 12 DE MAIO DE 2026", com dois-pontos solto, no título da
 * aba, no `og:title` e na trilha estruturada que o buscador lê.
 */
export function tituloComOrgao(sigla: string | null, titulo: string): string {
  return sigla ? `${sigla}: ${titulo}` : titulo;
}

/**
 * Os eventos do cronograma em português de tela.
 *
 * Nomeados do ponto de vista de quem lê a página, não do enum: o banco chama
 * de `publicacao_edital` o que o candidato lê como "Edital publicado".
 */
export const ROTULO_EVENTO: Record<EventoTipo, string> = {
  autorizacao: "Concurso autorizado",
  banca_definida: "Banca definida",
  publicacao_edital: "Edital publicado",
  inicio_inscricao: "Inscrições abrem",
  fim_inscricao: "Inscrições encerram",
  pedido_isencao: "Pedido de isenção",
  pagamento_taxa: "Pagamento da taxa",
  prova_objetiva: "Prova objetiva",
  prova_discursiva: "Prova discursiva",
  prova_pratica: "Prova prática",
  prova_titulos: "Prova de títulos",
  resultado_preliminar: "Resultado preliminar",
  resultado_final: "Resultado final",
  homologacao: "Homologação",
  convocacao: "Convocação",
  suspensao: "Suspensão",
  cancelamento: "Cancelamento",
};

/**
 * O rodapé diz o que é verdade deste concurso, não o que falta no projeto.
 *
 * Ele dizia que cargos, cronograma e o PDF do edital entrariam "quando a API
 * do engine estiver conectada". A API está conectada; o que varia agora é o
 * que cada ato publicado informou. E o link do Diário nunca foi o PDF do
 * edital: o Diário publica o ato ou o extrato, e o edital completo, com
 * anexos e programa de provas, sai no site da banca.
 */
export function textoDeRodape(concurso: ConcursoDetalhe): string {
  const lido = [
    concurso.cronograma.length > 0 ? "o cronograma" : null,
    concurso.cargos.length > 0 ? "os cargos" : null,
  ].filter(Boolean);

  const oQueTemos =
    lido.length > 0
      ? `Esta página mostra ${lido.join(" e ")} que lemos do ato publicado no diário oficial.`
      : "Este concurso foi publicado no diário oficial e o conteúdo do ato ainda não foi lido.";

  const semRemuneracao =
    concurso.cargos.length > 0 &&
    concurso.cargos.every((cargo) => cargo.remuneracoes.length === 0)
      ? " O ato não informou remuneração."
      : "";

  return (
    `${oQueTemos}${semRemuneracao}` +
    " O edital completo, com anexos, programa de provas e eventuais" +
    " retificações, sai no site da banca — confira sempre lá antes de se" +
    " inscrever."
  );
}
