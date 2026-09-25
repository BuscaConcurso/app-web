import { Fragment } from "react";
import Link from "next/link";
import { DadosEstruturados } from "./DadosEstruturados";
import { Icone } from "./Icone";
import { trilhaEstruturada, type Degrau } from "@/lib/trilha";

export type { Degrau };

/**
 * A trilha de navegação: o que a pessoa vê e o que o buscador lê, da mesma
 * lista.
 *
 * **É a lição de um defeito que já aconteceu.** A trilha vivia escrita à mão
 * em cada página que tinha uma (duas) e, dentro de cada uma delas, o
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
 * defensável de trilha, mas não é a escolha aqui, e antes deste componente a
 * página do concurso simplesmente não tinha o degrau escrito, o que é outra
 * coisa.
 *
 * **A forma é a de `Concurso.dc.html:57-61`**: 60px de altura, 14px, os
 * degraus em `link` sem sublinhado, o separador um chevron de 14px e o
 * degrau corrente em `tinta-900`.
 *
 * **`flex-wrap` com `min-w-0`, e corte em cada degrau.** O título mais longo
 * do acervo tem 208 caracteres e o nome de órgão mais longo, 169: sem o corte
 * em `40ch` um degrau desses empilharia linhas ou esticaria a página a 360px.
 */
export function Trilha({ degraus }: { degraus: Degrau[] }) {
  if (degraus.length === 0) return null;

  return (
    <>
      <DadosEstruturados dados={trilhaEstruturada(degraus)} />

      <nav
        aria-label="Trilha"
        className="flex min-h-[60px] min-w-0 flex-wrap items-center gap-x-2 gap-y-1 py-2 text-[14px] text-tinta-600"
      >
        {degraus.map((degrau, indice) => {
          const corrente = indice === degraus.length - 1;
          const corte = "max-w-[40ch] min-w-0 truncate";

          return (
            // `Fragment` e não uma caixa por degrau: o separador e o degrau
            // precisam ser itens de flex irmãos, senão o `flex-wrap` quebra
            // por par em vez de quebrar entre eles.
            <Fragment key={degrau.href}>
              {indice > 0 && (
                <Icone nome="voltar" tamanho={14} className="shrink-0 rotate-180 text-tinta-500" />
              )}
              {corrente ? (
                <span aria-current="page" className={`${corte} text-tinta-900`}>
                  {degrau.nome}
                </span>
              ) : (
                <Link href={degrau.href} className={`${corte} text-link hover:text-link-hover`}>
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
