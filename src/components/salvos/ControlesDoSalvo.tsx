"use client";

import { BotaoSalvar } from "./BotaoSalvar";
import { InterruptorDeLembrete } from "./InterruptorDeLembrete";

/**
 * Os controles de cada concurso em `/salvos`: o interruptor de lembrete e,
 * no cartão do celular, o botão de tirar dos salvos (a linha da tabela já
 * tem o marcador; o cartão inteiro é um link e não tem).
 */
export function ControlesDoSalvo({ slug, forma }: { slug: string; forma: "linha" | "cartao" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <InterruptorDeLembrete slug={slug} />
      {forma === "cartao" && (
        <BotaoSalvar
          slug={slug}
          comTexto
          tamanhoDoIcone={16}
          className="inline-flex h-10 items-center gap-1.5 rounded-controle bg-rebaixada px-3 text-sm font-semibold text-tinta-900 hover:bg-linha"
        />
      )}
    </div>
  );
}
