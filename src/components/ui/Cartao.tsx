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
        "rounded-cartao",
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
 *
 * **O rebaixo é do tom do cartão, não cinza fixo.** O `bg-rebaixada` cinza é o
 * rebaixo do cartão BRANCO; dentro do cartão urgente ou do previsto ele é uma
 * mancha de outra família, e no encerrado chegava a ficar mais CLARO que o
 * fundo — a lista parecia levantada em vez de rebaixada. Cada tom rebaixa com
 * o seu próprio `chip`, que é o tom já usado pela etiqueta de situação do
 * mesmo cartão.
 *
 * `tom` é opcional e cai em `aberto`, que devolve o cinza de sempre: quem
 * usa o bloco fora de um cartão colorido (a vitrine, por exemplo) não muda.
 */
export function BlocoDeNumeros({
  children,
  className,
  tom = "aberto",
}: {
  children: ReactNode;
  className?: string;
  tom?: Tom;
}) {
  return (
    <dl
      className={[
        "grid gap-2 rounded-lg px-3 py-2.5",
        ESTILO_DO_TOM[tom].bloco,
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
 * **Sem sigla o selo fica sem conteúdo, e não vira outra coisa.** Decisão do
 * parceiro humano: "quando não houver sigla, exiba square sem sigla ao invés
 * de —".
 *
 * Vale distinguir isto do defeito que este componente tinha até hoje de
 * manhã, porque a forma na tela é parecida e a causa é oposta. Lá, o selo
 * NORMAL desenhava uma sigla que não chegava: em 4.648 dos 4.649 cartões a
 * tela pintava 38,72 por 38,72 de cor sem letra, indistinguível de um selo
 * que funcionou, e isso durou semanas sem ninguém ver porque quadrado
 * colorido sem letra passa por decoração. Aqui é um ramo próprio, que sabe
 * que não há o que dizer.
 *
 * Duas coisas que a forma preserva:
 *
 * 1. **O alinhamento não se mexe.** A caixa continua `size-10`/`size-11`, e
 *    medido a 375px o título começa no mesmo x (77,42px) com e sem sigla.
 *    Colapsar a caixa puxaria o título para 28,16px e faria a lista dançar
 *    49,26px a cada cartão sem sigla — um em cada três.
 * 2. **Nada é afirmado.** Iniciais tiradas do nome inventariam uma sigla que
 *    ninguém publicou. O nome do órgão está do lado, por extenso, e a linha
 *    de contexto logo abaixo diz a esfera e o estado.
 *
 * O que se perde em relação ao travessão que esteve aqui por algumas horas: o
 * travessão dizia "não há valor" na convenção de tabela, e o quadrado liso
 * não diz nada — a ausência passa a ser lida pelo que falta, não por um
 * símbolo. É a troca que o parceiro humano escolheu, vendo as duas.
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

  const fundo = {
    aberto: "bg-rebaixada text-tinta-900",
    urgente: "bg-urgente-chip text-urucum-texto",
    previsto: "bg-previsto-chip text-ouro-sinal-texto",
    encerrado: "bg-encerrado-chip text-tinta-600",
  }[tom];

  if (!letras) {
    // O quadrado sem nada dentro, decisão do parceiro humano: a coluna do
    // selo mede o mesmo com e sem sigla (o `<h3>` começa em 77,42px nos dois
    // grupos), e o que estava aqui antes era um travessão.
    //
    // Ele não é o quadrado vazio que este componente tinha antes das siglas
    // existirem: aquele era o selo NORMAL desenhando uma sigla que não
    // chegava, indistinguível de um que chegou. Este é a forma do selo sem a
    // afirmação — mesma caixa, mesmo tom, sem conteúdo e sem alt.
    return (
      <span
        aria-hidden="true"
        className={[base, lado, "rounded-lg", fundo].join(" ")}
      />
    );
  }


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
