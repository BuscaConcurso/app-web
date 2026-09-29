import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoDeConsentimento, quemMede } from "./BannerDeConsentimento";

describe("quemMede", () => {
  it("diz o nome de cada ferramenta ligada", () => {
    expect(quemMede({ posthog: true, gtm: true })).toBe("do PostHog e do Google");
    expect(quemMede({ posthog: true, gtm: false })).toBe("do PostHog");
    expect(quemMede({ posthog: false, gtm: true })).toBe("do Google");
  });
});

describe("CartaoDeConsentimento", () => {
  const html = renderToStaticMarkup(
    createElement(CartaoDeConsentimento, { ligados: { posthog: true, gtm: true }, aoResponder: () => {} }),
  );

  it("é uma região com nome, não um modal que prende o foco", () => {
    expect(html).toContain('aria-label="Cookies"');
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("aria-modal");
  });

  it("recusar é tão fácil quanto aceitar: dois botões, lado a lado", () => {
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain(">Recusar</button>");
    expect(html).toContain(">Aceitar</button>");
  });

  it("diz quem mede e que o que se digita não é gravado", () => {
    expect(html).toContain("do PostHog e do Google");
    expect(html).toContain("sem o que você digita nos campos");
  });

  it("não esconde o que acontece ao recusar", () => {
    expect(html).toContain("Sem ela, só contamos visitas, sem cookie e sem saber quem é você.");
  });
});

describe("CartaoDeConsentimento só com o GTM", () => {
  const html = renderToStaticMarkup(
    createElement(CartaoDeConsentimento, { ligados: { posthog: false, gtm: true }, aoResponder: () => {} }),
  );

  it("não promete gravação nem contagem anônima, que são do PostHog", () => {
    expect(html).toContain("do Google");
    expect(html).not.toContain("gravam a navegação");
    expect(html).not.toContain("só contamos visitas");
    expect(html).toContain("Sem ela, nada é medido.");
  });
});
