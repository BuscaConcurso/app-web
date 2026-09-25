"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export interface ItemDeAba {
  id: string;
  rotulo: ReactNode;
  /** Com endereço, a aba é um link de verdade e a página muda. */
  href?: string;
  ativo: boolean;
}

/**
 * O trilho de abas: `docs/prototipo/Main.dc.html:195-200`. O fundo rebaixado
 * é o trilho, e a aba ativa se destaca com o cartão branco por cima.
 *
 * Com `href` em cada item, são âncoras de verdade e `aria-current="page"`
 * marca a ativa: um filtro que muda o endereço precisa ser seguível, e é o
 * que a escolaridade da home faz. Sem `href`, os itens viram `role="tab"` e
 * quem troca a seleção é o chamador (`AbasDoConcurso` liga o clique a um
 * estado).
 *
 * Todo `role="tab"` precisa de um `role="tablist"` no ancestral, então o
 * trilho vira `tablist` sempre que existe pelo menos um item sem `href`,
 * mesmo numa lista mista com links ao lado.
 */
export function Abas({
  rotulo,
  itens,
  tamanho = "md",
}: {
  rotulo: string;
  itens: ItemDeAba[];
  tamanho?: "md" | "sm";
}) {
  const altura = tamanho === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-3.5 text-sm";
  const comAba = itens.some((item) => !item.href);

  return (
    <div
      role={comAba ? "tablist" : undefined}
      aria-label={rotulo}
      className="inline-flex items-center gap-1 rounded-[12px] bg-rebaixada p-1"
    >
      {itens.map((item) => {
        const classe = [
          "flex items-center justify-center gap-1.5 rounded-[9px] transition-colors",
          altura,
          item.ativo
            ? "bg-cartao font-semibold text-tinta-900 shadow-aba"
            : "font-medium text-tinta-600 hover:text-tinta-900",
        ].join(" ");

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={item.ativo ? "page" : undefined}
              className={classe}
            >
              {item.rotulo}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.ativo}
            className={classe}
          >
            {item.rotulo}
          </button>
        );
      })}
    </div>
  );
}
