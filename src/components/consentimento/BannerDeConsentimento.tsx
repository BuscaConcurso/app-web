"use client";

import {
  ferramentasLigadas,
  gravarConsentimento,
  precisaPerguntar,
  type Consentimento,
} from "@/lib/consentimento";
import { useConsentimento } from "./useConsentimento";

/** "do PostHog e do Google": só o que está ligado neste build. */
export function quemMede(ligados: { posthog: boolean; gtm: boolean }): string {
  const nomes = [ligados.posthog && "do PostHog", ligados.gtm && "do Google"].filter(Boolean);
  return nomes.join(" e ");
}

/**
 * O cartão do banner, sem estado: é o que o teste desenha no servidor.
 *
 * Uma região com nome, e não um diálogo modal: o site continua usável com o
 * banner aberto, e o foco não é roubado de quem chegou pelo teclado. Recusar
 * e aceitar têm o mesmo tamanho e o mesmo lugar, como a LGPD pede de uma
 * escolha livre; só a cor diz qual é o padrão visual do site.
 */
export function CartaoDeConsentimento({
  ligados,
  aoResponder,
}: {
  ligados: { posthog: boolean; gtm: boolean };
  aoResponder: (resposta: Consentimento) => void;
}) {
  const botao = "h-11 flex-1 rounded-controle px-5 text-sm font-semibold transition-colors md:flex-none";
  return (
    <section aria-label="Cookies" className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] p-3 md:p-4">
      <div className="pointer-events-auto mx-auto flex max-w-[68rem] flex-col gap-4 rounded-cartao bg-cartao p-4 shadow-flutuante md:flex-row md:items-center md:gap-6 md:p-5">
        <p className="text-sm leading-6 text-tinta-600">
          <strong className="font-semibold text-tinta-900">
            Usamos cookies para entender como o site é usado e melhorá-lo.
          </strong>{" "}
          Com a sua permissão, as ferramentas {quemMede(ligados)} medem visitas e cliques e
          gravam a navegação, sem o que você digita nos campos. Sem ela, só contamos visitas, sem
          cookie e sem saber quem é você. Recusar não muda nada no site, e dá para mudar de ideia em
          &quot;Preferências de cookies&quot;, no rodapé.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => aoResponder("recusado")}
            className={`${botao} bg-rebaixada text-tinta-900 hover:bg-linha`}
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => aoResponder("aceito")}
            className={`${botao} bg-acao text-acao-texto hover:bg-acao-hover`}
          >
            Aceitar
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * O banner de cookies: aparece só quando há ferramenta de medição ligada no
 * build e a pessoa ainda não respondeu (`precisaPerguntar`). A resposta vai
 * para `consentimento.ts`, que avisa o PostHog e o GTM.
 */
export function BannerDeConsentimento() {
  const consentimento = useConsentimento();
  const ligados = ferramentasLigadas();
  if (consentimento === "servidor" || !precisaPerguntar(ligados, consentimento)) return null;
  return <CartaoDeConsentimento ligados={ligados} aoResponder={(resposta) => gravarConsentimento(resposta)} />;
}
