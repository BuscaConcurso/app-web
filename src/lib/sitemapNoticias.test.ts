import { describe, expect, it } from "vitest";
import { noticiasRecentes, xmlDeNoticias, xmlDoIndice, xmlDeArtigos } from "./sitemapNoticias";

const agora = new Date("2026-10-01T12:00:00Z");
const entrada = (slug: string, publicadoEm = agora.toISOString(), noticia = true) => ({
  slug, titulo: 'Vagas & "prazos" <hoje>', publicadoEm,
  atualizadoEm: agora.toISOString(), noticia,
});

describe("sitemaps editoriais", () => {
  it("limita pela publicação original: borda 48h incluída, antigos, futuros e não notícia excluídos", () => {
    expect(noticiasRecentes([
      entrada("recente"), entrada("borda", "2026-09-29T12:00:00Z"),
      entrada("velho", "2026-09-29T11:59:59Z"), entrada("futuro", "2026-10-01T12:00:01Z"),
      entrada("evergreen", undefined, false), entrada("invalido", "oops"),
    ], agora).map(x => x.slug)).toEqual(["recente", "borda"]);
  });
  it("escapa XML e mantém namespace, idioma e data original", () => {
    const xml = xmlDeNoticias([entrada("teste", "2026-09-30T12:00:00Z")]);
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(xml).toContain("<news:language>pt</news:language>");
    expect(xml).toContain("Vagas &amp; &quot;prazos&quot; &lt;hoje&gt;");
    expect(xml).toContain("<news:publication_date>2026-09-30T12:00:00Z</news:publication_date>");
    expect(xmlDeNoticias([])).toContain("</urlset>");
  });
  it("recusa arquivo acima de 1000 em vez de truncar notícias", () => {
    expect(() => xmlDeNoticias(Array.from({ length: 1001 }, (_, n) => entrada(`${n}`)))).toThrow();
    expect(xmlDoIndice(["/sitemap-noticias.xml?pagina=1", "/sitemap-noticias.xml?pagina=2"])).toContain("<sitemapindex");
  });
  it("mapa comum preserva notícia antiga com atualização real", () => {
    const xml = xmlDeArtigos([entrada("antigo", "2025-01-01T00:00:00Z")]);
    expect(xml).toContain("/artigos/antigo</loc>");
    expect(xml).toContain(`<lastmod>${agora.toISOString()}</lastmod>`);
    expect(xml).not.toContain("news:news");
  });
});
