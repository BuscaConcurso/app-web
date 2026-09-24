import { describe, expect, it } from "vitest";
import { chipsAtivos } from "./filtrosAtivos";
import { CONSULTA_VAZIA } from "./parametros";

describe("chipsAtivos", () => {
  const consulta = {
    ...CONSULTA_VAZIA,
    q: "tribunal",
    uf: "SP" as const,
    escolaridades: ["medio" as const],
  };

  it("tirar um filtro mantém o termo no caminho", () => {
    expect(chipsAtivos(consulta).find((chip) => chip.chave === "uf")?.href).toBe(
      "/busca/tribunal?escolaridade=medio",
    );
  });

  it("tirar o termo leva à listagem com os mesmos filtros", () => {
    expect(chipsAtivos(consulta).find((chip) => chip.chave === "q")?.href).toBe(
      "/concursos?uf=SP&escolaridade=medio",
    );
  });
});
