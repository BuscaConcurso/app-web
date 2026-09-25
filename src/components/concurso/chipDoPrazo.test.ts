import { describe, expect, it } from "vitest";
import { chipDoPrazoMovel } from "./CartaoConcurso";
import { chipDoPrazo } from "./LinhaConcurso";

const HOJE = new Date("2026-09-25T15:00:00Z");

describe("chipDoPrazo", () => {
  it("conta os dias de quem está aberto", () => {
    expect(chipDoPrazo("2026-09-25", HOJE).texto).toBe("hoje");
    expect(chipDoPrazo("2026-09-26", HOJE).texto).toBe("amanhã");
    expect(chipDoPrazo("2026-09-29", HOJE).texto).toBe("4 dias");
  });

  it("data no passado não vira \"hoje\"", () => {
    expect(chipDoPrazo("2026-09-15", HOJE).texto).toBe("encerrado");
  });

  it("encerrado pelo status não conta dias, mesmo com a data no futuro", () => {
    expect(chipDoPrazo("2026-09-29", HOJE, true).texto).toBe("encerrado");
  });
});

describe("chipDoPrazoMovel", () => {
  it("encerrado mostra a data em que encerrou", () => {
    expect(chipDoPrazoMovel("2026-09-15", HOJE).texto).toBe("encerrou 15/09");
    expect(chipDoPrazoMovel("2026-09-15", HOJE, true).texto).toBe("encerrou 15/09");
  });

  it("encerrado pelo status com a data no futuro não diz que encerrou nela", () => {
    expect(chipDoPrazoMovel("2026-10-13", HOJE, true).texto).toBe("encerrado");
  });

  it("aberto segue como antes", () => {
    expect(chipDoPrazoMovel("2026-09-25", HOJE).texto).toBe("encerra hoje");
    expect(chipDoPrazoMovel("2026-10-04", HOJE).texto).toBe("até 04/10");
  });
});
