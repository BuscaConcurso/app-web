import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listarArtigos } from "@/lib/artigos";
import { consultaDeArtigos, hrefDosArtigos, type ParametrosDeArtigos } from "@/lib/artigosConsulta";
import { colecaoDeArtigos } from "@/lib/artigosSeo";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import { Trilha } from "@/components/ui/Trilha";
import { ListaDeArtigos } from "@/components/artigos/ListaDeArtigos";

type Props = { searchParams: Promise<ParametrosDeArtigos> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filtro = consultaDeArtigos(await searchParams);
  return {
    title: filtro.pagina > 1 ? `Artigos sobre concursos, página ${filtro.pagina}` : "Artigos sobre concursos públicos",
    description: "Análises de concursos, panoramas por estado e prazos para organizar sua próxima inscrição.",
    alternates: { canonical: hrefDosArtigos("/artigos", filtro) },
  };
}

export default async function Artigos({ searchParams }: Props) {
  const filtro = consultaDeArtigos(await searchParams);
  if (filtro.q) redirect(hrefDosArtigos("/artigos/busca", filtro));
  const dados = await listarArtigos(filtro);
  if (filtro.pagina > Math.max(1, dados.totalDePaginas)) notFound();
  return <div className="conteudo pb-12">
    <DadosEstruturados dados={colecaoDeArtigos(dados.itens, hrefDosArtigos("/artigos", filtro))} />
    <Trilha degraus={[{ nome: "Início", href: "/" }, { nome: "Artigos", href: "/artigos" }]} />
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-linha pb-8 pt-6">
      <div className="max-w-2xl"><h1 className="font-titulo text-4xl font-bold tracking-tight sm:text-5xl">Artigos sobre concursos</h1><p className="mt-4 text-lg leading-relaxed text-tinta-600">O contexto para decidir onde concorrer. Análises, panoramas e prazos a partir dos dados do acervo.</p></div>
      <Link href="/artigos/como-escrevemos" className="text-sm font-semibold text-link underline">Como escrevemos</Link>
    </header>
    <ListaDeArtigos dados={dados} filtro={filtro} caminho="/artigos" />
  </div>;
}
