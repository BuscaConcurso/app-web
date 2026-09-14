import { Fragment } from "react";
import Link from "next/link";
import { DadosEstruturados } from "./DadosEstruturados";
import { trilhaEstruturada, type Degrau } from "@/lib/trilha";

export type { Degrau };

/**
 * A trilha de navegação: o que a pessoa vê e o que o buscador lê, da mesma
 * lista.
 *
 * **É a lição de um defeito que já aconteceu.** A trilha vivia escrita à mão
 * em cada página que tinha uma — duas — e, dentro de cada uma delas, o
 * `BreadcrumbList` estruturado era uma segunda lista escrita à mão logo
 * acima. Quando o órgão ganhou endereço próprio e virou degrau, a lista
 * estruturada da página do concurso passou a declarar três degraus e a tela
 * continuou desenhando dois: o robô e a pessoa recebiam hierarquias
 * diferentes do mesmo lugar (`d5d33a4`). O `BreadcrumbList` existe exatamente
 * para dizer ao buscador o que a tela diz, então uma trilha que pode divergir
 * da sua própria marcação não tem como estar certa por muito tempo.
 *
 * Aqui há **uma lista só**, o `degraus`, e as duas saídas vêm dela. Não há
 * onde escrever um degrau para uma das duas.
 *
 * A regra do parceiro humano sobre o revelador vale igual e foi dita como
 * "sempre": componente compartilhado mora em `components/ui/`, não no lugar
 * de uso. Uma terceira página com trilha herda tudo o que está medido aqui em
 * vez de repetir a medição.
 *
 * ## O que o componente decide, e por quê
 *
 * **O último degrau não é link.** É onde a pessoa já está; `aria-current`
 * diz isso a quem navega por leitor de tela, e o degrau continua sendo um
 * degrau na tela e no dado estruturado. Omitir o item corrente é escolha
 * defensável de trilha, mas não é a escolha aqui — e antes deste componente a
 * página do concurso simplesmente não tinha o degrau escrito, o que é outra
 * coisa.
 *
 * **`flex-wrap` com `min-w-0`, e corte em cada degrau.** Medido a 375px
 * contra o acervo de 2026-09-14: o título mais longo tem 208 caracteres e o
 * nome de órgão mais longo, 169. A trilha da página do órgão era um bloco de
 * texto simples e, medida, nenhum dos 466 órgãos a fazia empurrar a página —
 * texto em bloco quebra sozinho no espaço, e o maior pedaço sem espaço do
 * acervo tem 27 caracteres. O que ela fazia era crescer: seis órgãos davam
 * uma trilha de três ou quatro linhas de 12px, uma delas com 72px de altura
 * antes do `h1`. O corte em `40ch` resolve os dois casos com a mesma regra —
 * em flex, onde um item que não encolhe estica a página; e em bloco, onde ele
 * empilha linhas.
 *
 * **O separador tem 2px de cada lado, e é padding e não espaço de texto.**
 * É pedido do parceiro humano. O separador era `<span> / </span>`, com os
 * espaços literais valendo a largura do espaço da fonte — 3,03px no Archivo a
 * 12px, medido, e outro valor a cada corpo ou família. A escala de espaço
 * deste projeto tem `--spacing: 0.22rem`, então `px-0.5` dá 1,76px e `px-1`
 * dá 3,52px: **nenhum degrau da escala cai em 2px**. Como o pedido é um
 * número medido na tela e não uma proporção da escala, vai valor arbitrário,
 * que é a única forma de o elemento renderizado medir exatamente 2px dos dois
 * lados. Fica registrado que ele sai da escala de propósito.
 */
export function Trilha({ degraus }: { degraus: Degrau[] }) {
  if (degraus.length === 0) return null;

  return (
    <>
      <DadosEstruturados dados={trilhaEstruturada(degraus)} />

      <nav
        aria-label="Trilha"
        className="mb-5 flex min-w-0 flex-wrap items-baseline text-[12px] text-tinta-600"
      >
        {degraus.map((degrau, indice) => {
          const corrente = indice === degraus.length - 1;
          // `inline-block` + `align-bottom`: `truncate` precisa de uma caixa
          // com largura para cortar, e a linha de base de uma caixa cortada
          // desalinharia do separador sem o `align-bottom`.
          const corte = "inline-block max-w-[40ch] truncate align-bottom";

          return (
            // `Fragment` e não uma caixa por degrau: o separador e o degrau
            // precisam ser itens de flex irmãos, senão o `flex-wrap` quebra
            // por par em vez de quebrar entre eles.
            <Fragment key={degrau.href}>
              {indice > 0 && (
                <span aria-hidden="true" className="px-[2px]">
                  /
                </span>
              )}
              {corrente ? (
                <span aria-current="page" className={`${corte} text-tinta-900`}>
                  {degrau.nome}
                </span>
              ) : (
                <Link
                  href={degrau.href}
                  className={`${corte} underline underline-offset-4 hover:text-tinta-900`}
                >
                  {degrau.nome}
                </Link>
              )}
            </Fragment>
          );
        })}
      </nav>
    </>
  );
}
