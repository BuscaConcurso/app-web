import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { listarArtigos } from "@/lib/artigos";

export async function LeituraDoConcurso({ slug }: { slug: string }) {
  let artigo;
  try {
    const { itens } = await listarArtigos({ pagina: 1, concursoSlug: slug, tipo: "concurso" });
    artigo = itens[0];
  } catch (erro) {
    unstable_rethrow(erro);
    // Conteúdo complementar: uma falha editorial não derruba o edital.
    return null;
  }
  if (!artigo) return null;
  return (
      <aside className="rounded-cartao border border-linha bg-cartao p-6">
        <p className="text-xs font-bold tracking-wider text-tinta-500 uppercase">Para aprofundar</p>
        <Link href={`/artigos/${encodeURIComponent(artigo.slug)}`} className="mt-2 block font-titulo text-xl font-bold text-link hover:underline">
          {artigo.titulo}
        </Link>
        <p className="mt-2 text-sm text-tinta-600">Leia a análise dos dados capturados para este concurso.</p>
      </aside>
  );
}
