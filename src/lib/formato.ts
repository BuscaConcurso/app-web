/**
 * Formatação de data, dinheiro e prazo.
 *
 * Toda data do domínio é `AAAA-MM-DD`, que é como uma coluna `date` do
 * Postgres chega. `new Date("2026-04-14")` interpreta essa string como UTC à
 * meia-noite, então em qualquer fuso a oeste de Greenwich, o Brasil inteiro,
 * ela volta como 13 de abril. Por isso as funções daqui quebram a string na
 * mão e montam a data no fuso local.
 */

const MS_POR_DIA = 86_400_000;

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function paraDataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Zera a hora para que a diferença entre duas datas conte dias de calendário. */
function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** `2026-04-14` vira `14/04`. É o formato do cartão, onde o ano é ruído. */
export function dataCurta(iso: string): string {
  const data = paraDataLocal(iso);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/** `2026-04-14` vira `14/04/2026`. */
export function dataLonga(iso: string): string {
  return `${dataCurta(iso)}/${paraDataLocal(iso).getFullYear()}`;
}

/** `2026-04-14` vira `14 de abr`. Para prosa, onde a barra atrapalha. */
export function dataPorExtenso(iso: string): string {
  const data = paraDataLocal(iso);
  return `${data.getDate()} de ${MESES_CURTOS[data.getMonth()]}`;
}

/**
 * Hoje, como data civil brasileira, em `AAAA-MM-DD`.
 *
 * **Não use `new Date()` direto para comparar com data de edital.** Prazo de
 * inscrição é data civil do Brasil, e o relógio de quem renderiza não é: um
 * servidor em UTC vira o dia às 21h de Brasília, e das 21h à meia-noite a
 * página diria que encerrou ontem o que encerra hoje. É o defeito de três
 * horas que este projeto já teve — três horas por dia em que a tela mentia.
 *
 * Devolve string e não `Date` de propósito: toda data do domínio já é
 * `AAAA-MM-DD`, e nesse formato a comparação lexicográfica É a comparação
 * cronológica. Sem aritmética de milissegundo, sem horário de verão, sem
 * fuso do processo.
 */
const FUSO_CIVIL = "America/Sao_Paulo";

const ISO_EM_SAO_PAULO = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_CIVIL,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  // `en-CA` é o locale que formata como `AAAA-MM-DD`, que é exatamente a
  // forma das datas do domínio.
  return ISO_EM_SAO_PAULO.format(agora);
}

/**
 * Hoje em São Paulo, como `Date` à meia-noite local do processo.
 *
 * As listas (`filtrar`, `ordenar`, `tomDoConcurso`) recebem `Date` e leem o
 * dia com os getters locais. Passar `new Date()` fazia o servidor em UTC
 * (/concursos) e o navegador de quem lê (/busca) discordarem do dia entre
 * 21h e meia-noite de Brasília, ou em qualquer fuso fora do Brasil: um
 * concurso que encerra hoje sumia de "abertas" num lado e não no outro.
 * Com a data civil brasileira remontada no fuso local, os dois lados leem o
 * mesmo dia.
 */
export function hojeCivilEmSaoPaulo(agora: Date = new Date()): Date {
  return paraDataLocal(hojeEmSaoPaulo(agora));
}

/**
 * Dias de calendário entre hoje e a data. Negativo quando já passou, zero
 * quando é hoje.
 */
export function diasAte(iso: string, hoje: Date = new Date()): number {
  const alvo = inicioDoDia(paraDataLocal(iso));
  const base = inicioDoDia(hoje);
  return Math.round((alvo.getTime() - base.getTime()) / MS_POR_DIA);
}

/**
 * O prazo em palavras, como aparece na etiqueta vermelha do cartão urgente.
 * Devolve `null` quando a data já passou, porque aí o cartão deixa de ser
 * urgente e passa a ser encerrado, com outro texto.
 */
export function prazoRelativo(iso: string, hoje: Date = new Date()): string | null {
  const dias = diasAte(iso, hoje);
  if (dias < 0) return null;
  if (dias === 0) return "Encerra hoje";
  if (dias === 1) return "Encerra amanhã";
  return `Encerra em ${dias} dias`;
}

/**
 * `14852.66` vira `R$ 14.852`. Centavo em cartão de lista é ruído.
 *
 * Trunca em vez de arredondar: arredondar para cima faria a página anunciar
 * um salário maior do que o do edital, ainda que por um real.
 */
export function moeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Math.trunc(valor));
}

/** `95` vira `R$ 95,00`. Para taxa de inscrição, onde o centavo importa. */
export function moedaExata(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor);
}

export function numero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

/**
 * A soma de uma lista de quantidades que podem faltar, ou `null` quando
 * nenhuma delas é conhecida.
 *
 * Existe para o número "vagas previstas" da faixa de números da home: os
 * concursos previstos raramente têm vaga informada (o ato ainda não saiu),
 * e uma soma com `null` tratado como zero afirmaria "0 vagas previstas"
 * quando a resposta certa é "não sabemos". Só quando todo mundo é `null` a
 * soma também é `null`; um `null` isolado no meio da lista é ignorado, não
 * zera o total.
 */
export function somaOuNull(valores: (number | null)[]): number | null {
  const conhecidos = valores.filter((valor): valor is number => valor !== null);
  if (conhecidos.length === 0) return null;
  return conhecidos.reduce((total, valor) => total + valor, 0);
}

/**
 * A quantidade, se for mesmo uma quantidade; `null` em qualquer outro caso.
 *
 * Existe porque o tipo `ConcursoResumo` é uma promessa sobre o JSON de outro
 * processo, e o JSON não a cumpre sozinho: `acervo()` faz `await
 * resposta.json()` e anota o resultado com o tipo, sem conferir campo nenhum.
 * Um engine mais velho — que é o estado normal do mundo, porque API e app
 * sobem separados e a versão do app pode chegar antes — simplesmente não
 * manda o campo, ele chega `undefined`, e `Intl.NumberFormat().format(
 * undefined)` devolve a string **"NaN"**.
 *
 * Foi o que aconteceu: a busca mostrou "NaN vagas PcD" em cartões reais. O
 * erro não é cosmético. A tela afirmou uma reserva de vagas a partir de um
 * campo que não existia, num produto cujo contrato inteiro é não afirmar o
 * que o ato não disse. Campo que não veio é ausência de dado, e ausência de
 * dado não vira texto com valor dentro — vira nada.
 */
export function quantidade(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

/**
 * O texto de vagas do cartão. Um concurso sem número de vagas mas com
 * cadastro reserva não tem zero vagas, tem uma fila, e dizer "0 vagas"
 * afastaria quem deveria se inscrever.
 */
export function vagasTexto(
  vagas: number | null,
  cadastroReserva: boolean,
): string {
  if (vagas === null || vagas === 0) {
    return cadastroReserva ? "Cadastro reserva" : "A definir";
  }
  const contagem = `${numero(vagas)} ${vagas === 1 ? "vaga" : "vagas"}`;
  return cadastroReserva ? `${contagem} e cadastro reserva` : contagem;
}
