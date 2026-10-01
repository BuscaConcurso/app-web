import { afterEach, describe, expect, it, vi } from "vitest";
import { mapaDeArtigos } from "@/lib/artigos";
import { GET } from "./route";
import { GET as mapaGeral } from "../sitemap-artigos.xml/route";
import { chaveDaNoticia } from "@/lib/sitemapNoticias";

vi.mock("@/lib/artigos", () => ({ mapaDeArtigos: vi.fn() }));
afterEach(() => { vi.resetAllMocks(); vi.useRealTimers(); });
const req = (query = "") => new Request(`https://buscaconcurso.com.br/sitemap-noticias.xml${query}`);

describe("respostas dos mapas editoriais", () => {
  it("devolve XML vazio válido e não usa cache que estenda a janela temporal", async () => {
    vi.mocked(mapaDeArtigos).mockResolvedValue([]);
    const resposta = await GET(req());
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toContain("application/xml");
    expect(resposta.headers.get("cache-control")).toBe("no-cache");
    expect(await resposta.text()).toContain("</urlset>");
  });
  it("divide 1001 notícias em grupos estáveis mesmo se uma sair entre leituras", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    const itens = Array.from({ length: 1001 }, (_, i) => ({
      slug: `artigo-${i}`, titulo: `Artigo ${i}`, publicadoEm: "2026-10-01T10:00:00Z", atualizadoEm: "2026-10-01T10:00:00Z", noticia: true,
    }));
    vi.mocked(mapaDeArtigos).mockResolvedValue(itens);
    const indice = await (await GET(req())).text();
    expect(indice).toContain("sitemapindex");
    const partes = [...indice.matchAll(/\?parte=([a-f0-9]+)/g)].map(m => m[1]);
    expect(partes.length).toBeGreaterThan(1);
    const vistas: string[] = [];
    for (const [i, parte] of partes.entries()) {
      const resposta = await GET(req(`?parte=${parte}`));
      expect(resposta.status).toBe(200);
      const xml = await resposta.text();
      expect((xml.match(/<news:news>/g) ?? []).length).toBeLessThanOrEqual(1000);
      vistas.push(...[...xml.matchAll(/\/artigos\/(artigo-\d+)<\/loc>/g)].map(m => m[1]));
      if (i === 0) {
        const removido = itens.find(item => chaveDaNoticia(item).startsWith(parte))!;
        vi.mocked(mapaDeArtigos).mockResolvedValue(itens.filter(item => item !== removido));
      }
    }
    expect(new Set(vistas).size).toBe(1001);
    expect(vistas).toContain("artigo-1000");
  });
  it("não disfarça falha de API como sucesso vazio", async () => {
    vi.mocked(mapaDeArtigos).mockRejectedValue(new Error("indisponível"));
    for (const resposta of [await GET(req()), await mapaGeral()]) {
      expect(resposta.status).toBe(503);
      expect(resposta.headers.get("retry-after")).toBe("300");
    }
  });
  it("recusa parte inválida antes de buscar dados", async () => {
    for (const query of ["?parte=", "?parte=-1", "?parte=1.5", "?parte=xyz", `?parte=${"f".repeat(65)}`]) {
      expect((await GET(req(query))).status).toBe(404);
    }
    expect(mapaDeArtigos).not.toHaveBeenCalled();
  });
});
