import type { ComponentProps, ReactNode } from "react";

/**
 * Campo de texto e seleção.
 *
 * Sem borda de verdade: o campo é branco (`bg-cartao`, como o resto do
 * desenho novo) com um traço de 1px por dentro (`shadow-[inset...]`, a cor
 * `contorno`), e não uma borda de caixa que mudaria a largura do conteúdo. No
 * foco ganha o anel verde, que é o que substitui o traço para quem navega por
 * teclado. No erro, o fundo salmão carrega o aviso e o anel vermelho
 * confirma.
 */
const CONTROLE =
  "h-11 w-full rounded-controle px-3 text-sm text-tinta-900 " +
  "placeholder:text-tinta-500 outline-none transition-colors " +
  "focus:ring-2 focus:ring-acao";

function Envelope({
  etiqueta,
  para,
  erro,
  children,
}: {
  etiqueta?: string;
  para: string;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {etiqueta && (
        <label
          htmlFor={para}
          className={`text-xs font-semibold ${
            erro ? "text-urucum-texto" : "text-tinta-900"
          }`}
        >
          {etiqueta}
        </label>
      )}
      {children}
      {erro && (
        <p id={`${para}-erro`} className="text-xs text-urucum-texto">
          {erro}
        </p>
      )}
    </div>
  );
}

export function Campo({
  etiqueta,
  erro,
  id,
  className,
  ...resto
}: {
  etiqueta?: string;
  erro?: string;
  id: string;
} & Omit<ComponentProps<"input">, "id">) {
  return (
    <Envelope etiqueta={etiqueta} para={id} erro={erro}>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={[
          CONTROLE,
          erro
            ? "bg-urucum-fundo shadow-[inset_0_0_0_1px_var(--color-urucum)]"
            : "bg-cartao shadow-[inset_0_0_0_1px_var(--color-contorno)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...resto}
      />
    </Envelope>
  );
}

export interface Opcao {
  valor: string;
  rotulo: string;
}

export function Selecao({
  etiqueta,
  erro,
  id,
  opcoes,
  placeholder,
  className,
  ...resto
}: {
  etiqueta?: string;
  erro?: string;
  id: string;
  opcoes: Opcao[];
  placeholder?: string;
} & Omit<ComponentProps<"select">, "id" | "children">) {
  return (
    <Envelope etiqueta={etiqueta} para={id} erro={erro}>
      <div className="relative w-full">
        <select
          id={id}
          aria-invalid={erro ? true : undefined}
          className={[
            CONTROLE,
            "cursor-pointer appearance-none pr-9",
            erro
              ? "bg-urucum-fundo shadow-[inset_0_0_0_1px_var(--color-urucum)]"
              : "bg-cartao shadow-[inset_0_0_0_1px_var(--color-contorno)]",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...resto}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tinta-600"
        >
          <path
            d="M4 6.5 8 10.5l4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Envelope>
  );
}
