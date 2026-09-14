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
 * ("Estadual · Judiciário · SP") e **não existe no banco do engine**, que só
 * guarda esfera e UF em `orgao` — a API devolve nulo em 100% dos órgãos, e não
 * há de onde derivá-lo. Por isso `Orgao.poder` é anulável: o tipo descreve o
 * dado que chega, não o dado que a tela gostaria de ter.
 */
export type Poder =
  | "judiciario"
  | "executivo"
  | "legislativo"
  | "ministerio_publico"
  | "tribunal_de_contas"
  | "militar"
  | "autarquia";

/**
 * O órgão que publica o concurso.
 *
 * `sigla`, `esfera` e `poder` são anuláveis porque o acervo do engine não os
 * tem para todo mundo: a regra que recupera a sigla do título do concurso
 * chegou a 129 dos 1.946 órgãos, e `poder` não existe no banco. Os 1.615
 * cartões que seguem sem sigla são recusa deliberada do engine — a sigla
 * existe no mundo, mas ele não consegue conferir que ela nomeia aquele órgão,
 * e sigla errada afirma uma falsidade enquanto sigla ausente não afirma nada.
 *
 * A regra do projeto é que campo que o banco não tem chega nulo e nunca
 * inventado — um tipo não anulável sobre um campo nulo em um terço do acervo
 * obrigaria a API a inventar, ou o teste a mentir. Quem exibe trata a
 * ausência; ver `linhaDeContexto` em `rotulos.ts` e `Selo` em
 * `components/ui/Cartao.tsx`.
 */
export interface Orgao {
  slug: string;
  nome: string;
  sigla: string | null;
  esfera: Esfera | null;
  poder: Poder | null;
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
  /**
   * O que o cartão mostra: a UF quando é uma só, e **nula quando são
   * várias**. É coluna gerada a partir de `ufs` no banco do engine, então as
   * duas não têm como discordar — um cartão que dissesse "SP" para um
   * concurso com vaga em 23 estados mentiria.
   */
  uf: Uf | null;
  /**
   * O que o filtro casa. Publicada porque `uf` sozinha torna os concursos
   * multiestaduais **invisíveis a qualquer estado**: eles têm `uf` nula por
   * desenho, e são 7 no acervo — o do IBGE tem vaga em 23 estados.
   *
   * O tamanho distingue "não sabemos" (vazia) de "são vários" (mais de um),
   * sem precisar de um terceiro campo.
   */
  ufs: Uf[];
  /** Datas em ISO curto, `AAAA-MM-DD`, como vêm de uma coluna `date`. */
  inscricoesDe: string | null;
  inscricoesAte: string | null;
  publicadoEm: string | null;
  /** Ano estimado, para concursos ainda sem edital. */
  previstoPara: number | null;
  /**
   * O total de vagas, e **nulo quando o ato não informou** — 2.149 dos 3.071
   * concursos do acervo (70%). Nunca zero: a agregação do engine não publica
   * uma soma vazia como número, porque "não sei quantas vagas" e "zero
   * vagas" são afirmações diferentes e só a segunda é uma afirmação do ato.
   */
  vagas: number | null;
  /**
   * A repartição legal de `vagas`: quantas das vagas acima são reservadas a
   * pessoas com deficiência e a candidatos negros. Nulas quando o ato não
   * repartiu.
   *
   * São **recorte** do total, nunca soma a mais — no engine `vagas_total` é
   * sempre `ampla + pcd + negros + outras`. Uma etiqueta de reserva sem um
   * total ao lado não existe no acervo (0 casos em 3.071), e é por isso que
   * ela pode ser lida como parte de um número que o cartão já mostra.
   */
  vagasPcd: number | null;
  vagasNegros: number | null;
  cadastroReserva: boolean;
  /** Maior remuneração entre os cargos, em reais. */
  salarioAte: number | null;
  taxaInscricao: number | null;
  escolaridades: Escolaridade[];
  /**
   * Nomes dos cargos vigentes, distintos. Existem para a busca achar o
   * concurso pelo cargo, que é a primeira coisa que um candidato digita:
   * `titulo` é o cabeçalho do ato publicado, e no acervo do engine nenhum
   * deles contém a palavra "professor" enquanto 105 de 181 concursos têm um
   * cargo de professor. O cargo inteiro — vagas, requisitos, remuneração —
   * só vem na página de detalhe.
   */
  nomesDeCargo: string[];
  /**
   * Cidades das vagas, distintas. A cidade do concurso não está no órgão
   * (`orgao.municipio` é nulo em todos os 1.332), está na vaga, escrita pelo
   * ato — e é a cidade da vaga que o candidato procura.
   */
  localidades: string[];
  /** Link para o PDF do edital no diário ou no site da banca. */
  editalUrl: string | null;
}

