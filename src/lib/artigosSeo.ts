import type { Metadata } from "next";
import type { ArtigoDetalhe, ArtigoResumo } from "./artigos";
import { NOME_SITE, URL_SITE, urlAbsoluta } from "./site";

export type FormatoDaCapa = "16x9" | "4x3" | "1x1";
export const FORMATOS_DA_CAPA: Record<FormatoDaCapa, { width: number; height: number }> = {
  "16x9": { width: 1200, height: 675 },
  "4x3": { width: 1200, height: 900 },
  "1x1": { width: 1200, height: 1200 },
};

export function imagemDoArtigo(slug: string, formato: FormatoDaCapa = "16x9"): string {
  return urlAbsoluta(`/artigos/${encodeURIComponent(slug)}/capa/${formato}`);
}

export function metadataDoArtigo(artigo: ArtigoDetalhe): Metadata {
  const url = urlAbsoluta(`/artigos/${encodeURIComponent(artigo.slug)}`);
  const imagem = { url: imagemDoArtigo(artigo.slug), ...FORMATOS_DA_CAPA["16x9"], alt: artigo.titulo };
  return {
    title: artigo.titulo,
    description: artigo.descricao,
    alternates: { canonical: url },
    authors: [{ name: "Redação BuscaConcurso", url: urlAbsoluta("/artigos/como-escrevemos") }],
    openGraph: {
      type: "article", locale: "pt_BR", siteName: NOME_SITE, url,
      title: artigo.titulo, description: artigo.descricao,
      publishedTime: artigo.publicadoEm, modifiedTime: artigo.atualizadoEm,
      authors: [urlAbsoluta("/artigos/como-escrevemos")], images: [imagem],
    },
    twitter: { card: "summary_large_image", title: artigo.titulo, description: artigo.descricao, images: [imagem] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  };
}

export function artigoEstruturado(artigo: ArtigoDetalhe, citadosVisiveis: { slug: string; titulo: string }[] = []) {
  const url = urlAbsoluta(`/artigos/${encodeURIComponent(artigo.slug)}`);
  return {
    "@context": "https://schema.org",
    "@type": artigo.noticia ? "NewsArticle" : "Article",
    "@id": `${url}#artigo`, url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: artigo.titulo, description: artigo.descricao,
    image: (Object.keys(FORMATOS_DA_CAPA) as FormatoDaCapa[]).map(formato => imagemDoArtigo(artigo.slug, formato)),
    datePublished: artigo.publicadoEm, dateModified: artigo.atualizadoEm,
    inLanguage: "pt-BR", isAccessibleForFree: true,
    articleSection: "Concursos públicos",
    author: { "@type": "Organization", "@id": urlAbsoluta("/artigos/como-escrevemos#redacao"), name: "Redação BuscaConcurso", url: urlAbsoluta("/artigos/como-escrevemos") },
    publisher: { "@type": "Organization", "@id": `${URL_SITE}/#organizacao`, name: NOME_SITE, url: URL_SITE, logo: { "@type": "ImageObject", url: urlAbsoluta("/marca/horizontal.svg") } },
    ...(artigo.concursoSlug ? { about: { "@type": "Thing", name: artigo.titulo, url: urlAbsoluta(`/concursos/${encodeURIComponent(artigo.concursoSlug)}`) } } : {}),
    ...(citadosVisiveis.length ? { mainEntity: {
      "@type": "ItemList", name: "Concursos citados", numberOfItems: citadosVisiveis.length,
      itemListElement: citadosVisiveis.map((concurso, indice) => ({ "@type": "ListItem", position: indice + 1, name: concurso.titulo, url: urlAbsoluta(`/concursos/${encodeURIComponent(concurso.slug)}`) })),
    } } : {}),
  };
}

export function colecaoDeArtigos(artigos: ArtigoResumo[], caminho: string) {
  return {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "Artigos sobre concursos públicos", url: urlAbsoluta(caminho), inLanguage: "pt-BR",
    mainEntity: {
      "@type": "ItemList", numberOfItems: artigos.length,
      itemListElement: artigos.map((artigo, indice) => ({ "@type": "ListItem", position: indice + 1, name: artigo.titulo, url: urlAbsoluta(`/artigos/${encodeURIComponent(artigo.slug)}`) })),
    },
  };
}
