import { describe, expect, it } from "vitest";
import {
  avisoAoLigarLembrete,
  avisoDeFalha,
  caminhoParaVoltar,
  hrefParaEntrar,
  criarSincronizadorDeSalvos,
  mapaDe,
  normalizarRespostaDeSalvos,
} from "./salvos";

interface Chamada {
  descricao: string;
  resolver(valor?: unknown): void;
  rejeitar(erro: unknown): void;
}

/** Api falsa em que cada pedido fica pendente até o teste decidir. */
function montar() {
  const chamadas: Chamada[] = [];
  const avisos: string[] = [];
  let emVoo = 0;
  let maximoEmVoo = 0;
  const pedir = (descricao: string) =>
    new Promise<unknown>((resolve, reject) => {
      emVoo += 1;
      maximoEmVoo = Math.max(maximoEmVoo, emVoo);
      chamadas.push({
        descricao,
        resolver: (valor) => { emVoo -= 1; resolve(valor); },
        rejeitar: (erro) => { emVoo -= 1; reject(erro); },
      });
    });
  const sincronizador = criarSincronizadorDeSalvos({
    api: {
      salvar: (slug, lembrar) => pedir(`PUT ${slug} ${String(lembrar)}`),
      remover: (slug) => pedir(`DELETE ${slug}`),
    },
    avisar: (texto) => avisos.push(texto),
  });
  const esperar = () => new Promise((resolve) => setTimeout(resolve, 0));
  return { sincronizador, chamadas, avisos, esperar, maximoEmVoo: () => maximoEmVoo };
}

describe("criarSincronizadorDeSalvos", () => {
  it("salvar pinta o concurso antes de a api responder", async () => {
    const t = montar();
    const feito = t.sincronizador.salvar("a");
    expect(t.sincronizador.mapa().get("a")).toBe(false);
    expect(t.chamadas.map((c) => c.descricao)).toEqual(["PUT a undefined"]);
    t.chamadas[0]!.resolver({ lembrar: false });
    expect(await feito).toBe(true);
    expect(t.sincronizador.mapa().get("a")).toBe(false);
  });

  it("clique duplo: o DELETE só sai depois do PUT, e o fim é o último clique", async () => {
    const t = montar();
    void t.sincronizador.salvar("a");
    const remocao = t.sincronizador.remover("a");
    expect(t.sincronizador.mapa().has("a")).toBe(false);
    expect(t.chamadas).toHaveLength(1);
    t.chamadas[0]!.resolver({ lembrar: false });
    await t.esperar();
    expect(t.chamadas.map((c) => c.descricao)).toEqual(["PUT a undefined", "DELETE a"]);
    t.chamadas[1]!.resolver();
    expect(await remocao).toBe(true);
    expect(t.sincronizador.mapa().has("a")).toBe(false);
    expect(t.maximoEmVoo()).toBe(1);
  });

  it("três cliques que voltam ao estado do primeiro não mandam pedido a mais", async () => {
    const t = montar();
    void t.sincronizador.salvar("a");
    void t.sincronizador.remover("a");
    const ultimo = t.sincronizador.salvar("a");
    t.chamadas[0]!.resolver({ lembrar: false });
    expect(await ultimo).toBe(true);
    expect(t.chamadas).toHaveLength(1);
    expect(t.sincronizador.mapa().get("a")).toBe(false);
  });

  it("ligar e desligar o lembrete depressa termina desligado no banco", async () => {
    const t = montar();
    t.sincronizador.carregar({ itens: [item("a", false)], semDado: [] }, t.sincronizador.marca());
    void t.sincronizador.lembrar("a", true);
    const desligar = t.sincronizador.lembrar("a", false);
    t.chamadas[0]!.resolver({ lembrar: true });
    await t.esperar();
    t.chamadas[1]!.resolver({ lembrar: false });
    expect(await desligar).toBe(true);
    expect(t.chamadas.map((c) => c.descricao)).toEqual(["PUT a true", "PUT a false"]);
    expect(t.sincronizador.mapa().get("a")).toBe(false);
  });

  it("falha desfaz para o que o banco confirmou e avisa", async () => {
    const t = montar();
    t.sincronizador.carregar({ itens: [item("a", true)], semDado: [] }, t.sincronizador.marca());
    const remocao = t.sincronizador.remover("a");
    t.chamadas[0]!.rejeitar({ code: "INTERNAL_ERROR", status: 500 });
    expect(await remocao).toBe(false);
    expect(t.sincronizador.mapa().get("a")).toBe(true);
    expect(t.avisos).toEqual(["Não deu para remover agora. Tente de novo."]);
  });

  it("limite: desfaz para não salvo com o aviso dos 500", async () => {
    const t = montar();
    const feito = t.sincronizador.salvar("a");
    t.chamadas[0]!.rejeitar({ code: "SALVOS_LIMITE", status: 409 });
    expect(await feito).toBe(false);
    expect(t.sincronizador.mapa().has("a")).toBe(false);
    expect(t.avisos).toEqual(["Você chegou a 500 salvos."]);
  });

  it("a lista que chega durante um clique não apaga o estado pendente", async () => {
    const t = montar();
    const marca = t.sincronizador.marca();
    void t.sincronizador.salvar("a");
    t.sincronizador.carregar({ itens: [item("b", false)], semDado: [] }, marca);
    expect([...t.sincronizador.mapa().keys()].sort()).toEqual(["a", "b"]);
  });

  it("a lista pedida antes de uma confirmação não desfaz a confirmação", async () => {
    const t = montar();
    const marca = t.sincronizador.marca();
    const feito = t.sincronizador.salvar("a");
    t.chamadas[0]!.resolver({ lembrar: false });
    await feito;
    t.sincronizador.carregar({ itens: [], semDado: [] }, marca);
    expect(t.sincronizador.mapa().get("a")).toBe(false);
  });

  it("salvar o que o banco já tinha com lembrete adota o lembrete do banco", async () => {
    const t = montar();
    const feito = t.sincronizador.salvar("a");
    t.chamadas[0]!.resolver({ lembrar: true });
    await feito;
    expect(t.sincronizador.mapa().get("a")).toBe(true);
    expect(t.chamadas).toHaveLength(1);
  });

  it("avisa quem observa a cada mudança do mapa", async () => {
    const vistos: boolean[] = [];
    const s = criarSincronizadorDeSalvos({
      api: { salvar: async () => ({ lembrar: false }), remover: async () => undefined },
      avisar: () => {},
    });
    s.observar((mapa) => vistos.push(mapa.has("a")));
    await s.salvar("a");
    expect(vistos[0]).toBe(true);
    expect(vistos.at(-1)).toBe(true);
  });
});

