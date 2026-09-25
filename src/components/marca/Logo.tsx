/**
 * A marca.
 *
 * O símbolo é uma lente sobre um edital: as três linhas são o documento, o
 * círculo e o cabo são a busca. Abaixo de 24px as linhas somem, porque nesse
 * tamanho elas viram uma mancha em vez de um documento.
 *
 * Esse corte é para o símbolo isolado, em favicon e ícone de app. No
 * logotipo horizontal ele não deveria ser alcançado nunca: o canvas desenha
 * a marca com símbolo de 26 e palavra de 17, e o mínimo é 120px de largura.
 * Encolher a marca junto com o resto da interface faz as linhas caírem sem
 * ninguém pedir, que foi exatamente o que aconteceu uma vez.
 *
 * O canvas proíbe sombra, contorno, gradiente e inclinação.
 */

export type TomDaMarca = "cor" | "claro" | "mono";
export type VarianteDaMarca = "horizontal" | "empilhado" | "simbolo";

const PALETA: Record<
  TomDaMarca,
  { lente: string; documento: string; palavra: string; destaque: string }
> = {
  // No claro é lente verde e documento em tinta; no escuro os mesmos tokens
  // valem a variante "sobre fundo" do canvas, com lente branca e linhas
  // amarelas. Um tom só, dois desenhos, sem o componente saber do tema.
  // Correção mínima da Task 2 (fundo do achado de review): os tokens
  // `marca-*` e `amarelo`/`verde-300` do canvas antigo saíram de
  // `globals.css` e este componente ficava lendo variável indefinida. A
  // Task 4 reescreve o `Logo` de vez; aqui só troca pelo token que já
  // existe com o papel mais parecido.
  cor: {
    lente: "var(--color-acao)",
    documento: "var(--color-tinta-900)",
    palavra: "var(--color-tinta-900)",
    destaque: "var(--color-acao)",
  },
  claro: {
    lente: "#ffffff",
    documento: "var(--color-ouro)",
    palavra: "#ffffff",
    destaque: "var(--color-verde-texto)",
  },
  mono: {
    lente: "currentColor",
    documento: "currentColor",
    palavra: "currentColor",
    destaque: "currentColor",
  },
};

function Simbolo({
  tamanho,
  tom,
}: {
  tamanho: number;
  tom: TomDaMarca;
}) {
  const cores = PALETA[tom];
  const compacto = tamanho < 24;
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle
        cx="14"
        cy="14"
        r="10.4"
        stroke={cores.lente}
        strokeWidth={compacto ? 3 : 2.6}
      />
      {!compacto && (
        <path
          d="M9 10.6h10M9 14h9M9 17.4h6.4"
          stroke={cores.documento}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      <path
        d="M21.9 21.9 28.2 28.2"
        stroke={cores.lente}
        strokeWidth={compacto ? 3.6 : 3.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  variante = "horizontal",
  tom = "cor",
  tamanho = 26,
  className,
}: {
  variante?: VarianteDaMarca;
  tom?: TomDaMarca;
  /** Lado do símbolo em pixels. O texto acompanha. */
  tamanho?: number;
  className?: string;
}) {
  const cores = PALETA[tom];

  if (variante === "simbolo") {
    return (
      <span className={className}>
        <Simbolo tamanho={tamanho} tom={tom} />
        <span className="sr-only">BuscaConcurso</span>
      </span>
    );
  }

  const palavra = (
    <span
      style={{
        fontSize: Math.round(tamanho * 0.65),
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
      className="font-semibold whitespace-nowrap"
    >
      <span style={{ color: cores.palavra }}>Busca</span>
      <span style={{ color: cores.destaque }}>Concurso</span>
    </span>
  );

  if (variante === "empilhado") {
    return (
      <span
        className={`inline-flex flex-col items-center gap-1.5 ${className ?? ""}`}
      >
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
