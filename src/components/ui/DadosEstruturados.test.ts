import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DadosEstruturados, jsonParaScript } from "./DadosEstruturados";

const MALICIOSO = {
  "@type": "Event",
  name: "Edital </script><script>alert(1)</script> & <!-- \u2028\u2029 >",
};

describe("DadosEstruturados", () => {
  it("um título com </script> não fecha o bloco no HTML renderizado", () => {
    const html = renderToStaticMarkup(createElement(DadosEstruturados, { dados: MALICIOSO }));
    expect(html.startsWith('<script type="application/ld+json">')).toBe(true);
    // Um único fim de script, o do próprio bloco, no fim do HTML.
    expect(html.match(/<\/script/gi)).toHaveLength(1);
    expect(html.endsWith("</script>")).toBe(true);
    const corpo = html.slice('<script type="application/ld+json">'.length, -"</script>".length);
    expect(corpo).not.toMatch(/[<>&\u2028\u2029]/);
    // Quem analisa o bloco recebe exatamente a mesma string.
    expect(JSON.parse(corpo)).toEqual(MALICIOSO);
  });

  it("escapa <, >, &, U+2028 e U+2029 como escapes de JSON", () => {
    expect(jsonParaScript("<>&\u2028\u2029")).toBe('"\\u003c\\u003e\\u0026\\u2028\\u2029"');
  });
});
