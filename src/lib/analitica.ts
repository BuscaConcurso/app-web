/**
 * A única porta do app para o PostHog.
 *
 * Todo chamador (salvos, busca, conta) usa estas funções, e elas não fazem
 * nada enquanto o PostHog não estiver ligado: sem `NEXT_PUBLIC_POSTHOG_KEY`,
 * no servidor, nos testes. Assim nenhum componente precisa saber se a
 * analítica existe.
 *
 * O consentimento manda (`consentimento.ts`): sem "aceito", o modo
 * `cookieless_mode: "on_reject"` descarta ou anonimiza o que for registrado.
 */
import posthog from "posthog-js";
import { lerConsentimento, observarConsentimento, type Consentimento } from "./consentimento";
import { opcoesDoPosthog } from "./posthog";

/** Os eventos com nome. Pageview e cliques o PostHog pega sozinho. */
export type EventoDeAnalitica =
  | "busca"
  | "concurso_salvo"
  | "concurso_removido"
  | "lembrete_ligado"
  | "lembrete_desligado"
  | "cadastro_concluido"
  | "login_concluido"
  | "inscricao_clicada"
  | "filtro_aplicado"
  | "avaliacao_enviada";

function ligado(): boolean {
  return typeof window !== "undefined" && posthog.__loaded;
}

/**
 * Leva a resposta guardada ao PostHog, só quando ele ainda não a tem: o
 * `opt_in_capturing()` manda um evento `$opt_in`, e chamá-lo a cada página
 * carregada encheria os dados de um por visita.
 */
export function aplicarConsentimento(consentimento: Consentimento | null): void {
  if (!ligado()) return;
  const atual = posthog.get_explicit_consent_status();
  if (consentimento === "aceito") {
    if (atual !== "granted") posthog.opt_in_capturing();
  } else if (consentimento === "recusado") {
    if (atual !== "denied") posthog.opt_out_capturing();
  } else if (atual !== "pending") {
    posthog.clear_opt_in_out_capturing();
  }
}

/** Chamado uma vez, por `src/instrumentation-client.ts`, com a chave validada. */
export function iniciarAnalitica(chave: string): void {
  posthog.init(chave, opcoesDoPosthog());
  aplicarConsentimento(lerConsentimento());
  observarConsentimento(() => aplicarConsentimento(lerConsentimento()));
}

export function registrar(
  evento: EventoDeAnalitica,
  propriedades?: Record<string, string | number | boolean | null>,
): void {
  if (ligado()) posthog.capture(evento, propriedades);
}

/** A conta que entrou, pelo id interno. Nunca o e-mail nem o nome. */
export function identificar(idDaConta: string): void {
  if (ligado()) posthog.identify(idDaConta);
}

/**
 * Ao sair. O `reset()` também limpa o consentimento dentro do PostHog, e
 * `reset()` depois do opt-in para a captura sem aviso (documentação do
 * `posthog-js`): por isso a resposta guardada é aplicada de novo em seguida.
 */
export function esquecer(): void {
  if (!ligado()) return;
  posthog.reset();
  aplicarConsentimento(lerConsentimento());
}
