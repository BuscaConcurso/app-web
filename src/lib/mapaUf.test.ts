import { describe, expect, it } from "vitest";
import { lerCor, razaoDeContraste } from "./contraste";
import { UFS } from "./dominio";
import { ESTILO_DO_NIVEL, nivelDoMapa, POSICAO_UF } from "./mapaUf";

describe("mapa por UF", () => {
  it("tem posição para as 27 UFs e nenhuma célula repetida", () => {
    expect(Object.keys(POSICAO_UF).sort()).toEqual([...UFS].sort());
    const celulas = Object.values(POSICAO_UF).map(({ coluna, linha }) => `${coluna},${linha}`);
    expect(new Set(celulas).size).toBe(27);
  });

  it("reproduz a escala do protótipo (máximo 31)", () => {
    expect(nivelDoMapa(0, 31)).toBe(0);
    expect(nivelDoMapa(1, 31)).toBe(1);
    expect(nivelDoMapa(2, 31)).toBe(2);
    expect(nivelDoMapa(4, 31)).toBe(3);
    expect(nivelDoMapa(6, 31)).toBe(4);
    expect(nivelDoMapa(7, 31)).toBe(5);
    expect(nivelDoMapa(9, 31)).toBe(5);
    expect(nivelDoMapa(18, 31)).toBe(6);
    expect(nivelDoMapa(31, 31)).toBe(7);
  });

  it("acervo vazio não divide por zero", () => {
    expect(nivelDoMapa(0, 0)).toBe(0);
  });

  it("todo nível passa 4,5:1 entre texto e fundo", () => {
    for (const [nivel, { fundo, texto }] of Object.entries(ESTILO_DO_NIVEL)) {
      expect(
        razaoDeContraste(lerCor(texto).rgb, lerCor(fundo).rgb),
        `nível ${nivel}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
