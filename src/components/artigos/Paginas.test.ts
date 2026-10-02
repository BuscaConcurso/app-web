import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Capa, { generateMetadata as metadataDaCapa } from "@/app/artigos/page";
import Busca, { metadata as metadataDaBusca } from "@/app/artigos/busca/page";
import Detalhe, * as rotaDoDetalhe from "@/app/artigos/[slug]/page";
import { artigoDeTeste, paginaDeTeste } from "./artigos.fixtures";
import { CONCURSOS } from "@/mocks/concursos";
import { ITENS_DA_NAV } from "@/components/layout/itensDaNav";

const { obterDetalhe } = vi.hoisted(() => ({ obterDetalhe: vi.fn() }));
vi.mock("@/lib/concursos", () => ({ obterDetalhe }));
const fetchApi = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubEnv("BC_API_URL", "https://api.example/v1");
  vi.stubGlobal("fetch", fetchApi); fetchApi.mockReset(); obterDetalhe.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("páginas editoriais", () => {
  it("catálogo vazio sem API e páginas fora do fim retornam ausência", async () => {
    vi.stubEnv("BC_API_URL", "");
    expect(renderToStaticMarkup(await Capa({ searchParams: Promise.resolve({}) }))).toContain("Ainda não há artigos publicados");
    await expect(Capa({ searchParams: Promise.resolve({ pagina: "2" }) })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    await expect(Detalhe({ params: Promise.resolve({ slug: "ausente" }) })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
  it("busca é noindex/follow inclusive Googlebot e capa tem canonical próprio", async () => {
    expect(metadataDaBusca.robots).toMatchObject({ index: false, follow: true, googleBot: { index: false, follow: true } });
    expect(metadataDaBusca.alternates?.canonical).toBeNull();
    expect((await metadataDaCapa({ searchParams: Promise.resolve({ pagina: "2", uf: "SP" }) })).alternates?.canonical).toBe("/artigos?pagina=2&uf=SP");
    fetchApi.mockResolvedValue(Response.json({ ...paginaDeTeste, itens: [], totalDePaginas: 1 }));
    await expect(Busca({ searchParams: Promise.resolve({ pagina: "2" }) })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
  it("API indisponível não vira catálogo vazio", async () => {
    fetchApi.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(Capa({ searchParams: Promise.resolve({}) })).rejects.toThrow("503");
  });
  it("renderiza texto seguro, fonte e citados canônicos também no JSON-LD", async () => {
    const atual = { ...CONCURSOS[0], slug: "slug-canonico", titulo: "Concurso atual", origens: [], editalCitadoUrl: "https://fonte.example/edital" };
    fetchApi.mockImplementation(async url => Response.json(String(url).includes("/artigos?") ? paginaDeTeste : String(url).endsWith("/concursos") ? { itens: [atual] } : artigoDeTeste));
    obterDetalhe.mockResolvedValue({ ...atual, cargos: [], cronograma: [] });
    const html = renderToStaticMarkup(await Detalhe({ params: Promise.resolve({ slug: artigoDeTeste.slug }) }));
    expect(html).toContain("Leia &lt;b&gt;com atenção&lt;/b&gt;");
    expect(html).toContain('href="/concursos/slug-canonico"');
    expect(html).toContain('href="https://fonte.example/edital"');
    expect(html).not.toContain('href="/concursos/concurso-ausente"');
    const jsons = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const artigo = jsons.find(j => j["@type"] === "NewsArticle");
    expect(artigo.mainEntity.numberOfItems).toBe(1);
    expect(artigo.mainEntity.itemListElement[0].url).toMatch(/\/concursos\/slug-canonico$/);
    expect(artigo.about.url).toMatch(/\/concursos\/slug-canonico$/);
  });
  it("o artigo é página guardada, gerada na primeira visita, e nenhuma leitura dela é no-store", async () => {
    expect(rotaDoDetalhe.revalidate).toBe(300);
    expect(rotaDoDetalhe.dynamicParams).toBe(true);
    expect(await rotaDoDetalhe.generateStaticParams()).toEqual([]);
    fetchApi.mockImplementation(async url => Response.json(String(url).includes("/artigos?") ? paginaDeTeste : String(url).endsWith("/concursos") ? { itens: [] } : artigoDeTeste));
    obterDetalhe.mockResolvedValue(null);
    await Detalhe({ params: Promise.resolve({ slug: artigoDeTeste.slug }) });
    expect(fetchApi.mock.calls.length).toBeGreaterThanOrEqual(3);
    for (const [, opcoes] of fetchApi.mock.calls) {
      expect(opcoes?.cache).toBeUndefined();
      expect(opcoes?.next?.revalidate).toBeGreaterThan(0);
    }
  });
  it("navegação inclui artigos e ativa suas páginas sem capturar prefixos alheios", () => {
    const item = ITENS_DA_NAV.find(i => i.href === "/artigos");
    expect(item).toBeDefined();
    expect(item?.ativo("/artigos/busca", new URLSearchParams())).toBe(true);
    expect(item?.ativo("/artigos-outros", new URLSearchParams())).toBe(false);
  });
});
