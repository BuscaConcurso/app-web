"use client";

import { avisoAoLigarLembrete } from "@/lib/salvos";
import { useSalvos } from "./contexto";

/**
 * O interruptor "Lembrete por e-mail" de cada concurso em `/salvos`.
 * `role="switch"` porque liga e desliga uma preferência, sem ser um envio.
 */
export function InterruptorDeLembrete({ slug }: { slug: string }) {
  const salvos = useSalvos();
  const ligado = salvos.mapa.get(slug) === true;

  async function alternar() {
    const aceito = await salvos.lembrar(slug, !ligado);
    if (aceito && !ligado) salvos.avisar(avisoAoLigarLembrete(salvos.emailConfirmado));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => void alternar()}
      className="inline-flex items-center gap-2.5 text-sm font-semibold text-tinta-900"
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${
          ligado ? "bg-acao" : "bg-linha"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-cartao shadow transition-transform ${
            ligado ? "translate-x-[1.125rem]" : "translate-x-0.5"
          }`}
        />
      </span>
      Lembrete por e-mail
    </button>
  );
}
