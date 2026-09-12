/**
 * Tipos do domínio, espelhando o schema do engine (`engine/migrations`).
 *
 * Os enums são cópia literal dos tipos do Postgres. Manter os mesmos valores
 * agora é o que evita que a entrada da API vire reescrita depois: o mock tem
 * a forma do dado real, não uma aproximação conveniente para a tela.
 */

/** `create type esfera` */
export type Esfera = "federal" | "estadual" | "municipal" | "distrital";

/** `create type concurso_status` */
export type ConcursoStatus =
  | "previsto"
  | "autorizado"
  | "banca_definida"
  | "inscricoes_abertas"
  | "inscricoes_encerradas"
  | "provas"
  | "resultado"
  | "homologado"
  | "suspenso"
  | "cancelado"
  | "encerrado";

/** `create type escolaridade` */
export type Escolaridade =
  | "fundamental_incompleto"
  | "fundamental"
  | "medio"
  | "medio_tecnico"
  | "superior"
  | "pos_graduacao"
  | "mestrado"
  | "doutorado";

/** `create type concurso_tipo` */
export type ConcursoTipo =
  | "concurso_publico"
  | "processo_seletivo"
  | "residencia"
  | "estagio"
  | "vestibular"
  | "outro";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export type Uf = (typeof UFS)[number];

/**
 * Poder ao qual o órgão pertence. Aparece na linha de contexto do cartão
 * ("Estadual · Judiciário · SP") mas ainda não existe no banco do engine,
 * que só guarda esfera e UF em `orgao`. Fica como campo de exibição do front
 * até a API decidir de onde ele sai.
 */
export type Poder =
  | "judiciario"
  | "executivo"
  | "legislativo"
  | "ministerio_publico"
  | "tribunal_de_contas"
  | "militar"
  | "autarquia";

export interface Orgao {
  slug: string;
  nome: string;
  sigla: string;
  esfera: Esfera;
  poder: Poder;
  uf: Uf | null;
  municipio: string | null;
  /**
   * `false` quando ninguém ainda separou o nome do órgão do caminho onde ele
   * foi publicado — ver `nomeEhCaminho`. Opcional porque o mock não o traz;
   * a API do engine manda sempre, e hoje manda `false` em todos os 1.332
   * órgãos do acervo.
   */
  resolvido?: boolean;
  /**
   * `true` quando `nome` é o caminho de hierarquia do Diário inteiro
   * ("Ministério da Educação/Universidade Federal de Sergipe/Reitoria") e
   * não o nome do órgão. São 1.287 dos 1.332 órgãos do acervo. O campo
   * existe para a tela poder mostrar o que tem sem afirmar o que não tem; a
   * resolução do nome está sendo especificada em paralelo, no engine.
   */
  nomeEhCaminho?: boolean;
}

export interface Banca {
  slug: string;
  nome: string;
}

/**
 * Um concurso reduzido ao que o cartão de lista precisa mostrar.
 *
 * É a junção achatada de `concurso`, `orgao`, `banca`, `cargo`, `cargo_vaga`,
 * `cargo_remuneracao` e `evento`. A API vai devolver algo com esta forma; o
 * detalhe do concurso, quando existir, é que precisa das tabelas separadas.
 */
export interface ConcursoResumo {
  slug: string;
  titulo: string;
  tipo: ConcursoTipo;
  status: ConcursoStatus;
  orgao: Orgao;
  banca: Banca | null;
  uf: Uf | null;
  /** Datas em ISO curto, `AAAA-MM-DD`, como vêm de uma coluna `date`. */
  inscricoesDe: string | null;
  inscricoesAte: string | null;
  publicadoEm: string | null;
  /** Ano estimado, para concursos ainda sem edital. */
  previstoPara: number | null;
  vagas: number | null;
  cadastroReserva: boolean;
  /** Maior remuneração entre os cargos, em reais. */
  salarioAte: number | null;
  taxaInscricao: number | null;
  escolaridades: Escolaridade[];
  /** Link para o PDF do edital no diário ou no site da banca. */
  editalUrl: string | null;
}

/** Como o cartão se pinta. O fundo é o sinal de situação. */
export type Tom = "urgente" | "aberto" | "previsto" | "encerrado";

/** Quantos dias faltando para o fim das inscrições contam como urgente. */
export const DIAS_DE_URGENCIA = 7;
