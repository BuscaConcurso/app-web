import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LIMITE_DO_COMENTARIO,
  lerPedido,
  novoAvaliador,
  registrarAvaliacao,
  type Pedido,
} from "./avaliacao";

/**
 * O que é testável sem navegador: o formulário virando pedido e o pedido
 * virando requisição. O componente em si (`components/concurso/Avaliacao.tsx`)
 * continua sem rede de testes — a suíte é Node, sem DOM, e é a quinta vez que
 * isto aparece no relatório.
 */

function formulario(campos: Record<string, string>): FormData {
  const dados = new FormData();
  for (const [chave, valor] of Object.entries(campos)) dados.set(chave, valor);
  return dados;
}

const CLIQUE = { slug: "trt-2-analista-2026", bloco: "cargos", gostei: "nao" };

describe("lerPedido", () => {
  it("um clique em 'não gostei' já é um pedido completo, sem comentário", () => {
    // O ponto do recorte: o registro acontece no clique. Se o pedido só
    // ficasse válido com comentário, quem fecha o modal sem escrever — que é
    // a maioria — não teria dito nada.
    const pedido = lerPedido(formulario(CLIQUE));

    expect(pedido).toEqual({
      slug: "trt-2-analista-2026",
      bloco: "cargos",
      pergunta: undefined,
      ato: null,
      gostei: false,
      comentario: null,
    });
  });

  it("'gostei' também vira pedido", () => {
    // Sem o positivo, a base só tem reclamação e ninguém sabe o denominador.
    expect(lerPedido(formulario({ ...CLIQUE, gostei: "sim" }))?.gostei).toBe(true);
  });

  it("comentário em branco é ausência de comentário, não texto vazio", () => {
    // Nulo quer dizer "não comentou". String vazia diria "comentou e não
    // disse nada", que é outra coisa e mancharia a contagem.
    const pedido = lerPedido(formulario({ ...CLIQUE, comentario: "   \n " }));

    expect(pedido?.comentario).toBeNull();
  });

  it("o comentário chega limpo e dentro do limite", () => {
    const pedido = lerPedido(
      formulario({ ...CLIQUE, comentario: "  a data está errada  " }),
    );
    const enorme = lerPedido(
      formulario({ ...CLIQUE, comentario: "a".repeat(LIMITE_DO_COMENTARIO + 500) }),
    );

    expect(pedido?.comentario).toBe("a data está errada");
    expect(enorme?.comentario).toHaveLength(LIMITE_DO_COMENTARIO);
  });

  it("leva o ato, que é o que amarra a avaliação à procedência", () => {
    const pedido = lerPedido(formulario({ ...CLIQUE, ato: "dou-2026-03-05-1" }));

    expect(pedido?.ato).toBe("dou-2026-03-05-1");
  });

  it("pergunta é do FAQ e de mais nada", () => {
    // A mesma regra que o serviço devolve como 422 e o banco como `check`.
    // Aqui ela evita a requisição inútil; ela não substitui nenhuma das duas.
    expect(
      lerPedido(formulario({ ...CLIQUE, pergunta: "quanto_custa" })),
    ).toBeNull();
    expect(lerPedido(formulario({ ...CLIQUE, bloco: "faq" }))).toBeNull();
    expect(
      lerPedido(formulario({ ...CLIQUE, bloco: "faq", pergunta: "quanto_custa" }))
        ?.pergunta,
    ).toBe("quanto_custa");
  });

  it("recusa o que não é bloco, pergunta ou voto", () => {
    expect(lerPedido(formulario({ ...CLIQUE, bloco: "rodape" }))).toBeNull();
    expect(
      lerPedido(formulario({ ...CLIQUE, bloco: "faq", pergunta: "quem_paga" })),
    ).toBeNull();
    expect(lerPedido(formulario({ ...CLIQUE, gostei: "talvez" }))).toBeNull();
    expect(lerPedido(formulario({ slug: "x", bloco: "cargos" }))).toBeNull();
  });
});

describe("novoAvaliador", () => {
  it("dá um token novo a cada pessoa, longo o bastante para não colidir", () => {
    // Ele não é identidade: é só o que impede dez cliques de virarem dez
    // linhas. Dois navegadores continuam sendo duas pessoas para esta base.
    const tokens = new Set(Array.from({ length: 50 }, novoAvaliador));

    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(token.length).toBeGreaterThanOrEqual(8);
  });
});

const PEDIDO: Pedido = {
  slug: "trt-2-analista-2026",
  bloco: "faq",
  pergunta: "ate_quando",
  ato: "dou-1",
  gostei: false,
  comentario: null,
};

describe("registrarAvaliacao", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("manda o pedido para a API com o token de quem clicou", async () => {
    const chamadas: [string, RequestInit][] = [];
    vi.stubEnv("BC_API_URL", "http://127.0.0.1:8787/");
    vi.stubGlobal("fetch", async (url: string, opcoes: RequestInit) => {
      chamadas.push([url, opcoes]);
      return new Response("{}", { status: 200 });
    });

    const resultado = await registrarAvaliacao(PEDIDO, "token-de-navegador");

    expect(resultado).toBe("gravada");
    // A barra do fim some, como em `concursos.ts`: endereço com duas barras
    // vira 404 e ninguém descobre por quê.
    expect(chamadas[0][0]).toBe("http://127.0.0.1:8787/avaliacao");
    expect(chamadas[0][1].method).toBe("POST");
    expect(JSON.parse(chamadas[0][1].body as string)).toEqual({
      slug: "trt-2-analista-2026",
      bloco: "faq",
      pergunta: "ate_quando",
      ato: "dou-1",
      gostei: false,
      comentario: null,
      avaliador: "token-de-navegador",
    });
  });

  it("sem API configurada, diz que não gravou em vez de fingir", async () => {
    // É o modo mock: a tela mostra o acervo de mentira e não tem onde
    // registrar. Um "obrigado" aqui seria a mesma mentira do acervo de mock
    // se passando por acervo de verdade.
    vi.stubEnv("BC_API_URL", "");
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);

    expect(await registrarAvaliacao(PEDIDO, "token-de-navegador")).toBe("sem-api");
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("API que recusa não derruba a página de quem clicou", async () => {
    vi.stubEnv("BC_API_URL", "http://127.0.0.1:8787");
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 503 }));

    expect(await registrarAvaliacao(PEDIDO, "token-de-navegador")).toBe("falhou");
  });

  it("API fora do ar também não derruba", async () => {
    // O pior desfecho possível seria a página do concurso morrer justamente
    // quando alguém clica dizendo que ela está errada.
    vi.stubEnv("BC_API_URL", "http://127.0.0.1:8787");
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });

    expect(await registrarAvaliacao(PEDIDO, "token-de-navegador")).toBe("falhou");
  });
});
