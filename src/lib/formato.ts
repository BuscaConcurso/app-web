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
