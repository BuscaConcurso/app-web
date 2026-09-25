/**
 * A ilustração do banner.
 *
 * Não é um desenho sobre concurso, é o próprio produto ampliado: uma pilha de
 * editais com um cartão de resultado na frente, e a lente da marca por cima
 * dele. As peças são as mesmas da interface, nos mesmos tons, então a
 * ilustração e a lista logo abaixo dela parecem a mesma coisa em duas escalas.
 *
 * Segue as regras do canvas: sem sombra, sem borda, sem gradiente. Tudo é
 * cinza, e a única cor é o verde da marca na lente, mais o ponto de seis
 * pixels da etiqueta de inscrições abertas. As cores saem dos tokens, então
 * mexer no tema move a ilustração junto.
 *
 * É decorativa: quem usa leitor de tela não perde nada ao não vê-la, e o
 * título ao lado já diz o que a página é. Daí o `aria-hidden`.
 */
export function Ilustracao({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 280"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* A pilha: dois editais atrás, levemente girados. */}
      <rect
        x="20"
        y="44"
        width="168"
        height="196"
        rx="10"
        fill="var(--color-rebaixada)"
        transform="rotate(-7 104 142)"
      />
      <rect
        x="30"
        y="36"
        width="168"
        height="200"
        rx="10"
        fill="var(--color-rebaixada)"
        transform="rotate(-3.5 114 136)"
      />

      {/* O cartão da frente, que é o cartão de concurso da lista. */}
      <rect
        x="40"
        y="28"
        width="168"
        height="204"
        rx="10"
        fill="var(--color-cartao)"
      />

      {/* Selo do órgão e o nome. */}
      <rect x="56" y="46" width="30" height="30" rx="7" fill="var(--color-rebaixada)" />
      <rect x="94" y="50" width="80" height="9" rx="4.5" fill="var(--color-linha)" />
      <rect x="94" y="64" width="52" height="7" rx="3.5" fill="var(--color-linha)" />

      {/* Etiqueta de situação, com o ponto de inscrições abertas. */}
      <rect x="56" y="90" width="74" height="17" rx="5" fill="var(--color-rebaixada)" />
      <circle cx="66" cy="98.5" r="3.2" fill="var(--color-verde)" />
      <rect x="74" y="95" width="48" height="7" rx="3.5" fill="var(--color-linha)" />

      {/* O bloco rebaixado dos números: vagas, salário, prazo. */}
      <rect x="56" y="119" width="96" height="44" rx="8" fill="var(--color-rebaixada)" />
      <rect x="66" y="129" width="20" height="5" rx="2.5" fill="var(--color-linha)" />
      <rect x="66" y="140" width="30" height="8" rx="4" fill="var(--color-tinta-500)" />
      <rect x="112" y="129" width="20" height="5" rx="2.5" fill="var(--color-linha)" />
      <rect x="112" y="140" width="26" height="8" rx="4" fill="var(--color-tinta-500)" />

      {/* Corpo do edital. */}
      <rect x="56" y="177" width="112" height="7" rx="3.5" fill="var(--color-linha)" />
      <rect x="56" y="192" width="84" height="7" rx="3.5" fill="var(--color-linha)" />
      <rect x="56" y="207" width="98" height="7" rx="3.5" fill="var(--color-linha)" />

      {/* A lente da marca, ampliada. O miolo é branco para ela ler como uma
          lente por cima da pilha, e não como um anel vazado. */}
      <g transform="translate(150 118) scale(3)">
        <circle
          cx="14"
          cy="14"
          r="10.4"
          fill="var(--color-cartao)"
          stroke="var(--color-acao)"
          strokeWidth="2.6"
        />
        <path
          d="M9 10.6h10M9 14h9M9 17.4h6.4"
          stroke="var(--color-tinta-900)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M21.9 21.9 28.2 28.2"
          stroke="var(--color-acao)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
