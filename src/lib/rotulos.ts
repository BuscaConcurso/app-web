/**
 * Os enums do banco em português de tela.
 *
 * O canvas manda caixa alta só na sigla: "TJSP" sim, "TRIBUNAL DE JUSTIÇA"
 * não, e cargo em caixa baixa. Por isso nada aqui é gritado.
 */
import type {
  ConcursoDetalhe,
  ConcursoStatus,
  FaqPergunta,
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

  // Quando um ato diz onde o edital está, a frase manda a pessoa para lá em
  // vez de deixá-la procurar: é o documento que ela veio buscar. Sem
  // prometer, porque o endereço é o que o ato afirma e não o que conferimos —
  // a ressalva inteira fica ao lado do link, na seção do ato.
  const ondeEstaOEdital = concurso.editalCitadoUrl
    ? " O endereço do edital completo, informado pelo próprio ato, está logo" +
      " abaixo, na seção do ato publicado."
    : " O edital completo, com anexos, programa de provas e eventuais" +
      " retificações, sai no site da banca — confira sempre lá antes de se" +
      " inscrever.";

  return `${oQueTemos}${semRemuneracao}${ondeEstaOEdital}`;
}

/**
 * A frase que explica um filtro que o acervo não tem como responder.
 *
 * Devolve `null` quando não há o que explicar. A diferença que ela existe
 * para marcar é a que separa informação de mentira: "ainda não sabemos o
 * estado destes concursos" não é "não há concurso neste estado", e uma lista
 * vazia sem explicação diz a segunda.
 *
 * Hoje isso vale para estado e esfera, nulos em 100% do acervo. Quando a
 * resolução de órgão preencher parte deles, a contagem sobe e a frase
 * desaparece sozinha para quem já tem dado.
 */
export function avisoDeFiltroSemDado(
  filtro: { uf?: Uf; esferas?: Esfera[] },
  dimensoes: { total: number; comUf: number; comEsfera: number },
): string | null {
  const pedidos: string[] = [];
  if (filtro.uf && dimensoes.comUf === 0) {
    pedidos.push(`o estado (${NOME_UF[filtro.uf]})`);
  }
  if (filtro.esferas?.length && dimensoes.comEsfera === 0) {
    const esferas = filtro.esferas.map((esfera) => ROTULO_ESFERA[esfera]);
    pedidos.push(`a esfera (${esferas.join(", ").toLowerCase()})`);
  }
  if (pedidos.length === 0) return null;

  return (
    `Este filtro não tem como responder ainda: nenhum dos ${dimensoes.total} ` +
    `concursos do acervo tem ${pedidos.join(" nem ")} identificado. ` +
    "A lista vazia quer dizer que não sabemos, não que não exista."
  );
}

/**
 * As seis perguntas do FAQ como o candidato as faria.
 *
 * Perguntas, não rótulos de campo: quem chega nesta página está decidindo se
 * presta, e "Até quando dá para se inscrever?" é o que ele quer saber —
 * `ate_quando` é nome de coluna.
 */
export const ROTULO_PERGUNTA: Record<FaqPergunta, string> = {
  quem_pode: "Quem pode se inscrever?",
  ate_quando: "Até quando dá para se inscrever?",
  quanto_custa: "Quanto custa a inscrição?",
  onde_inscrever: "Onde se inscrever?",
  como_inscrever: "Como se inscrever?",
  etapas_prova: "Quais são as etapas e as provas?",
};
