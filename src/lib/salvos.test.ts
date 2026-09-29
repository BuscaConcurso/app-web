import { describe, expect, it } from "vitest";
import {
  acoesDeSalvos,
  avisoAoLigarLembrete,
  avisoDeFalha,
  hrefParaEntrar,
  mapaDe,
  type MapaDeSalvos,
} from "./salvos";

function montar(inicial: MapaDeSalvos = new Map(), falhar?: { code: string; status: number }) {
  let mapa = inicial;
  const vistosDuranteAChamada: MapaDeSalvos[] = [];
  const avisos: string[] = [];
  const chamadas: string[] = [];
  const responder = async (descricao: string) => {
    chamadas.push(descricao);
    vistosDuranteAChamada.push(mapa);
    if (falhar) throw Object.assign(new Error("falhou"), falhar);
  };
  const acoes = acoesDeSalvos({
    ler: () => mapa,
    escrever: (novo) => {
      mapa = novo;
    },
    avisar: (texto) => avisos.push(texto),
    api: {
      salvar: (slug, lembrar) => responder(`salvar ${slug} ${String(lembrar)}`),
      remover: (slug) => responder(`remover ${slug}`),
    },
  });
  return { acoes, avisos, chamadas, vistosDuranteAChamada, mapa: () => mapa };
}

describe("acoesDeSalvos", () => {
  it("salvar pinta o concurso antes de a api responder", async () => {
    const t = montar();
    expect(await t.acoes.salvar("a")).toBe(true);
    expect(t.vistosDuranteAChamada[0]!.get("a")).toBe(false);
    expect(t.mapa().get("a")).toBe(false);
    expect(t.chamadas).toEqual(["salvar a undefined"]);
    expect(t.avisos).toEqual([]);
  });

  it("falha ao salvar desfaz para não salvo e avisa", async () => {
    const t = montar(new Map(), { code: "SALVOS_LIMITE", status: 409 });
    expect(await t.acoes.salvar("a")).toBe(false);
    expect(t.mapa().has("a")).toBe(false);
    expect(t.avisos).toEqual(["Você chegou a 500 salvos."]);
  });

  it("remover tira na hora e, se a api falhar, devolve com o lembrete de antes", async () => {
    const t = montar(new Map([["a", true]]), { code: "INTERNAL_ERROR", status: 500 });
    expect(await t.acoes.remover("a")).toBe(false);
    expect(t.vistosDuranteAChamada[0]!.has("a")).toBe(false);
    expect(t.mapa().get("a")).toBe(true);
    expect(t.avisos).toEqual(["Não deu para remover agora. Tente de novo."]);
  });

  it("lembrar salva junto quando o concurso ainda não estava salvo", async () => {
    const t = montar();
    expect(await t.acoes.lembrar("a", true)).toBe(true);
    expect(t.mapa().get("a")).toBe(true);
    expect(t.chamadas).toEqual(["salvar a true"]);
  });

  it("desligar o lembrete que falha volta a ligado", async () => {
    const t = montar(new Map([["a", true]]), { code: "AUTH_SESSION_EXPIRED", status: 401 });
    expect(await t.acoes.lembrar("a", false)).toBe(false);
    expect(t.mapa().get("a")).toBe(true);
    expect(t.avisos).toEqual(["Entre de novo para mudar o lembrete."]);
  });
});

describe("avisoDeFalha", () => {
  it("explica sessão perdida, limite, concurso sumido e o resto", () => {
    expect(avisoDeFalha({ code: "AUTH_TOKEN_INVALID", status: 401 }, "salvar")).toBe("Entre de novo para salvar.");
    expect(avisoDeFalha(new Error("rede"), "salvar")).toBe("Não deu para salvar agora. Tente de novo.");
    expect(avisoDeFalha({ code: "CONCURSO_NAO_ENCONTRADO", status: 404 }, "salvar")).toBe(
      "Este concurso não está mais na lista.",
    );
  });
});

describe("hrefParaEntrar", () => {
  it("volta para o caminho atual, codificado", () => {
    expect(hrefParaEntrar("/concursos/tj-sp-2026")).toBe("/entrar?retorno=%2Fconcursos%2Ftj-sp-2026");
    expect(hrefParaEntrar(null)).toBe("/entrar");
  });
});

describe("mapaDe", () => {
  it("junta os itens e os sem dado, estes sem lembrete", () => {
    const mapa = mapaDe({
      itens: [{ concurso: { slug: "a" } as never, lembrar: true, salvoEm: "2026-09-28T00:00:00Z" }],
      semDado: ["b"],
    });
    expect([...mapa]).toEqual([
      ["a", true],
      ["b", false],
    ]);
  });
});

describe("avisoAoLigarLembrete", () => {
  it("avisa que os e-mails esperam a confirmação do endereço", () => {
    expect(avisoAoLigarLembrete(true)).toBe("Lembrete ligado. Avisamos por e-mail.");
    expect(avisoAoLigarLembrete(false)).toBe(
      "Lembrete ligado. Os e-mails só saem depois que você confirmar seu endereço.",
    );
  });
});
