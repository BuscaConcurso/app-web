import { afterEach, describe, expect, it, vi } from "vitest";
import {
  escolheuManualmente,
  liberarDeteccao,
  marcarEscolhaManual,
  paginaPedeLocalizacao,
} from "./localizacaoManual";

const CHAVE = "buscaconcurso.uf.manual";

function fingirArmazenamento(inicial?: string): Map<string, string> {
  const dados = new Map<string, string>();
  if (inicial !== undefined) dados.set(CHAVE, inicial);
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (chave: string) => dados.get(chave) ?? null,
      setItem: (chave: string, valor: string) => void dados.set(chave, valor),
      removeItem: (chave: string) => void dados.delete(chave),
    },
  });
  return dados;
}

/** Aba anônima com cookies desligados: todo acesso lança. */
function fingirArmazenamentoBloqueado(): void {
  const recusar = () => {
    throw new Error("o armazenamento está bloqueado");
  };
  vi.stubGlobal("window", {
    localStorage: { getItem: recusar, setItem: recusar, removeItem: recusar },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a escolha manual do estado", () => {
  it("quem nunca escolheu à mão deixa o pedido automático valer", () => {
    fingirArmazenamento();
    expect(escolheuManualmente()).toBe(false);
  });

  it("escolher à mão desliga o pedido automático, e a marca fica guardada", () => {
    const dados = fingirArmazenamento();
    marcarEscolhaManual();
    expect(escolheuManualmente()).toBe(true);
    // Guardada no armazenamento, e não num cache de módulo: é o próximo
    // CARREGAMENTO que precisa vê-la, não esta mesma navegação.
    expect(dados.get(CHAVE)).toBe("1");
  });

  it("voltar a pedir a localização religa o pedido automático", () => {
    const dados = fingirArmazenamento("1");
    liberarDeteccao();
    expect(escolheuManualmente()).toBe(false);
    expect(dados.has(CHAVE)).toBe(false);
  });

  it("valor que não é a marca não conta como escolha", () => {
    fingirArmazenamento("sim");
    expect(escolheuManualmente()).toBe(false);
  });

  it("armazenamento bloqueado degrada para o comportamento de antes, sem lançar", () => {
    fingirArmazenamentoBloqueado();
    expect(() => marcarEscolhaManual()).not.toThrow();
    expect(() => liberarDeteccao()).not.toThrow();
    expect(escolheuManualmente()).toBe(false);
  });
});

describe("paginaPedeLocalizacao", () => {
  it("pede só onde a barra pedia antes de morar no cabeçalho", () => {
    expect(paginaPedeLocalizacao("/")).toBe(true);
    expect(paginaPedeLocalizacao("/concursos")).toBe(true);
    expect(paginaPedeLocalizacao("/busca/tribunal")).toBe(true);
    expect(paginaPedeLocalizacao("/entrar")).toBe(false);
    expect(paginaPedeLocalizacao("/concursos/algum-edital")).toBe(false);
    expect(paginaPedeLocalizacao("/conta")).toBe(false);
  });
});
