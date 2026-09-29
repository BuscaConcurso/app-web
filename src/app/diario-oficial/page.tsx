import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedDoDiario } from "@/components/diario/FeedDoDiario";
import { Paginacao } from "@/components/ui/Paginacao";
import { Trilha, type Degrau } from "@/components/ui/Trilha";
import { feedDoDiario } from "@/lib/concursos";
import { agruparPorDia } from "@/lib/diarioOficial";
import { hojeEmSaoPaulo, numero } from "@/lib/formato";

/**
 * O feed do Diário Oficial da União: todo ato sobre concurso que o motor
 * coletou, do mais recente para o mais antigo, em blocos por dia.
 *
 * Lê `?pagina=`, então rende na requisição, como `/concursos`; o dado vem do
 * `fetch` guardado por cinco minutos em `feedDoDiario`, o mesmo `revalidate`
 * do acervo. Falha da API lança e cai em `error.tsx`, a mesma página de erro
 * das outras rotas do acervo.
 */
const TITULO = "Feed do Diário Oficial";
const DESCRICAO =
  "Todo ato novo sobre concurso publicado no Diário Oficial da União, do mais " +
  "recente para o mais antigo, com o link para o ato e para o concurso.";

/** A mesma leitura de `/orgaos/[slug]`: o que não é página válida vira a 1. */
function paginaPedida(bruto: string | string[] | undefined): number {
  const texto = Array.isArray(bruto) ? bruto[0] : bruto;
  const pagina = Number(texto);
  return Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1;
}

function hrefDe(pagina: number): string {
  return pagina > 1 ? `/diario-oficial?pagina=${pagina}` : "/diario-oficial";
}

export async function generateMetadata(
  props: PageProps<"/diario-oficial">,
): Promise<Metadata> {
  const pagina = paginaPedida((await props.searchParams).pagina);
  return {
    title: pagina > 1 ? `${TITULO}, página ${pagina}` : TITULO,
    description: DESCRICAO,
    alternates: { canonical: hrefDe(pagina) },
  };
}

export default async function PaginaDoDiarioOficial(
  props: PageProps<"/diario-oficial">,
) {
  const pagina = paginaPedida((await props.searchParams).pagina);
  const feed = await feedDoDiario(pagina);
  // Página além do fim não existe: 404, e não uma lista vazia que afirma
  // "o Diário não publicou nada".
  if (feed.itens.length === 0 && pagina > 1) notFound();
  // Data civil de São Paulo, a mesma das outras páginas: é ela que decide se
  // o rótulo do dia leva o ano.
  const dias = agruparPorDia(feed.itens, hojeEmSaoPaulo());
  const trilha: Degrau[] = [
    { nome: "Início", href: "/" },
    { nome: "Diário Oficial", href: "/diario-oficial" },
  ];

  return (
    <div className="conteudo pb-8 md:pb-12">
      <Trilha degraus={trilha} />

      <div className="flex flex-col gap-6">
        <header className="rounded-painel bg-cartao p-5 shadow-cartao md:px-10 md:py-9">
          <h1 className="font-titulo text-[1.75rem] leading-[1.1] font-bold tracking-[-0.025em] md:text-[2.5rem]">
            {TITULO}
          </h1>
          <p className="mt-2 max-w-[40rem] text-[0.9375rem] leading-[1.55] text-tinta-600">
            Todo ato novo sobre concurso no Diário Oficial da União, do mais
            recente para o mais antigo.
          </p>
        </header>

        {dias.length > 0 ? (
          <FeedDoDiario dias={dias} />
        ) : (
          <p className="text-tinta-600">Nenhum ato do Diário foi lido até aqui.</p>
        )}

        {feed.totalDePaginas > 1 && (
          <div className="flex flex-col items-center gap-2">
            <Paginacao pagina={pagina} paginas={feed.totalDePaginas} hrefDe={hrefDe} />
            <p className="text-[0.75rem] text-tinta-600">
              {numero(feed.total)} atos, {numero(feed.porPagina)} por página
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
