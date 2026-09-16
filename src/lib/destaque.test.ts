import { describe, expect, it } from "vitest";
import { ancoraDoTrecho, destacar, grifavel, type Faixa } from "./destaque";
import { partirEmParagrafos } from "./leitura";

const ATO = "Aviso. As inscrições vão de 10/03 a 15/04. Prova em 22/11. Fim.";

/** Um ato com estrutura, para o grifo medido depois da partição. */
const ATO_LONGO =
  "EDITAL Nº 47 A UNIVERSIDADE torna pública a abertura das inscrições. " +
  "3. DAS INSCRIÇÕES. " +
  "2.1. A taxa de inscrição será de R$ 120,75 e cabe pedido de isenção. " +
  "3.1. Serão de exclusiva responsabilidade do candidato os dados informados.";

/** O texto reconstruído tem de ser idêntico ao original, sempre. */
function juntar(pedacos: { texto: string }[]): string {
  return pedacos.map((p) => p.texto).join("");
}

describe("destacar", () => {
  it("marca o trecho e devolve o resto em volta", () => {
    const inicio = ATO.indexOf("As inscrições");
    const fim = ATO.indexOf(". Prova") + 1;

    const pedacos = destacar(ATO, [{ inicio, fim }]);

    expect(pedacos.map((p) => p.destacado)).toEqual([false, true, false]);
    expect(pedacos[1].texto).toBe("As inscrições vão de 10/03 a 15/04.");
    expect(juntar(pedacos)).toBe(ATO);
  });

  it("une faixas sobrepostas numa marca só", () => {
    // É o caso comum, não a borda: no acervo, 19 pares de trechos aceitos se
    // sobrepõem, porque a mesma frase responde "até quando", "onde" e "como".
    const inicio = ATO.indexOf("As inscrições");
    const pedacos = destacar(ATO, [
      { inicio, fim: inicio + 30 },
      { inicio: inicio + 10, fim: inicio + 35 },
      { inicio, fim: inicio + 13 },
    ]);

    expect(pedacos.filter((p) => p.destacado)).toHaveLength(1);
    expect(pedacos.filter((p) => p.destacado)[0].texto).toBe(
      ATO.slice(inicio, inicio + 35),
    );
    expect(juntar(pedacos)).toBe(ATO);
  });

  it("faixas separadas viram marcas separadas", () => {
    const pedacos = destacar(ATO, [
      { inicio: 0, fim: 6 },
      { inicio: ATO.indexOf("Prova"), fim: ATO.indexOf("Prova") + 14 },
    ]);

    expect(pedacos.filter((p) => p.destacado)).toHaveLength(2);
    expect(juntar(pedacos)).toBe(ATO);
  });

  it("faixa inválida some, e o texto continua inteiro", () => {
    // A posição vem do banco. Se um dia ela não casar com o texto, o defeito
    // certo é o destaque faltar — nunca a página mostrar o ato picado no
    // lugar errado.
    const pedacos = destacar(ATO, [
      { inicio: 10, fim: 5 },
      { inicio: 5, fim: 5 },
      { inicio: 9000, fim: 9100 },
    ]);

    expect(pedacos).toEqual([{ texto: ATO, destacado: false }]);
  });

  it("faixa que passa do fim do texto é aparada, não descartada", () => {
    const pedacos = destacar(ATO, [{ inicio: ATO.length - 4, fim: 9000 }]);

    expect(pedacos[pedacos.length - 1]).toEqual({ texto: "Fim.", destacado: true });
    expect(juntar(pedacos)).toBe(ATO);
  });

  it("sem faixa nenhuma, um pedaço só e nada marcado", () => {
    expect(destacar(ATO, [])).toEqual([{ texto: ATO, destacado: false }]);
  });
});

