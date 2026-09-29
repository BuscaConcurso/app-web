import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("redirecionamentos", () => {
  it("o endereço em breve do Diário Oficial leva ao feed, de vez", async () => {
    expect(await nextConfig.redirects?.()).toContainEqual({
      source: "/em-breve/diario-oficial",
      destination: "/diario-oficial",
      permanent: true,
    });
  });
});
