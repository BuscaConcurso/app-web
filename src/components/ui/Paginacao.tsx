import { LinkDaConsulta } from "@/components/busca/LinkDaConsulta";

/**
 * Paginação.
 *
 * Quadrados de 34px, âncoras de verdade. Um buscador precisa poder seguir
 * cada página, e um botão com JavaScript não é seguível.
 *
 * A janela mostra primeira, última e as vizinhas da atual, com reticências
 * no meio. Trinta e duas páginas viradas em número seria uma linha ilegível.
 */
function janela(pagina: number, paginas: number): (number | "…")[] {
  if (paginas <= 7) {
    return Array.from({ length: paginas }, (_, i) => i + 1);
  }
  const perto = [pagina - 1, pagina, pagina + 1].filter(
    (n) => n > 1 && n < paginas,
  );
  const itens: (number | "…")[] = [1];
  if (perto[0] > 2) itens.push("…");
  itens.push(...perto);
  if (perto[perto.length - 1] < paginas - 1) itens.push("…");
  itens.push(paginas);
  return itens;
}

const QUADRADO =
  "flex size-[30px] items-center justify-center rounded-controle text-[12px] font-semibold";

export function Paginacao({
  pagina,
  paginas,
  hrefDe,
}: {
  pagina: number;
  paginas: number;
  hrefDe: (pagina: number) => string;
}) {
  if (paginas <= 1) return null;

  return (
    <nav aria-label="Paginação" className="flex items-center gap-1.5">
      {pagina > 1 ? (
        <LinkDaConsulta
          rolarAoTopo
          href={hrefDe(pagina - 1)}
          rel="prev"
          aria-label="Página anterior"
          className={`${QUADRADO} bg-rebaixada text-tinta-900 hover:bg-linha`}
        >
          ‹
        </LinkDaConsulta>
      ) : (
        <span
          aria-hidden="true"
          className={`${QUADRADO} bg-rebaixada text-linha`}
        >
          ‹
        </span>
      )}

      {janela(pagina, paginas).map((item, indice) =>
        item === "…" ? (
          <span
            key={`reticencias-${indice}`}
            className={`${QUADRADO} text-tinta-500`}
          >
            …
          </span>
        ) : item === pagina ? (
          <span
            key={item}
            aria-current="page"
            className={`${QUADRADO} bg-acao text-acao-texto`}
          >
            {item}
          </span>
        ) : (
          <LinkDaConsulta
            rolarAoTopo
            key={item}
            href={hrefDe(item)}
            className={`${QUADRADO} bg-rebaixada text-tinta-900 hover:bg-linha`}
          >
            {item}
          </LinkDaConsulta>
        ),
      )}

      {pagina < paginas ? (
        <LinkDaConsulta
          rolarAoTopo
          href={hrefDe(pagina + 1)}
          rel="next"
          aria-label="Próxima página"
          className={`${QUADRADO} bg-rebaixada text-tinta-900 hover:bg-linha`}
        >
          ›
        </LinkDaConsulta>
      ) : (
        <span
          aria-hidden="true"
          className={`${QUADRADO} bg-rebaixada text-linha`}
        >
          ›
        </span>
      )}
    </nav>
  );
}
