import { describe, expect, it } from "vitest";
import {
  dataCurta,
  dataLonga,
  diasAte,
  hojeCivilEmSaoPaulo,
  hojeEmSaoPaulo,
  moeda,
  moedaExata,
  paraDataLocal,
  prazoRelativo,
  quantidade,
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

describe("quantidade", () => {
  it("deixa passar número, inclusive zero", () => {
    expect(quantidade(0)).toBe(0);
    expect(quantidade(8)).toBe(8);
    expect(quantidade(-3)).toBe(-3);
  });

  it("campo que não veio é ausência, não 'NaN'", () => {
    // O caso real: o app subiu antes do engine, `vagasPcd` chegou
    // `undefined`, e `Intl.NumberFormat().format(undefined)` devolve a string
    // "NaN" — a busca anunciou "NaN vagas PcD" em cartões de verdade.
    expect(quantidade(undefined)).toBeNull();
    expect(quantidade(null)).toBeNull();
    expect(quantidade(NaN)).toBeNull();
    expect(quantidade(Infinity)).toBeNull();
    expect(quantidade(-Infinity)).toBeNull();
  });

  it("string que parece número também é ausência", () => {
    // Number("12") daria 12 e pareceria conserto. Não é: um engine que manda
    // "12" onde o contrato diz número está errado, e a tela adivinhar o que
    // ele quis dizer é como a tela acabou inventando a reserva de vagas.
    expect(quantidade("12")).toBeNull();
    expect(quantidade("")).toBeNull();
    expect(quantidade({})).toBeNull();
  });
});

describe("hojeEmSaoPaulo", () => {
  it("devolve a data civil brasileira, não a do fuso do processo", () => {
    // 15/09 às 02h em UTC ainda é dia 14 em Brasília: é a janela de três
    // horas em que um servidor em UTC daria o dia seguinte.
    expect(hojeEmSaoPaulo(new Date("2026-09-15T02:00:00Z"))).toBe("2026-09-14");
    expect(hojeEmSaoPaulo(new Date("2026-09-15T03:00:00Z"))).toBe("2026-09-15");
  });

  it("sai no mesmo formato das datas do domínio", () => {
    expect(hojeEmSaoPaulo(new Date("2026-01-05T12:00:00Z"))).toBe("2026-01-05");
    expect(hojeEmSaoPaulo(new Date("2026-12-31T23:00:00Z"))).toBe("2026-12-31");
  });
});

describe("hojeCivilEmSaoPaulo", () => {
  it("devolve a meia-noite local do dia civil de Brasília, em qualquer fuso do processo", () => {
    // 02h UTC do dia 15 ainda é dia 14 em Brasília.
    const hoje = hojeCivilEmSaoPaulo(new Date("2026-09-15T02:00:00Z"));
    expect([hoje.getFullYear(), hoje.getMonth(), hoje.getDate()]).toEqual([2026, 8, 14]);
    expect([hoje.getHours(), hoje.getMinutes()]).toEqual([0, 0]);
    expect(hoje.getTime()).toBe(paraDataLocal("2026-09-14").getTime());
  });

  it("um prazo que encerra hoje em Brasília ainda não passou, mesmo com o relógio em UTC no dia seguinte", () => {
    const hoje = hojeCivilEmSaoPaulo(new Date("2026-09-15T02:30:00Z"));
    expect(diasAte("2026-09-14", hoje)).toBe(0);
    expect(prazoRelativo("2026-09-14", hoje)).toBe("Encerra hoje");
  });
});
