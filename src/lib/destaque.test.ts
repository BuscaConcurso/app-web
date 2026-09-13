import { describe, expect, it } from "vitest";
import { destacar } from "./destaque";

const ATO = "Aviso. As inscrições vão de 10/03 a 15/04. Prova em 22/11. Fim.";

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
