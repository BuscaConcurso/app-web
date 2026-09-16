import { afterEach, describe, expect, it, vi } from "vitest";

type Modulo = typeof import("./termosBuscados");

const CHAVE = "buscaconcurso.termos";

/**
 * O módulo guarda um cache de módulo, de propósito (ver a docstring dele:
 * `getSnapshot` tem de devolver a mesma referência). Então cada teste carrega
 * uma cópia nova, senão o cache do teste anterior atravessa.
 */
async function carregar(): Promise<Modulo> {
  vi.resetModules();
  return import("./termosBuscados");
}

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

describe("a ordem e o limite", () => {
  it("devolve o mais recente primeiro", async () => {
    fingirArmazenamento();
    const { lembrarTermo, termosBuscados } = await carregar();

    lembrarTermo("analista judiciário");
    lembrarTermo("professor");

    expect(termosBuscados()).toEqual(["professor", "analista judiciário"]);
  });

  it("promove o termo repetido em vez de criar uma segunda entrada", async () => {
    fingirArmazenamento();
    const { lembrarTermo, termosBuscados } = await carregar();

    lembrarTermo("analista");
    lembrarTermo("professor");
    lembrarTermo("analista");

    expect(termosBuscados()).toEqual(["analista", "professor"]);
  });

  it("trata como o mesmo termo o que a busca acha igual", async () => {
    fingirArmazenamento();
    const { lembrarTermo, termosBuscados } = await carregar();

    lembrarTermo("sao paulo");
    lembrarTermo("São Paulo");

    // Uma entrada só, e a grafia que fica é a que a pessoa acabou de usar.
    expect(termosBuscados()).toEqual(["São Paulo"]);
  });

  it("para em dez, e quem sai é o mais antigo", async () => {
    fingirArmazenamento();
    const { LIMITE, lembrarTermo, termosBuscados } = await carregar();

    for (let i = 1; i <= 13; i += 1) lembrarTermo(`termo ${i}`);

    const termos = termosBuscados();
    expect(LIMITE).toBe(10);
    expect(termos).toHaveLength(10);
    expect(termos[0]).toBe("termo 13");
    expect(termos.at(-1)).toBe("termo 4");
    expect(termos).not.toContain("termo 3");
  });

  it("não guarda o que não é termo", async () => {
    fingirArmazenamento();
    const { lembrarTermo, termosBuscados } = await carregar();

    lembrarTermo("");
    lembrarTermo("   ");
    lembrarTermo("\n\t");

    expect(termosBuscados()).toEqual([]);
  });

  it("guarda o termo numa linha só, sem espaço sobrando", async () => {
    fingirArmazenamento();
    const { lembrarTermo, termosBuscados } = await carregar();

    lembrarTermo("  analista   judiciário \n area administrativa  ");

    expect(termosBuscados()).toEqual([
      "analista judiciário area administrativa",
    ]);
  });
});

describe("a política: só entra o que deu resultado", () => {
  it("guarda a busca que devolveu concursos", async () => {
    fingirArmazenamento();
    const { registrarBusca, termosBuscados } = await carregar();

    registrarBusca({ termo: "analista", resultados: 199, filtrada: false });

    expect(termosBuscados()).toEqual(["analista"]);
  });

  it("não guarda a busca que devolveu zero", async () => {
    fingirArmazenamento();
    const { registrarBusca, termosBuscados } = await carregar();

    registrarBusca({ termo: "xilofonista", resultados: 0, filtrada: false });

    expect(termosBuscados()).toEqual([]);
  });

  it("não guarda navegação só de filtro, que não tem termo", async () => {
    fingirArmazenamento();
    const { registrarBusca, termosBuscados } = await carregar();

    registrarBusca({ termo: undefined, resultados: 42, filtrada: true });
    registrarBusca({ termo: "  ", resultados: 42, filtrada: true });

    expect(termosBuscados()).toEqual([]);
  });

  it("tira da lista o termo que passou a devolver zero sozinho", async () => {
    fingirArmazenamento();
    const { registrarBusca, termosBuscados } = await carregar();

    registrarBusca({ termo: "analista", resultados: 199, filtrada: false });
    registrarBusca({ termo: "professor", resultados: 2609, filtrada: false });
    registrarBusca({ termo: "analista", resultados: 0, filtrada: false });

    expect(termosBuscados()).toEqual(["professor"]);
  });

  it("mantém o termo quando o zero veio do filtro, e não dele", async () => {
    fingirArmazenamento();
    const { registrarBusca, termosBuscados } = await carregar();

    registrarBusca({ termo: "analista", resultados: 199, filtrada: false });
    // "analista" no Acre devolve zero por causa do Acre.
    registrarBusca({ termo: "analista", resultados: 0, filtrada: true });

    expect(termosBuscados()).toEqual(["analista"]);
  });

  it("guarda a busca filtrada, porque filtro só estreita", async () => {
    fingirArmazenamento();
    const { registrarBusca, termosBuscados } = await carregar();

    registrarBusca({ termo: "analista", resultados: 3, filtrada: true });

    expect(termosBuscados()).toEqual(["analista"]);
  });
});