function item(slug: string, lembrar: boolean) {
  return { concurso: { slug } as never, lembrar, salvoEm: "2026-09-28T00:00:00Z" };
}

describe("avisoDeFalha", () => {
  it("explica sessão perdida, limite, concurso sumido e o resto", () => {
    expect(avisoDeFalha({ code: "AUTH_TOKEN_INVALID", status: 401 }, "salvar")).toBe("Entre de novo para salvar.");
    expect(avisoDeFalha(new Error("rede"), "salvar")).toBe("Não deu para salvar agora. Tente de novo.");
    expect(avisoDeFalha({ code: "CONCURSO_NAO_ENCONTRADO", status: 404 }, "salvar")).toBe(
      "Este concurso não está mais na lista.",
    );
  });
});

describe("caminhoParaVoltar", () => {
  it("leva a query junto, para a busca filtrada voltar filtrada", () => {
    expect(caminhoParaVoltar({ pathname: "/busca/policia", search: "?uf=SP&pagina=2" })).toBe(
      "/busca/policia?uf=SP&pagina=2",
    );
    expect(hrefParaEntrar(caminhoParaVoltar({ pathname: "/concursos", search: "?situacao=abertas" }))).toBe(
      "/entrar?retorno=%2Fconcursos%3Fsituacao%3Dabertas",
    );
    expect(caminhoParaVoltar({ pathname: "/", search: "" })).toBe("/");
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

describe("normalizarRespostaDeSalvos", () => {
  it("tira o travessão que vem da api no título, no órgão e nos cargos", () => {
    const concurso = {
      slug: "cra-am",
      titulo: "CRA-AM \u2014 Edital nº 1/2026",
      orgao: { nome: "Conselho \u2014 AM" },
      banca: null,
      nomesDeCargo: ["Fiscal \u2014 Nível superior"],
      ultimoAto: { data: "2026-09-01", titulo: "Aviso \u2014 1", primeiro: true },
    } as never;
    const resposta = normalizarRespostaDeSalvos({
      itens: [{ concurso, lembrar: true, salvoEm: "2026-09-28T00:00:00Z" }],
      semDado: ["x"],
    });
    const [item] = resposta.itens;
    expect(item!.concurso.titulo).toBe("CRA-AM - Edital nº 1/2026");
    expect(item!.concurso.orgao.nome).toBe("Conselho - AM");
    expect(item!.concurso.nomesDeCargo).toEqual(["Fiscal - Nível superior"]);
    expect(item!.concurso.ultimoAto?.titulo).toBe("Aviso - 1");
    expect(item!.lembrar).toBe(true);
    expect(resposta.semDado).toEqual(["x"]);
  });
});
