import { afterEach, describe, expect, it, vi } from "vitest";
import { obterArtigo, type ArtigoDetalhe } from "@/lib/artigos";
import { GET } from "./route";

vi.mock("@/lib/artigos", () => ({ obterArtigo: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const request = new Request("https://buscaconcurso.com.br/artigos/teste/capa/16x9");

describe("capas dos artigos", () => {
  it("artigo ausente ou formato desconhecido devolvem 404", async () => {
    vi.mocked(obterArtigo).mockResolvedValue(null);
    expect((await GET(request, { params: Promise.resolve({ slug: "teste", formato: "16x9" }) })).status).toBe(404);
    vi.mocked(obterArtigo).mockClear();
    expect((await GET(request, { params: Promise.resolve({ slug: "teste", formato: "estranho" }) })).status).toBe(404);
    expect(obterArtigo).not.toHaveBeenCalled();
  });
  it.each([["16x9", 675], ["4x3", 900], ["1x1", 1200]] as const)("gera PNG real em %s", async (formato, altura) => {
    vi.mocked(obterArtigo).mockResolvedValue({ slug: "teste", titulo: "Concurso: análise dos prazos e das condições", uf: "AM", orgao: null, tipo: "concurso" } as ArtigoDetalhe);
    const resposta = await GET(request, { params: Promise.resolve({ slug: "teste", formato }) });
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toBe("image/png");
    const bytes = Buffer.from(await resposta.arrayBuffer());
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(altura);
  });
});
