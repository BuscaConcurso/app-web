import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConcursoResumo, Uf } from "./dominio";
import { CONCURSOS } from "@/mocks/concursos";

/**
 * A entrada de dados: de onde `acervo()` (src/lib/concursos.ts) tira o
 * acervo, e o que ela faz quando a API do engine não está lá.
 *
 * Fica em arquivo separado de `concursos.test.ts` de propósito. Aquele arquivo
 * testa filtro, contagem e paginação sobre um acervo conhecido e não deve
 * saber que existe uma API; este testa só a fronteira. O sinal de que a troca
 * do mock pela API foi feita certa é `concursos.test.ts` não ter mudado uma
 * linha.
 *
 * `BC_API_URL` é lida na carga do módulo, então cada teste precisa de
 * `resetModules()` antes do `import` dinâmico: sem isso, o primeiro teste
 * congelaria o valor para todos os outros.
 */
const API = "http://api.de.teste";

const UM_CONCURSO: ConcursoResumo = {
  slug: "so-este",
  titulo: "EDITAL Nº 1",
  tipo: "concurso_publico",
  status: "autorizado",
  orgao: {
    slug: "orgao-do-engine",
    nome: "Ministério da Educação/Universidade Federal de Alfenas",
    // A API manda nulo nos três: nenhum órgão do acervo tem sigla ou esfera,
    // e `poder` não existe no banco do engine.
    sigla: null,
    esfera: null,
    poder: null,
    uf: null,
    municipio: null,
    resolvido: false,
    nomeEhCaminho: true,
  },
  banca: null,
  uf: null,
  ufs: [],
  inscricoesDe: null,
  inscricoesAte: null,
  publicadoEm: "2026-05-12",
  previstoPara: 2026,
  vagas: 1,
  vagasPcd: null,
  vagasNegros: null,
  cadastroReserva: false,
  salarioAte: null,
  taxaInscricao: null,
  escolaridades: [],
  nomesDeCargo: ["Professor Visitante"],
  localidades: ["Pelotas"],
  editalUrl: null,
};