/** Como o cartão se pinta. O fundo é o sinal de situação. */
export type Tom = "urgente" | "aberto" | "previsto" | "encerrado";

/** Quantos dias faltando para o fim das inscrições contam como urgente. */
export const DIAS_DE_URGENCIA = 7;

/** `create type evento_tipo` */
export type EventoTipo =
  | "autorizacao"
  | "banca_definida"
  | "publicacao_edital"
  | "inicio_inscricao"
  | "fim_inscricao"
  | "pedido_isencao"
  | "pagamento_taxa"
  | "prova_objetiva"
  | "prova_discursiva"
  | "prova_pratica"
  | "prova_titulos"
  | "resultado_preliminar"
  | "resultado_final"
  | "homologacao"
  | "convocacao"
  | "suspensao"
  | "cancelamento";

/**
 * Um fato datado da vida do concurso, com a citação do ato que o sustenta.
 *
 * `evidencia` é o que separa este produto de uma lista de datas copiada: é o
 * trecho do documento de onde a data saiu, e o engine a grava em todos os
 * eventos que extrai. Uma data sem ela é um número que ninguém tem como
 * conferir.
 */
export interface EventoDoCronograma {
  tipo: EventoTipo;
  /**
   * A `chave` da origem de onde este evento foi lido, quando se sabe. É o que
   * liga a linha do tempo ao ato: a pessoa lê de onde tiramos a data e abre
   * o documento que a produziu, na mesma página.
   */
  ato: string | null;
  /** `AAAA-MM-DD`. A data única do fato vive aqui, mesmo em `fim_inscricao`. */
  inicio: string | null;
  /** Só quando o ato deu um intervalo. Raro: 2 de 439 eventos do acervo. */
  fim: string | null;
  hora: string | null;
  localidades: string[];
  observacao: string | null;
  evidencia: string | null;
}

export interface Requisito {
  descricao: string;
  formacoes: string[];
}

export interface Vaga {
  /** Como o ato escreveu, que costuma ser mais específico que o município. */
  localidade: string | null;
  uf: Uf | null;
  ampla: number;
  pcd: number;
  negros: number;
  outras: number;
  total: number;
  cadastroReserva: boolean;
  crQuantidade: number | null;
}

export interface Remuneracao {
  base: number | null;
  total: number | null;
  /** "mensal" na prática; é texto livre no banco. */
  tipo: string;
  observacao: string | null;
}

/** O campo do cargo e o trecho do ato que o sustenta. */
export interface TrechoDeEvidencia {
  campo: string;
  trecho: string;
}

/**
 * Um cargo do concurso.
 *
 * Os três estados que a tela precisa aguentar são todos comuns no acervo:
 * cargo com vaga detalhada e remuneração, cargo com vaga e sem remuneração
 * (a maioria), e cargo só com nome e área. Lista vazia quer dizer "o ato não
 * informou", e é isso que a tela diz.
 */
export interface Cargo {
  nome: string;
  codigo: string | null;
  escolaridade: Escolaridade | null;
  area: string | null;
  jornadaHoras: number | null;
  requisitos: Requisito[];
  taxaInscricao: number | null;
  vagas: Vaga[];
  remuneracoes: Remuneracao[];
  evidencia: TrechoDeEvidencia[];
}

/** `create type faq_pergunta` — as seis perguntas de candidato. */
export type FaqPergunta =
  | "ate_quando"
  | "onde_inscrever"
  | "etapas_prova"
  | "como_inscrever"
  | "quem_pode"
  | "quanto_custa";

