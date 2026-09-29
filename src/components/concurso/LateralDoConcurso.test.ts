import { describe, expect, it } from "vitest";
import { botoesDeAviso } from "./LateralDoConcurso";

describe("botoesDeAviso", () => {
  it("previsto tem só Avisar quando abrir: Lembrar amanhã faria a mesma coisa", () => {
    expect(botoesDeAviso("previsto")).toEqual({ avisarQuandoAbrir: true, lembrarAmanha: false });
  });

  it("aberto tem Lembrar amanhã", () => {
    expect(botoesDeAviso("aberto")).toEqual({ avisarQuandoAbrir: false, lembrarAmanha: true });
  });

  it("encerrado não tem aviso nenhum", () => {
    expect(botoesDeAviso("encerrado")).toEqual({ avisarQuandoAbrir: false, lembrarAmanha: false });
  });
});
