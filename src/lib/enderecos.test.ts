import { describe, expect, it } from "vitest";
import { partirEmEnderecos } from "./enderecos";

/**
 * A invariante que manda em tudo: o texto remontado é idêntico ao original.
 * O trecho é citação literal do ato e tem posição guardada para o grifo: um
 * caractere de diferença desalinha as duas coisas.
 */
function juntar(pedacos: { texto: string }[]): string {
  return pedacos.map((p) => p.texto).join("");
}

/** Só os pedaços que viraram link, na ordem. */
function links(texto: string) {
  return partirEmEnderecos(texto)
    .filter((p) => p.href !== null)
    .map((p) => ({ texto: p.texto, href: p.href }));
}

describe("aparar a pontuação do ato", () => {
  // Os sete casos vêm da medição do acervo, e as frases são de atos reais.
  it("vírgula depois da URL fica no texto, fora do href", () => {
    const trecho =
      "As inscrições serão realizadas no endereço https://sigs.ufrpe.br/sigrh/public/home.jsf, no período de 10 a 20 de maio.";

    expect(links(trecho)).toEqual([
      {
        texto: "https://sigs.ufrpe.br/sigrh/public/home.jsf",
        href: "https://sigs.ufrpe.br/sigrh/public/home.jsf",
      },
    ]);
    expect(juntar(partirEmEnderecos(trecho))).toBe(trecho);
  });

  it("fecha-parêntese sem abre é da frase, e cai", () => {
    const trecho =
      "conforme o edital constante na página do SSPM na Internet (www.marinha.mil.br/sspm/node/23); l) Estar autorizado";

    expect(links(trecho)).toEqual([
      {
        texto: "www.marinha.mil.br/sspm/node/23",
        href: "https://www.marinha.mil.br/sspm/node/23",
      },
    ]);
    expect(juntar(partirEmEnderecos(trecho))).toBe(trecho);
  });

  it("ponto final some do href e continua na tela", () => {
    const trecho = "O manual está em https://www.gov.br/servidor/faq/manual.pdf.";
    const pedacos = partirEmEnderecos(trecho);

    expect(links(trecho)).toEqual([
      {
        texto: "https://www.gov.br/servidor/faq/manual.pdf",
        href: "https://www.gov.br/servidor/faq/manual.pdf",
      },
    ]);
    expect(pedacos[pedacos.length - 1]).toEqual({ texto: ".", href: null });
    expect(juntar(pedacos)).toBe(trecho);
  });

  it("URL no fim do trecho sem pontuação sai inteira", () => {
    const trecho =
      "disponível em https://www.utfpr.edu.br/editais/concursos#b_start=0";

    expect(links(trecho)).toEqual([
      {
        texto: "https://www.utfpr.edu.br/editais/concursos#b_start=0",
        href: "https://www.utfpr.edu.br/editais/concursos#b_start=0",
      },
    ]);
    expect(juntar(partirEmEnderecos(trecho))).toBe(trecho);
  });

  it("e-mail comum vira mailto", () => {
    const trecho = "Dúvidas pelo e-mail seletivo.ch@uffs.edu.br, em dias úteis.";

    expect(links(trecho)).toEqual([
      { texto: "seletivo.ch@uffs.edu.br", href: "mailto:seletivo.ch@uffs.edu.br" },
    ]);
    expect(juntar(partirEmEnderecos(trecho))).toBe(trecho);
  });

  it("e-mail que não é endereço não vira link, e o texto não é consertado", () => {
    // Está no acervo hoje: o órgão digitou vírgula no lugar do ponto. Corrigir
    // para `gmail.com` seria emendar a citação; linkar o errado seria oferecer
    // uma porta que não abre. Fica texto.
    const trecho =
      "exclusivamente por meio do e-mail: concursoanatomia2026@gmail,com, identificando-se o assunto";

    expect(links(trecho)).toEqual([]);
    expect(partirEmEnderecos(trecho)).toEqual([{ texto: trecho, href: null }]);
  });

  it("texto sem endereço nenhum sai num pedaço só", () => {
    const trecho = "As inscrições vão de 10/03 a 15/04, na secretaria do órgão.";

    expect(partirEmEnderecos(trecho)).toEqual([{ texto: trecho, href: null }]);
  });
});

