import { beforeEach, describe, expect, it, vi } from "vitest";

const chamadas: string[] = [];
const falso = {
  __loaded: false,
  init: vi.fn(() => {
    chamadas.push("init");
    falso.__loaded = true;
  }),
  capture: vi.fn((evento: string) => void chamadas.push(`capture:${evento}`)),
  identify: vi.fn((id: string) => void chamadas.push(`identify:${id}`)),
  reset: vi.fn(() => void chamadas.push("reset")),
  opt_in_capturing: vi.fn(() => void chamadas.push("opt_in")),
  opt_out_capturing: vi.fn(() => void chamadas.push("opt_out")),
  clear_opt_in_out_capturing: vi.fn(() => void chamadas.push("pendente")),
};
vi.mock("posthog-js", () => ({ default: falso }));

let consentimento: "aceito" | "recusado" | null = null;
vi.mock("./consentimento", () => ({
  lerConsentimento: () => consentimento,
  observarConsentimento: () => () => {},
}));

// O vitest roda em Node; `ligado()` exige navegador, de propósito, por causa
// do servidor. Um `window` vazio basta para a porta abrir.
vi.stubGlobal("window", {});

const { aplicarConsentimento, esquecer, identificar, iniciarAnalitica, registrar } = await import(
  "./analitica"
);

beforeEach(() => {
  chamadas.length = 0;
  falso.__loaded = false;
  consentimento = null;
});

describe("sem PostHog ligado", () => {
  it("no servidor, nada chama a biblioteca, mesmo carregada", () => {
    vi.stubGlobal("window", undefined);
    falso.__loaded = true;
    registrar("busca", { termo: "x" });
    expect(chamadas).toEqual([]);
    vi.stubGlobal("window", {});
  });

  it("nada chama a biblioteca", () => {
    registrar("concurso_salvo", { slug: "x" });
    identificar("conta-1");
    esquecer();
    aplicarConsentimento("aceito");
    expect(chamadas).toEqual([]);
  });
});

describe("com PostHog ligado", () => {
  it("liga com a chave e aplica a resposta que já estava guardada", () => {
    consentimento = "aceito";
    iniciarAnalitica("phc_chave");
    expect(falso.init).toHaveBeenCalledWith("phc_chave", expect.objectContaining({ cookieless_mode: "on_reject" }));
    expect(chamadas).toEqual(["init", "opt_in"]);
  });

  it("sem resposta, fica pendente e não captura", () => {
    iniciarAnalitica("phc_chave");
    expect(chamadas).toEqual(["init", "pendente"]);
  });

  it("cada resposta vira a chamada certa", () => {
    falso.__loaded = true;
    aplicarConsentimento("aceito");
    aplicarConsentimento("recusado");
    aplicarConsentimento(null);
    expect(chamadas).toEqual(["opt_in", "opt_out", "pendente"]);
  });

  it("evento e conta passam, pelo id da conta", () => {
    falso.__loaded = true;
    registrar("lembrete_ligado", { slug: "tj-sp" });
    identificar("0191-conta");
    expect(falso.capture).toHaveBeenCalledWith("lembrete_ligado", { slug: "tj-sp" });
    expect(chamadas).toEqual(["capture:lembrete_ligado", "identify:0191-conta"]);
  });

  it("ao sair, reset primeiro e depois a resposta de novo, senão a captura para calada", () => {
    falso.__loaded = true;
    consentimento = "aceito";
    esquecer();
    expect(chamadas).toEqual(["reset", "opt_in"]);
  });
});
