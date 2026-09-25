/**
 * O placeholder "em breve": todo botão sem função e todo link sem destino
 * chega aqui, em vez de fingir que faz algo.
 *
 * Uma lista fechada, e não texto livre em cada chamador: os dez recursos são
 * o inventário completo do que o protótipo promete e o acervo ainda não
 * entrega, e cada chamador só escolhe qual deles é.
 */
export type RecursoEmBreve =
  | "salvos"
  | "areas"
  | "diario-oficial"
  | "como-lemos"
  | "acessibilidade"
  | "contato"
  | "alertas"
  | "alto-contraste"
  | "tamanho-da-fonte"
  | "lembrete";

export const RECURSOS_EM_BREVE: Record<
  RecursoEmBreve,
  { titulo: string; frase: string }
> = {
  salvos: {
    titulo: "Concursos salvos",
    frase: "Guarde os concursos que interessam e veja todos num lugar só.",
  },
  areas: {
    titulo: "Concursos por área",
    frase:
      "Tribunais, polícia, saúde e as outras áreas, cada uma com a sua lista.",
  },
  "diario-oficial": {
    titulo: "Feed do Diário Oficial",
    frase: "Todo ato novo sobre concurso, do mais recente para o mais antigo.",
  },
  "como-lemos": {
    titulo: "Como lemos os editais",
    frase:
      "O caminho do ato publicado até a página: coleta, leitura e conferência.",
  },
  acessibilidade: {
    titulo: "Acessibilidade",
    frase:
      "O que fazemos para o site funcionar com leitor de tela, teclado e zoom.",
  },
  contato: {
    titulo: "Contato",
    frase: "Um canal para falar com a equipe e apontar erro de leitura.",
  },
  alertas: {
    titulo: "Alertas",
    frase: "Receba o edital no dia em que ele sair.",
  },
  "alto-contraste": {
    titulo: "Alto contraste",
    frase: "Uma versão de cores com contraste máximo.",
  },
  "tamanho-da-fonte": {
    titulo: "Tamanho da fonte",
    frase: "Aumentar e diminuir o texto do site inteiro.",
  },
  lembrete: {
    titulo: "Lembretes",
    frase: "Um aviso na véspera do fim das inscrições.",
  },
};

export function hrefEmBreve(recurso: RecursoEmBreve): string {
  return `/em-breve/${recurso}`;
}

/**
 * Converte o segmento cru da rota num recurso conhecido, ou devolve `null`.
 * É o que decide entre a página "em breve" e a 404, então quem não está na
 * lista não vira uma afirmação de que existe.
 *
 * `Object.hasOwn` e não `in`: `in` sobe pelo protótipo, e
 * `/em-breve/constructor` ou `/em-breve/toString` respondiam 200.
 */
function ehRecursoEmBreve(valor: string): valor is RecursoEmBreve {
  return Object.hasOwn(RECURSOS_EM_BREVE, valor);
}

export function recursoEmBreve(valor: string): RecursoEmBreve | null {
  return ehRecursoEmBreve(valor) ? valor : null;
}
