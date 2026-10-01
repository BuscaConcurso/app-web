import { describe, expect, it } from "vitest";
import type { ArtigoDetalhe } from "./artigos";
import { artigoEstruturado, colecaoDeArtigos, imagemDoArtigo, metadataDoArtigo } from "./artigosSeo";
import { urlAbsoluta } from "./site";

const artigo: ArtigoDetalhe = {
  slug: "concurso-teste", tipo: "concurso", titulo: "Concurso & oportunidades",
  descricao: "Informações capturadas sobre o concurso.", noticia: true,
  minutosDeLeitura: 3, publicadoEm: "2026-09-29T12:00:00Z", atualizadoEm: "2026-10-01T10:00:00Z",
  uf: "AM", ufs: ["AM"], escolaridade: null, periodo: null, concursoSlug: "teste",
  orgao: { slug: "orgao", nome: "Órgão", sigla: null }, trecho: null,
  lide: "Leia as condições.", emResumo: ["Confira o documento."],
  secoes: [{ titulo: "O que considerar", blocos: [{ tipo: "paragrafo", texto: "Texto literal <script>." }] }],
  concursosCitados: ["teste"],
};

describe("dados editoriais para buscadores", () => {
  it("usa datas editoriais, autor organizacional e três imagens do artigo", () => {
    const dados = artigoEstruturado(artigo);
    expect(dados).toMatchObject({ "@type": "NewsArticle", headline: artigo.titulo,
      datePublished: artigo.publicadoEm, dateModified: artigo.atualizadoEm,
      author: { "@type": "Organization", name: "Redação BuscaConcurso" }, inLanguage: "pt-BR" });
    expect(dados.image).toEqual(["16x9", "4x3", "1x1"].map(f => urlAbsoluta(`/artigos/concurso-teste/capa/${f}`)));
    expect(JSON.stringify(dados)).not.toMatch(/FAQPage|JobPosting/);
  });
  it("artigo não noticioso permanece Article e declara só citados visíveis", () => {
    const dados = artigoEstruturado({ ...artigo, noticia: false }, [{ slug: "visivel", titulo: "Visível" }]);
    expect(dados["@type"]).toBe("Article");
    expect(JSON.stringify(dados.mainEntity)).toContain("/concursos/visivel");
    expect(JSON.stringify(dados.mainEntity)).not.toContain("/concursos/teste");
  });
  it("metadata tem canonical próprio, imagem grande e publicação original", () => {
    expect(metadataDoArtigo(artigo)).toMatchObject({
      alternates: { canonical: urlAbsoluta("/artigos/concurso-teste") },
      openGraph: { type: "article", publishedTime: artigo.publicadoEm, modifiedTime: artigo.atualizadoEm },
      robots: { googleBot: { "max-image-preview": "large" } },
    });
    expect(imagemDoArtigo("a/b")).toContain("a%2Fb/capa/16x9");
  });
  it("coleção descreve somente os cards apresentados", () => {
    const dados = colecaoDeArtigos([artigo], "/artigos?pagina=2");
    expect(dados.url).toBe(urlAbsoluta("/artigos?pagina=2"));
    expect(dados.mainEntity.itemListElement).toHaveLength(1);
  });
});
