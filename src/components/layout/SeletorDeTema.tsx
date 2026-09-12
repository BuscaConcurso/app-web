"use client";

import { useSyncExternalStore } from "react";
import {
  assinarTema,
  definirTema,
  temaAtual,
  temaNoServidor,
  type Tema,
} from "@/lib/tema";

/**
 * O seletor de tema.
 *
 * Controle segmentado de três posições, e não um interruptor de duas: um
 * interruptor obriga a escolher entre claro e escuro, e a maioria das pessoas
 * quer mesmo é que o site siga o aparelho. "Sistema" é o padrão e precisa ser
 * uma opção visível para dar como voltar depois de experimentar as outras.
 *
 * O estado vem do atributo `data-tema` do `html`, lido com
 * `useSyncExternalStore`: no servidor o instantâneo é "sistema" e no cliente é
 * o que o script do `head` já escreveu, sem divergência de hidratação.
 */
const OPCOES: { tema: Tema; rotulo: string; caminho: React.ReactNode }[] = [
  {
    tema: "claro",
    rotulo: "Tema claro",
    caminho: (
      <>
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1.4v1.7M8 12.9v1.7M1.4 8h1.7M12.9 8h1.7M3.3 3.3l1.2 1.2M11.5 11.5l1.2 1.2M12.7 3.3l-1.2 1.2M4.5 11.5l-1.2 1.2" />
      </>
    ),
  },
  {
    tema: "escuro",
    rotulo: "Tema escuro",
    caminho: <path d="M13.4 9.6A5.9 5.9 0 0 1 6.4 2.6a5.9 5.9 0 1 0 7 7Z" />,
  },
  {
    tema: "sistema",
    rotulo: "Seguir o sistema",
    caminho: (
      <>
        <rect x="1.9" y="2.6" width="12.2" height="8.4" rx="1.6" />
        <path d="M5.7 13.4h4.6" />
      </>
    ),
  },
];

export function SeletorDeTema({ className }: { className?: string }) {
  const atual = useSyncExternalStore(assinarTema, temaAtual, temaNoServidor);

  return (
    <div
      role="group"
      aria-label="Tema"
      className={`inline-flex items-center gap-0.5 rounded-full bg-rebaixada p-0.5 ${
        className ?? ""
      }`}
    >
      {OPCOES.map((opcao) => {
        const ativo = opcao.tema === atual;
        return (
          <button
            key={opcao.tema}
            type="button"
            onClick={() => definirTema(opcao.tema)}
            aria-pressed={ativo}
            title={opcao.rotulo}
            className={`flex size-7 items-center justify-center rounded-full transition-colors ${
              ativo
                ? "bg-cartao text-tinta-900"
                : "text-tinta-500 hover:text-tinta-800"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              {opcao.caminho}
            </svg>
            <span className="sr-only">{opcao.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