describe("o que a regra preserva", () => {
  it("barra, consulta e âncora do fim continuam no href", () => {
    const trecho =
      "no endereço https://sig.ufla.br/modulos/publico/editais/inscricoes/, no dia 26/8/2026.";

    expect(links(trecho)[0].href).toBe(
      "https://sig.ufla.br/modulos/publico/editais/inscricoes/",
    );
    expect(
      links("veja https://sigaa.ufrrj.br/sigaa/lista.jsf?nivel=L&aba=p-lato.")[0]
        .href,
    ).toBe("https://sigaa.ufrrj.br/sigaa/lista.jsf?nivel=L&aba=p-lato");
  });

  it("vírgula e parêntese dentro da URL ficam", () => {
    expect(links("veja http://x.br/mapa/(centro)/a,b hoje")[0].texto).toBe(
      "http://x.br/mapa/(centro)/a,b",
    );
  });

  it("parêntese que fecha a frase cai sem levar o que é da URL", () => {
    expect(links("(veja http://x.br/a_(b)) hoje")[0].texto).toBe(
      "http://x.br/a_(b)",
    );
  });

  it("sublinhado no fim não é pontuação de frase e fica", () => {
    // Do acervo: o diário quebrou a URL com um espaço no meio. Não dá para
    // emendar, e cortar o `_` não tornaria o link melhor, só diferente.
    const trecho =
      "no link https://sei.mj.gov.br/sei/externo.php?acao=logar&id_ orgao_acesso=0.";

    expect(links(trecho)[0].texto).toBe(
      "https://sei.mj.gov.br/sei/externo.php?acao=logar&id_",
    );
  });
});

describe("o href, que é a única coisa que pode diferir do texto", () => {
  it("www sem esquema é exibido como está e aberto por https", () => {
    const [link] = links("Inscrições em www.institutoconsulplan.org.br.");

    expect(link.texto).toBe("www.institutoconsulplan.org.br");
    expect(link.href).toBe("https://www.institutoconsulplan.org.br");
  });

  it("sinal de menor e maior delimita e não entra no endereço", () => {
    const trecho = "pelo endereço <https://pnd.inep.gov.br/pnd>, durante o período";

    expect(links(trecho)).toEqual([
      { texto: "https://pnd.inep.gov.br/pnd", href: "https://pnd.inep.gov.br/pnd" },
    ]);
    expect(juntar(partirEmEnderecos(trecho))).toBe(trecho);
  });

  it("só sai href que começa por http, https ou mailto", () => {
    const trecho =
      "veja javascript:alert(1) e data:text/html,x e file:///etc/passwd e www.x.br";

    for (const { href } of links(trecho)) {
      expect(href).toMatch(/^(?:https?:\/\/|mailto:)/);
    }
  });

  it("hospedeiro que não é domínio não vira link", () => {
    expect(links("o protocolo https:// não é endereço")).toEqual([]);
    expect(links("veja http://localhost:3000 no seu micro")).toEqual([]);
  });
});

describe("o trecho inteiro", () => {
  it("acha vários endereços e devolve o texto costurado", () => {
    const trecho =
      "Inscreva-se em www.a.br/x, tire dúvidas em fulano@b.edu.br ou em https://c.br/d).";
    const pedacos = partirEmEnderecos(trecho);

    expect(pedacos.map((p) => p.href)).toEqual([
      null,
      "https://www.a.br/x",
      null,
      "mailto:fulano@b.edu.br",
      null,
      "https://c.br/d",
      null,
    ]);
    expect(juntar(pedacos)).toBe(trecho);
  });

  it("texto vazio não devolve pedaço nenhum", () => {
    expect(partirEmEnderecos("")).toEqual([]);
  });

  it("o texto remontado é sempre o original, com pontuação acumulada", () => {
    for (const trecho of [
      "veja www.x.br...",
      "veja (www.x.br);",
      "veja <www.x.br>,",
      "veja www.x.br?",
      "e-mail: a@b.br. Site: www.c.br.",
      "já viu www.x.br? sim",
    ]) {
      expect(juntar(partirEmEnderecos(trecho))).toBe(trecho);
    }
  });

  it("não guarda posição de uma chamada para a outra", () => {
    // A expressão é global e mora no módulo: sem zerar `lastIndex`, a segunda
    // chamada começaria onde a primeira parou e perderia o endereço.
    const trecho = "inscreva-se em www.x.br hoje";

    expect(links(trecho)).toEqual(links(trecho));
    expect(links(trecho)).toHaveLength(1);
  });
});
