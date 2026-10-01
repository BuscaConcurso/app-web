import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { listarArtigos } from "@/lib/artigos";
import { LeituraDoConcurso } from "./LeituraDoConcurso";

vi.mock("@/lib/artigos", () => ({ listarArtigos: vi.fn() }));
afterEach(() => vi.resetAllMocks());

it("busca somente o artigo do concurso canônico e cria link real", async () => {
  vi.mocked(listarArtigos).mockResolvedValue({ itens: [{ slug: "leitura", titulo: "O que considerar" }] } as Awaited<ReturnType<typeof listarArtigos>>);
  const html = renderToStaticMarkup(await LeituraDoConcurso({ slug: "concurso-canonico" }));
  expect(listarArtigos).toHaveBeenCalledWith({ pagina: 1, concursoSlug: "concurso-canonico", tipo: "concurso" });
  expect(html).toContain('href="/artigos/leitura"');
  expect(html).toContain("O que considerar");
});

it("sem artigo ou com API editorial indisponível preserva a página de concurso", async () => {
  vi.mocked(listarArtigos).mockResolvedValue({ itens: [] } as unknown as Awaited<ReturnType<typeof listarArtigos>>);
  expect(await LeituraDoConcurso({ slug: "sem" })).toBeNull();
  vi.mocked(listarArtigos).mockRejectedValue(new Error("fora do ar"));
  expect(await LeituraDoConcurso({ slug: "sem" })).toBeNull();
});
