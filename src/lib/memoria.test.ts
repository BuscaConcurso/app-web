import { describe, expect, it, vi } from "vitest";
import { lembrarPor } from "./memoria";

describe("lembrarPor", () => {
  it("dentro da validade não busca de novo", async () => {
    let agora = 0;
    const buscar = vi.fn(async () => "acervo");
    const obter = lembrarPor(300_000, buscar, () => agora);
    await obter();
    agora = 299_999;
    await obter();
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it("vencida a validade, busca de novo", async () => {
    let agora = 0;
    const buscar = vi.fn(async () => "acervo");
    const obter = lembrarPor(300_000, buscar, () => agora);
    await obter();
    agora = 300_000;
    await obter();
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it("chamadas simultâneas dividem a mesma busca", async () => {
    const buscar = vi.fn(() => new Promise<string>((resolver) => setTimeout(() => resolver("x"), 5)));
    const obter = lembrarPor(1000, buscar, () => 0);
    const [a, b] = await Promise.all([obter(), obter()]);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("falha não fica guardada", async () => {
    let vezes = 0;
    const buscar = vi.fn(async () => {
      vezes += 1;
      if (vezes === 1) throw new Error("fora do ar");
      return "ok";
    });
    const obter = lembrarPor(300_000, buscar, () => 0);
    await expect(obter()).rejects.toThrow("fora do ar");
    await expect(obter()).resolves.toBe("ok");
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it("renovação que falha depois de um sucesso devolve o valor anterior", async () => {
    let agora = 0;
    let vezes = 0;
    const buscar = vi.fn(async () => {
      vezes += 1;
      if (vezes === 2) throw new Error("fora do ar");
      return `leitura ${vezes}`;
    });
    const obter = lembrarPor(300_000, buscar, () => agora);
    await expect(obter()).resolves.toBe("leitura 1");
    agora = 300_000;
    await expect(obter()).resolves.toBe("leitura 1");
    // O valor velho vale por mais uma validade: a API fora do ar não é
    // consultada a cada chamada.
    agora = 400_000;
    await expect(obter()).resolves.toBe("leitura 1");
    expect(buscar).toHaveBeenCalledTimes(2);
    agora = 600_000;
    await expect(obter()).resolves.toBe("leitura 3");
  });

  it("falha sem nenhum valor anterior rejeita", async () => {
    const buscar = vi.fn(async (): Promise<string> => {
      throw new Error("fora do ar");
    });
    const obter = lembrarPor(300_000, buscar, () => 0);
    await expect(obter()).rejects.toThrow("fora do ar");
  });
});
