import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Botão.
 *
 * Cinco variantes e nada mais. O amarelo é a chamada única da tela: se
 * houver dois numa página, nenhum dos dois chama.
 *
 * Altura de 40px no padrão, 48px na chamada, 32px no compacto, que são os
 * três tamanhos do canvas. Nada de borda e nada de sombra.
 */
export type VarianteDoBotao =
  | "primario"
  | "secundario"
  | "fantasma"
  | "chamada";

export type TamanhoDoBotao = "sm" | "md" | "lg";

const VARIANTE: Record<VarianteDoBotao, string> = {
  primario: "bg-verde-700 text-white hover:bg-verde-600 font-semibold",
  secundario: "bg-rebaixada text-tinta-900 hover:bg-tinta-200 font-medium",
  fantasma: "text-tinta-800 hover:bg-rebaixada font-medium",
  chamada: "bg-amarelo text-tinta-900 hover:bg-amarelo-escuro font-semibold",
};

const TAMANHO: Record<TamanhoDoBotao, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-[18px] text-sm",
  lg: "h-12 px-[22px] text-[15px]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-controle " +
  "transition-colors select-none disabled:cursor-not-allowed " +
  "disabled:bg-tinta-100 disabled:text-tinta-400 disabled:hover:bg-tinta-100";

function classes(
  variante: VarianteDoBotao,
  tamanho: TamanhoDoBotao,
  extra?: string,
) {
  return [BASE, VARIANTE[variante], TAMANHO[tamanho], extra]
    .filter(Boolean)
    .join(" ");
}

type Comuns = {
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
  children: ReactNode;
  className?: string;
};

export function Botao({
  variante = "primario",
  tamanho = "md",
  className,
  children,
  ...resto
}: Comuns & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={classes(variante, tamanho, className)} {...resto}>
      {children}
    </button>
  );
}

export function BotaoLink({
  variante = "primario",
  tamanho = "md",
  className,
  children,
  ...resto
}: Comuns & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link className={classes(variante, tamanho, className)} {...resto}>
      {children}
    </Link>
  );
}
