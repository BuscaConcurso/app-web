import { unstable_rethrow } from "next/navigation";
import { obterDetalhe } from "@/lib/concursos";
import { concursosCitadosDoArtigo, type ArtigoDetalhe, type ConcursoCitado } from "@/lib/artigos";
import type { ConcursoDetalhe } from "@/lib/dominio";

/** O `revalidate` da página do artigo: nenhuma leitura dela pode ser `no-store`. */
const VALIDADE_S = 300;

export interface DadosVivosDoArtigo {
  principal: ConcursoDetalhe | null;
  citados: ConcursoCitado[];
  indisponiveis: number;
}

/** Falha de concurso não derruba o artigo: vira ausência, e a página avisa. */
async function ouAusente<T>(leitura: Promise<T>, ausente: T): Promise<T> {
  try { return await leitura; }
  catch (erro) { unstable_rethrow(erro); return ausente; }
}

/**
 * A ficha inteira só do concurso principal, que desenha cargos e cronograma.
 * Os citados vêm todos de uma requisição, já no slug canônico e na ordem do
 * artigo.
 */
export async function carregarDadosDoArtigo(artigo: ArtigoDetalhe): Promise<DadosVivosDoArtigo> {
  const pedidos = [...new Set(artigo.concursosCitados)];
  const [principal, citados] = await Promise.all([
    artigo.concursoSlug ? ouAusente(obterDetalhe(artigo.concursoSlug, { validadeS: VALIDADE_S }), null) : null,
    pedidos.length ? ouAusente(concursosCitadosDoArtigo(artigo.slug), []) : [],
  ]);
  const principalFaltou = artigo.concursoSlug && !principal && !pedidos.includes(artigo.concursoSlug);
  return {
    principal,
    citados,
    indisponiveis: Math.max(0, pedidos.length - citados.length) + (principalFaltou ? 1 : 0),
  };
}
