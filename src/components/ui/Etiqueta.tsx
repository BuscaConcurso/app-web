import type { ReactNode } from "react";
import { ESTILO_DO_TOM } from "@/lib/situacao";
import type { Tom } from "@/lib/dominio";

/**
 * Etiqueta.
 *
 * Duas famílias: a de situação, que leva um ponto colorido de 6px e herda a
 * cor do tom do cartão, e a neutra, que é cinza e serve para escolaridade,
 * banca e qualquer outro metadado. O ponto é o único lugar onde o verde de
 * "inscrições abertas" aparece, justamente para não colorir a linha toda.
 */
export function Etiqueta({
  children,
  tom,
  comPonto = false,
  className,
}: {
  children: ReactNode;
  /** Sem tom, a etiqueta é neutra. */
  tom?: Tom;
  comPonto?: boolean;
  className?: string;
}) {
  const estilo = tom
    ? ESTILO_DO_TOM[tom]
    : { chip: "bg-tinta-100 text-tinta-600", ponto: "bg-tinta-400" };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1",
        "text-xs font-semibold whitespace-nowrap",
        estilo.chip,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {comPonto && (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${estilo.ponto}`}
        />
      )}
      {children}
    </span>
  );
}

/** O rótulo de seção e de filtro: 11px, semibold, caixa alta, bem espaçado. */
export function Rotulo({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={[
        "text-[10px] leading-4 font-semibold tracking-[0.08em] uppercase",
        "text-tinta-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}
