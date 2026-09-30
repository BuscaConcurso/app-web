import { describe, expect, it, vi } from "vitest";
import {
  avisoDePreferencia,
  criarDescadastro,
  tipoDoLink,
  type ApiDoDescadastro,
  type EstadoDoDescadastro,
} from "./preferenciasDeEmail";

function montar(opcoes: { token?: string | null; tipo?: string; api?: Partial<ApiDoDescadastro> } = {}) {
  const estados: EstadoDoDescadastro[] = [];
  const api: ApiDoDescadastro = {
    descadastrar: vi.fn(async () => ({ tipo: "lembretes", ligado: false })),
    religar: vi.fn(async () => ({ tipo: "lembretes", ligado: true })),
    ...opcoes.api,
  };
  const descadastro = criarDescadastro({
    api,
    token: opcoes.token === undefined ? "tok" : opcoes.token,
    tipo: tipoDoLink(opcoes.tipo ?? "lembretes"),
    mudou: (estado) => estados.push(estado),
  });
  return { api, descadastro, estados };
}

describe("tipoDoLink", () => {
  it("aceita só os tipos conhecidos", () => {
    expect(tipoDoLink("lembretes")).toBe("lembretes");
    expect(tipoDoLink("resumo")).toBeNull();
    expect(tipoDoLink(undefined)).toBeNull();
  });
});

describe("descadastro pelo link do e-mail", () => {
  it("abrir a página não chama a api: começa perguntando", () => {
    const { api, descadastro } = montar();
    expect(descadastro.estado()).toBe("pergunta");
    expect(api.descadastrar).not.toHaveBeenCalled();
    expect(api.religar).not.toHaveBeenCalled();
  });

  it("confirmar desliga e mostra o pronto; desfazer religa", async () => {
    const { api, descadastro, estados } = montar();
    await descadastro.confirmar();
    expect(api.descadastrar).toHaveBeenCalledWith("tok", "lembretes");
    expect(descadastro.estado()).toBe("pronto");
    await descadastro.desfazer();
    expect(api.religar).toHaveBeenCalledWith("tok", "lembretes");
    expect(descadastro.estado()).toBe("reativado");
    expect(estados).toEqual(["enviando", "pronto", "desfazendo", "reativado"]);
  });

  it("clique duplo em confirmar faz um pedido só", async () => {
    const { api, descadastro } = montar();
    await Promise.all([descadastro.confirmar(), descadastro.confirmar()]);
    expect(api.descadastrar).toHaveBeenCalledTimes(1);
  });

  it("sem token, ou com tipo desconhecido, o link é inválido desde o começo", () => {
    expect(montar({ token: null }).descadastro.estado()).toBe("invalido");
    expect(montar({ token: "" }).descadastro.estado()).toBe("invalido");
    expect(montar({ tipo: "resumo" }).descadastro.estado()).toBe("invalido");
  });

  it("a api recusando o token (404 ou 400) vira link inválido", async () => {
    for (const status of [404, 400]) {
      const { descadastro } = montar({
        api: { descadastrar: vi.fn(async () => Promise.reject({ status, code: "EMAIL_LINK_INVALIDO" })) },
      });
      await descadastro.confirmar();
      expect(descadastro.estado()).toBe("invalido");
    }
  });

  it("outra falha volta a perguntar, marcando que falhou", async () => {
    const { descadastro } = montar({ api: { descadastrar: vi.fn(async () => Promise.reject(new Error("rede"))) } });
    await descadastro.confirmar();
    expect(descadastro.estado()).toBe("falhou");
  });

  it("falha ao desfazer volta ao pronto, marcando a falha", async () => {
    const { descadastro } = montar({ api: { religar: vi.fn(async () => Promise.reject(new Error("rede"))) } });
    await descadastro.confirmar();
    await descadastro.desfazer();
    expect(descadastro.estado()).toBe("falhouAoDesfazer");
  });
});

describe("avisoDePreferencia", () => {
  it("salvo, falha comum e sessão vencida", () => {
    expect(avisoDePreferencia(null)).toBe("Preferência salva.");
    expect(avisoDePreferencia(new Error("rede"))).toBe("Não deu para salvar agora. Tente de novo.");
    expect(avisoDePreferencia({ status: 401, code: "AUTH_SESSION_EXPIRED" })).toBe("Entre de novo para mudar a preferência.");
  });
});
