import { describe, expect, it } from "vitest";
import { filtrar } from "./consulta";
import {
  destinoCanonico,
  metadadosDaBusca,
  slugDaBusca,
  termoDaPagina,
  termoDoSlug,
  tituloDoTermo,
  urlDoTermo,
} from "./enderecoDaBusca";
import { CONCURSOS } from "@/mocks/concursos";

describe("slugDaBusca", () => {
  it("tira acento, põe em minúscula e troca o que não é letra ou número por hífen", () => {
    expect(slugDaBusca("Assistente em Administração")).toBe("assistente-em-administracao");
    expect(slugDaBusca("  Técnico   Judiciário ")).toBe("tecnico-judiciario");
    expect(slugDaBusca("Soldado de 1ª classe")).toBe("soldado-de-1-classe");
    expect(slugDaBusca("11/2026/SEGAP")).toBe("11-2026-segap");
    expect(slugDaBusca("--Médico!!")).toBe("medico");
  });

  it("texto sem letra nem número vira slug vazio", () => {
    for (const q of ["", "   ", "!!!", "ª", "\u2014"]) expect(slugDaBusca(q)).toBe("");
  });
});

describe("slugDaBusca, teto de tamanho", () => {
  // Um `q` enorme colado na barra não pode virar um `location` e um canônico
  // do mesmo tamanho: o slug para em 100 caracteres, numa fronteira de hífen.
  it("corta em no máximo 100 caracteres, entre palavras e sem hífen no fim", () => {
    const slug = slugDaBusca("analista judiciario ".repeat(20));
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug.endsWith("-")).toBe(false);
    expect("analista-judiciario-".repeat(20).startsWith(`${slug}-`)).toBe(true);
    expect(slug.split("-").every((palavra) => ["analista", "judiciario"].includes(palavra))).toBe(true);
  });

  it("cabe em 100 exatos sem perder a última palavra", () => {
    const q = `${"a".repeat(49)} ${"b".repeat(50)}`;
    expect(slugDaBusca(q)).toBe(`${"a".repeat(49)}-${"b".repeat(50)}`);
    expect(slugDaBusca(`${q} c`)).toBe(`${"a".repeat(49)}-${"b".repeat(50)}`);
  });

  it("uma palavra só, maior que o teto, é cortada no teto", () => {
    expect(slugDaBusca("x".repeat(150))).toBe("x".repeat(100));
  });

  it("o slug cortado é estável", () => {
    const slug = slugDaBusca("tecnico em enfermagem ".repeat(10));
    expect(slugDaBusca(termoDoSlug(slug))).toBe(slug);
  });

  it("o endereço longo redireciona para o cortado", () => {
    const longo = "professor-".repeat(15) + "fim";
    const destino = destinoCanonico(`/busca/${longo}`, new URLSearchParams());
    expect(destino).toBe(`/busca/${slugDaBusca(longo)}`);
    expect(destino!.length).toBeLessThanOrEqual("/busca/".length + 100);
  });
});

describe("termoDoSlug", () => {
  it("troca hífen por espaço e não deixa espaço sobrando", () => {
    expect(termoDoSlug("assistente-em-administracao")).toBe("assistente em administracao");
    expect(termoDoSlug("a--b-")).toBe("a b");
  });

  it("ida e volta é estável: o slug do termo do slug é o próprio slug", () => {
    for (const q of ["Assistente em Administração", "Analista (TI)", "São Paulo", "11/2026"]) {
      const slug = slugDaBusca(q);
      expect(slugDaBusca(termoDoSlug(slug))).toBe(slug);
    }
  });

  it("com símbolo só entre palavras, o slug devolve a mesma lista que o texto", () => {
    for (const q of ["Auxiliar", "professor de docência", "Pedagogo  ", "ESCREVENTE"]) {
      expect(filtrar(CONCURSOS, { q: termoDoSlug(slugDaBusca(q)) })).toEqual(
        filtrar(CONCURSOS, { q }),
      );
    }
  });

  // "11/2026" procura o pedaço "11/2026"; o slug procura "11" e "2026"
  // separados. É a única diferença entre texto e slug, e ela só alarga.
  it("símbolo dentro da palavra alarga a busca, nunca estreita", () => {
    for (const q of ["1ª classe", "11/2026", "docência-1"]) {
      const porSlug = new Set(
        filtrar(CONCURSOS, { q: termoDoSlug(slugDaBusca(q)) }).map((c) => c.slug),
      );
      for (const concurso of filtrar(CONCURSOS, { q })) {
        expect(porSlug.has(concurso.slug)).toBe(true);
      }
    }
  });
});

