import Script from "next/script";
import { idDoGtm, scriptDoGtm, urlDoNoscriptDoGtm } from "@/lib/gtm";

/**
 * Carrega o GTM depois da hidratação (`afterInteractive`), para não disputar
 * o primeiro carregamento com o conteúdo. Sem `NEXT_PUBLIC_GTM_ID` válido não
 * renderiza nada: nem script, nem iframe.
 */
export function GoogleTagManager() {
  const id = idDoGtm(process.env.NEXT_PUBLIC_GTM_ID);
  if (!id) return null;

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {scriptDoGtm(id)}
      </Script>
      <noscript>
        <iframe
          src={urlDoNoscriptDoGtm(id)}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
