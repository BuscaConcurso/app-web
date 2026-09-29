"use client";

import { limparConsentimento } from "@/lib/consentimento";

/**
 * "Preferências de cookies", no rodapé: apaga a resposta guardada, e o
 * banner volta. Quem decide se aparece é o rodapé (`ferramentasLigadas`):
 * sem ferramenta de medição ligada no build, não há o que escolher.
 */
export function PreferenciasDeCookies({ className }: { className: string }) {
  return (
    <button type="button" onClick={() => limparConsentimento()} className={`${className} text-left`}>
      Preferências de cookies
    </button>
  );
}
