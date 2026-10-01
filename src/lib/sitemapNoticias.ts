import type { EntradaDoMapa } from "./artigos";
import { createHash } from "node:crypto";
import { NOME_SITE, urlAbsoluta } from "./site";

export const NOTICIAS_POR_MAPA = 1000;
const CABECALHO = '<?xml version="1.0" encoding="UTF-8"?>';
const NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

/** O slug imutável mantém cada notícia na mesma parte quando outra sai. */
export function chaveDaNoticia(item: EntradaDoMapa): string {
  return createHash("sha256").update(item.slug).digest("hex");
}

export function partesDasNoticias(itens: EntradaDoMapa[], prefixo = ""): string[] {
  if (itens.length <= NOTICIAS_POR_MAPA) return [prefixo];
  if (prefixo.length >= 64) throw new Error("Não foi possível dividir o mapa de notícias.");
  const grupos = new Map<string, EntradaDoMapa[]>();
  for (const item of itens) {
    const parte = prefixo + chaveDaNoticia(item)[prefixo.length];
    const membros = grupos.get(parte) ?? [];
    membros.push(item);
    grupos.set(parte, membros);
  }
  return [...grupos.entries()].sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([parte, membros]) => partesDasNoticias(membros, parte));
}

/** XML 1.0 não aceita caracteres de controle, mesmo escapados. */
export function escaparXml(texto: string): string {
  return Array.from(texto).filter(letra => {
    const n = letra.codePointAt(0)!;
    return n === 9 || n === 10 || n === 13 || (n >= 32 && n <= 0xd7ff) || (n >= 0xe000 && n <= 0xfffd) || (n >= 0x10000 && n <= 0x10ffff);
  }).join("").replace(/[<>&"']/g, letra => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[letra]!);
}

export function noticiasRecentes(itens: EntradaDoMapa[], agora: Date): EntradaDoMapa[] {
  const fim = agora.getTime();
  const inicio = fim - 48 * 60 * 60 * 1000;
  return itens.filter(item => {
    const publicado = Date.parse(item.publicadoEm);
    return item.noticia && publicado >= inicio && publicado <= fim;
  });
}

export function xmlDeNoticias(itens: EntradaDoMapa[]): string {
  if (itens.length > NOTICIAS_POR_MAPA) throw new Error("Divida as notícias em arquivos de até 1000 URLs.");
  return `${CABECALHO}\n<urlset xmlns="${NAMESPACE}" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${itens.map(item => `
  <url><loc>${escaparXml(urlAbsoluta(`/artigos/${encodeURIComponent(item.slug)}`))}</loc><news:news><news:publication><news:name>${escaparXml(NOME_SITE)}</news:name><news:language>pt</news:language></news:publication><news:publication_date>${escaparXml(item.publicadoEm)}</news:publication_date><news:title>${escaparXml(item.titulo)}</news:title></news:news></url>`).join("")}\n</urlset>`;
}

export function xmlDoIndice(caminhos: string[]): string {
  return `${CABECALHO}\n<sitemapindex xmlns="${NAMESPACE}">${caminhos.map(caminho => `<sitemap><loc>${escaparXml(urlAbsoluta(caminho))}</loc></sitemap>`).join("")}\n</sitemapindex>`;
}

export function xmlDeArtigos(itens: EntradaDoMapa[]): string {
  if (itens.length > 50_000) throw new Error("O mapa comum aceita até 50000 URLs.");
  return `${CABECALHO}\n<urlset xmlns="${NAMESPACE}">${itens.map(item => `<url><loc>${escaparXml(urlAbsoluta(`/artigos/${encodeURIComponent(item.slug)}`))}</loc><lastmod>${escaparXml(item.atualizadoEm)}</lastmod></url>`).join("")}\n</urlset>`;
}
