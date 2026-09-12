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
    sigla: "",
    // A API manda nulo nos dois: nenhum órgão do acervo tem esfera, e `poder`
    // não existe no banco do engine. Os tipos do front os declaram
    // obrigatórios, e é isso que estes `as never` registram — a divergência é
    // real e está no relatório, não é descuido do teste.
    esfera: null as never,
    poder: null as never,
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
