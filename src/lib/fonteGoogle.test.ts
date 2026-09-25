import { describe, expect, it } from "vitest";
import { carregarFonteGoogle } from "./fonteGoogle";

const CSS_COM_TTF =
  "@font-face{font-family:'Bricolage Grotesque';font-style:normal;" +
  "font-weight:700;src: url(https://fonts.gstatic.com/s/x.ttf) format('truetype');}";

const CSS_SEM_REFERENCIA_UTIL =
  "@font-face{font-family:'Bricolage Grotesque';src: url(data:;) format('woff2');}";

function fetchQueDevolve(...respostas: Response[]): typeof fetch {
  let chamada = 0;
  return async () => respostas[Math.min(chamada++, respostas.length - 1)];
}

function fetchQueLanca(erro: Error): typeof fetch {
  return async () => {
    throw erro;
  };
}

describe("carregarFonteGoogle", () => {
  it("devolve o ArrayBuffer da fonte quando as duas respostas vêm certas", async () => {
    const bytesEsperados = new Uint8Array([1, 2, 3, 4]).buffer;
    const fetchImpl = fetchQueDevolve(
      new Response(CSS_COM_TTF, { status: 200 }),
      new Response(bytesEsperados, { status: 200 }),
    );

    const resultado = await carregarFonteGoogle({
      familia: "Bricolage Grotesque",
      peso: 700,
      texto: "abc",
      fetchImpl,
    });

    expect(resultado).not.toBeNull();
    expect(new Uint8Array(resultado!)).toEqual(new Uint8Array(bytesEsperados));
  });

  it("degrada para null quando a resposta do CSS não é 2xx", async () => {
    const fetchImpl = fetchQueDevolve(new Response("fora do ar", { status: 503 }));

    const resultado = await carregarFonteGoogle({
      familia: "Bricolage Grotesque",
      peso: 700,
      texto: "abc",
      fetchImpl,
    });

    expect(resultado).toBeNull();
  });

  it("degrada para null quando o CSS não tem a linha src: url(...) format(...) esperada", async () => {
    const fetchImpl = fetchQueDevolve(new Response(CSS_SEM_REFERENCIA_UTIL, { status: 200 }));

    const resultado = await carregarFonteGoogle({
      familia: "Bricolage Grotesque",
      peso: 700,
      texto: "abc",
      fetchImpl,
    });

    expect(resultado).toBeNull();
  });

  it("degrada para null quando a segunda resposta (o arquivo da fonte) não é 2xx", async () => {
    const fetchImpl = fetchQueDevolve(
      new Response(CSS_COM_TTF, { status: 200 }),
      new Response("não achei", { status: 404 }),
    );

    const resultado = await carregarFonteGoogle({
      familia: "Bricolage Grotesque",
      peso: 700,
      texto: "abc",
      fetchImpl,
    });

    expect(resultado).toBeNull();
  });

  it("degrada para null quando o fetch lança (rede fora do ar, timeout)", async () => {
    const fetchImpl = fetchQueLanca(new Error("network error"));

    const resultado = await carregarFonteGoogle({
      familia: "Bricolage Grotesque",
      peso: 700,
      texto: "abc",
      fetchImpl,
    });

    expect(resultado).toBeNull();
  });

  it("nunca lança, mesmo com as três formas de falha acima", async () => {
    await expect(
      carregarFonteGoogle({
        familia: "x",
        peso: 400,
        texto: "y",
        fetchImpl: fetchQueLanca(new Error("boom")),
      }),
    ).resolves.toBeNull();
  });
});
