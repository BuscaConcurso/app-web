import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icone, type NomeDoIcone } from "./Icone";

/**
 * Botão.
 *
 * Cinco variantes: o `primario` (verde de ação), o `chamada` (o amarelo, a
 * chamada única da tela: se houver duas numa página, nenhuma das duas chama),
 * o `secundario` (o cinza rebaixado), o `contorno` (sem fundo, só o traço) e o
 * `fantasma` (sem fundo nem traço). Nada de sombra.
 *
 * Quatro tamanhos, as alturas do protótipo: 42, 44, 52 e 56px. O raio é o
 * `rounded-controle` de sempre (11px), exceto no `xl`, que usa 12px, igual ao
 * botão de busca do herói (`Main.dc.html:69`).
 */
export type VarianteDoBotao =
  | "primario"
  | "chamada"
  | "secundario"
  | "contorno"
  | "fantasma";

export type TamanhoDoBotao = "sm" | "md" | "lg" | "xl";

const VARIANTE: Record<VarianteDoBotao, string> = {
  primario: "bg-acao text-acao-texto hover:bg-acao-hover font-semibold",
  chamada: "bg-ouro text-ouro-texto hover:bg-ouro-hover font-bold",
  secundario: "bg-rebaixada text-tinta-900 hover:bg-linha font-semibold",
  contorno:
    "text-tinta-900 shadow-[inset_0_0_0_1px_var(--color-contorno)] hover:bg-rebaixada font-semibold",
  fantasma: "text-tinta-900 hover:bg-rebaixada font-semibold",
};

const TAMANHO: Record<TamanhoDoBotao, string> = {
  sm: "h-[42px] rounded-controle px-4 text-sm",
  md: "h-11 rounded-controle px-[18px] text-[15px]",
  lg: "h-[52px] rounded-controle px-[22px] text-base",
  xl: "h-14 rounded-[12px] px-[26px] text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 " +
  "transition-colors select-none disabled:cursor-not-allowed disabled:shadow-none " +
  "disabled:bg-rebaixada disabled:text-tinta-500 disabled:hover:bg-rebaixada";

function classes(
  variante: VarianteDoBotao,
  tamanho: TamanhoDoBotao,
  extra?: string,
) {
  return [BASE, TAMANHO[tamanho], VARIANTE[variante], extra]
    .filter(Boolean)
    .join(" ");
}

type Comuns = {
  variante?: VarianteDoBotao;
  tamanho?: TamanhoDoBotao;
  /** Ícone de 18px antes do texto. */
  icone?: NomeDoIcone;
  /** Ícone de 18px depois do texto, para "ver mais" e afins. */
  iconeDepois?: NomeDoIcone;
  children: ReactNode;
  className?: string;
};

function ConteudoDoBotao({
  icone,
  iconeDepois,
  children,
}: Pick<Comuns, "icone" | "iconeDepois" | "children">) {
  return (
    <>
      {icone && <Icone nome={icone} tamanho={18} />}
      {children}
      {iconeDepois && <Icone nome={iconeDepois} tamanho={18} />}
    </>
  );
}

export function Botao({
  variante = "primario",
  tamanho = "md",
  icone,
  iconeDepois,
  className,
  children,
  ...resto
}: Comuns & Omit<ComponentProps<"button">, "className" | "children">) {
  return (
    <button className={classes(variante, tamanho, className)} {...resto}>
      <ConteudoDoBotao icone={icone} iconeDepois={iconeDepois}>
        {children}
      </ConteudoDoBotao>
    </button>
  );
}

export function BotaoLink({
  variante = "primario",
  tamanho = "md",
  icone,
  iconeDepois,
  className,
  children,
  ...resto
}: Comuns & Omit<ComponentProps<typeof Link>, "className" | "children">) {
  return (
    <Link className={classes(variante, tamanho, className)} {...resto}>
      <ConteudoDoBotao icone={icone} iconeDepois={iconeDepois}>
        {children}
      </ConteudoDoBotao>
    </Link>
  );
}
