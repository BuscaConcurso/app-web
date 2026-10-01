import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoArtigo } from "./CartaoArtigo";
import { CorpoDoArtigo } from "./CorpoDoArtigo";
import { ListaDeArtigos } from "./ListaDeArtigos";
import { artigoDeTeste, paginaDeTeste } from "./artigos.fixtures";

const render = renderToStaticMarkup;
describe("leitura dos artigos", () => {
  it("escapa título e destaque vindo da API e usa capa própria", () => {
    const html = render(createElement(CartaoArtigo, { artigo: artigoDeTeste }));
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<mark");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("/artigos/analise-teste/capa/4x3");
  });
  it("escapa blocos e informa ausência dos dados vivos sem números fictícios", () => {
    const html = render(createElement(CorpoDoArtigo, { artigo: artigoDeTeste, vivos: { principal: null, citados: [], indisponiveis: 2 }, hoje: "2026-10-01" }));
    expect(html).toContain("Texto &lt;iframe&gt;");
    expect(html).toContain("Item &lt;b&gt;");
    expect(html).not.toContain("<iframe>");
    expect(html).toContain("Dados atuais indisponíveis");
    expect(html).not.toContain("0 vagas");
  });
  it("formulário GET e paginação preservam termo, tipo, UF e ordem", () => {
    const html = render(createElement(ListaDeArtigos, { dados: paginaDeTeste, filtro: { pagina: 1, q: "médico & lei", tipo: "concurso", uf: "SP", ordem: "relevantes" }, caminho: "/artigos/busca" }));
    expect(html).toMatch(/<form[^>]*action="\/artigos\/busca"[^>]*method="get"/);
    expect(html).toContain("pagina=2&amp;tipo=concurso&amp;uf=SP&amp;q=m%C3%A9dico+%26+lei&amp;ordem=relevantes");
    for (const nome of ["q", "tipo", "uf", "ordem"]) expect(html).toContain(`name="${nome}"`);
  });
});