describe("urlDoTermo e termoDaPagina", () => {
  it("monta o caminho, ou nada quando não há o que buscar", () => {
    expect(urlDoTermo("Tribunal")).toBe("/busca/tribunal");
    expect(urlDoTermo("!!")).toBeNull();
  });

  it("lê o termo do caminho da página, para a barra do cabeçalho", () => {
    expect(termoDaPagina("/busca/analista-judiciario")).toBe("analista judiciario");
    expect(termoDaPagina("/busca/Analista%20Judici%C3%A1rio")).toBe("analista judiciario");
    expect(termoDaPagina("/busca/---")).toBeUndefined();
    expect(termoDaPagina("/concursos")).toBeUndefined();
    expect(termoDaPagina("/")).toBeUndefined();
  });
});

describe("destinoCanonico", () => {
  const em = (caminho: string, busca = "") =>
    destinoCanonico(caminho, new URLSearchParams(busca));

  it("manda /concursos?q= para /busca/<slug> e leva o resto da query na ordem", () => {
    expect(em("/concursos", "q=Analista%20Judici%C3%A1rio&uf=SP&escolaridade=superior&pagina=2")).toBe(
      "/busca/analista-judiciario?uf=SP&escolaridade=superior&pagina=2",
    );
  });

  it("q sem letra nem número só sai da URL", () => {
    expect(em("/concursos", "q=%21%21&uf=SP")).toBe("/concursos?uf=SP");
    expect(em("/concursos", "q=%21%21")).toBe("/concursos");
  });

  it("não mexe na listagem sem texto", () => {
    expect(em("/concursos")).toBeNull();
    expect(em("/concursos", "uf=SP")).toBeNull();
    expect(em("/concursos", "q=%20%20")).toBeNull();
  });

  it("leva o slug fora da forma para a canônica, com a query", () => {
    expect(em("/busca/Analista%20Judici%C3%A1rio")).toBe("/busca/analista-judiciario");
    expect(em("/busca/ANALISTA-judiciario", "uf=SP")).toBe("/busca/analista-judiciario?uf=SP");
    expect(em("/busca/analista--judiciario-")).toBe("/busca/analista-judiciario");
    expect(em("/busca/%E0%A4%A")).toBe("/busca/e0-a4-a");
  });

  it("não leva o parâmetro interno do Next para o destino", () => {
    expect(em("/concursos", "q=tribunal&_rsc=abc")).toBe("/busca/tribunal");
    expect(em("/busca/Tribunal", "_rsc=abc&uf=RJ")).toBe("/busca/tribunal?uf=RJ");
  });

  it("slug canônico e slug vazio não redirecionam (o vazio vira 404 na página)", () => {
    expect(em("/busca/analista-judiciario", "uf=SP")).toBeNull();
    expect(em("/busca/---")).toBeNull();
    expect(em("/busca/%E2%80%94")).toBeNull();
  });

  it("ignora o que não é das duas rotas", () => {
    expect(em("/", "q=x")).toBeNull();
    expect(em("/busca/a/b")).toBeNull();
    expect(em("/concursos/algum-slug", "q=x")).toBeNull();
  });
});

describe("título e metadados", () => {
  const CARGOS = [{ termo: "soldado de 1 classe", rotulo: "Soldado de 1ª classe" }];

  it("usa o rótulo acentuado quando o slug é de um cargo medido", () => {
    expect(tituloDoTermo("soldado-de-1-classe", CARGOS)).toBe("Concursos de Soldado de 1ª classe");
  });

  it("senão, põe inicial maiúscula em cada palavra do slug", () => {
    expect(tituloDoTermo("analista-judiciario", CARGOS)).toBe("Concursos de Analista Judiciario");
    expect(tituloDoTermo("tribunal", [])).toBe("Concursos de Tribunal");
  });

  it("o canônico é o próprio caminho, sem query, e só busca com resultado é indexável", () => {
    expect(metadadosDaBusca("tribunal", 12, [])).toMatchObject({
      title: "Concursos de Tribunal",
      alternates: { canonical: "/busca/tribunal" },
      robots: { index: true, follow: true },
    });
    expect(metadadosDaBusca("tribunal", 0, []).robots).toEqual({ index: false, follow: true });
  });
});
