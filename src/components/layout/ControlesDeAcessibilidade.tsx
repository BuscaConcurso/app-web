"use client";

import { useSyncExternalStore } from "react";
import { Icone } from "@/components/ui/Icone";
import {
  assinarAcessibilidade,
  contrasteAltoAtual,
  contrasteAltoNoServidor,
  definirContrasteAlto,
  definirFonte,
  FONTE_MAXIMA,
  FONTE_MINIMA,
  fonteAtual,
  fonteNoServidor,
} from "@/lib/acessibilidade";

/** O sinal de menos (U+2212), não o hífen nem o travessão. */
const MENOS = "−";

/**
 * Alto contraste e tamanho da fonte.
 *
 * Duas formas do mesmo controle: `barra`, na faixa escura acima da nav
 * (`Main.dc.html:24-31`), e `gaveta`, no menu do celular, onde a barra some.
 * O estado vem dos atributos do `html`, lidos com `useSyncExternalStore`: no
 * servidor o instantâneo é o padrão e no cliente é o que o script do `head`
 * já escreveu, sem divergência de hidratação. Clicar numa das duas formas e
 * ver a outra mudar é a própria conferência de que o estado é um só.
 *
 * O alto contraste é um interruptor (`aria-pressed`). A− e A+ ficam
 * desabilitados no limite, em vez de aceitar um clique que não faz nada.
 */
export function ControlesDeAcessibilidade({
  variante,
}: {
  variante: "barra" | "gaveta";
}) {
  const alto = useSyncExternalStore(
    assinarAcessibilidade,
    contrasteAltoAtual,
    contrasteAltoNoServidor,
  );
  const fonte = useSyncExternalStore(assinarAcessibilidade, fonteAtual, fonteNoServidor);

  const noMinimo = fonte <= FONTE_MINIMA;
  const noMaximo = fonte >= FONTE_MAXIMA;

  if (variante === "barra") {
    // Alvo de toque: a barra tem 36px de altura, a do artboard, e cada
    // controle ocupa a altura inteira dela (`h-9`). Ver `BarraUtilitaria`.
    const alvo =
      "inline-flex h-9 min-w-9 items-center justify-center px-2 disabled:cursor-not-allowed disabled:opacity-50";
    return (
      <>
        {/* Abaixo de `lg` o rótulo sai e fica o ícone (com o nome no
            `aria-label`), para a data à esquerda caber sem cortar. */}
        <button
          type="button"
          onClick={() => definirContrasteAlto(!alto)}
          aria-pressed={alto}
          aria-label="Alto contraste"
          className={`${alvo} gap-1.5 hover:underline aria-pressed:underline`}
        >
          <Icone nome="contraste" tamanho={15} />
          <span className="hidden lg:inline">Alto contraste</span>
        </button>

        <span role="group" aria-label="Tamanho da fonte" className="flex">
          <button
            type="button"
            onClick={() => definirFonte(fonte - 1)}
            disabled={noMinimo}
            aria-label="Diminuir fonte"
            className={`${alvo} text-[0.8125rem] font-semibold`}
          >
            A{MENOS}
          </button>
          <button
            type="button"
            onClick={() => definirFonte(fonte + 1)}
            disabled={noMaximo}
            aria-label="Aumentar fonte"
            className={`${alvo} text-[0.8125rem] font-semibold`}
          >
            A+
          </button>
        </span>
      </>
    );
  }

  // Na gaveta os alvos têm 44px, o tamanho de toque do resto do menu.
  const botao =
    "flex h-11 min-w-11 items-center justify-center rounded-controle px-3 text-[0.9375rem] font-semibold text-tinta-900 hover:bg-rebaixada disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => definirContrasteAlto(!alto)}
        aria-pressed={alto}
        className={`${botao} justify-between gap-3 aria-pressed:bg-rebaixada`}
      >
        <span className="flex items-center gap-3">
          <Icone nome="contraste" tamanho={18} />
          Alto contraste
        </span>
        <span className="text-[0.8125rem] font-medium text-tinta-600">
          {alto ? "Ligado" : "Desligado"}
        </span>
      </button>

      <div className="flex items-center justify-between pl-3">
        <span className="text-[0.8125rem] font-medium text-tinta-600">Tamanho da fonte</span>
        <span role="group" aria-label="Tamanho da fonte" className="flex">
          <button
            type="button"
            onClick={() => definirFonte(fonte - 1)}
            disabled={noMinimo}
            aria-label="Diminuir fonte"
            className={botao}
          >
            A{MENOS}
          </button>
          <button
            type="button"
            onClick={() => definirFonte(fonte + 1)}
            disabled={noMaximo}
            aria-label="Aumentar fonte"
            className={botao}
          >
            A+
          </button>
        </span>
      </div>
    </div>
  );
}
