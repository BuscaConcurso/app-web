import { describe, expect, it, vi } from "vitest";
import { medirCargos } from "@/lib/cargos";
import { slugDaBusca } from "@/lib/enderecoDaBusca";
import { urlAbsoluta } from "@/lib/site";
import { CONCURSOS } from "@/mocks/concursos";

// `sitemap()` chama `connection()` para não sair do build congelado com o
// mock (comentário em `sitemap.ts`). Fora do pipeline de renderização do
// Next, sem um Request de verdade, `connection()` lança: é o mesmo motivo
// pelo qual não há teste de `app/layout.tsx`. Aqui simulamos o Request que
// só existe em produção, sem mexer no comportamento real: `connection()`
// resolve na hora, como resolveria durante uma renderização de verdade.
vi.mock("next/server", async (importarOriginal) => {
  const original = await importarOriginal<typeof import("next/server")>();
  return { ...original, connection: async () => undefined };
});

const { default: sitemap } = await import("./sitemap");

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
});
