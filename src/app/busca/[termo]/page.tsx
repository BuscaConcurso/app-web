import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ResultadosDaBusca,
  ResultadosDaBuscaNaUrl,
  type DadosDaBusca,
} from "@/components/busca/ResultadosDaBusca";
import {
  avisoDoAcervo,
  cargosEscolhidos,
  concursosDoTermo,
  dimensoesDoAcervo,
  paraALista,
} from "@/lib/concursos";
import {
  decodificarSegmento,
  metadadosDaBusca,
  slugDaBusca,
  termoDoSlug,
  tituloDoTermo,
} from "@/lib/enderecoDaBusca";

/**
 * A busca por termo, pré-renderizada.
 *
 * Nada no build (`generateStaticParams` vazio): cada termo é renderizado na
 * primeira visita e servido do cache por cinco minutos. Para continuar
 * estática, a página **não lê `searchParams`**: ela entrega os concursos do
 * termo, e filtro, ordenação e página são do navegador
 * (`ResultadosDaBuscaNaUrl`). O termo vem só do caminho: um `?q=` que sobre
 * na query é ignorado por `ResultadosDaBusca`. A forma canônica do slug já
 * foi imposta pelo `proxy.ts`; aqui o slug é recalculado só para o vazio
 * virar 404.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ termo: string }[]> {
  return [];
}

async function slugDaRota(props: PageProps<"/busca/[termo]">): Promise<string> {
  const { termo } = await props.params;
  const slug = slugDaBusca(decodificarSegmento(termo));
  if (!slug) notFound();
  return slug;
}

export async function generateMetadata(
  props: PageProps<"/busca/[termo]">,
): Promise<Metadata> {
  const slug = await slugDaRota(props);
  const [itens, cargos] = await Promise.all([
    concursosDoTermo(termoDoSlug(slug)),
    cargosEscolhidos(),
  ]);
  return metadadosDaBusca(slug, itens.length, cargos);
}

export default async function BuscaPorTermo(props: PageProps<"/busca/[termo]">) {
  const slug = await slugDaRota(props);
  const [itens, cargos, aviso, dimensoes] = await Promise.all([
    concursosDoTermo(termoDoSlug(slug)),
    cargosEscolhidos(),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
  ]);
  // O mesmo objeto nas duas pontas do `Suspense`: o RSC do React 19 escreve
  // um objeto repetido uma vez só e referencia a segunda. Uma cópia aqui
  // mandaria a lista duas vezes.
  const dados: DadosDaBusca = {
    slug,
    titulo: tituloDoTermo(slug, cargos),
    itens: paraALista(itens),
    aviso,
    dimensoes,
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <Suspense fallback={<ResultadosDaBusca {...dados} parametros={{}} />}>
        <ResultadosDaBuscaNaUrl {...dados} />
      </Suspense>
    </div>
  );
}
