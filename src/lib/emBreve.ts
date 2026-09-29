/**
 * O placeholder "em breve": todo botão sem função e todo link sem destino
 * chega aqui, em vez de fingir que faz algo.
 *
 * Uma lista fechada, e não texto livre em cada chamador: os recursos são
 * o inventário completo do que o protótipo promete e o acervo ainda não
 * entrega, e cada chamador só escolhe qual deles é.
 */
export type RecursoEmBreve =
  | "salvos"
  | "alertas"
  | "lembrete";

export const RECURSOS_EM_BREVE: Record<
  RecursoEmBreve,
  { titulo: string; frase: string }
> = {
  salvos: {
    titulo: "Concursos salvos",
    frase: "Guarde os concursos que interessam e veja todos num lugar só.",
  },
  alertas: {
    titulo: "Alertas",
    frase: "Receba o edital no dia em que ele sair.",
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
