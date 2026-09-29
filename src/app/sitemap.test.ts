import { describe, expect, it } from "vitest";
import { AREAS } from "@/lib/areas";
import { medirCargos } from "@/lib/cargos";
import { slugDaBusca } from "@/lib/enderecoDaBusca";
import { urlAbsoluta } from "@/lib/site";
import { CONCURSOS } from "@/mocks/concursos";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("tem /busca/<slug> para cada cargo medido, diário e com prioridade 0,7", async () => {
    // O mock rende 7 cargos escolhidos; sem nenhum, o teste não provaria nada.
    const { escolhidos } = medirCargos(CONCURSOS);
    expect(escolhidos.length).toBeGreaterThan(0);

    const buscas = (await sitemap()).filter((entrada) =>
      entrada.url.startsWith(urlAbsoluta("/busca/")),
    );
    expect(buscas.map((entrada) => entrada.url).sort()).toEqual(
      escolhidos.map((cargo) => urlAbsoluta(`/busca/${slugDaBusca(cargo.termo)}`)).sort(),
    );
    for (const entrada of buscas) {
      expect(entrada.changeFrequency).toBe("daily");
      expect(entrada.priority).toBe(0.7);
    }
  });

  it("não lista busca por texto livre", async () => {
    expect((await sitemap()).some((entrada) => entrada.url.includes("?q="))).toBe(false);
  });

  it("tem o feed do Diário Oficial, diário", async () => {
    const entrada = (await sitemap()).find((e) => e.url === urlAbsoluta("/diario-oficial"));
    expect(entrada?.changeFrequency).toBe("daily");
  });

  it("tem /areas e a página de cada uma das 12 áreas", async () => {
    const urls = (await sitemap()).map((entrada) => entrada.url);
    expect(urls).toContain(urlAbsoluta("/areas"));
    for (const area of AREAS) expect(urls).toContain(urlAbsoluta(`/areas/${area.slug}`));
  });
});
