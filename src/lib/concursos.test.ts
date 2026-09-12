import { describe, expect, it } from "vitest";
import { contagensDeFaceta, contarConcursos, listarConcursos } from "./concursos";
import type { Escolaridade } from "./dominio";
import type { Situacao } from "./consulta";

/**
 * As contagens da coluna de filtros são uma promessa ao usuário: o número ao
 * lado da opção é quantos resultados ele vai encontrar se clicar nela. Estes
 * testes checam a promessa contra o próprio filtro, em vez de fixar números
 * do mock, que mudam a cada edição do acervo.
 */
const HOJE = new Date(2026, 3, 10, 9, 0);

describe("contagensDeFaceta", () => {
  it("a contagem de uma opção é o que ela devolve quando marcada", async () => {
    const contagens = await contagensDeFaceta({}, HOJE);

    for (const opcao of contagens.situacoes) {
      const real = await contarConcursos(
        { situacoes: [opcao.valor as Situacao] },
        HOJE,
      );
      expect(opcao.total, `situação ${opcao.valor}`).toBe(real);
    }

    for (const opcao of contagens.escolaridades) {
      const real = await contarConcursos(
        { escolaridades: [opcao.valor as Escolaridade] },
        HOJE,
      );
      expect(opcao.total, `escolaridade ${opcao.valor}`).toBe(real);
    }

    for (const opcao of contagens.bancas) {
      const real = await contarConcursos({ bancas: [opcao.valor] }, HOJE);
      expect(opcao.total, `banca ${opcao.valor}`).toBe(real);
    }
  });

  it("as outras dimensões continuam valendo na contagem", async () => {
    const semUf = await contagensDeFaceta({}, HOJE);
    const comUf = await contagensDeFaceta({ uf: "SP" }, HOJE);

    for (const opcao of comUf.escolaridades) {
      const real = await contarConcursos(
        { uf: "SP", escolaridades: [opcao.valor as Escolaridade] },
        HOJE,
      );
      expect(opcao.total).toBe(real);
      const equivalente = semUf.escolaridades.find(
        (outra) => outra.valor === opcao.valor,
      );
      expect(opcao.total).toBeLessThanOrEqual(equivalente!.total);
    }
  });

  it("as situações particionam o acervo", async () => {
    const contagens = await contagensDeFaceta({}, HOJE);
    const soma = contagens.situacoes.reduce((total, o) => total + o.total, 0);
    const acervo = await contarConcursos({}, HOJE);
    expect(soma).toBe(acervo);
  });

  it("mantém a opção que zeraria o resultado", async () => {
    // Uma combinação impossível de propósito: se a coluna escondesse a linha,
    // ela mudaria de tamanho a cada clique e a pessoa perderia a referência.
    const contagens = await contagensDeFaceta(
      { situacoes: ["previstos"], bancas: ["quadrix"] },
      HOJE,
    );
    expect(contagens.escolaridades.length).toBeGreaterThan(0);
    expect(contagens.escolaridades.every((o) => o.total >= 0)).toBe(true);
  });
});

describe("listarConcursos", () => {
  it("pagina sem perder nem repetir item", async () => {
    const inteiro = await listarConcursos({ porPagina: 1000 }, HOJE);
    const primeira = await listarConcursos({ porPagina: 10, pagina: 1 }, HOJE);
    const segunda = await listarConcursos({ porPagina: 10, pagina: 2 }, HOJE);

    expect(primeira.total).toBe(inteiro.total);
    expect(primeira.paginas).toBe(Math.ceil(inteiro.total / 10));
    expect([...primeira.itens, ...segunda.itens].map((c) => c.slug)).toEqual(
      inteiro.itens.slice(0, 20).map((c) => c.slug),
    );
  });

  it("uma página além do fim vem vazia, não quebra", async () => {
    const resultado = await listarConcursos({ pagina: 999 }, HOJE);
    expect(resultado.itens).toEqual([]);
    expect(resultado.total).toBeGreaterThan(0);
  });
});