describe("o armazenamento", () => {
  it("escreve e relê o que guardou", async () => {
    const dados = fingirArmazenamento();
    const primeiro = await carregar();
    primeiro.lembrarTermo("analista");
    primeiro.lembrarTermo("professor");

    expect(JSON.parse(dados.get(CHAVE)!)).toEqual(["professor", "analista"]);

    const segundo = await carregar();
    expect(segundo.termosBuscados()).toEqual(["professor", "analista"]);
  });

  it("não quebra com o armazenamento bloqueado", async () => {
    fingirArmazenamentoBloqueado();
    const { lembrarTermo, registrarBusca, termosBuscados } = await carregar();

    expect(termosBuscados()).toEqual([]);
    expect(() => lembrarTermo("analista")).not.toThrow();
    expect(() =>
      registrarBusca({ termo: "analista", resultados: 9, filtrada: false }),
    ).not.toThrow();
    // A memória em processo vale para esta navegação, como em `ufLembrada`.
    expect(termosBuscados()).toEqual(["analista"]);
  });

  it("ignora conteúdo estragado em vez de derrubar a barra", async () => {
    for (const estragado of [
      "isto não é json",
      '"uma string"',
      "{}",
      "null",
      "[1, 2, 3]",
      "[null, false]",
    ]) {
      fingirArmazenamento(estragado);
      const { termosBuscados } = await carregar();
      expect(termosBuscados()).toEqual([]);
    }
  });

  it("saneia o que sobrou de outra versão: lixo, repetido e excesso", async () => {
    const guardado = JSON.stringify([
      "analista",
      42,
      "  analista  ",
      "ANALISTA",
      "",
      ...Array.from({ length: 20 }, (_, i) => `sobra ${i}`),
    ]);
    fingirArmazenamento(guardado);
    const { termosBuscados } = await carregar();

    const termos = termosBuscados();
    expect(termos).toHaveLength(10);
    expect(termos[0]).toBe("analista");
    expect(termos.filter((termo) => /analista/i.test(termo))).toHaveLength(1);
  });

  it("devolve sempre a mesma referência enquanto nada muda", async () => {
    fingirArmazenamento();
    const { lembrarTermo, termosBuscados, termosBuscadosNoServidor } =
      await carregar();

    // É o que impede o laço infinito do `useSyncExternalStore`.
    expect(termosBuscados()).toBe(termosBuscados());
    expect(termosBuscadosNoServidor()).toBe(termosBuscadosNoServidor());
    expect(termosBuscadosNoServidor()).toEqual([]);

    lembrarTermo("analista");
    const depois = termosBuscados();
    lembrarTermo("analista");
    expect(termosBuscados()).toBe(depois);
  });

  it("avisa os ouvintes quando a lista muda, e só então", async () => {
    fingirArmazenamento();
    const { assinarTermosBuscados, lembrarTermo } = await carregar();

    const ouvinte = vi.fn();
    const desassinar = assinarTermosBuscados(ouvinte);

    lembrarTermo("analista");
    expect(ouvinte).toHaveBeenCalledTimes(1);

    // O mesmo termo já em primeiro não muda a lista.
    lembrarTermo("analista");
    expect(ouvinte).toHaveBeenCalledTimes(1);

    desassinar();
    lembrarTermo("professor");
    expect(ouvinte).toHaveBeenCalledTimes(1);
  });

  it("esquece o termo pedido e só ele", async () => {
    fingirArmazenamento();
    const { esquecerTermo, lembrarTermo, termosBuscados } = await carregar();

    lembrarTermo("analista");
    lembrarTermo("professor");
    esquecerTermo("ANALISTA");

    expect(termosBuscados()).toEqual(["professor"]);
  });
});
