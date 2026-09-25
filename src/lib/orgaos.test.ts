import { describe, expect, it } from "vitest";
import {
  acharOrgao,
  agruparPorOrgao,
  nomeCurtoDoOrgao,
  resumoDoOrgao,
} from "./orgaos";
import { obterOrgao } from "./concursos";
import type { ConcursoResumo, Orgao } from "./dominio";
import { CONCURSOS } from "@/mocks/concursos";

/**
 * O agrupamento por órgão.
 *
 * O que dá para errar aqui é sempre o mesmo: a agregação afirmar mais do que
 * a lista tem. Por isso quase nenhum teste fixa número: eles conferem o
 * agrupamento contra a própria lista de onde ele saiu, que é o que continua
 * valendo quando o mock mudar.
 */
const ORGAO: Orgao = {
  slug: "cra-rj",
  nome: "Conselho Regional de Administração do Rio de Janeiro",
  sigla: "CRA-RJ",
  esfera: "federal",
  poder: null,
  uf: "RJ",
  municipio: null,
  resolvido: true,
  nomeEhCaminho: false,
};

function concurso(slug: string, orgao: Partial<Orgao> = {}): ConcursoResumo {
  return {
    slug,
    titulo: `Conselho Regional de Administração do Rio de Janeiro (CRA-RJ) \u2014 Edital nº ${slug}`,
    tipo: "concurso_publico",
    status: "autorizado",
    orgao: { ...ORGAO, ...orgao },
    banca: null,
    uf: "RJ",
    ufs: ["RJ"],
    inscricoesDe: null,
    inscricoesAte: null,
    publicadoEm: null,
    previstoPara: null,
    vagas: null,
    vagasPcd: null,
    vagasNegros: null,
    cadastroReserva: false,
    salarioAte: null,
    taxaInscricao: null,
    escolaridades: [],
    nomesDeCargo: [],
    localidades: [],
    editalUrl: null,
  };
}

describe("agruparPorOrgao", () => {
  it("não perde nem duplica concurso", () => {
    const grupos = agruparPorOrgao(CONCURSOS);
    const somados = grupos.reduce((total, g) => total + g.concursos.length, 0);
    expect(somados).toBe(CONCURSOS.length);

    const slugs = grupos.flatMap((g) => g.concursos.map((c) => c.slug));
    expect(new Set(slugs).size).toBe(CONCURSOS.length);
  });

  it("cada grupo só tem concurso do próprio órgão, e nenhum grupo é vazio", () => {
    for (const { orgao, concursos } of agruparPorOrgao(CONCURSOS)) {
      expect(concursos.length).toBeGreaterThan(0);
      for (const c of concursos) expect(c.orgao.slug).toBe(orgao.slug);
    }
  });

  it("ordena do maior para o menor, e desempata por nome", () => {
    const grupos = agruparPorOrgao([
      concurso("1", { slug: "b", nome: "Beta" }),
      concurso("2", { slug: "a", nome: "Alfa" }),
      concurso("3", { slug: "c", nome: "Gama" }),
      concurso("4", { slug: "c", nome: "Gama" }),
    ]);
    expect(grupos.map((g) => g.orgao.slug)).toEqual(["c", "a", "b"]);
  });

  it("descarta concurso sem órgão em vez de criar um órgão sem nome", () => {
    // O tipo promete `orgao`, mas quem preenche é o JSON de outro processo:
    // um engine mais velho, ou um mock pela metade, derrubaria a página com
    // um grupo de slug vazio e nome `undefined`.
    const torto = { ...concurso("x"), orgao: undefined } as unknown as ConcursoResumo;
    const grupos = agruparPorOrgao([concurso("1"), torto]);
    expect(grupos).toHaveLength(1);
    expect(grupos[0].concursos.map((c) => c.slug)).toEqual(["1"]);
  });
});

describe("acharOrgao", () => {
  it("devolve o órgão e só os concursos dele", () => {
    const lista = [
      concurso("1"),
      concurso("2", { slug: "outro", nome: "Outro", sigla: null }),
      concurso("3"),
    ];
    const achado = acharOrgao(lista, "cra-rj");
    expect(achado?.orgao.nome).toBe(ORGAO.nome);
    expect(achado?.concursos.map((c) => c.slug)).toEqual(["1", "3"]);
  });

  it("devolve null quando nenhum concurso nomeia o slug", () => {
    // É o que vira 404 na página. Um órgão sem concurso no acervo existe na
    // tabela do engine (1.946 com slug contra 466 com concurso na lista) e
    // uma página vazia com o nome dele afirmaria que ele não tem concurso.
    expect(acharOrgao([concurso("1")], "nao-existe")).toBeNull();
  });

  it("a página do órgão lista exatamente o que o acervo tem dele", async () => {
    // A razão de não haver rota de órgão na API: a lista da página sai do
    // mesmo acervo da busca, então ela não tem como divergir dela.
    const [{ orgao }] = agruparPorOrgao(CONCURSOS);
    const pagina = await obterOrgao(orgao.slug);
    const naBusca = CONCURSOS.filter((c) => c.orgao.slug === orgao.slug);
    expect(pagina?.concursos.map((c) => c.slug)).toEqual(
      naBusca.map((c) => c.slug),
    );
  });
});

describe("nomeCurtoDoOrgao", () => {
  it("prefere a sigla", () => {
    expect(nomeCurtoDoOrgao(ORGAO)).toBe("CRA-RJ");
  });

  it("cai no nome quando não há sigla", () => {
    // 1.615 dos 4.649 concursos do acervo. Iniciais tiradas do nome
    // inventariam uma sigla que ninguém publicou.
    expect(nomeCurtoDoOrgao({ ...ORGAO, sigla: null })).toBe(ORGAO.nome);
  });

  it("sigla vazia ou só espaço não é sigla", () => {
    expect(nomeCurtoDoOrgao({ ...ORGAO, sigla: "  " })).toBe(ORGAO.nome);
  });
});

describe("resumoDoOrgao", () => {
  it("concorda com o número", () => {
    expect(resumoDoOrgao(1)).toMatch(/^Um concurso/);
    expect(resumoDoOrgao(2)).toMatch(/^2 concursos/);
  });

  it("com um só, não promete um índice", () => {
    // São 195 dos 466 órgãos. A frase é o que faz a página dizer o que sabe
    // em vez de desenhar uma lista de um item com cara de catálogo.
    expect(resumoDoOrgao(1)).not.toMatch(/lista|todos/i);
  });
});
