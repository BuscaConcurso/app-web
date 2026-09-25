import type { ReactNode } from "react";
import { ESTILO_DO_TOM } from "@/lib/situacao";
import type { Tom } from "@/lib/dominio";

/**
 * Cartão.
 *
 * No desenho novo o cartão é sempre branco: o degrau entre ele e a página
 * é a sombra fina de `shadow-cartao` (`Main.dc.html`, os cartões de
 * "Encerram esta semana" e da lista de abertos são `#FFFFFF` mesmo nos que
 * fecham hoje). O sinal de situação passou para a folhinha do `Calendario` e
 * para a `Etiqueta`, não para o fundo do cartão inteiro.
 *
 * `tom` continua aceito, sem efeito aqui, só para quem ainda o passa
 * (o cartão do concurso decide o que fazer com ele).
 */
export function Cartao({
  children,
  className,
  as: Tag = "div",
}: {
  tom?: "neutro" | Tom;
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "section" | "header";
}) {
  return (
    <Tag
      className={["bg-cartao rounded-cartao shadow-cartao", className ?? "p-4"].join(
        " ",
      )}
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
 * fundo: a lista parecia levantada em vez de rebaixada. Cada tom rebaixa com
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
 * de um travessão".
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
 *    49,26px a cada cartão sem sigla: um em cada três.
 * 2. **Nada é afirmado.** Iniciais tiradas do nome inventariam uma sigla que
 *    ninguém publicou. O nome do órgão está do lado, por extenso, e a linha
 *    de contexto logo abaixo diz a esfera e o estado.
 *
 * O que se perde em relação ao travessão que esteve aqui por algumas horas: o
 * travessão dizia "não há valor" na convenção de tabela, e o quadrado liso
 * não diz nada, a ausência passa a ser lida pelo que falta, não por um
 * símbolo. É a troca que o parceiro humano escolheu, vendo as duas.
 *
 * **O tom.** Sem `tom`, o selo é o anil do desenho novo (`bg-anil-fundo
 * text-anil-texto`), que é o quadrado de marca do órgão fora de qualquer
 * cartão colorido por situação. Com `tom`, ele volta ao esquema antigo, de
 * quando o quadrado morava dentro de um cartão urgente/previsto/encerrado e
 * precisava combinar com o fundo dele.
 *
 * **O tamanho** agora é o lado em pixels (padrão 44, como no cartão de
 * "Encerram esta semana"), não mais "sm"/"md": um número aceita qualquer
 * caixa que um cartão futuro peça, sem um nome novo por tamanho. `"sm"` e
 * `"md"` continuam aceitos, por quem ainda os usa.
 */
export function Selo({
  sigla,
  tom,
  tamanho = 44,
}: {
  sigla: string | null;
  tom?: Tom;
  tamanho?: number | "sm" | "md";
}) {
  // A API manda `null` nos 1.615 sem sigla, mas quem preenche é outro
  // processo: string vazia ou só espaço chegaria como sigla e desenharia de
  // novo o quadrado vazio que este componente acabou de parar de desenhar.
  const letras = sigla?.trim() ?? "";

  const lado =
    typeof tamanho === "number" ? tamanho : tamanho === "sm" ? 40 : 44;
  // O selo grande do cabeçalho do concurso (`Concurso.dc.html:64`): 72px,
  // raio de 18px e a sigla em Bricolage 17px. Os menores seguem com 12px.
  const grande = lado >= 72;
  const base = `flex shrink-0 items-center justify-center text-center leading-none ${
    grande ? "rounded-[18px]" : "rounded-[12px]"
  }`;

  const fundo = tom
    ? {
        aberto: "bg-rebaixada text-tinta-900",
        urgente: "bg-urgente-chip text-urucum-texto",
        previsto: "bg-previsto-chip text-ouro-sinal-texto",
        encerrado: "bg-encerrado-chip text-tinta-600",
      }[tom]
    : "bg-anil-fundo text-anil-texto";

  if (!letras) {
    // O quadrado sem nada dentro, decisão do parceiro humano: a coluna do
    // selo mede o mesmo com e sem sigla, e o que estava aqui antes era um
    // travessão.
    //
    // Ele não é o quadrado vazio que este componente tinha antes das siglas
    // existirem: aquele era o selo NORMAL desenhando uma sigla que não
    // chegava, indistinguível de um que chegou. Este é a forma do selo sem a
    // afirmação: mesma caixa, mesmo tom, sem conteúdo e sem alt.
    return (
      <span
        aria-hidden="true"
        className={[base, fundo].join(" ")}
        style={{ width: lado, height: lado }}
      />
    );
  }

  // Siglas do acervo vão de 2 a 8 letras. No selo grande, até 6 cabem em
  // 17px (UFRRJ, `Concurso.dc.html:64`) e acima disso caem para 13px. Nos
  // outros, acima de 4 o corpo cai para 9px e
  // quebra em duas linhas (`wrap-anywhere`, porque "UNIPAMPA" não tem hífen
  // nem barra por onde o navegador quebraria sozinho); é o piso que ainda se
  // lê sem estourar a caixa. Até 4, 12px numa caixa de 44px ou mais, 11px
  // numa caixa menor.
  const corpo = grande
    ? letras.length > 6
      ? "font-titulo text-[13px] wrap-anywhere"
      : "font-titulo text-[17px]"
    : letras.length > 4
      ? "text-[9px] wrap-anywhere"
      : lado >= 44
        ? "text-xs"
        : "text-[11px]";

  return (
    <span
      aria-hidden="true"
      className={[base, "px-1 font-bold tracking-tight", corpo, fundo].join(
        " ",
      )}
      style={{ width: lado, height: lado }}
    >
      {letras}
    </span>
  );
}
