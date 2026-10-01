import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listarArtigos } from "@/lib/artigos";
import { consultaDeArtigos, type ParametrosDeArtigos } from "@/lib/artigosConsulta";
import { Trilha } from "@/components/ui/Trilha";
import { ListaDeArtigos } from "@/components/artigos/ListaDeArtigos";

export const metadata: Metadata = {
  title: "Buscar artigos",
  // A busca é noindex; não herda o canonical da página inicial.
  alternates: { canonical: null },
  robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
};

export default async function BuscaDeArtigos({ searchParams }: { searchParams: Promise<ParametrosDeArtigos> }) {
  const filtro = consultaDeArtigos(await searchParams);
  const dados = await listarArtigos(filtro);
  if (filtro.pagina > Math.max(1, dados.totalDePaginas)) notFound();
  return <div className="conteudo pb-12">
    <Trilha degraus={[{ nome: "Início", href: "/" }, { nome: "Artigos", href: "/artigos" }, { nome: "Busca", href: "/artigos/busca" }]} />
    <h1 className="mb-8 pt-6 font-titulo text-4xl font-bold">Buscar artigos</h1>
    <ListaDeArtigos dados={dados} filtro={filtro} caminho="/artigos/busca" />
  </div>;
}
