import { describe, expect, it } from "vitest";
import { abasDeSituacao, rotuloDaLista } from "./ListaDeResultados";
import type { ContagensDeFaceta } from "@/lib/concursos";
import { CONSULTA_VAZIA, type ConsultaDaUrl } from "@/lib/parametros";

const CONTAGENS: ContagensDeFaceta = {
  situacoes: [
    { valor: "abertas", rotulo: "Inscrições abertas", total: 112 },
    { valor: "previstos", rotulo: "Previstos", total: 1121 },
    { valor: "encerrados", rotulo: "Encerrados", total: 3491 },
  ],
  escolaridades: [],
  bancas: [],
};

function comSituacoes(situacoes: ConsultaDaUrl["situacoes"]): ConsultaDaUrl {
  return { ...CONSULTA_VAZIA, situacoes };
}

/**
 * Ruling R26: com duas ou mais situações na URL, cada aba correspondente
 * precisa ficar marcada (não só "Todas" apagada e nenhuma outra acesa), para
 * o trilho concordar com os chips de `chipsAtivos` e com a lista de baixo,
 * que já responde pelas duas.
 */
describe("abasDeSituacao", () => {
  it("sem situação na URL, só 'Todas' fica marcada", () => {
    const abas = abasDeSituacao(comSituacoes([]), CONTAGENS);
    const marcadas = abas.filter((aba) => aba.ativo).map((aba) => aba.id);
    expect(marcadas).toEqual(["todas"]);
  });

  it("com uma situação, só a dela fica marcada", () => {
    const abas = abasDeSituacao(comSituacoes(["abertas"]), CONTAGENS);
    const marcadas = abas.filter((aba) => aba.ativo).map((aba) => aba.id);
    expect(marcadas).toEqual(["abertas"]);
  });

  it("com duas situações, as duas ficam marcadas e 'Todas' não", () => {
    const abas = abasDeSituacao(comSituacoes(["abertas", "previstos"]), CONTAGENS);
    const marcadas = abas.filter((aba) => aba.ativo).map((aba) => aba.id);
    expect(marcadas.sort()).toEqual(["abertas", "previstos"]);
    expect(marcadas).not.toContain("todas");
  });

  it("cada aba de situação continua levando a só ela, mesmo com duas na URL", () => {
    const abas = abasDeSituacao(comSituacoes(["abertas", "previstos"]), CONTAGENS);
    const aberta = abas.find((aba) => aba.id === "abertas");
    const prevista = abas.find((aba) => aba.id === "previstos");
    expect(aberta?.href).toContain("situacao=abertas");
    expect(aberta?.href).not.toContain("situacao=previstos");
    expect(prevista?.href).toContain("situacao=previstos");
    expect(prevista?.href).not.toContain("situacao=abertas");
  });

  it("'Todas' sempre volta para a consulta sem nenhuma situação", () => {
    const abas = abasDeSituacao(comSituacoes(["abertas", "previstos"]), CONTAGENS);
    const todas = abas.find((aba) => aba.id === "todas");
    expect(todas?.href).not.toContain("situacao=");
  });
});

describe("rotuloDaLista", () => {
  it("diz a situação filtrada, e não sempre \"inscrições abertas\"", () => {
    expect(rotuloDaLista(comSituacoes(["abertas"])).texto).toBe("INSCRIÇÕES ABERTAS");
    expect(rotuloDaLista(comSituacoes(["previstos"])).texto).toBe("PREVISTOS");
    expect(rotuloDaLista(comSituacoes(["encerrados"])).texto).toBe("ENCERRADOS");
    expect(rotuloDaLista(comSituacoes([])).texto).toBe("CONCURSOS");
    expect(rotuloDaLista(comSituacoes(["abertas", "previstos"])).texto).toBe("CONCURSOS");
  });

  it("com termo é busca", () => {
    expect(rotuloDaLista({ ...comSituacoes(["previstos"]), q: "professor" }).texto).toBe("BUSCA");
  });
});