function respostaCom(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function carregar() {
  vi.resetModules();
  return import("./concursos");
}

let avisos: string[];
let erros: string[];

beforeEach(() => {
  avisos = [];
  erros = [];
  vi.spyOn(console, "warn").mockImplementation((mensagem: string) => {
    avisos.push(String(mensagem));
  });
  vi.spyOn(console, "error").mockImplementation((mensagem: string) => {
    erros.push(String(mensagem));
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("acervo", () => {
  it("sem BC_API_URL não toca a rede e usa o mock", async () => {
    // A ordem importa: a primeira asserção é a que o teste promete (nenhuma
    // requisição). Se ela viesse depois da contagem, um dia em que o mock e a
    // API tivessem o mesmo tamanho o teste passaria tendo feito rede.
    const rede = vi.fn();
    vi.stubGlobal("fetch", rede);

    const { listarConcursos } = await carregar();
    const pagina = await listarConcursos({ porPagina: 1000 });

    expect(rede).not.toHaveBeenCalled();
    expect(pagina.total).toBe(CONCURSOS.length);
  });

  it("com BC_API_URL, o acervo é o que a rota devolve", async () => {
    vi.stubEnv("BC_API_URL", API);
    const rede = vi.fn(async () =>
      respostaCom({ concursos: [UM_CONCURSO], semDado: 293 }),
    );
    vi.stubGlobal("fetch", rede);

    const { listarConcursos } = await carregar();
    const pagina = await listarConcursos({ porPagina: 1000 });

    expect(rede).toHaveBeenCalledWith(`${API}/acervo`, {
      next: { revalidate: 300 },
      signal: expect.any(AbortSignal),
    });
    expect(pagina.total).toBe(1);
    expect(pagina.itens[0].slug).toBe("so-este");
    expect(avisos).toEqual([]);
  });

  it("a barra sobrando no fim da variável não vira barra dupla na URL", async () => {
    vi.stubEnv("BC_API_URL", `${API}/`);
    const rede = vi.fn(async () => respostaCom({ concursos: [], semDado: 0 }));
    vi.stubGlobal("fetch", rede);

    const { listarConcursos } = await carregar();
    await listarConcursos();

    expect(rede).toHaveBeenCalledWith(`${API}/acervo`, {
      next: { revalidate: 300 },
      signal: expect.any(AbortSignal),
    });
  });

  it("no build, API fora do ar derruba o build em vez de congelar o mock", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { listarConcursos } = await carregar();

    await expect(listarConcursos()).rejects.toThrow("ECONNREFUSED");
    expect(avisos).toEqual([]);
  });

  it("dentro dos cinco minutos, leituras seguidas fazem uma requisição só", async () => {
    vi.stubEnv("BC_API_URL", API);
    const rede = vi.fn(async () => respostaCom({ concursos: [UM_CONCURSO], semDado: 0 }));
    vi.stubGlobal("fetch", rede);

    const { listarConcursos, dimensoesDoAcervo } = await carregar();
    await listarConcursos();
    await dimensoesDoAcervo();

    expect(rede).toHaveBeenCalledTimes(1);
  });

  // Com a API configurada, falha sem leitura boa anterior lança, e não cai
  // no mock: numa regeneração ISR o mock ficaria no cache por cinco minutos,
  // com concursos inventados, para todo mundo. O erro vai para o log.
  it("API fora do ar, sem leitura boa anterior, lança em vez de cair no mock", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { listarConcursos } = await carregar();

    await expect(listarConcursos()).rejects.toThrow("ECONNREFUSED");
    expect(erros.join()).toContain("ECONNREFUSED");
    expect(avisos.join()).not.toContain("usando o mock");
  });

  it("resposta de erro lança", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ erro: "x" }, 500)));

    const { listarConcursos } = await carregar();

    await expect(listarConcursos()).rejects.toThrow("500");
  });

  it("resposta sem a lista de concursos lança", async () => {
    vi.stubEnv("BC_API_URL", API);
    // O caso de apontar a variável para outro serviço qualquer que responde
    // 200: sem esta checagem, `filtrar` receberia `undefined` e a página
    // morreria com TypeError longe daqui.
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ ok: true })));

    const { listarConcursos } = await carregar();

    await expect(listarConcursos()).rejects.toThrow("`concursos`");
  });

  it("API fora do ar depois de uma leitura boa devolve a leitura boa", async () => {
    vi.stubEnv("BC_API_URL", API);
    let agora = 0;
    vi.spyOn(Date, "now").mockImplementation(() => agora);
    let vezes = 0;
    vi.stubGlobal("fetch", vi.fn(async () => {
      vezes += 1;
      if (vezes > 1) throw new Error("ECONNREFUSED");
      return respostaCom({ concursos: [UM_CONCURSO], semDado: 0 });
    }));

    const { listarConcursos, origemDoAcervo } = await carregar();
    expect((await listarConcursos()).total).toBe(1);

    agora = 300_000;
    const pagina = await listarConcursos();

    expect(vezes).toBe(2);
    expect(pagina.itens[0].slug).toBe("so-este");
    expect(await origemDoAcervo()).toBe("api");
  });

  it("o aviso conta os concursos que a rota não mandou, e por que estão fora", async () => {
    // A decisão de produto é que a lista traz só quem tem dado e a contagem
    // do resto aparece como aviso. Sem esta função, o número chegava no app e
    // morria aqui, e a tela afirmava por omissão que o acervo tem um
    // concurso.
    //
    // A repartição vem junto porque o número sozinho fazia a tela mentir:
    // ela dizia que os que estão fora "entram na lista conforme forem
    // lidos", e hoje isso não vale para nenhum deles. Números da carga real
    // de 2026-09-14, depois da remoção da fonte IBADE.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({
        concursos: [UM_CONCURSO],
        total: 4838,
        semDado: 189,
        foraDaLista: {
          total: 189, naFila: 0, naoAbreConcurso: 138, lacuna: 51,
        },
      }),
    ));

    const { avisoDoAcervo, listarConcursos } = await carregar();

    expect(await avisoDoAcervo()).toEqual({
      semDado: 189,
      total: 4838,
      naFila: 0,
      naoAbreConcurso: 138,
      lacuna: 51,
    });
    expect((await listarConcursos({ porPagina: 1000 })).total).toBe(1);
  });

  it("engine sem `foraDaLista` zera a repartição em vez de chutá-la", async () => {
    // API e app sobem separados, e o app novo chega antes do engine novo com
    // frequência. O que NÃO se pode fazer aqui é preencher `naFila: semDado`
    // para a frase ficar bonita: seria refazer, do lado do front, a promessa
    // de entrada automática que este trabalho existe para desfazer. Três
    // zeros não somam 189, `acervoIncompletoEmPartes` descarta a repartição,
    // e a tela usa a frase curta.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [UM_CONCURSO], total: 4838, semDado: 189 }),
    ));

    const { avisoDoAcervo } = await carregar();

    expect(await avisoDoAcervo()).toEqual({
      semDado: 189, total: 4838, naFila: 0, naoAbreConcurso: 0, lacuna: 0,
    });
  });

  it("a fila vazia de hoje atravessa a fronteira como zero, não como ausência", async () => {
    // O caso que o estado de 2026-09-14 tornou o principal: `naFila: 0` é um
    // zero VERDADEIRO (a fonte IBADE saiu e com ela os 104 jobs que havia),
    // não um campo que faltou. A diferença aparece na soma: 0 + 138 + 51
    // fecha os 189, então a repartição vale e a frase sai com duas orações.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({
        concursos: [UM_CONCURSO],
        total: 4838,
        semDado: 189,
        foraDaLista: {
          total: 189, naFila: 0, naoAbreConcurso: 138, lacuna: 51,
        },
      }),
    ));

    const { avisoDoAcervo } = await carregar();
    const { acervoIncompletoEmPartes } = await import("./rotulos");
    const aviso = (await avisoDoAcervo())!;
    const partes = acervoIncompletoEmPartes(aviso);

    expect(aviso.naFila).toBe(0);
    expect(partes.map((parte) => parte.quantos)).toEqual([138, 51]);
    // Nenhuma oração de zero, e a soma continua fechando o total.
    expect(partes.every((parte) => parte.quantos > 0)).toBe(true);
    expect(partes.reduce((soma, parte) => soma + parte.quantos, 0)).toBe(189);
    expect(partes.map((parte) => parte.texto).join(" ")).not.toContain("fila");
  });

  it("a frase da tela nunca promete entrada automática sobre o total", async () => {
    // O teste que a frase antiga reprovava, montado ponta a ponta: a resposta
    // da API atravessa `avisoDoAcervo()` e chega em
    // `acervoIncompletoEmPartes()` como a tela a recebe. Medido com a carga
    // do dia seguinte, quando o `tick` já enfileirou o Diário: a promessa
    // existe, e cobre só os 59 da fila.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({
        concursos: [UM_CONCURSO],
        total: 4897,
        semDado: 248,
        foraDaLista: {
          total: 248, naFila: 59, naoAbreConcurso: 138, lacuna: 51,
        },
      }),
    ));

    const { avisoDoAcervo } = await carregar();
    const { acervoIncompletoEmPartes } = await import("./rotulos");
    const aviso = (await avisoDoAcervo())!;
    const partes = acervoIncompletoEmPartes(aviso);

    const prometem = partes.filter((parte) =>
      /entra(m)? quando/.test(parte.texto),
    );
    expect(prometem).toHaveLength(1);
    expect(prometem[0].quantos).toBe(59);
    expect(prometem[0].quantos).toBeLessThan(aviso.semDado);
    // E o que a promessa NÃO cobre continua na frase, dito por inteiro.
    expect(partes.reduce((soma, parte) => soma + parte.quantos, 0)).toBe(248);
  });

  it("acervo sem buraco não vira aviso", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [UM_CONCURSO], total: 1, semDado: 0 }),
    ));

    const { avisoDoAcervo } = await carregar();

    expect(await avisoDoAcervo()).toBeNull();
  });

  it("com o mock não há aviso: o mock não é um acervo pela metade", async () => {
    const rede = vi.fn();
    vi.stubGlobal("fetch", rede);

    const { avisoDoAcervo } = await carregar();

    expect(rede).not.toHaveBeenCalled();
    expect(await avisoDoAcervo()).toBeNull();
  });

  it("API fora do ar não inventa aviso: lança", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { avisoDoAcervo } = await carregar();

    await expect(avisoDoAcervo()).rejects.toThrow("ECONNREFUSED");
  });

  it("as facetas rotulam órgão e banca com o que vem da rota", async () => {
    // As duas funções liam o nome em `@/mocks/orgaos` e `@/mocks/bancas` pelo
    // slug. Nenhum dos 1.332 órgãos do engine está lá: a busca voltava
    // `undefined` e `undefined.nome` derrubava a home na primeira linha real.
    vi.stubEnv("BC_API_URL", API);
    const aberto: ConcursoResumo = {
      ...UM_CONCURSO,
      status: "inscricoes_abertas",
      inscricoesAte: "2099-01-01",
      banca: { slug: "banca-do-engine", nome: "Instituto Brasileiro" },
    };
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [aberto], semDado: 0 }),
    ));

    const { facetas, contagensDeFaceta } = await carregar();
    const links = await facetas();
    const contagens = await contagensDeFaceta();

    expect(links.orgaos.map((o) => o.rotulo)).toEqual([
      "Ministério da Educação/Universidade Federal de Alfenas",
    ]);
    expect(links.bancas.map((b) => b.rotulo)).toEqual(["Instituto Brasileiro"]);
    expect(contagens.bancas.map((b) => b.rotulo)).toEqual(["Instituto Brasileiro"]);
    // O link do órgão aponta para a página dele, pela chave que agrupa essa
    // página, e não mais para `?q=<sigla ou nome>`, que respondia por
    // aproximação sobre o texto buscável e trazia também quem só cita o órgão
    // no título. O slug vem da rota, como o rótulo: nenhum órgão do engine
    // está em `@/mocks/orgaos`.
    expect(links.orgaos[0].href).toBe("/orgaos/orgao-do-engine");
  });
});

