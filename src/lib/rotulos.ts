/**
 * Os enums do banco em português de tela.
 *
 * O canvas manda caixa alta só na sigla: "TJSP" sim, "TRIBUNAL DE JUSTIÇA"
 * não, e cargo em caixa baixa. Por isso nada aqui é gritado.
 */
import type {
  ConcursoDetalhe,
  ConcursoResumo,
  ConcursoStatus,
  FaqPergunta,
  Escolaridade,
  Esfera,
  EventoTipo,
  Poder,
  Uf,
} from "./dominio";
import { numero, quantidade } from "./formato";

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
 * As etiquetas de vagas do cartão da busca: **para quem** as vagas são.
 *
 * A divisão de trabalho com o bloco de números é o desenho inteiro. O bloco
 * é de posições fixas — o rótulo "Vagas" é sempre desenhado —, então ele é o
 * único lugar da tela onde a ausência de dado consegue aparecer, e é lá que
 * o "quantas" mora. A fileira de etiquetas é de tamanho variável: uma
 * etiqueta que não existe é invisível, e por isso ela só pode carregar
 * afirmação, nunca ausência. Daí a regra: **o bloco diz quantas, as
 * etiquetas dizem para quem, e nenhuma das duas repete a outra.**
 *
 * É também por isso que não há etiqueta com o total. Ela apareceria em 922
 * cartões repetindo o número que está três linhas abaixo, e em 602 deles
 * (65%) diria "1 vaga" — uma etiqueta que não separa um cartão de outro.
 *
 * O que as etiquetas acrescentam, medido no acervo de 3.071 concursos:
 * - cadastro de reserva, em 254 cartões. Em 83 deles o cartão perdia o fato
 *   por completo (o bloco mostrava só o número) e nos outros 171 ele saía
 *   como a abreviação "CR" dentro de uma casa de número.
 * - a reserva legal, em 197 cartões (94 com PcD, 162 com negros), que o
 *   resumo nem publicava.
 * Ao todo 425 cartões (14%) ganham pelo menos uma.
 */
export function etiquetasDeVagas(
  concurso: Partial<
    Pick<ConcursoResumo, "vagasPcd" | "vagasNegros" | "cadastroReserva">
  >,
): string[] {
  return [
    // "1 vaga PcD" e não "PcD: 1": a etiqueta fica acima do bloco de
    // números, então precisa dizer sozinha de que ela está falando.
    reservadas(concurso.vagasPcd, "PcD"),
    reservadas(concurso.vagasNegros, "para negros"),
    // Por extenso, e por último. "CR" é jargão de edital, e quem não o
    // conhece é exatamente quem a etiqueta serve: o cadastro de reserva é o
    // caso em que vale se inscrever mesmo sem vaga imediata anunciada.
    //
    // `=== true` e não o valor cru: um engine que não conhece o campo manda
    // `undefined`, e "não veio" não pode virar "sim" por acidente de
    // coerção. Aqui daria `false` de qualquer jeito; está explícito porque a
    // regra é da fileira inteira, não deste ramo.
    concurso.cadastroReserva === true ? "Cadastro reserva" : null,
  ].filter((etiqueta): etiqueta is string => etiqueta !== null);
}

/**
 * Uma etiqueta de reserva, ou nada.
 *
 * `quantidade()` antes de qualquer coisa, e é o ponto todo desta função: o
 * parâmetro chega tipado como `number | null`, mas o tipo é uma promessa
 * sobre o JSON de outro processo — um engine mais velho não manda o campo e
 * ele chega `undefined`. Sem esta guarda, `numero(undefined)` devolve "NaN" e
 * a busca anuncia **"NaN vagas PcD"**, que foi o que aconteceu em cartões
 * reais. Uma tela que afirma reserva de vaga a partir de campo inexistente é
 * o erro exato que este produto não pode cometer.
 *
 * Zero também não vira etiqueta, pelo mesmo motivo de não virar número: o
 * ato não repartir e o ato reservar nenhuma são coisas diferentes.
 */
