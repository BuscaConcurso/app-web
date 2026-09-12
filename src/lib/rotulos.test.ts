import { describe, expect, it } from "vitest";
import { linhaDeContexto } from "./rotulos";

/**
 * A linha de contexto do cartão ("Estadual · Judiciário · São Paulo, SP") com
 * o órgão como o acervo do engine o entrega hoje: sem esfera em nenhum dos
 * 1.332 órgãos, e sem `poder`, que não existe no banco. O tipo `Orgao` declara
 * os dois obrigatórios — daí os `as never`: a divergência é entre o tipo e o
 * dado real, e é ela que este teste fixa até o tipo ser decidido.
 */
describe("linhaDeContexto", () => {
  it("órgão sem esfera e sem poder não vira separador vazio", () => {
    const linha = linhaDeContexto({
      esfera: null as never,
      poder: null as never,
      uf: null,
      municipio: null,
    });

    expect(linha).toBe("Nacional");
    expect(linha).not.toContain(" · ");
  });

  it("com esfera e poder, a linha continua a do canvas", () => {
    expect(
      linhaDeContexto({
        esfera: "estadual",
        poder: "judiciario",
        uf: "SP",
        municipio: "São Paulo",
      }),
    ).toBe("Estadual · Judiciário · São Paulo, SP");
  });
});
