"use client";

import { Icone } from "@/components/ui/Icone";
import { avisoAoLigarLembrete } from "@/lib/salvos";
import { useSalvos } from "./contexto";
import { LinkParaEntrar } from "./LinkParaEntrar";

/**
 * "Lembrar amanhã" e "Avisar quando abrir" (spec de lembretes, §6): os dois
 * são salvar o concurso com `lembrar` ligado, e o job diário decide qual
 * e-mail sai. Clicar de novo desliga o lembrete; o concurso continua salvo.
 *
 * `rotulo` é o nome do lugar ("Avisar quando abrir"), `texto` o que cabe na
 * tela quando é mais curto ("Avisar"). Ligado, os dois viram "Lembrete
 * ligado". Com `textoSoAPartirDeSm` o texto some abaixo de `sm` e o nome vai
 * no `aria-label`, como no bloco "Vem aí" da home.
 */
export function BotaoLembrar({
  slug,
  rotulo,
  texto = rotulo,
  textoSoAPartirDeSm = false,
  tamanhoDoIcone,
  className,
}: {
  slug: string;
  rotulo: string;
  texto?: string;
  textoSoAPartirDeSm?: boolean;
  /** Sem tamanho, sem ícone. */
  tamanhoDoIcone?: number;
  className?: string;
}) {
  const salvos = useSalvos();
  const ligado = salvos.mapa.get(slug) === true;
  const nome = ligado ? "Lembrete ligado" : rotulo;
  const visivel = ligado ? "Lembrete ligado" : texto;
  const conteudo = (
    <>
      {tamanhoDoIcone !== undefined && <Icone nome="alerta" tamanho={tamanhoDoIcone} />}
      <span className={textoSoAPartirDeSm ? "hidden sm:inline" : undefined}>{visivel}</span>
    </>
  );
  const ariaLabel = textoSoAPartirDeSm || visivel !== nome ? nome : undefined;

  if (salvos.estado === "anonimo") {
    return (
      <LinkParaEntrar ariaLabel={ariaLabel} className={className}>
        {conteudo}
      </LinkParaEntrar>
    );
  }

  async function alternar() {
    const aceito = await salvos.lembrar(slug, !ligado);
    if (aceito && !ligado) salvos.avisar(avisoAoLigarLembrete(salvos.emailConfirmado));
  }

  return (
    <button
      type="button"
      aria-pressed={ligado}
      aria-label={ariaLabel}
      className={className}
      onClick={() => void alternar()}
    >
      {conteudo}
    </button>
  );
}