describe("obterDetalhe", () => {
  const DETALHE = {
    ...UM_CONCURSO,
    cronograma: [
      {
        tipo: "inicio_inscricao",
        ato: "49284164",
        inicio: "2026-05-18",
        fim: null,
        hora: null,
        localidades: [],
        observacao: null,
        evidencia: "As inscrições serão realizadas de 18 de maio a 21 de junho",
      },
    ],
    cargos: [
      {
        nome: "Professor Visitante",
        codigo: null,
        escolaridade: "superior",
        area: "Antropologia",
        jornadaHoras: 40,
        requisitos: [],
        taxaInscricao: 200,
        vagas: [],
        remuneracoes: [],
        evidencia: [],
      },
    ],
    origens: [
      {
        chave: "49284164",
        url: "https://www.in.gov.br/leiturajornal?data=13-05-2026",
        titulo: "EDITAL Nº 10",
        fonte: "Diário Oficial da União",
        vistoEm: "2026-09-12T03:55:48Z",
        texto: "EDITAL Nº 10, DE 13 DE MAIO DE 2026 ...",
        caracteres: 2911,
        faq: [],
        editalCitadoUrl: "https://www.vunesp.com.br/TRT2601",
      },
    ],
    editalCitadoUrl: "https://www.vunesp.com.br/TRT2601",
  };

  it("vem da rota do concurso, com cronograma, cargos e origem", async () => {
    vi.stubEnv("BC_API_URL", API);
    const rede = vi.fn(async () => respostaCom(DETALHE));
    vi.stubGlobal("fetch", rede);

    const { obterDetalhe } = await carregar();
    const detalhe = await obterDetalhe("so-este");

    expect(rede).toHaveBeenCalledWith(`${API}/concursos/so-este`, {
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
    expect(detalhe!.cronograma[0].evidencia).toContain("18 de maio");
    expect(detalhe!.cargos[0].nome).toBe("Professor Visitante");
    expect(detalhe!.origens[0].url).toContain("in.gov.br");
  });

  it("404 vira nulo, e não o mock", async () => {
    // A página mostra "não encontrado" a partir daqui. Cair no mock faria um
    // slug inexistente abrir um concurso de mentira, com nome de órgão de
    // verdade: o pior dos dois mundos.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ detail: "x" }, 404)));

    const { obterDetalhe } = await carregar();

    expect(await obterDetalhe("trt-2-analista-judiciario-2026")).toBeNull();
    expect(avisos).toEqual([]);
  });

  // Com BC_API_URL, falha não é mock. Um slug real que o mock não tem
  // viraria 404 com noindex durante a queda; lançando, a página de erro
  // responde e o 404 fica só para o slug que a API diz não existir.
  it("API fora do ar lança, e não cai no mock", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { obterDetalhe } = await carregar();

    // Slug que existe no mock: antes, a queda o servia com dado de mentira.
    await expect(obterDetalhe("trt-2-analista-judiciario-2026")).rejects.toThrow(
      "ECONNREFUSED",
    );
    // Slug real que o mock não tem: antes, virava 404.
    await expect(obterDetalhe("so-este")).rejects.toThrow("ECONNREFUSED");
    expect(erros.join()).toContain("a página de erro responde");
    expect(avisos.join()).not.toContain("mock");
  });

  it("5xx da API lança", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ detail: "x" }, 503)));

    const { obterDetalhe } = await carregar();

    await expect(obterDetalhe("so-este")).rejects.toThrow("a API respondeu 503");
  });

  it("tempo esgotado lança", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    }));

    const { obterDetalhe } = await carregar();

    await expect(obterDetalhe("so-este")).rejects.toThrow(/timeout/);
  });

  it("resposta sem concurso lança", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ outra: "coisa" })));

    const { obterDetalhe } = await carregar();

    await expect(obterDetalhe("so-este")).rejects.toThrow("a resposta não tem um concurso");
  });

  it("sem BC_API_URL não toca a rede e devolve o resumo do mock", async () => {
    const rede = vi.fn();
    vi.stubGlobal("fetch", rede);

    const { obterDetalhe } = await carregar();
    const detalhe = await obterDetalhe("trt-2-analista-judiciario-2026");

    expect(rede).not.toHaveBeenCalled();
    expect(detalhe!.cronograma).toEqual([]);
    expect(detalhe!.origens).toEqual([]);
  });

  it("slug que não existe no mock também é nulo", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const { obterDetalhe } = await carregar();

    expect(await obterDetalhe("nao-existe")).toBeNull();
  });
});

