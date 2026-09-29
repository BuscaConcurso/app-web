/**
 * A resposta ao banner de cookies, guardada neste navegador.
 *
 * É a fonte da verdade para o PostHog e para o GTM: o PostHog lê daqui ao
 * ligar (`aplicarConsentimento`, em `analitica.ts`), e o GTM só carrega com
 * "aceito". Guardar a própria resposta é o armazenamento estritamente
 * necessário que o banner pressupõe; sem ele, a pergunta voltaria a cada
 * página.
 *
 * O acesso ao `localStorage` pode lançar (navegador que bloqueia dado de
 * site, modo privado de alguns navegadores): aí vale como sem resposta, e o
 * banner aparece de novo, que é o lado seguro.
 */
import { idDoGtm } from "./gtm";
import { chaveDoPosthog } from "./posthog";

export type Consentimento = "aceito" | "recusado";

const CHAVE = "bc:consentimento";
const EVENTO = "bc:consentimento";

function padrao(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function lerConsentimento(armazenamento: Storage | null = padrao()): Consentimento | null {
  try {
    const valor = armazenamento?.getItem(CHAVE);
    return valor === "aceito" || valor === "recusado" ? valor : null;
  } catch {
    return null;
  }
}

function avisar(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function gravarConsentimento(
  valor: Consentimento,
  armazenamento: Storage | null = padrao(),
): void {
  try {
    armazenamento?.setItem(CHAVE, valor);
  } catch {
    // Sem onde guardar, a escolha vale só nesta página.
  }
  avisar();
}

/** "Preferências de cookies", no rodapé: a pergunta volta. */
export function limparConsentimento(armazenamento: Storage | null = padrao()): void {
  try {
    armazenamento?.removeItem(CHAVE);
  } catch {
    // Nada guardado que precise sair.
  }
  avisar();
}

/** Para `useSyncExternalStore`: avisa quando a resposta muda nesta aba. */
export function observarConsentimento(aoMudar: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENTO, aoMudar);
  return () => window.removeEventListener(EVENTO, aoMudar);
}

/** O banner só aparece quando há o que ligar e a pessoa ainda não respondeu. */
export function precisaPerguntar(
  ligados: { posthog: boolean; gtm: boolean },
  consentimento: Consentimento | null,
): boolean {
  return (ligados.posthog || ligados.gtm) && consentimento === null;
}

/**
 * O que o banner pede para ligar. `NEXT_PUBLIC_*` vem gravado no build, então
 * servidor e navegador respondem igual.
 */
export function ferramentasLigadas(): { posthog: boolean; gtm: boolean } {
  return {
    posthog: chaveDoPosthog(process.env.NEXT_PUBLIC_POSTHOG_KEY) !== null,
    gtm: idDoGtm(process.env.NEXT_PUBLIC_GTM_ID) !== null,
  };
}
