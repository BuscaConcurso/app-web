import type { ComponentProps, ReactNode } from "react";

/**
 * Campo de texto e seleção.
 *
 * Sem borda, como tudo aqui: o campo em repouso é um rebaixo cinza dentro do
 * cartão branco. No foco ele fica branco e ganha um anel, que é o que
 * substitui a borda para quem navega por teclado. No erro, o fundo salmão
 * carrega o aviso e o anel vermelho confirma.
 */
const CONTROLE =
  "h-10 w-full rounded-controle px-3 text-sm text-tinta-900 " +
  "placeholder:text-tinta-500 outline-none transition-colors " +
  "focus:bg-cartao focus:ring-2 focus:ring-verde-700";

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
            erro ? "text-vermelho-800" : "text-tinta-800"
          }`}
        >
          {etiqueta}
        </label>
      )}
      {children}
      {erro && (
        <p id={`${para}-erro`} className="text-xs text-vermelho-800">
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
          erro ? "bg-urgente ring-2 ring-vermelho" : "bg-rebaixada",
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
            erro ? "bg-urgente ring-2 ring-vermelho" : "bg-rebaixada",
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
