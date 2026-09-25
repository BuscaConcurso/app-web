"use client";

import { useSyncExternalStore } from "react";
import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
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
const OPCOES: {
  tema: Tema;
  icone: NomeDoIcone;
  rotulo: string;
  rotuloCompacto: string;
}[] = [
  { tema: "claro", icone: "sol", rotulo: "Tema claro", rotuloCompacto: "Tema claro" },
  { tema: "escuro", icone: "lua", rotulo: "Tema escuro", rotuloCompacto: "Tema escuro" },
  {
    tema: "sistema",
    icone: "monitor",
    rotulo: "Seguir o sistema",
    rotuloCompacto: "Tema do sistema",
  },
];

/**
 * A versão compacta, para a barra utilitária (`Main.dc.html:27`): três
 * ícones de 15px em `text-utilitaria-texto`, sem pílula cinza (que não lê
 * sobre o fundo escuro da barra) e sem rótulo visível, só `aria-label`.
 */
function SeletorCompacto({ atual, className }: { atual: Tema; className?: string }) {
  return (
    <div
      role="group"
      aria-label="Tema"
      className={`flex items-center ${className ?? ""}`}
    >
      {OPCOES.map((opcao) => {
        const ativo = opcao.tema === atual;
        // O botão é um quadrado de 36px, a altura inteira da barra
        // utilitária (ver o alvo de toque em `BarraUtilitaria.tsx`); o
        // círculo de 28px de dentro é só o desenho.
        return (
          <button
            key={opcao.tema}
            type="button"
            onClick={() => definirTema(opcao.tema)}
            aria-pressed={ativo}
            aria-label={opcao.rotuloCompacto}
            className="group/tema flex size-9 items-center justify-center text-utilitaria-texto"
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full transition-colors ${
                ativo ? "bg-utilitaria-texto/15" : "group-hover/tema:bg-utilitaria-texto/10"
              }`}
            >
              <Icone nome={opcao.icone} tamanho={15} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SeletorDeTema({
  className,
  compacto = false,
}: {
  className?: string;
  compacto?: boolean;
}) {
  const atual = useSyncExternalStore(assinarTema, temaAtual, temaNoServidor);

  if (compacto) return <SeletorCompacto atual={atual} className={className} />;

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
                : "text-tinta-500 hover:text-tinta-900"
            }`}
          >
            <Icone nome={opcao.icone} tamanho={16} />
            <span className="sr-only">{opcao.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
