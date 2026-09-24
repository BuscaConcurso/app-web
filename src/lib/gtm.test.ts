import { describe, expect, it } from "vitest";
import { idDoGtm, scriptDoGtm, urlDoNoscriptDoGtm } from "@/lib/gtm";

describe("idDoGtm", () => {
  it("aceita um ID de contêiner válido", () => {
    expect(idDoGtm("GTM-ABC1234")).toBe("GTM-ABC1234");
  });

  it("apara espaços vindos do painel de Variables", () => {
    expect(idDoGtm("  GTM-ABC1234\n")).toBe("GTM-ABC1234");
  });

  it.each([undefined, "", "   ", "G-ABC1234", "UA-123-1", "GTM-", "gtm-abc1234", "GTM-ABC1234');alert(1);//"])(
    "desliga o GTM para %p",
    (valor) => {
      expect(idDoGtm(valor)).toBeNull();
    },
  );
});

describe("snippet", () => {
  it("usa o ID no carregador do gtm.js", () => {
    const js = scriptDoGtm("GTM-ABC1234");
    expect(js).toContain("https://www.googletagmanager.com/gtm.js?id=");
    expect(js).toContain("'GTM-ABC1234'");
    expect(js).toContain("dataLayer");
  });

  it("aponta o noscript para o iframe do contêiner", () => {
    expect(urlDoNoscriptDoGtm("GTM-ABC1234")).toBe(
      "https://www.googletagmanager.com/ns.html?id=GTM-ABC1234",
    );
  });
});