describe("a âncora do trecho", () => {
  it("vai no pedaço destacado que a faixa produziu", () => {
    const inicio = ATO.indexOf("As inscrições");
    const pedacos = destacar(ATO, [
      { inicio, fim: inicio + 10, ancora: "ato-1-ate_quando" },
    ]);

    expect(pedacos[1]).toEqual({
      texto: ATO.slice(inicio, inicio + 10),
      destacado: true,
      ancoras: ["ato-1-ate_quando"],
    });
    expect(juntar(pedacos)).toBe(ATO);
  });

  it("três perguntas na mesma frase viram uma marca com três âncoras", () => {
    // É o caso que obrigou a âncora a ser um elemento vazio e não um `id` no
    // próprio `<mark>`: a marca é uma só e os endereços são três.
    const inicio = ATO.indexOf("As inscrições");
    const pedacos = destacar(ATO, [
      { inicio, fim: inicio + 20, ancora: "ato-1-ate_quando" },
      { inicio: inicio + 5, fim: inicio + 30, ancora: "ato-1-onde_inscrever" },
      { inicio, fim: inicio + 12, ancora: "ato-1-como_inscrever" },
    ]);

    const marcas = pedacos.filter((p) => p.destacado);
    expect(marcas).toHaveLength(1);
    // A ordem é a da união — começo, depois fim —, e não a da entrada. Para o
    // que as âncoras fazem, tanto faz: são três `id` no mesmo lugar.
    expect(marcas[0].ancoras).toEqual([
      "ato-1-como_inscrever",
      "ato-1-ate_quando",
      "ato-1-onde_inscrever",
    ]);
  });

  it("faixa sem âncora não inventa o campo", () => {
    const pedacos = destacar(ATO, [{ inicio: 0, fim: 6 }]);
    expect(pedacos[0]).toEqual({ texto: "Aviso.", destacado: true });
  });

  it("a faixa descartada leva a âncora junto", () => {
    // É o que faz o recorte por parágrafo funcionar sem caso especial: a
    // faixa que não cai neste pedaço de texto não deixa `id` para trás.
    expect(destacar(ATO, [{ inicio: 9000, fim: 9100, ancora: "ato-1-etapas" }])).toEqual([
      { texto: ATO, destacado: false },
    ]);
  });
});

describe("o grifo sobre um ato partido em parágrafos", () => {
  /** O que `AtosPublicados` faz: desconta o começo do parágrafo das faixas e
   *  só deixa a âncora no parágrafo em que a faixa de fato começa. */
  function noParagrafo(faixas: Faixa[], inicio: number): Faixa[] {
    return faixas.map((faixa) => ({
      inicio: faixa.inicio - inicio,
      fim: faixa.fim - inicio,
      ancora: faixa.inicio >= inicio ? faixa.ancora : undefined,
    }));
  }

  it("o grifo cai no mesmo lugar depois da partição", () => {
    const paragrafos = partirEmParagrafos(ATO_LONGO);
    const alvo = ATO_LONGO.indexOf("A taxa");
    const faixas: Faixa[] = [
      { inicio: alvo, fim: alvo + 30, ancora: "ato-9-quanto_custa" },
    ];

    const pintado = paragrafos.map((p) =>
      destacar(p.texto, noParagrafo(faixas, p.inicio)),
    );

    // O texto sai inteiro, e o grifo é exatamente o trecho pedido.
    expect(pintado.flat().map((p) => p.texto).join("")).toBe(ATO_LONGO);
    const marcas = pintado.flat().filter((p) => p.destacado);
    expect(marcas).toHaveLength(1);
    expect(marcas[0].texto).toBe(ATO_LONGO.slice(alvo, alvo + 30));
    expect(marcas[0].ancoras).toEqual(["ato-9-quanto_custa"]);
  });

  it("o trecho que atravessa a quebra vira uma marca de cada lado, e a âncora fica com a primeira", () => {
    const paragrafos = partirEmParagrafos(ATO_LONGO);
    const alvo = ATO_LONGO.indexOf("isenção");
    const depoisDaQuebra = ATO_LONGO.indexOf("3.1. Serão") + 20;
    const faixas: Faixa[] = [
      { inicio: alvo, fim: depoisDaQuebra, ancora: "ato-9-quanto_custa" },
    ];

    const pintado = paragrafos.map((p) =>
      destacar(p.texto, noParagrafo(faixas, p.inicio)),
    );

    const marcas = pintado.flat().filter((p) => p.destacado);
    expect(marcas).toHaveLength(2);
    // Somadas, as duas dão o trecho inteiro: nada se perdeu na quebra.
    expect(marcas.map((m) => m.texto).join("")).toBe(
      ATO_LONGO.slice(alvo, depoisDaQuebra),
    );
    // E o `id` aparece uma vez só, no começo do trecho.
    expect(marcas.map((m) => m.ancoras)).toEqual([["ato-9-quanto_custa"], undefined]);
  });
});

describe("grifavel", () => {
  it("recusa o que destacar descartaria, e aceita o que ele pinta", () => {
    expect(grifavel(ATO, 5, 20)).toBe(true);
    expect(grifavel(ATO, 20, 5)).toBe(false);
    expect(grifavel(ATO, 5, 5)).toBe(false);
    expect(grifavel(ATO, 9000, 9100)).toBe(false);
    expect(grifavel(ATO, null, 20)).toBe(false);
    expect(grifavel(null, 5, 20)).toBe(false);
  });

  it("a faixa que passa do fim é aceita, porque ela vira marca", () => {
    expect(grifavel(ATO, ATO.length - 4, 9000)).toBe(true);
  });
});

describe("ancoraDoTrecho", () => {
  it("é o id do ato com a pergunta atrás", () => {
    expect(ancoraDoTrecho("50441767", "ate_quando")).toBe(
      "ato-50441767-ate_quando",
    );
  });
});
