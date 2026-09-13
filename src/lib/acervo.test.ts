import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConcursoResumo } from "./dominio";
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
 * `resetModules()` antes do `import` dinâmico — sem isso, o primeiro teste
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
  inscricoesDe: null,
  inscricoesAte: null,
  publicadoEm: "2026-05-12",
  previstoPara: 2026,
  vagas: 1,
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

beforeEach(() => {
  avisos = [];
  vi.spyOn(console, "warn").mockImplementation((mensagem: string) => {
    avisos.push(String(mensagem));
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
      respostaCom({ concursos: [UM_CONCURSO], semDado: 9309 }),
    );
    vi.stubGlobal("fetch", rede);

    const { listarConcursos } = await carregar();
    const pagina = await listarConcursos({ porPagina: 1000 });

    expect(rede).toHaveBeenCalledWith(`${API}/acervo`, { cache: "no-store" });
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

    expect(rede).toHaveBeenCalledWith(`${API}/acervo`, { cache: "no-store" });
  });

  it("API fora do ar cai no mock, e avisa", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { listarConcursos } = await carregar();
    const pagina = await listarConcursos({ porPagina: 1000 });

    expect(pagina.total).toBe(CONCURSOS.length);
    // Cair no mock em silêncio é pior do que a tela vazia: alguém demonstra o
    // mock achando que está vendo o acervo do engine.
    expect(avisos.join()).toContain("ECONNREFUSED");
    expect(avisos.join()).toContain("usando o mock");
  });

  it("resposta de erro cai no mock, e avisa", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ erro: "x" }, 500)));

    const { listarConcursos } = await carregar();
    const pagina = await listarConcursos({ porPagina: 1000 });

    expect(pagina.total).toBe(CONCURSOS.length);
    expect(avisos.join()).toContain("500");
  });

  it("resposta sem a lista de concursos cai no mock, e avisa", async () => {
    vi.stubEnv("BC_API_URL", API);
    // O caso de apontar a variável para outro serviço qualquer que responde
    // 200: sem esta checagem, `filtrar` receberia `undefined` e a página
    // morreria com TypeError no lugar de mostrar o mock.
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ ok: true })));

    const { listarConcursos } = await carregar();
    const pagina = await listarConcursos({ porPagina: 1000 });

    expect(pagina.total).toBe(CONCURSOS.length);
    expect(avisos.join()).toContain("`concursos`");
  });

  it("o aviso conta os concursos que a rota não mandou", async () => {
    // A decisão de produto é que a lista traz só quem tem dado e a contagem
    // do resto aparece como aviso. Sem esta função, o número chegava no app e
    // morria aqui, e a tela afirmava por omissão que o acervo tem um
    // concurso.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({ concursos: [UM_CONCURSO], total: 9311, semDado: 9310 }),
    ));

    const { avisoDoAcervo, listarConcursos } = await carregar();

    expect(await avisoDoAcervo()).toEqual({ semDado: 9310, total: 9311 });
    expect((await listarConcursos({ porPagina: 1000 })).total).toBe(1);
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

  it("API fora do ar não inventa aviso", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { avisoDoAcervo } = await carregar();

    // Caiu no mock: dizer "faltam 9.309" sobre o mock seria uma afirmação
    // falsa sobre um acervo que nem está sendo mostrado.
    expect(await avisoDoAcervo()).toBeNull();
    expect(avisos.join()).toContain("usando o mock");
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
    // Sem sigla, o termo de busca do link do órgão é o nome. `q=` vazio
    // traria o acervo inteiro atrás de um link que promete um órgão.
    expect(links.orgaos[0].href).toContain(encodeURIComponent("Ministério"));
  });
});

describe("obterDetalhe", () => {
  const DETALHE = {
    ...UM_CONCURSO,
    cronograma: [
      {
        tipo: "inicio_inscricao",
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
        url: "https://www.in.gov.br/web/dou/-/49284164",
        titulo: "EDITAL Nº 10",
        fonte: "Diário Oficial da União",
        vistoEm: "2026-09-12T03:55:48Z",
      },
    ],
  };

  it("vem da rota do concurso, com cronograma, cargos e origem", async () => {
    vi.stubEnv("BC_API_URL", API);
    const rede = vi.fn(async () => respostaCom(DETALHE));
    vi.stubGlobal("fetch", rede);

    const { obterDetalhe } = await carregar();
    const detalhe = await obterDetalhe("so-este");

    expect(rede).toHaveBeenCalledWith(`${API}/concurso/so-este`, {
      cache: "no-store",
    });
    expect(detalhe!.cronograma[0].evidencia).toContain("18 de maio");
    expect(detalhe!.cargos[0].nome).toBe("Professor Visitante");
    expect(detalhe!.origens[0].url).toContain("in.gov.br");
  });

  it("404 vira nulo, e não o mock", async () => {
    // A página mostra "não encontrado" a partir daqui. Cair no mock faria um
    // slug inexistente abrir um concurso de mentira, com nome de órgão de
    // verdade — o pior dos dois mundos.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ detail: "x" }, 404)));

    const { obterDetalhe } = await carregar();

    expect(await obterDetalhe("trt-2-analista-judiciario-2026")).toBeNull();
    expect(avisos).toEqual([]);
  });

  it("API fora do ar cai no resumo do mock, sem inventar detalhe", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { obterDetalhe } = await carregar();
    const detalhe = await obterDetalhe("trt-2-analista-judiciario-2026");

    expect(detalhe!.titulo).toBe("Analista e técnico judiciário");
    // Cronograma vazio, não um cronograma inventado a partir das datas do
    // resumo: o mock não tem evento nenhum, e a página sabe dizer isso.
    expect(detalhe!.cronograma).toEqual([]);
    expect(detalhe!.cargos).toEqual([]);
    expect(avisos.join()).toContain("usando o mock");
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

  it("diz `falha` quando a API estava configurada e não respondeu", async () => {
    // O caso que motivou isto: a API reiniciando, a tela mostrando o mock com
    // cara de acervo real, e quem olhava quase relatando o mock como dado.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { origemDoAcervo, listarConcursos } = await carregar();

    expect(await origemDoAcervo()).toBe("falha");
    // E a lista continua vindo: a reserva não foi tirada, só deixou de ser
    // silenciosa.
    expect((await listarConcursos({ porPagina: 1000 })).total).toBe(
      CONCURSOS.length,
    );
  });

  it("diz `mock` quando ninguém configurou a API", async () => {
    vi.stubGlobal("fetch", vi.fn());

    const { origemDoAcervo } = await carregar();

    expect(await origemDoAcervo()).toBe("mock");
  });

  it("resposta torta também é falha, não `api`", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () => respostaCom({ ok: true })));

    const { origemDoAcervo } = await carregar();

    expect(await origemDoAcervo()).toBe("falha");
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

  it("conta quem tem, quando tem", async () => {
    vi.stubEnv("BC_API_URL", API);
    const comDado = {
      ...UM_CONCURSO,
      slug: "com-dado",
      uf: "SP",
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
    // ingeridos antes do campo novo não têm endereço nenhum — hoje, todo o
    // acervo. A origem chega assim mesmo: o ato existe.
    vi.stubEnv("BC_API_URL", API);
    vi.stubGlobal("fetch", vi.fn(async () =>
      respostaCom({
        ...UM_CONCURSO,
        cronograma: [],
        cargos: [],
        origens: [
          {
            url: null,
            titulo: "EDITAL Nº 1, DE 5 DE MARÇO DE 2026",
            fonte: "Diário Oficial da União",
            vistoEm: "2026-09-12T03:55:48Z",
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
