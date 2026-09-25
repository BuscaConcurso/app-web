import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Selo } from "./Cartao";

const LOGO = "https://api.buscaconcurso.com.br/logos/ab/cd/" + "a".repeat(64) + ".webp";

function selo(props: Parameters<typeof Selo>[0]): string {
  return renderToStaticMarkup(createElement(Selo, props));
}

/** O `style` da caixa de fora, que carrega o lado em pixels. */
function lado(html: string): string | undefined {
  return html.match(/^<span[^>]*style="([^"]*)"/)?.[1];
}

describe("Selo", () => {
  it("com logo, desenha a imagem numa caixa do lado e do raio do selo", () => {
    const html = selo({ sigla: "STJ", logoUrl: LOGO });
    expect(html).toContain(`<img src="${LOGO}" alt=""`);
    expect(html).not.toContain(">STJ<");
    expect(lado(html)).toBe("width:44px;height:44px");
    expect(html).toContain("rounded-[12px]");
    expect(html).toContain("bg-logo-fundo");
  });

  it("o logo no selo grande mede 72px e tem raio de 18px, como a sigla", () => {
    const comLogo = selo({ sigla: "UFRRJ", logoUrl: LOGO, tamanho: 72 });
    const comSigla = selo({ sigla: "UFRRJ", tamanho: 72 });
    expect(lado(comLogo)).toBe("width:72px;height:72px");
    expect(lado(comSigla)).toBe(lado(comLogo));
    expect(comLogo).toContain("rounded-[18px]");
    expect(comSigla).toContain("rounded-[18px]");
  });

  it("sem logo, a sigla no anil, sem imagem", () => {
    const html = selo({ sigla: "UFMG", logoUrl: null, tamanho: 36 });
    expect(html).not.toContain("<img");
    expect(html).toContain(">UFMG<");
    expect(html).toContain("bg-anil-fundo");
    expect(lado(html)).toBe("width:36px;height:36px");
  });

  it("URL que não é de imagem na web cai para a sigla", () => {
    const html = selo({ sigla: "MD", logoUrl: "javascript:alert(1)" });
    expect(html).not.toContain("<img");
    expect(html).toContain(">MD<");
  });

  it("sem logo e sem sigla, a caixa lisa do mesmo lado", () => {
    const html = selo({ sigla: null, tamanho: 42 });
    expect(html).not.toContain("<img");
    expect(html).toBe(
      '<span aria-hidden="true" class="flex shrink-0 items-center justify-center text-center leading-none rounded-[12px] bg-anil-fundo text-anil-texto" style="width:42px;height:42px"></span>',
    );
  });
});
