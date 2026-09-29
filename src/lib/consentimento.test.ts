import { describe, expect, it } from "vitest";
import {
  gravarConsentimento,
  lerConsentimento,
  limparConsentimento,
  precisaPerguntar,
} from "./consentimento";

function armazenamento(): Storage {
  const dados = new Map<string, string>();
  return {
    get length() {
      return dados.size;
    },
    clear: () => dados.clear(),
    getItem: (chave) => dados.get(chave) ?? null,
    key: (indice) => [...dados.keys()][indice] ?? null,
    removeItem: (chave) => void dados.delete(chave),
    setItem: (chave, valor) => void dados.set(chave, String(valor)),
  };
}

function quebrado(): Storage {
  const falha = () => {
    throw new Error("SecurityError");
  };
  return { length: 0, clear: falha, getItem: falha, key: falha, removeItem: falha, setItem: falha };
}

describe("consentimento guardado", () => {
  it("grava, lê e limpa a escolha", () => {
    const local = armazenamento();
    expect(lerConsentimento(local)).toBeNull();
    gravarConsentimento("aceito", local);
    expect(lerConsentimento(local)).toBe("aceito");
    gravarConsentimento("recusado", local);
    expect(lerConsentimento(local)).toBe("recusado");
    limparConsentimento(local);
    expect(lerConsentimento(local)).toBeNull();
  });

  it("valor estranho guardado vale como sem resposta", () => {
    const local = armazenamento();
    local.setItem("bc:consentimento", "talvez");
    expect(lerConsentimento(local)).toBeNull();
  });

  it("navegador que bloqueia o armazenamento não quebra: fica sem resposta", () => {
    expect(lerConsentimento(quebrado())).toBeNull();
    expect(() => gravarConsentimento("aceito", quebrado())).not.toThrow();
    expect(() => limparConsentimento(quebrado())).not.toThrow();
    expect(lerConsentimento(null)).toBeNull();
  });
});

describe("precisaPerguntar", () => {
  it("pergunta só quando há o que ligar e ainda não há resposta", () => {
    expect(precisaPerguntar({ posthog: true, gtm: false }, null)).toBe(true);
    expect(precisaPerguntar({ posthog: false, gtm: true }, null)).toBe(true);
    expect(precisaPerguntar({ posthog: true, gtm: true }, "aceito")).toBe(false);
    expect(precisaPerguntar({ posthog: true, gtm: true }, "recusado")).toBe(false);
    expect(precisaPerguntar({ posthog: false, gtm: false }, null)).toBe(false);
  });
});
