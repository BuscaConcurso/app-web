import { unstable_rethrow } from "next/navigation";
import { obterDetalhe } from "@/lib/concursos";
import type { ArtigoDetalhe } from "@/lib/artigos";
import type { ConcursoDetalhe } from "@/lib/dominio";

export interface DadosVivosDoArtigo {
  principal: ConcursoDetalhe | null;
  citados: ConcursoDetalhe[];
  indisponiveis: number;
}

/** Só lê concursos referenciados; aliases usam o slug canônico da resposta. */
export async function carregarDadosDoArtigo(artigo: ArtigoDetalhe): Promise<DadosVivosDoArtigo> {
  const slugs = [...new Set([...(artigo.concursoSlug ? [artigo.concursoSlug] : []), ...artigo.concursosCitados])];
  const encontrados = new Map<string, ConcursoDetalhe | null>();
  // Pequenos lotes evitam disparar todos os detalhes de um panorama ao mesmo tempo.
  for (let i = 0; i < slugs.length; i += 4) {
    await Promise.all(slugs.slice(i, i + 4).map(async slug => {
      try { encontrados.set(slug, await obterDetalhe(slug)); }
      catch (erro) { unstable_rethrow(erro); encontrados.set(slug, null); }
    }));
  }
  const citados = new Map<string, ConcursoDetalhe>();
  for (const slug of artigo.concursosCitados) {
    const concurso = encontrados.get(slug);
    if (concurso) citados.set(concurso.slug, concurso);
  }
  return {
    principal: artigo.concursoSlug ? encontrados.get(artigo.concursoSlug) ?? null : null,
    citados: [...citados.values()],
    indisponiveis: [...encontrados.values()].filter(c => !c).length,
  };
}
