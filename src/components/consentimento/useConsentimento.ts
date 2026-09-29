"use client";

import { useSyncExternalStore } from "react";
import { lerConsentimento, observarConsentimento, type Consentimento } from "@/lib/consentimento";

/**
 * A resposta ao banner, atualizada quando muda nesta aba. No servidor (e na
 * primeira passada da hidratação) é `"servidor"`: a resposta mora no
 * navegador, e quem lê deve esperar em vez de chutar, senão o banner
 * piscaria para quem já respondeu.
 */
export function useConsentimento(): Consentimento | null | "servidor" {
  return useSyncExternalStore(observarConsentimento, () => lerConsentimento(), () => "servidor");
}
