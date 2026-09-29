import { notFound } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aberturaDoMetodo, numerosSemDerrubar } from "./metodo";

const NUMEROS = { concursos: 4649, orgaos: 1332, bancas: 87 };

describe("numerosSemDerrubar", () => {
  afterEach(() => vi.restoreAllMocks());

  it("devolve os números quando o acervo responde", async () => {
    expect(await numerosSemDerrubar(async () => NUMEROS)).toEqual(NUMEROS);
  });

  it("devolve null, e não lança, quando o acervo falha", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      await numerosSemDerrubar(async () => {
        throw new Error("a API respondeu 503");
      }),
    ).toBeNull();
    expect(log).toHaveBeenCalledOnce();
  });

  it("deixa passar o sinal do próprio Next", async () => {
    await expect(
      numerosSemDerrubar(async () => {
        notFound();
      }),
    ).rejects.toThrow();
  });
});

describe("aberturaDoMetodo", () => {
  it("com números, diz quantos concursos, órgãos e bancas", () => {
    expect(aberturaDoMetodo(NUMEROS)).toContain(
      "Hoje a lista tem 4.649 concursos de 1.332 órgãos, com 87 bancas organizadoras citadas nos atos.",
    );
  });

  it("sem números, não afirma número nenhum", () => {
    const texto = aberturaDoMetodo(null);
    expect(texto).not.toMatch(/\d/);
    expect(texto).not.toContain("Hoje a lista");
  });
});
