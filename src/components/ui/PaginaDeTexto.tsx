import type { ReactNode } from "react";
import { Trilha } from "./Trilha";

/**
 * O layout de texto longo das páginas institucionais ("Como lemos os
 * editais", "Acessibilidade", "Contato"): trilha, `h1`, a frase de abertura
 * e o corpo numa coluna de até 68 caracteres, que é a largura em que uma
 * linha ainda se lê sem perder o começo da próxima.
 *
 * O corpo é JSX comum (`h2`, `p`, `ul`, `a`) e o estilo vem daqui, pelos
 * seletores de filho: cada página escreve só o texto, e as três ficam com a
 * mesma cara sem repetir classe em cada parágrafo. Tudo em `rem`, então o
 * A+ da barra utilitária aumenta o texto, e a coluna em `ch` cresce junto.
 */
export function PaginaDeTexto({
  titulo,
  href,
  abertura,
  children,
}: {
  titulo: string;
  href: string;
  abertura: string;
  children: ReactNode;
}) {
  return (
    <div className="conteudo pb-8 md:pb-12">
      <Trilha
        degraus={[
          { nome: "Início", href: "/" },
          { nome: titulo, href },
        ]}
      />

      <article className="max-w-[68ch]">
        <h1 className="font-titulo text-[2rem] leading-[1.1] font-bold tracking-[-0.025em] break-words text-balance md:text-[2.5rem] md:leading-[1.05] md:tracking-[-0.03em]">
          {titulo}
        </h1>
        <p className="mt-4 text-[1.1875rem] leading-[1.55] text-tinta-600">{abertura}</p>

        <div
          className={[
            "mt-10 text-[1.0625rem] leading-[1.65] text-tinta-900",
            "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-titulo [&_h2]:text-[1.5rem] [&_h2]:leading-[1.2] [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2:first-child]:mt-0",
            "[&_p]:mt-4 [&_p:first-child]:mt-0",
            "[&_ul]:mt-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6",
            "[&_a]:break-words [&_a]:text-link [&_a]:underline [&_a]:underline-offset-[0.15em] [&_a:hover]:text-link-hover",
            "[&_strong]:font-semibold",
          ].join(" ")}
        >
          {children}
        </div>
      </article>
    </div>
  );
}
