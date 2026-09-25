import type { ReactNode } from "react";
import Link from "next/link";
import { Cartao } from "./Cartao";
import { Rotulo } from "./Etiqueta";
import { Icone, type NomeDoIcone } from "./Icone";
import type { Tom } from "@/lib/dominio";

/**
 * O cabeçalho de seção do desenho novo (`Main.dc.html:128-131`): um rótulo
 * pequeno e colorido em cima (opcional, com ícone), o título grande de
 * verdade embaixo, e um link "Ver todos" à direita quando a seção tem uma
 * página própria.
 *
 * **`titulo` deixou de ser o rótulo.** Na versão antiga, sem título grande,
 * `titulo` era desenhado como o próprio rótulo em caixa alta (`Rotulo
 * as="h2"`). Agora ele é sempre o `<h2>` de 40px; quem quer o rótulo por
 * cima escreve em `rotulo`. Todo chamador atual só passava `titulo`/`apoio`,
 * então continua compilando, só ganha o título maior.
 *
 * `tom` segue opcional e vale para duas coisas: a cor do `rotulo` (o "sinal")
 * e o `tom` repassado ao `Cartao` de baixo, que hoje não muda o fundo dele
 * (ver `Cartao.tsx`) mas continua aceito para quem já passa.
 */
export function Secao({
  rotulo,
  icone,
  tom,
  titulo,
  apoio,
  href,
  hrefRotulo,
  children,
  className,
}: {
  /** O rótulo pequeno acima do título, como "POR ÁREA" ou "ÚLTIMA CHAMADA". */
  rotulo?: ReactNode;
  /** Ícone de 16px ao lado do rótulo. Sem `rotulo`, não aparece. */
  icone?: NomeDoIcone;
  tom?: Tom;
  titulo: ReactNode;
  /** A linha que explica a seção, quando existe. Sai junto com o título. */
  apoio?: ReactNode;
  /** Com endereço, aparece o link "Ver todos" à direita do cabeçalho. */
  href?: string;
  /** O texto do link. Padrão "Ver todos". */
  hrefRotulo?: string;
  children: ReactNode;
  /** O recheio do cartão, quando ele não é o de seção. */
  className?: string;
}) {
  return (
    <section>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {rotulo && (
            <Rotulo icone={icone} tom={tom} className="mb-2.5">
              {rotulo}
            </Rotulo>
          )}
          <h2 className="font-titulo text-[40px] leading-[1.05] font-bold tracking-[-0.03em] break-words">
            {titulo}
          </h2>
          {apoio && (
            <p className="mt-2 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
              {apoio}
            </p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-tinta-900 hover:text-verde-texto"
          >
            {hrefRotulo ?? "Ver todos"}
            <Icone nome="seta" tamanho={17} />
          </Link>
        )}
      </header>
      <Cartao tom={tom} className={className ?? "p-6 sm:p-8"}>
        {children}
      </Cartao>
    </section>
  );
}
