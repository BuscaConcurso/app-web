import type { ReactNode } from "react";
import { ESTILO_DO_TOM } from "@/lib/situacao";
import type { Tom } from "@/lib/dominio";

/**
 * Cartão.
 *
 * O fundo é o sinal de situação, e é também o que separa o cartão da página:
 * não há borda nem sombra, só o degrau entre o cinza da página e o fundo do
 * cartão.
 */
export function Cartao({
  tom = "aberto",
  children,
  className,
  as: Tag = "div",
}: {
  tom?: Tom;
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "section";
}) {
  return (
    <Tag
      className={[
        "rounded-caixa",
        ESTILO_DO_TOM[tom].cartao,
        className ?? "p-4",
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

/**
 * O bloco rebaixado de dentro do cartão, que agrupa os números para que
 * vagas, salário e prazo leiam como uma tabela e não como frases soltas.
 */
export function BlocoDeNumeros({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={[
        "grid gap-2 rounded-lg bg-bloco px-3 py-2.5",
        className ?? "grid-cols-3",
      ].join(" ")}
    >
      {children}
    </dl>
  );
}

export function Numero({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="mb-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase text-tinta-500">
        {rotulo}
      </dt>
      <dd className="numero text-base font-medium text-tinta-900">{children}</dd>
    </div>
  );
}

/**
 * O quadrado com a sigla do órgão. Faz o papel do logotipo que não temos:
 * o acervo tem mais de mil órgãos e nenhum arquivo de marca para eles.
 */
export function Selo({
  sigla,
  tom = "aberto",
  tamanho = "md",
}: {
  sigla: string;
  tom?: Tom;
  tamanho?: "sm" | "md";
}) {
  const fundo = {
    aberto: "bg-rebaixada text-tinta-800",
    urgente: "bg-urgente-chip text-vermelho-800",
    previsto: "bg-previsto-chip text-previsto-texto",
    encerrado: "bg-encerrado-chip text-tinta-600",
  }[tom];

  // "SEFAZ-CE" tem o dobro das letras de "PF" e precisa caber no mesmo
  // quadrado sem quebrar em duas linhas.
  const corpo =
    sigla.length > 6
      ? "text-[7px]"
      : sigla.length > 4
        ? "text-[8px]"
        : tamanho === "sm"
          ? "text-[10px]"
          : "text-xs";

  return (
    <span
      aria-hidden="true"
      className={[
        "flex shrink-0 items-center justify-center rounded-lg px-1",
        "text-center leading-none font-semibold tracking-tight",
        tamanho === "sm" ? "size-10" : "size-11",
        corpo,
        fundo,
      ].join(" ")}
    >
      {sigla}
    </span>
  );
}
