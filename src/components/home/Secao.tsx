import Link from "next/link";
import type { ReactNode } from "react";

/**
 * O invólucro das faixas da home.
 *
 * Seções se separam por 32, cartões por 12, como manda a escala do canvas.
 * O título é Literata; a linha de apoio e o link são Archivo.
 */
export function Secao({
  titulo,
  apoio,
  href,
  hrefRotulo,
  children,
}: {
  titulo: string;
  apoio?: string;
  href?: string;
  hrefRotulo?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div>
          <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em]">
            {titulo}
          </h2>
          {apoio && <p className="mt-1 text-[12px] text-tinta-600">{apoio}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="text-[12px] font-semibold text-link underline underline-offset-4 hover:text-link-hover"
          >
            {hrefRotulo ?? "Ver todos"}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
