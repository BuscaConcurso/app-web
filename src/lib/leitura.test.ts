import { describe, expect, it } from "vitest";
import { partirEmParagrafos } from "./leitura";

/** A invariante que manda em tudo: a soma dos parágrafos é o ato. */
function juntar(texto: string): string {
  return partirEmParagrafos(texto)
    .map((p) => p.texto)
    .join("");
}

function comecos(texto: string): string[] {
  return partirEmParagrafos(texto).map((p) => p.texto.slice(0, 24));
}

/** Um edital de verdade, encurtado: os seis marcadores em uso. */
const EDITAL =
  "EDITAL Nº 47, DE 10 DE SETEMBRO DE 2026 A UNIVERSIDADE FEDERAL DE VIÇOSA, " +
  "nos termos da Lei nº 12.772/2012 e do Decreto nº 7.485, de 28 de novembro " +
  "de 2011, torna pública a abertura das inscrições. " +
  "1. DAS DISPOSIÇÕES PRELIMINARES. " +
  "1.1.Este edital admitirá inscrições por cotas. " +
  "2. DAS INSCRIÇÕES. " +
  "2.1. A taxa de inscrição será de R$ 6.180,86 e os candidatos poderão " +
  "solicitar isenção; " +
  "2.1.1. O resultado da solicitação será divulgado no sítio da UFV. " +
  "Art. 3º São documentos exigidos: " +
  "a) RG ou CNH; " +
  "b) CPF. " +
  "I - Fica divulgado no ANEXO I o resultado; " +
  "II - dentro do prazo. " +
  "ANEXO I QUADRO DE VAGAS";

describe("partirEmParagrafos", () => {
  it("devolve o ato inteiro, caractere por caractere", () => {
    expect(juntar(EDITAL)).toBe(EDITAL);
  });

  it("cada parágrafo sabe onde começa no texto original", () => {
    const paragrafos = partirEmParagrafos(EDITAL);
    let cursor = 0;
    for (const paragrafo of paragrafos) {
      expect(paragrafo.inicio).toBe(cursor);
      expect(EDITAL.slice(paragrafo.inicio, paragrafo.inicio + paragrafo.texto.length)).toBe(
        paragrafo.texto,
      );
      cursor += paragrafo.texto.length;
    }
    expect(cursor).toBe(EDITAL.length);
  });

  it("abre um parágrafo em cada um dos seis marcadores", () => {
    expect(comecos(EDITAL)).toEqual([
      "EDITAL Nº 47, DE 10 DE S",
      "1. DAS DISPOSIÇÕES PRELI",
      "1.1.Este edital admitirá",
      "2. DAS INSCRIÇÕES. ",
      "2.1. A taxa de inscrição",
      "2.1.1. O resultado da so",
      "Art. 3º São documentos e",
      "a) RG ou CNH; ",
      "b) CPF. ",
      "I - Fica divulgado no AN",
      "II - dentro do prazo. ",
      "ANEXO I QUADRO DE VAGAS",
    ]);
  });

  it("o espaço que separava fica no fim do parágrafo de cima", () => {
    // A quebra cai *entre* dois caracteres que já existiam: nada é inserido
    // para separar, e nada é consumido ao separar.
    const paragrafos = partirEmParagrafos("Fim da frase. 1. DAS INSCRIÇÕES.");
    expect(paragrafos.map((p) => p.texto)).toEqual([
      "Fim da frase. ",
      "1. DAS INSCRIÇÕES.",
    ]);
  });

  it("o ato curto sem marcador sai como um parágrafo só", () => {
    // Os 272 de 420 medidos, mediana de 1.252 caracteres: não há o que
    // quebrar, e forçar quebra neles seria piorar.
    const curto =
      "EDITAL Nº 93 HOMOLOGAÇÃO DE PROCESSO SELETIVO A Diretora Geral torna " +
      "público o resultado final, a seguir discriminado: ALEX SANDER 89 ANA " +
      "CAROLINA 75 JORDANA ECCEL 62";
    expect(partirEmParagrafos(curto)).toHaveLength(1);
  });

  it("texto vazio não vira um parágrafo vazio", () => {
    expect(partirEmParagrafos("")).toEqual([]);
  });
});

describe("o que a regra recusa, e é por isso que ela existe", () => {
  const intacto = (texto: string) => expect(partirEmParagrafos(texto)).toHaveLength(1);

  it("número de lei, decreto e dinheiro", () => {
    intacto("Nos termos da Lei nº 12.772/2012 e do Decreto nº 9.508, de 2015.");
    intacto("A taxa será de R$ 6.180,86 (seis mil reais) por candidato.");
    intacto("Serão oferecidas 1.500 vagas Para o certame inteiro.");
  });

  it("ano no fim de frase, que tem ponto, espaço e maiúscula depois", () => {
    // O caso perigoso: só o limite de dois dígitos por nível o segura.
    intacto("Publicada em 28 de novembro de 2011. A partir dela, tudo mudou.");
  });

  it("número que é quantidade, e não item: o que vem depois é minúsculo", () => {
    intacto("A sessão começa às 14.30 horas do mesmo dia.");
    // Aqui o `01.` é o valor de "Nº Vagas" e não abre nada, embora venha
    // depois de `:` e de um espaço. Quem abre é o `d)`, que é alínea de
    // verdade — as duas decisões no mesmo pedaço de texto real.
    expect(partirEmParagrafos("c) Nº Vagas: 01. d) Localização: Alfenas-MG.")).toEqual([
      { texto: "c) Nº Vagas: 01. ", inicio: 0 },
      { texto: "d) Localização: Alfenas-MG.", inicio: 17 },
    ]);
  });

  it("anexo e artigo citados no meio da frase", () => {
    // Sem a condição de abertura, estes dois quebravam — foi o que a medição
    // nos 420 atos mostrou primeiro.
    intacto("Fica divulgado no ANEXO II deste Edital o resultado final.");
    intacto("O Anexo II do Edital nº 12/2026 fica retificado.");
    intacto("As alterações previstas nos arts. 1º e 2º são retificatórias.");
  });

  it("item sem ponto final não é item", () => {
    // A lista de aprovados da Cebraspe usa `2.1 ` sem ponto; sem o ponto não
    // há como distinguir do resto, e o ato fica inteiro.
    intacto("Relação final na seguinte ordem: 10085595, Edilton Oliveira.");
  });
});

describe("o marcador é atravessado de uma vez", () => {
  it("`Art. 10.` abre um parágrafo, não dois", () => {
    // Sem isso o `10.` era lido como item novo e a quebra caía entre o
    // `Art.` e o número dele, deixando um parágrafo com a palavra `Art.`.
    const paragrafos = partirEmParagrafos(
      "Fim da frase. Art. 10. O candidato poderá desistir do certame.",
    );
    expect(paragrafos.map((p) => p.texto)).toEqual([
      "Fim da frase. ",
      "Art. 10. O candidato poderá desistir do certame.",
    ]);
  });
});