function reservadas(quantas: unknown, para: string): string | null {
  const quantas_ = quantidade(quantas);
  if (quantas_ === null || quantas_ <= 0) return null;
  return `${numero(quantas_)} ${quantas_ === 1 ? "vaga" : "vagas"} ${para}`;
}

/**
 * Quanto texto de cargo cabe na linha do cartão, contando o aviso de corte.
 *
 * Medido na tela, não escolhido: a 375px a linha tem 264px úteis (o rótulo
 * "Cargos" come o resto dos 319px do cartão) e o maior texto que ainda ocupa
 * uma linha só tem **47 caracteres**. Duas linhas dão folga para **84**,
 * que é o orçamento; o `line-clamp-3` do cartão é margem para telas mais
 * estreitas que o alvo (a 320px cabem 32 por linha).
 *
 * O orçamento vale para o texto INTEIRO, com o " · e mais 12" dentro. É a
 * diferença que importa: orçar só os nomes deixaria o aviso de corte cair
 * fora das linhas visíveis, e aí o cartão voltaria a sumir com cargos em
 * silêncio — justamente o que o aviso existe para impedir.
 *
 * Contra o acervo, 84 caracteres deixam passar inteira a lista de **2.455
 * dos 2.717** concursos com cargo (90%): 227 cartões ganham o aviso "e mais
 * N" e em 59 o próprio nome é cortado com reticências: a mediana da lista completa é 23
 * caracteres e o p90 é 83. O corte existe para a cauda, e a cauda é real —
 * o maior nome de cargo do acervo tem 290 caracteres sozinho, a maior lista
 * junta dá 3.024, e um concurso tem 91 cargos.
 */
const ORCAMENTO_DE_CARGOS = 84;

/** " · e mais 12": o corte se declarando, e o que ele custa em caracteres. */
function avisoDeCorte(quantos: number): string {
  return ` · e mais ${quantos}`;
}

/**
 * Os cargos do cartão, que é o que a pessoa de fato digitou na busca.
 *
 * `titulo` não serve para isso: no acervo real ele é o cabeçalho do ato
 * ("Agência Nacional de Saúde Suplementar — Edital nº 22/2026"), e não
 * contém o nome do cargo. Sem esta linha, o cartão devolvido por uma busca
 * por "professor" não mostra em lugar nenhum a palavra "professor".
 *
 * **O corte diz que cortou, e o texto cabe.** As duas coisas são a mesma
 * regra: o resultado nunca passa de `ORCAMENTO_DE_CARGOS`, então o " · e
 * mais 12" nunca é o pedaço que a tela corta. Sumir com 12 cargos em
 * silêncio faria o cartão descrever um concurso menor do que ele é, e quem
 * procura o 13º concluiria que ele não existe. O `line-clamp-3` da linha
 * ficou como cinto de segurança, não como a regra — uma regra que depende de
 * CSS para ser verdadeira não é uma regra.
 *
 * **Ausência é ausência.** 354 dos 3.071 concursos do acervo não têm cargo
 * nenhum, e nesses a função devolve `informado: false` para a linha existir
 * dizendo que não sabe. A linha é desenhada sempre, de propósito: uma linha
 * que some quando falta dado não consegue mostrar que falta dado — é a mesma
 * razão pela qual "quantas vagas" mora no bloco de números e não numa
 * etiqueta.
 *
 * O parâmetro é `unknown` pelo motivo de `reservadas()` aqui em cima: o tipo
 * `ConcursoResumo` é uma promessa sobre o JSON de outro processo, e um engine
 * que não mande o campo faria `nomes.length` derrubar o cartão. Campo que não
 * veio é ausência, e ausência é o caso que esta função já sabe tratar.
 */
