import { describe, expect, it } from "vitest";
import { GET, dynamic } from "./route";

describe("GET /api/areas", () => {
  it("é dinâmica e sem cache de CDN: o job semanal é o único cliente e não pode ler cópia velha", async () => {
    expect(dynamic).toBe("force-dynamic");
    const resposta = await GET();
    expect(resposta.headers.get("cache-control")).toBe("no-store");
  });

  it("traz as 12 áreas e quando o acervo foi lido", async () => {
    const corpo = await (await GET()).json();
    expect(corpo.areas).toHaveLength(12);
    expect(Number.isNaN(Date.parse(corpo.geradoEm))).toBe(false);
  });
});
