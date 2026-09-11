import { describe, expect, it } from "vitest";
import {
  dataCurta,
  dataLonga,
  diasAte,
  moeda,
  moedaExata,
  paraDataLocal,
  prazoRelativo,
  vagasTexto,
} from "./formato";

/** Uma hora qualquer do dia, para provar que a hora não entra na conta. */
const HOJE = new Date(2026, 3, 10, 15, 42);

describe("datas", () => {
  it("lê a data no fuso local, não em UTC", () => {
    const data = paraDataLocal("2026-04-14");
    expect(data.getFullYear()).toBe(2026);
    expect(data.getMonth()).toBe(3);
    expect(data.getDate()).toBe(14);
  });

  it("formata curta e longa", () => {
    expect(dataCurta("2026-04-14")).toBe("14/04");
    expect(dataLonga("2026-04-14")).toBe("14/04/2026");
    expect(dataCurta("2026-01-05")).toBe("05/01");
  });
});

describe("diasAte", () => {
  it("conta dias de calendário, ignorando a hora", () => {
    expect(diasAte("2026-04-13", HOJE)).toBe(3);
    expect(diasAte("2026-04-10", HOJE)).toBe(0);
  });

  it("é negativo quando a data já passou", () => {
    expect(diasAte("2026-04-08", HOJE)).toBe(-2);
  });

  it("atravessa a virada do mês", () => {
    expect(diasAte("2026-05-01", HOJE)).toBe(21);
  });
});

describe("prazoRelativo", () => {
  it("trata hoje e amanhã como casos próprios", () => {
    expect(prazoRelativo("2026-04-10", HOJE)).toBe("Encerra hoje");
    expect(prazoRelativo("2026-04-11", HOJE)).toBe("Encerra amanhã");
  });

  it("conta os dias no plural a partir de dois", () => {
    expect(prazoRelativo("2026-04-12", HOJE)).toBe("Encerra em 2 dias");
    expect(prazoRelativo("2026-04-17", HOJE)).toBe("Encerra em 7 dias");
  });

  it("devolve nulo quando o prazo já passou", () => {
    expect(prazoRelativo("2026-04-09", HOJE)).toBeNull();
  });
});

describe("dinheiro", () => {
  it("corta o centavo no valor de cartão", () => {
    expect(moeda(14852.66).replace(/\u00a0/g, " ")).toBe("R$ 14.852");
    expect(moeda(3100).replace(/\u00a0/g, " ")).toBe("R$ 3.100");
  });

  it("mantém o centavo na taxa", () => {
    expect(moedaExata(95).replace(/\u00a0/g, " ")).toBe("R$ 95,00");
    expect(moedaExata(45.5).replace(/\u00a0/g, " ")).toBe("R$ 45,50");
  });
});

describe("vagasTexto", () => {
  it("concorda o singular", () => {
    expect(vagasTexto(1, false)).toBe("1 vaga");
  });

  it("agrupa o milhar", () => {
    expect(vagasTexto(2500, false)).toBe("2.500 vagas");
  });

  it("não diz zero vagas quando existe cadastro reserva", () => {
    expect(vagasTexto(null, true)).toBe("Cadastro reserva");
    expect(vagasTexto(0, true)).toBe("Cadastro reserva");
  });

  it("admite não saber", () => {
    expect(vagasTexto(null, false)).toBe("A definir");
  });

  it("soma as duas informações quando as duas existem", () => {
    expect(vagasTexto(420, true)).toBe("420 vagas e cadastro reserva");
  });
});