/**
 * As três coisas que podem ter acontecido com uma pergunta.
 *
 * `nao_respondida` é o ato não dizer, e é resposta: homologação não informa
 * como se inscrever porque não tem como informar. `descartada` é o motor ter
 * recusado o trecho que o modelo devolveu, porque ele não conferiu palavra
 * por palavra com o texto do ato. A tela precisa dizer as duas coisas com
 * palavras diferentes — uma é lacuna do documento, a outra é falha nossa.
 */
export type SituacaoDaResposta =
  | "respondida"
  | "nao_respondida"
  | "descartada";

/**
 * Uma pergunta respondida pelo próprio ato.
 *
 * `trecho` **não é prosa do modelo**: é o pedaço literal do documento, e
 * `inicioChar`/`fimChar` dizem onde ele está dentro de `Origem.texto`. É o
 * que deixa a página destacar a resposta na frase que a produziu, em vez de
 * pedir que se acredite na nossa leitura.
 */
export interface RespostaDoFaq {
  pergunta: FaqPergunta;
  situacao: SituacaoDaResposta;
  /** Só quando respondida. O trecho recusado não chega aqui. */
  trecho: string | null;
  inicioChar: number | null;
  fimChar: number | null;
  /** Vocabulário de motor, não de tela. A página diz que houve descarte. */
  motivoDescarte: string | null;
}

/**
 * De onde este concurso veio: o ato no Diário Oficial.
 *
 * Não é "o PDF do edital". O Diário publica o ato ou o extrato; o edital
 * completo, com anexos, fica no site da banca. O acervo do engine não tem
 * nenhuma linha de edital, e isso é por desenho.
 */
export interface Origem {
  /** Identificador do ato na fonte. É o alvo do link vindo do cronograma. */
  chave: string;
  /**
   * `null` quando a fonte não registrou o endereço público do ato — hoje,
   * todo o acervo. O ato existe e foi publicado; o que falta é o endereço, e
   * a página diz isso em vez de oferecer um link que não abre.
   *
   * Quando existe, aponta para a **página** do Diário em que o ato saiu, não
   * para o ato: a mesma página costuma trazer outros atos do mesmo dia.
   */
  url: string | null;
  titulo: string | null;
  fonte: string | null;
  /** ISO completo: é quando o motor viu o ato, não quando ele foi publicado. */
  vistoEm: string;
  /**
   * O ato inteiro, como saiu publicado. **Não é o edital**: o diário publica
   * o ato ou o extrato dele, e o edital completo com anexos fica na banca.
   *
   * É o que o produto tem de mais garantido — o texto está no nosso banco,
   * não depende de link nenhum continuar existindo. Vem só na rota de
   * detalhe.
   */
  texto: string | null;
  /** Tamanho do texto. É por ele que a página decide o que abrir sozinho. */
  caracteres: number | null;
  /**
   * As seis perguntas respondidas por **este** ato. Vazia quando ele não foi
   * lido pelo estágio de FAQ — só edital de abertura é elegível.
   *
   * Fica no ato, e não no concurso, porque a resposta é do documento: um
   * concurso com abertura e retificação pode ter respostas de mais de um, e
   * atribuir cada uma ao seu ato evita escolher qual vale.
   */
  faq: RespostaDoFaq[];
  /**
   * O endereço onde **este ato diz** que o edital completo pode ser lido.
   *
   * Campo separado de `ConcursoResumo.editalUrl` de propósito: aquele é um
   * arquivo que o motor baixou e guardou; este é um endereço que o ato
   * afirma e que **nunca visitamos**. O ato pode ter meses e site de banca
   * muda, então a tela oferece o link dizendo isso, em vez de prometer que
   * ele abre.
   */
  editalCitadoUrl: string | null;
}

/** O concurso inteiro, como a página de detalhe precisa dele. */
export interface ConcursoDetalhe extends ConcursoResumo {
  cronograma: EventoDoCronograma[];
  cargos: Cargo[];
  origens: Origem[];
  /**
   * O endereço do edital completo escolhido entre os atos — abertura
   * primeiro, depois o mais recente. Mesma ressalva de `Origem`: é o que o
   * ato afirma, não o que nós conferimos.
   */
  editalCitadoUrl: string | null;
}
