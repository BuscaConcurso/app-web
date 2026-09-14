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
  as?: "div" | "article" | "li" | "section" | "header";
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
 * o acervo tem 1.946 órgãos e nenhum arquivo de marca para eles.
 *
 * **Sem sigla o quadrado não é desenhado.** Ele existia mesmo vazio, e isso
 * durou semanas sem ninguém ver, porque quadrado colorido sem letra passa por
 * decoração: em 4.648 dos 4.649 cartões a tela pintava 38,72 por 38,72 de cor
 * que não diziam nada. A regra que recuperou a sigla do título mudou a conta —
 * 3.034 cartões têm sigla hoje —, mas 1.615 seguem sem, e nesses o quadrado
 * pintado seria um selo sem selo.
 *
 * No lugar dele fica o mesmo espaço, vazio a não ser por um travessão no tom
 * de apoio do cartão. As três coisas que isso resolve, nesta ordem:
 *
 * 1. **A ausência fica dita.** Espaço em branco ao lado de cartões com selo
 *    lê como imagem que não carregou; o travessão é a convenção de tabela
 *    para "não há valor", e é o mesmo gesto de "a definir" nas casas de
 *    número e de `cargosDoCartao` na linha de cargos — este projeto escreve a
 *    falta, não a esconde.
 * 2. **O alinhamento não se mexe.** A caixa continua `size-10`/`size-11`, e
 *    medido a 375px o título começa no mesmo x (77,42px) com e sem sigla.
 *    Colapsar a caixa puxaria o título para 28,16px e faria a lista dançar
 *    49,26px a cada cartão sem sigla — um em cada três.
 * 3. **Nada é afirmado.** Iniciais tiradas do nome inventariam uma sigla que
 *    ninguém publicou, e o parceiro humano ainda não decidiu coletar marca
 *    nenhuma. O nome do órgão está do lado, por extenso.
 *
 * O fundo pintado pelo tom sai junto com o quadrado, e não faz falta: a
 * situação já está no fundo do cartão inteiro e na etiqueta com ponto.
 */
export function Selo({
  sigla,
  tom = "aberto",
  tamanho = "md",
}: {
  sigla: string | null;
  tom?: Tom;
  tamanho?: "sm" | "md";
}) {
  // A API manda `null` nos 1.615 sem sigla, mas quem preenche é outro
  // processo: string vazia ou só espaço chegaria como sigla e desenharia de
  // novo o quadrado vazio que este componente acabou de parar de desenhar.
  const letras = sigla?.trim() ?? "";

  const lado = tamanho === "sm" ? "size-10" : "size-11";
  const base = "flex shrink-0 items-center justify-center text-center leading-none";

  if (!letras) {
    return (
      <span
        aria-hidden="true"
        className={[
          base,
          lado,
          // O mesmo corpo da sigla curta, para o traço ter o peso óptico da
          // letra que ele substitui, e o mesmo cinza da linha de contexto
          // logo abaixo: a falta pertence à camada de apoio, não à de
          // afirmação.
          tamanho === "sm" ? "text-[10px]" : "text-xs",
          "font-semibold",
          ESTILO_DO_TOM[tom].apoio,
        ].join(" ")}
      >
        {/* Travessão, não hífen: é o traço de "sem valor" e não se confunde
            com o hífen que parte "CRA-RJ" no selo do cartão vizinho. */}
        —
      </span>
    );
  }

  const fundo = {
    aberto: "bg-rebaixada text-tinta-800",
    urgente: "bg-urgente-chip text-vermelho-800",
    previsto: "bg-previsto-chip text-previsto-texto",
    encerrado: "bg-encerrado-chip text-tinta-600",
  }[tom];

  /*
    A escada de corpo, que só passou a rodar hoje: até ontem a sigla chegava
    em 1 dos 4.649 cartões e nenhum degrau abaixo do primeiro tinha sido
    medido. Medidos agora, contra as 118 siglas distintas do acervo (de 2 a 8
    letras) e contra os dois tamanhos de caixa — 31,68px úteis no `md` e
    28,15px no `sm`, já descontado o `px-1`:

    | letras | numa linha precisa de | o que é feito           |
    |---|---|---|
    | 2 e 3 | 11px  | 11px / 10px, uma linha  |
    | 4     | 10px (md), 9px (sm) | 10px / 9px, uma linha |
    | 5     | 8px (md), 7px (sm)  | 9px, duas linhas      |
    | 6     | 7px                 | 9px, duas linhas      |
    | 7     | 6px                 | 9px, duas linhas      |
    | 8     | 5px                 | 9px, duas linhas      |

    A escada antiga ia até 7px e mesmo assim estourava: "UNIPAMPA" no degrau
    de 8px mede 40,33px numa caixa de 31,68px, e sem `overflow` nenhum o
    excesso era pintado por cima do nome do órgão. Daí a troca de critério —
    **duas linhas em vez de corpo ilegível**. Uma sigla partida se lê; uma
    sigla de 5px, não. O piso é 9px, e a quebra é `wrap-anywhere` porque
    "UNIPAMPA" não oferece um lugar por onde quebrar e "CAU/BR" oferece um
    que o navegador não usa sozinho.

    São 707 dos 3.034 cartões com sigla que caem na faixa de duas linhas.
  */
  const corpo =
    letras.length > 4
      ? "text-[9px] wrap-anywhere"
      : letras.length > 3
        ? tamanho === "sm"
          ? "text-[9px]"
          : "text-[10px]"
        : tamanho === "sm"
          ? "text-[10px]"
          : "text-xs";

  return (
    <span
      aria-hidden="true"
      className={[
        base,
        lado,
        "rounded-lg px-1 font-semibold tracking-tight",
        corpo,
        fundo,
      ].join(" ")}
    >
      {letras}
    </span>
  );
}
