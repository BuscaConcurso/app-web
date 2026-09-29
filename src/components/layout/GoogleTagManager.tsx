"use client";

import Script from "next/script";
import { useConsentimento } from "@/components/consentimento/useConsentimento";
import { idDoGtm, scriptDoGtm } from "@/lib/gtm";

/**
 * Carrega o GTM depois da hidratação (`afterInteractive`), para não disputar
 * o primeiro carregamento com o conteúdo, e **só com o aceite do banner de
 * cookies** (`consentimento.ts`): ele mede e grava cookie do Google, que é
 * exatamente o que o banner pergunta. Sem `NEXT_PUBLIC_GTM_ID` válido não
 * renderiza nada.
 *
 * Sem o `<noscript>` de antes: sem JavaScript não há banner, e então não há
 * aceite. Quem recusa depois de aceitar tira o GTM a partir da próxima
 * página carregada; o script que já rodou nesta não se desfaz.
 */
export function GoogleTagManager() {
  const id = idDoGtm(process.env.NEXT_PUBLIC_GTM_ID);
  const consentimento = useConsentimento();
  if (!id || consentimento !== "aceito") return null;

  return (
    <Script id="gtm" strategy="afterInteractive">
      {scriptDoGtm(id)}
    </Script>
  );
}
