import type { ReactNode } from "react";
import { Cartao } from "./Cartao";
import { Rotulo } from "./Etiqueta";
import type { Tom } from "@/lib/dominio";

/**
 * Um bloco com o rótulo do lado de fora.
 *
 * O rótulo morava dentro do cartão, como primeira linha do conteúdo. Enquanto
 * as seções eram parágrafos de um cartão só, isso funcionava: o rótulo era o
 * único sinal de que ali começava outra coisa. Desde que cada seção virou um
 * bloco desenhado, o bloco já diz onde a seção começa, e o rótulo dentro dele
 * passou a competir com o conteúdo em vez de rotulá-lo — dois começos para a
 * mesma coisa.
 *
 * Fora, ele volta a ser o que é: o nome do que vem abaixo.
 *
 * **As distâncias.** São duas, e a diferença entre elas é o que faz o título
 * pertencer ao bloco de baixo em vez de flutuar entre dois. Medido no Chrome
 * a 375px, na página de detalhe, com o acervo real (a unidade de espaço deste
 * projeto é 3,52px, não 4 — ver `--spacing` em `globals.css` —, então o
 * degrau da escala e o pixel medido não são o mesmo número):
 *
 * | de | para | escala | medido |
 * |---|---|---|---|
 * | rótulo | linha de apoio | `mt-1` | 3,5px |
 * | cabeçalho | o bloco que ele rotula | `mb-2` | 7,0px |
 * | bloco | o rótulo do bloco seguinte | `gap-6` | 21,1px |
 *
 * 7 contra 21 é 1 para 3 exato. É o mínimo que resolve a ambiguidade a olho:
 * com os `gap-3` (10,6px) que separavam os blocos antes, o título teria de
 * grudar a 3,5px do cartão para ficar mais perto dele do que do bloco de
 * cima, e 3,5px abaixo de um texto de 10px em caixa alta lê como erro de
 * margem. O vão entre blocos dobrou por causa disso: ele deixou de separar só
 * caixas e passou a separar assuntos.
 *
 * O mesmo 21 contra 7 está nas colunas de `BlocosSeo`, que seguiram o mesmo
 * caminho — e lá o empate chegou a existir: empilhadas no celular com 7px dos
 * dois lados, o rótulo ficava no meio do caminho entre dois cartões.
 *
 * A largura do cabeçalho segue a da página, não a do conteúdo do cartão: o
 * rótulo começa na sangria da coluna e o conteúdo começa 21px adentro, que é
 * o `p-6` do cartão. É o degrau que mostra que um está por fora do outro.
 */
export function Secao({
  titulo,
  apoio,
  tom,
  children,
  className,
}: {
  titulo: ReactNode;
  /** A linha que explica a seção, quando existe. Sai junto com o título. */
  apoio?: ReactNode;
  tom?: Tom;
  children: ReactNode;
  /** O recheio do cartão, quando ele não é o de seção. */
  className?: string;
}) {
  return (
    <section>
      <header className="mb-2">
        <Rotulo as="h2">{titulo}</Rotulo>
        {apoio && (
          <p className="mt-1 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
            {apoio}
          </p>
        )}
      </header>
      <Cartao tom={tom} className={className ?? "p-6 sm:p-8"}>
        {children}
      </Cartao>
    </section>
  );
}