describe("origemDoAcervo", () => {
  it("diz `api` quando a API respondeu", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [UM_CONCURSO], total: 1, semDado: 0 }),
    ));

    const { origemDoAcervo } = await carregar();

    expect(await origemDoAcervo()).toBe("api");
  });

  it("com a API configurada e fora do ar, não finge origem nenhuma: lança", async () => {
    // O caso que motivou a faixa de origem: a API reiniciando, a tela
    // mostrando o mock com cara de acervo real. Hoje não há mock com a API
    // configurada, então não há o que avisar: a página falha ou continua a
    // velha.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { origemDoAcervo } = await carregar();

    await expect(origemDoAcervo()).rejects.toThrow("ECONNREFUSED");
  });

  it("diz `mock` quando ninguém configurou a API", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const { origemDoAcervo } = await carregar();

    expect(await origemDoAcervo()).toBe("mock");
  });

  it("resposta torta também lança, e não vira `api`", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ ok: true })));

    const { origemDoAcervo } = await carregar();

    await expect(origemDoAcervo()).rejects.toThrow("`concursos`");
  });
});

describe("dimensoesDoAcervo", () => {
  it("conta os campos que o filtro lê, não os parecidos", async () => {
    // `filtrar` casa `concurso.uf` no filtro de estado e
    // `concurso.orgao.esfera` no de esfera. Contar `orgao.uf` no lugar de
    // `concurso.uf` faria a tela prometer um filtro que o filtro não entrega.
    vi.stubEnv("BC_API_URL", API);
    const comUfSoNoOrgao = {
      ...UM_CONCURSO,
      slug: "uf-so-no-orgao",
      uf: null,
      orgao: { ...UM_CONCURSO.orgao, uf: "SP" },
    };
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({
        concursos: [UM_CONCURSO, comUfSoNoOrgao],
        total: 2,
        semDado: 0,
      }),
    ));

    const { dimensoesDoAcervo } = await carregar();

    expect(await dimensoesDoAcervo()).toEqual({
      total: 2,
      comUf: 0,
      comEsfera: 0,
    });
  });

  it("o concurso multiestadual conta como filtrável, e o cartão não o mostra", async () => {
    // O caso que a contagem tem de enxergar: `uf` nula porque são vários
    // estados, e mesmo assim filtrável por qualquer um deles. Contar `uf`
    // diria que este concurso não dá para filtrar, e o seletor de estado
    // ficaria desligado com 7 concursos alcançáveis no acervo.
    vi.stubEnv("BC_API_URL", API);
    const nacional = {
      ...UM_CONCURSO,
      slug: "nacional",
      uf: null,
      ufs: ["ES", "SP"] as Uf[],
    };
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [nacional], total: 1, semDado: 0 }),
    ));

    const { dimensoesDoAcervo, listarConcursos } = await carregar();

    expect(await dimensoesDoAcervo()).toEqual({
      total: 1,
      comUf: 1,
      comEsfera: 0,
    });
    expect((await listarConcursos({ uf: "ES" })).total).toBe(1);
  });

  it("conta quem tem, quando tem", async () => {
    vi.stubEnv("BC_API_URL", API);
    const comDado = {
      ...UM_CONCURSO,
      slug: "com-dado",
      uf: "SP",
      ufs: ["SP"] as Uf[],
      orgao: { ...UM_CONCURSO.orgao, esfera: "federal" },
    };
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [UM_CONCURSO, comDado], total: 2, semDado: 0 }),
    ));

    const { dimensoesDoAcervo } = await carregar();

    expect(await dimensoesDoAcervo()).toEqual({
      total: 2,
      comUf: 1,
      comEsfera: 1,
    });
  });
});

describe("origem sem endereço", () => {
  it("o detalhe aceita origem sem url e não inventa uma", async () => {
    // O endereço que o motor montava para o Diário respondia 404, e os atos
    // ingeridos antes do campo novo não têm endereço nenhum: hoje, todo o
    // acervo. A origem chega assim mesmo: o ato existe.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({
        ...UM_CONCURSO,
        cronograma: [],
        cargos: [],
        origens: [
          {
            chave: "1",
            url: null,
            titulo: "EDITAL Nº 1, DE 5 DE MARÇO DE 2026",
            fonte: "Diário Oficial da União",
            vistoEm: "2026-09-12T03:55:48Z",
            texto: "EDITAL Nº 1, DE 5 DE MARÇO DE 2026 ...",
            caracteres: 1837,
            faq: [],
            editalCitadoUrl: null,
          },
        ],
      }),
    ));

    const { obterDetalhe } = await carregar();
    const detalhe = await obterDetalhe("so-este");

    expect(detalhe!.origens[0].url).toBeNull();
    expect(detalhe!.origens[0].titulo).toContain("EDITAL");
  });
});
