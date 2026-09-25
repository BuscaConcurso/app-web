/**
 * A marca: uma lupa sobre um azulejo de Athos Bulcão, cujos painéis vestem
 * os prédios públicos de Brasília, o lugar do serviço público. A lupa é a
 * busca; o quarto de círculo em ouro é o sol no canto da peça
 * (`docs/prototipo/Logo.dc.html:18`).
 */

export type TomDaMarca = "cor" | "claro" | "mono";
export type VarianteDaMarca = "horizontal" | "empilhado" | "simbolo";

const CORES_DO_SIMBOLO: Record<TomDaMarca, { fundo: string; lupa: string; ouro: boolean }> = {
  cor: { fundo: "#0B6B3A", lupa: "#FFFFFF", ouro: true },
  claro: { fundo: "#F6F4EE", lupa: "#0A4D2E", ouro: true },
  mono: { fundo: "currentColor", lupa: "var(--color-cartao)", ouro: false },
};

function Simbolo({ tamanho, tom }: { tamanho: number; tom: TomDaMarca }) {
  const cores = CORES_DO_SIMBOLO[tom];
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="40" height="40" rx="10" fill={cores.fundo} />
      {cores.ouro && (
        <path d="M25 0H30A10 10 0 0 1 40 10V15A15 15 0 0 1 25 0Z" fill="#F2C230" />
      )}
      <circle
        cx="17.5"
        cy="19.5"
        r="8"
        fill="none"
        stroke={cores.lupa}
        strokeWidth="3.6"
      />
      <path d="M23.3 25.3 30 32" stroke={cores.lupa} strokeWidth="3.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  variante = "horizontal",
  tom = "cor",
  tamanho = 36,
  className,
}: {
  variante?: VarianteDaMarca;
  tom?: TomDaMarca;
  /** Lado do símbolo em pixels. A palavra acompanha. */
  tamanho?: number;
  className?: string;
}) {
  if (variante === "simbolo") {
    return (
      <span className={className}>
        <Simbolo tamanho={tamanho} tom={tom} />
        <span className="sr-only">BuscaConcurso</span>
      </span>
    );
  }

  const corDaPalavra =
    tom === "mono" ? "text-current" : tom === "claro" ? "text-acao-texto" : "text-tinta-900";
  const corDoDestaque =
    tom === "mono" ? "text-current" : tom === "claro" ? "text-ouro" : "text-verde-texto";
  const escalaDaPalavra = variante === "empilhado" ? 0.38 : 0.58;

  const palavra = (
    <span
      style={{
        fontSize: Math.round(tamanho * escalaDaPalavra),
        lineHeight: 1,
      }}
      className={`font-titulo font-bold tracking-[-0.02em] whitespace-nowrap ${corDaPalavra}`}
    >
      Busca
      <span className={corDoDestaque}>Concurso</span>
    </span>
  );

  if (variante === "empilhado") {
    return (
      <span className={`inline-flex flex-col items-center gap-[18px] ${className ?? ""}`}>
        <Simbolo tamanho={tamanho} tom={tom} />
        {palavra}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Simbolo tamanho={tamanho} tom={tom} />
      {palavra}
    </span>
  );
}
