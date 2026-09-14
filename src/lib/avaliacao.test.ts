import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LIMITE_DO_COMENTARIO,
  formularioDoPedido,
  lerPedido,
  novoAvaliador,
  registrarAvaliacao,
  resultadoDaResposta,
  type Pedido,
} from "./avaliacao";

/**
 * O que é testável sem navegador: o clique virando corpo de requisição, o
 * corpo virando pedido, o pedido virando requisição ao engine e a resposta da
 * rota virando frase na tela. O componente em si
 * (`components/concurso/Avaliacao.tsx`) continua sem rede de testes — a suíte
 * é Node, sem DOM, e é a quinta vez que isto aparece no relatório.
 */

function formulario(campos: Record<string, string>): FormData {
  const dados = new FormData();
  for (const [chave, valor] of Object.entries(campos)) dados.set(chave, valor);
  return dados;
}

const CLIQUE = { slug: "trt-2-analista-2026", gostei: "nao" };

describe("lerPedido", () => {
  it("um clique em 'não gostei' já é um pedido completo, sem comentário", () => {
    // O ponto do recorte: o registro acontece no clique. Se o pedido só
    // ficasse válido com comentário, quem fecha o modal sem escrever — que é
    // a maioria — não teria dito nada.
    const pedido = lerPedido(formulario(CLIQUE));

    expect(pedido).toEqual({
      slug: "trt-2-analista-2026",
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

  it("o pedido é o concurso e o voto: item nenhum atravessa", () => {
    // A granularidade nova, cobrada no caminho de entrada. `bloco`,
    // `pergunta` e `ato` eram do recorte por item; uma aba aberta desde antes
    // da mudança ainda os manda, e o que vale é o voto do concurso — não um
    // 400 na cara de quem clicou.
    const antiga = lerPedido(
      formulario({
        ...CLIQUE,
        bloco: "faq",
        pergunta: "ate_quando",
        ato: "dou-2026-03-05-1",
      }),
    );

    expect(antiga).toEqual({
      slug: "trt-2-analista-2026",
      gostei: false,
      comentario: null,
    });
  });

  it("recusa o que não é slug nem voto", () => {
    expect(lerPedido(formulario({ ...CLIQUE, gostei: "talvez" }))).toBeNull();
    expect(lerPedido(formulario({ slug: "x" }))).toBeNull();
    expect(lerPedido(formulario({ gostei: "sim" }))).toBeNull();
    expect(lerPedido(formulario({ ...CLIQUE, slug: "   " }))).toBeNull();
  });
});

describe("formularioDoPedido", () => {
  it("o que o navegador manda é exatamente o que a rota consegue ler", () => {
    // As duas metades da mesma regra. Se um campo mudar de nome de um lado
    // só, é aqui que aparece — e não em produção, como um campo que some e
    // leva o voto junto.
    expect(
      lerPedido(
        formularioDoPedido("trt-2-analista-2026", false, "a data está errada"),
      ),
    ).toEqual({
      slug: "trt-2-analista-2026",
      gostei: false,
      comentario: "a data está errada",
    });
  });

  it("o clique sem comentário não manda campo de comentário nenhum", () => {
    // Campo vazio no corpo viraria "comentou e não disse nada" se `lerPedido`
    // um dia deixar de aparar. Não mandar é a versão que não depende disso.
    expect(formularioDoPedido("x", true).has("comentario")).toBe(false);
    expect(formularioDoPedido("x", true, "  \n ").has("comentario")).toBe(false);
    expect(lerPedido(formularioDoPedido("x", true))?.comentario).toBeNull();
  });

  it("o corpo tem o slug e o voto, e nada do recorte por item", () => {
    const dados = formularioDoPedido("x", false);

    expect([...dados.keys()].sort()).toEqual(["gostei", "slug"]);
    expect(dados.get("gostei")).toBe("nao");
  });
});

describe("resultadoDaResposta", () => {
  it("o que a rota afirma é o que a tela diz", () => {
    expect(resultadoDaResposta({ resultado: "gravada" })).toBe("gravada");
    expect(resultadoDaResposta({ resultado: "sem-api" })).toBe("sem-api");
    expect(resultadoDaResposta({ resultado: "pedido-invalido" })).toBe(
      "pedido-invalido",
    );
  });

  it("resposta que não se entende é falha, nunca 'gravada'", () => {
    // O modo de errar que importa é dizer "obrigado" para quem não teve o
    // clique registrado. Corpo vazio, HTML de proxy, JSON de outro formato:
    // tudo isso é "não deu", e a pessoa pode tentar de novo.
    expect(resultadoDaResposta(null)).toBe("falhou");
    expect(resultadoDaResposta(undefined)).toBe("falhou");
    expect(resultadoDaResposta({})).toBe("falhou");
    expect(resultadoDaResposta("<html>502</html>")).toBe("falhou");
    expect(resultadoDaResposta({ resultado: "ok" })).toBe("falhou");
    expect(resultadoDaResposta({ resultado: true })).toBe("falhou");
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
    // O corpo EXATO, e não só os campos que interessam. O modelo do engine
    // ignora campo desconhecido em silêncio (pydantic, `extra` no padrão),
    // então um `bloco` ressuscitado aqui não quebraria nada e também não
    // gravaria nada — o modo de falhar mais caro que existe. Igualdade do
    // corpo inteiro é o que faz isso aparecer no teste em vez de no banco.
    expect(JSON.parse(chamadas[0][1].body as string)).toEqual({
      slug: "trt-2-analista-2026",
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
