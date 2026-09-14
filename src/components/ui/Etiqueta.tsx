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
        // `max-w-full` é o que impede uma etiqueta sozinha de esticar a
        // página. Medido a 375px, onde a fileira tem 319px úteis: 2 dos 15
        // nomes de banca do acervo passam disso sozinhos (366px e 325px, com
        // `whitespace-nowrap`), e os 2 cartões correspondentes davam scroll
        // horizontal na busca. Uma fileira `flex-wrap` quebra em linhas, mas
        // não quebra um item que se recusa a encolher.
        "max-w-full text-xs font-semibold whitespace-nowrap",
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
      {/*
        O texto num filho próprio, com `min-w-0`: `truncate` sozinho não
        encolhe item de flex, porque `min-width` de item de flex é `auto` e
        vale o min-content. É exatamente a armadilha que já quebrou o mobile
        deste projeto uma vez — e a razão de o corte ficar aqui dentro, e não
        na fileira.
      */}
      <span className="min-w-0 truncate">{children}</span>
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