export function cargosDoCartao(nomes: unknown): {
  texto: string;
  informado: boolean;
} {
  const lista = Array.isArray(nomes)
    ? nomes.filter(
        (nome): nome is string => typeof nome === "string" && nome.trim() !== "",
      )
    : [];
  if (lista.length === 0) return { texto: "não informados", informado: false };

  // Do maior número de nomes para o menor, parando no primeiro que caiba
  // COM o seu próprio aviso. Contar para a frente não serve: quantos cabem
  // depende do tamanho do aviso, e o tamanho do aviso depende de quantos
  // ficaram de fora.
  for (let quantos = lista.length; quantos >= 1; quantos--) {
    const restantes = lista.length - quantos;
    const texto =
      lista.slice(0, quantos).join(" · ") +
      (restantes > 0 ? avisoDeCorte(restantes) : "");
    if (texto.length <= ORCAMENTO_DE_CARGOS) return { texto, informado: true };
  }

  // Nem o primeiro nome sozinho cabe — 228 nomes do acervo passam de 80
  // caracteres e o maior tem 290. Aqui o nome é que cede, com reticências
  // próprias: cortar o nome e manter o aviso diz as duas verdades ("este
  // nome continua" e "há mais cargos"), enquanto deixar o nome inteiro
  // empurraria o aviso para fora da tela e só diria a primeira.
  const restantes = lista.length - 1;
  const aviso = restantes > 0 ? avisoDeCorte(restantes) : "";
  const espaco = ORCAMENTO_DE_CARGOS - aviso.length - 1;
  return {
    texto: `${lista[0].slice(0, espaco).trimEnd()}…${aviso}`,
    informado: true,
  };
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
 * Um pedaço da frase do acervo incompleto: o número e o que dizer dele.
 *
 * Sai partido em dois porque a tela destaca o número e o texto não — e
 * porque devolver HTML daqui tiraria a frase do alcance do teste, que é
 * justamente onde ela precisa estar.
 */
export interface ParteDoAcervoIncompleto {
  /** Quantos concursos esta parte conta. Sempre maior que zero. */
  quantos: number;
  /** O que vem depois do número, já concordando com ele, com ponto final. */
  texto: string;
}

/**
 * A frase que diz por que N concursos do acervo estão fora da lista.
 *
 * **Ela existia e afirmava três coisas falsas.** Dizia: *"Outros N dos T
 * concursos do acervo ainda não foram lidos: o diário oficial publicou o
 * ato, e o cargo, as vagas e o cronograma ainda não foram extraídos do
 * documento. Eles entram na lista conforme forem lidos."* Medido no banco em
 * 2026-09-14, dos 293 concursos fora da lista:
 *
 * - *"ainda não foram lidos"* era falso para 138. Foram lidos, deu certo, e
 *   não há o que extrair — o ato é retificação, anexo, complementar ou
 *   "outro".
 * - *"o cargo ... ainda não foi extraído"* sugeria, para esses mesmos 138,
 *   um trabalho pendente que não existe. Uma retificação de prazo não tem
 *   cargo para extrair: ela atualiza um concurso que já está na lista.
 * - *"entram na lista conforme forem lidos"* valia para 104 — os que estão
 *   na fila — e para mais ninguém. Os 138 nunca entram, e os 51 restantes só
 *   entram se a leitura for refeita.
 *
 * **Três partes, e não quatro nem uma.** Quatro seria a repartição do banco
 * (fila, ato que não abre concurso, leitura que falhou, abertura que não
 * rendeu nada), e as duas últimas dizem a mesma coisa ao candidato: é dado
 * que deveria estar aqui e não está, e ele não pode fazer nada a respeito.
 * Juntá-las num "lacuna nossa" tira uma oração da tela sem tirar nenhuma
 * informação que mude o que o leitor faz. Uma parte só seria voltar ao
 * número sozinho, que é de onde as três mentiras vieram.
 *
 * **Quantas cabem, medido na tela e não estimado.** O parágrafo renderizado
 * em Chrome com a fonte do app (Archivo 13px/21,12px, que é o que
 * `text-sm leading-6` produz aqui), nas quatro larguras reais em que ele
 * aparece — a home a 1240px, a coluna de resultados da busca a 1240px e a
 * 1024px (ela divide a faixa com os 288px da coluna de filtros), e o
 * telefone a 375px:
 *
 * | largura útil | a frase antiga | 1 parte | 2 partes | **3 partes** |
 * |---|---|---|---|---|
 * | 1150px (home) | 2 linhas | 1 | 2 | **2** |
 * | 842px (busca, 1240) | 2 | 1 | 2 | **3** |
 * | 626px (busca, 1024) | 2 | 1 | 3 | **4** |
 * | 301px (telefone) | 5 | 3 | 6 | **8** |
 *
 * Na home as três partes custam as mesmas duas linhas que a frase falsa
 * custava. No telefone custam três linhas a mais, e é aí que a decisão
 * aperta: 8 linhas num bloco cinza de rodapé é muito. Foi por essa medição
 * que a primeira parte perdeu o final ", em vez de criar outro" — tirar 23
 * caracteres tirou uma linha inteira da home. Duas partes economizariam mais
 * duas linhas no telefone, e a parte que sairia seria justamente a da fila:
 * a tela perderia a única promessa verdadeira que ela tem para fazer, ou
 * juntaria a fila com a lacuna e voltaria a mentir, pelo outro lado.
 *
 * A ordem é fixa e não é a ordem de tamanho: primeiro o que nunca vai
 * entrar, porque é isso que tira o leitor da espera; depois a fila, que é a
 * única promessa que se pode fazer; por último a lacuna, que é nossa e é a
 * parte que não dá para maquiar.
 *
 * **Devolve lista vazia quando a repartição não fecha** — engine mais velho
 * que não manda `foraDaLista`, ou soma que não bate com `semDado`. Aí a tela
 * usa a frase curta, que conta o total e não afirma repartição nenhuma.
 * Conferir a soma, e não a presença dos campos, é de propósito: zero é um
 * valor legítimo em qualquer uma das três, e é a soma que distingue "não há
 * nenhum na fila" de "não sei quantos estão na fila".
 */
export function acervoIncompletoEmPartes(aviso: {
  semDado: number;
  naFila: number;
  naoAbreConcurso: number;
  lacuna: number;
}): ParteDoAcervoIncompleto[] {
  const naoAbre = quantidade(aviso.naoAbreConcurso) ?? -1;
  const fila = quantidade(aviso.naFila) ?? -1;
  const nossa = quantidade(aviso.lacuna) ?? -1;
  if (naoAbre < 0 || fila < 0 || nossa < 0) return [];
  if (naoAbre + fila + nossa !== quantidade(aviso.semDado)) return [];

  return [
    {
      quantos: naoAbre,
      texto:
        (naoAbre === 1
          ? "não vai entrar: é uma retificação, um anexo ou outro ato que não" +
            " abre concurso"
          : "não vão entrar: são retificações, anexos e outros atos que não" +
            " abrem concurso") +
        " — uma retificação de prazo atualiza um concurso que já está aqui.",
    },
    {
      quantos: fila,
      // A única promessa de entrada automática que sobra, e ela é do tamanho
      // certo: 104, não 293. Um teste em rotulos.test.ts quebra se esta
      // oração voltar a ser escrita sobre o total.
      texto:
        `${fila === 1 ? "está" : "estão"} na fila de leitura e` +
        ` ${fila === 1 ? "entra" : "entram"} quando` +
        ` ${fila === 1 ? "for lido" : "forem lidos"}.`,
    },
    {
      quantos: nossa,
      texto:
        `${nossa === 1 ? "é" : "são"} lacuna nossa: a leitura falhou, ou não` +
        " achou cargo nem cronograma no ato —" +
        ` ${nossa === 1 ? "só entra" : "só entram"} se for refeita.`,
    },
  ].filter((parte) => parte.quantos > 0);
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
