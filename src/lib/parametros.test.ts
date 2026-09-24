import { describe, expect, it } from "vitest";
import { termoDoSlug } from "./enderecoDaBusca";
import {
  CONSULTA_VAZIA,
  caminhoDaBusca,
  destinoDoFormulario,
  filtroDaConsulta,
  lerConsulta,
  parametrosDaUrl,
  quantosFiltros,
  urlAlternando,
  urlDaBusca,
  urlSemFiltros,
  urlSemValor,
  type ConsultaDaUrl,
} from "./parametros";

const VAZIA = CONSULTA_VAZIA;

describe("lerConsulta", () => {
  it("descarta valor que não existe no domínio", () => {
    const consulta = lerConsulta({
      uf: "banana",
      escolaridade: ["superior", "jedi"],
      situacao: "qualquer",
      banca: "banca-inventada",
      ordem: "aleatoria",
    });
    expect(consulta.uf).toBeUndefined();
    expect(consulta.escolaridades).toEqual(["superior"]);
    expect(consulta.situacoes).toEqual([]);
    expect(consulta.bancas).toEqual([]);
    expect(consulta.ordem).toBe("encerrando");
  });

  it("aceita o parâmetro repetido e a lista separada por vírgula", () => {
    expect(
      lerConsulta({ escolaridade: ["superior", "medio"] }).escolaridades,
    ).toEqual(["superior", "medio"]);
    expect(lerConsulta({ escolaridade: "superior,medio" }).escolaridades).toEqual(
      ["superior", "medio"],
    );
  });

  it("não conta o mesmo valor duas vezes", () => {
    expect(
      lerConsulta({ escolaridade: ["superior", "superior"] }).escolaridades,
    ).toEqual(["superior"]);
  });

  it("lê o salário com ou sem separador de milhar", () => {
    expect(lerConsulta({ salarioMin: "3.000" }).salarioMin).toBe(3000);
    expect(lerConsulta({ salarioMin: "3000" }).salarioMin).toBe(3000);
    expect(lerConsulta({ salarioMin: "abc" }).salarioMin).toBeUndefined();
    expect(lerConsulta({ salarioMin: "0" }).salarioMin).toBeUndefined();
  });

  it("volta para a primeira página diante de lixo", () => {
    expect(lerConsulta({ pagina: "-3" }).pagina).toBe(1);
    expect(lerConsulta({ pagina: "2,5" }).pagina).toBe(1);
    expect(lerConsulta({ pagina: "4" }).pagina).toBe(4);
  });
});

describe("urlDaBusca", () => {
  it("omite ordenação padrão e primeira página", () => {
    expect(urlDaBusca(VAZIA)).toBe("/concursos");
    expect(urlDaBusca(VAZIA, { ordem: "encerrando", pagina: 1 })).toBe(
      "/concursos",
    );
  });

  it("escreve cada valor da dimensão como parâmetro repetido", () => {
    const url = urlDaBusca(VAZIA, { escolaridades: ["superior", "medio"] });
    expect(url).toBe("/concursos?escolaridade=superior&escolaridade=medio");
  });

  it("sobrevive à ida e à volta, com o termo no caminho", () => {
    const original: ConsultaDaUrl = {
      ...CONSULTA_VAZIA,
      // Já normalizado: o caminho guarda o termo como a busca o compara.
      q: "analista judiciario",
      uf: "SP",
      escolaridades: ["superior", "medio"],
      bancas: ["vunesp"],
      salarioMin: 3000,
      ordem: "vagas",
      pagina: 3,
    };
    const url = new URL(urlDaBusca(original), "http://x");
    const [, rota, slug] = url.pathname.split("/");
    expect(rota).toBe("busca");
    const parametros = {
      ...Object.fromEntries(
        [...new Set(url.searchParams.keys())].map((chave) => [chave, url.searchParams.getAll(chave)]),
      ),
      q: termoDoSlug(slug),
    };
    expect(lerConsulta(parametros)).toEqual(original);
  });

  it("com texto, o termo vai no caminho e sai da query", () => {
    expect(
      urlDaBusca(CONSULTA_VAZIA, { q: "Assistente em Administração", uf: "SP", pagina: 2 }),
    ).toBe("/busca/assistente-em-administracao?uf=SP&pagina=2");
  });

  it("texto sem letra nem número cai na listagem geral", () => {
    expect(urlDaBusca(CONSULTA_VAZIA, { q: "!!!" })).toBe("/concursos");
  });
});

