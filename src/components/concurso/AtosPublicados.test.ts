import { describe, expect, it } from "vitest";
import { enderecoLegivel } from "./AtosPublicados";

describe("enderecoLegivel", () => {
  it("tira protocolo, query e barra final", () => {
    expect(
      enderecoLegivel("https://servicos.ufrrj.br/concursos/?acao=concursos_andamento&tipo=9"),
    ).toBe("servicos.ufrrj.br/concursos");
  });

  it("mantém o caminho", () => {
    expect(enderecoLegivel("http://www.banca.org.br/edital/2026/01")).toBe(
      "www.banca.org.br/edital/2026/01",
    );
  });

  it("devolve o texto sem protocolo quando não é URL", () => {
    expect(enderecoLegivel("banca.org.br/edital")).toBe("banca.org.br/edital");
  });
});