describe("urlAlternando na busca", () => {
  it("marca o filtro sem sair do caminho do termo", () => {
    expect(urlAlternando({ ...CONSULTA_VAZIA, q: "tribunal" }, "situacoes", "abertas")).toBe(
      "/busca/tribunal?situacao=abertas",
    );
  });
});

describe("caminhoDaBusca", () => {
  it("é o caminho do termo, ou a listagem", () => {
    expect(caminhoDaBusca("tribunal")).toBe("/busca/tribunal");
    expect(caminhoDaBusca(undefined)).toBe("/concursos");
    expect(caminhoDaBusca("!!")).toBe("/concursos");
  });
});

describe("urlSemFiltros", () => {
  it("tira estado, facetas e salário e mantém termo e ordenação", () => {
    expect(
      urlSemFiltros({
        ...CONSULTA_VAZIA,
        q: "tribunal",
        uf: "SP",
        escolaridades: ["medio"],
        salarioMin: 3000,
        ordem: "vagas",
        pagina: 3,
      }),
    ).toBe("/busca/tribunal?ordem=vagas");
  });
});

describe("destinoDoFormulario", () => {
  it("leva o texto para o caminho e o estado para a query", () => {
    expect(destinoDoFormulario("Analista Judiciário", "SP")).toBe("/busca/analista-judiciario?uf=SP");
  });

  it("sem texto, é a listagem com o estado", () => {
    expect(destinoDoFormulario("   ", "RJ")).toBe("/concursos?uf=RJ");
    expect(destinoDoFormulario("", "")).toBe("/concursos");
  });

  it("estado que não existe não entra", () => {
    expect(destinoDoFormulario("x", "banana")).toBe("/busca/x");
  });
});

describe("filtroDaConsulta e parametrosDaUrl", () => {
  it("o filtro é a consulta sem ordem nem página", () => {
    expect(
      filtroDaConsulta({ ...CONSULTA_VAZIA, q: "a", uf: "SP", ordem: "vagas", pagina: 2 }),
    ).toEqual({
      q: "a",
      uf: "SP",
      escolaridades: [],
      situacoes: [],
      bancas: [],
      esferas: [],
      salarioMin: undefined,
      salarioMax: undefined,
    });
  });

  it("parâmetro repetido vira lista, e o único continua texto", () => {
    expect(
      parametrosDaUrl(new URLSearchParams("escolaridade=superior&escolaridade=medio&uf=SP")),
    ).toEqual({ escolaridade: ["superior", "medio"], uf: "SP" });
  });
});

describe("urlAlternando", () => {
  it("marca o que não está marcado e desmarca o que está", () => {
    const semNada = urlAlternando(VAZIA, "escolaridades", "superior");
    expect(semNada).toContain("escolaridade=superior");

    const comSuperior = { ...VAZIA, escolaridades: ["superior" as const] };
    expect(urlAlternando(comSuperior, "escolaridades", "superior")).toBe(
      "/concursos",
    );
  });

  it("preserva as outras dimensões", () => {
    const consulta: ConsultaDaUrl = {
      ...VAZIA,
      uf: "SP",
      bancas: ["vunesp"],
    };
    const url = urlAlternando(consulta, "escolaridades", "medio");
    expect(url).toContain("uf=SP");
    expect(url).toContain("banca=vunesp");
    expect(url).toContain("escolaridade=medio");
  });

  // Estar na página 3 e mexer no filtro costuma levar a uma página que não
  // existe mais no resultado novo.
  it("volta para a primeira página", () => {
    const consulta = { ...VAZIA, pagina: 3 };
    expect(urlAlternando(consulta, "situacoes", "abertas")).not.toContain(
      "pagina",
    );
  });
});

describe("urlSemValor", () => {
  it("remove só o valor pedido", () => {
    const consulta: ConsultaDaUrl = {
      ...VAZIA,
      escolaridades: ["superior", "medio"],
    };
    const url = urlSemValor(consulta, "escolaridades", "superior");
    expect(url).toContain("escolaridade=medio");
    expect(url).not.toContain("superior");
  });
});

describe("quantosFiltros", () => {
  it("conta cada valor, não cada dimensão", () => {
    expect(quantosFiltros(VAZIA)).toBe(0);
    expect(
      quantosFiltros({
        ...VAZIA,
        uf: "SP",
        escolaridades: ["superior", "medio"],
        salarioMin: 3000,
      }),
    ).toBe(4);
  });

  it("não conta a busca por texto nem a ordenação", () => {
    expect(quantosFiltros({ ...VAZIA, q: "analista", ordem: "vagas" })).toBe(0);
  });
});
