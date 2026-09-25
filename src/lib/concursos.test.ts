import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import {
  contagensDeFaceta,
  contarConcursos,
  facetas,
  listarConcursos,
  normalizarDetalhe,
  normalizarResumo,
  paraALista,
  semTravessao,
  tambemAbertos,
} from "./concursos";
import type { ConcursoDetalhe, Escolaridade } from "./dominio";
import type { Situacao } from "./consulta";
import { CONCURSOS } from "@/mocks/concursos";

/** O travessão por escape, não pelo glifo: ver o cabeçalho de `semTravessao`. */
const TRAVESSAO = "\u2014";

/**
 * As contagens da coluna de filtros são uma promessa ao usuário: o número ao
 * lado da opção é quantos resultados ele vai encontrar se clicar nela. Estes
 * testes checam a promessa contra o próprio filtro, em vez de fixar números
 * do mock, que mudam a cada edição do acervo.
 */
const HOJE = new Date(2026, 3, 10, 9, 0);

describe("contagensDeFaceta", () => {
  it("a contagem de uma opção é o que ela devolve quando marcada", async () => {
    const contagens = await contagensDeFaceta({}, HOJE);

    for (const opcao of contagens.situacoes) {
      const real = await contarConcursos(
        { situacoes: [opcao.valor as Situacao] },
        HOJE,
      );
      expect(opcao.total, `situação ${opcao.valor}`).toBe(real);
    }

    for (const opcao of contagens.escolaridades) {
      const real = await contarConcursos(
        { escolaridades: [opcao.valor as Escolaridade] },
        HOJE,
      );
      expect(opcao.total, `escolaridade ${opcao.valor}`).toBe(real);
    }

    for (const opcao of contagens.bancas) {
      const real = await contarConcursos({ bancas: [opcao.valor] }, HOJE);
      expect(opcao.total, `banca ${opcao.valor}`).toBe(real);
    }
  });

  it("as outras dimensões continuam valendo na contagem", async () => {
    const semUf = await contagensDeFaceta({}, HOJE);
    const comUf = await contagensDeFaceta({ uf: "SP" }, HOJE);

    for (const opcao of comUf.escolaridades) {
      const real = await contarConcursos(
        { uf: "SP", escolaridades: [opcao.valor as Escolaridade] },
        HOJE,
      );
      expect(opcao.total).toBe(real);
      const equivalente = semUf.escolaridades.find(
        (outra) => outra.valor === opcao.valor,
      );
      expect(opcao.total).toBeLessThanOrEqual(equivalente!.total);
    }
  });

  it("as situações particionam o acervo", async () => {
    const contagens = await contagensDeFaceta({}, HOJE);
    const soma = contagens.situacoes.reduce((total, o) => total + o.total, 0);
    const acervo = await contarConcursos({}, HOJE);
    expect(soma).toBe(acervo);
  });

  it("mantém a opção que zeraria o resultado", async () => {
    // Uma combinação impossível de propósito: se a coluna escondesse a linha,
    // ela mudaria de tamanho a cada clique e a pessoa perderia a referência.
    const contagens = await contagensDeFaceta(
      { situacoes: ["previstos"], bancas: ["quadrix"] },
      HOJE,
    );
    expect(contagens.escolaridades.length).toBeGreaterThan(0);
    expect(contagens.escolaridades.every((o) => o.total >= 0)).toBe(true);
  });
});

describe("listarConcursos", () => {
  it("pagina sem perder nem repetir item", async () => {
    const inteiro = await listarConcursos({ porPagina: 1000 }, HOJE);
    const primeira = await listarConcursos({ porPagina: 10, pagina: 1 }, HOJE);
    const segunda = await listarConcursos({ porPagina: 10, pagina: 2 }, HOJE);

    expect(primeira.total).toBe(inteiro.total);
    expect(primeira.paginas).toBe(Math.ceil(inteiro.total / 10));
    expect([...primeira.itens, ...segunda.itens].map((c) => c.slug)).toEqual(
      inteiro.itens.slice(0, 20).map((c) => c.slug),
    );
  });

  it("uma página além do fim vem vazia, não quebra", async () => {
    const resultado = await listarConcursos({ pagina: 999 }, HOJE);
    expect(resultado.itens).toEqual([]);
    expect(resultado.total).toBeGreaterThan(0);
  });
});

describe("paraALista", () => {
  // O que viaja para o navegador em `/busca/<slug>` é só o que o cartão, o
  // filtro, a ordenação e a contagem de faceta leem. As duas provas: o
  // cartão sai idêntico (aqui) e a busca do navegador dá a mesma página que
  // a do servidor sobre a lista enxuta (`buscaLocal.test.ts`).
  const HOJE = new Date("2026-09-24T12:00:00");

  it("o cartão de cada concurso sai idêntico com a lista enxuta", () => {
    const enxutos = paraALista(CONCURSOS);
    CONCURSOS.forEach((original, i) => {
      for (const ufDoFiltro of [undefined, "SP" as const]) {
        const desenhar = (concurso: typeof original) =>
          renderToStaticMarkup(createElement(CartaoConcurso, { concurso, hoje: HOJE, ufDoFiltro }));
        expect(desenhar(enxutos[i]), original.slug).toBe(desenhar(original));
      }
    });
  });

  it("não leva o que ninguém da lista lê", () => {
    const [enxuto] = paraALista([
      { ...CONCURSOS[0], localidades: ["Pelotas"], ultimoAto: { data: "2026-09-01", titulo: "X", primeiro: true } },
    ]);
    for (const campo of ["tipo", "uf", "inscricoesDe", "editalUrl", "localidades", "ultimoAto"]) {
      expect(enxuto, campo).not.toHaveProperty(campo);
    }
    expect(enxuto.orgao).not.toHaveProperty("resolvido");
    expect(enxuto.orgao).not.toHaveProperty("nomeEhCaminho");
  });
});

/**
 * O parceiro humano proíbe o travessão em qualquer texto visível, e
 * título e nome de órgão vêm da API, não do código-fonte. Por isso
 * `semTravessao.test.ts` (que varre `src/`) não os alcança. Estes testes
 * cobrem o corte isolado e o limite em que ele entra, `normalizarResumo` e
 * `normalizarDetalhe`.
 */
describe("semTravessao", () => {
  it(`troca "${TRAVESSAO}" por " - ", com um espaço de cada lado`, () => {
    expect(semTravessao(`ENFAM ${TRAVESSAO} Edital nº 2`)).toBe("ENFAM - Edital nº 2");
  });

  it("recolhe o espaço já colado ao travessão, dos dois lados", () => {
    expect(semTravessao(`ENFAM${TRAVESSAO}Edital`)).toBe("ENFAM - Edital");
    expect(semTravessao(`ENFAM ${TRAVESSAO}Edital`)).toBe("ENFAM - Edital");
  });

  it("não mexe em texto sem travessão", () => {
    expect(semTravessao("Analista Judiciário")).toBe("Analista Judiciário");
  });
});

describe("normalizarResumo / normalizarDetalhe, sem travessão", () => {
  it("tira o travessão do título, do nome do órgão, da banca, do cargo e do último ato ao moldar o resumo", () => {
    const sujo = {
      ...CONCURSOS[0],
      titulo: `ENFAM ${TRAVESSAO} Edital nº 2`,
      orgao: { ...CONCURSOS[0].orgao, nome: `Escola ${TRAVESSAO} ENFAM` },
      banca: { slug: "cespe", nome: `Cespe ${TRAVESSAO} Cebraspe` },
      nomesDeCargo: [`Analista ${TRAVESSAO} Judiciário`],
      ultimoAto: { data: "2026-09-01", titulo: `Edital ${TRAVESSAO} 2`, primeiro: true },
    };

    const limpo = normalizarResumo(sujo);

    expect(limpo.titulo).toBe("ENFAM - Edital nº 2");
    expect(limpo.orgao.nome).toBe("Escola - ENFAM");
    expect(limpo.banca?.nome).toBe("Cespe - Cebraspe");
    expect(limpo.nomesDeCargo).toEqual(["Analista - Judiciário"]);
    expect(limpo.ultimoAto?.titulo).toBe("Edital - 2");
    for (const campo of [
      limpo.titulo,
      limpo.orgao.nome,
      limpo.banca?.nome,
      ...limpo.nomesDeCargo,
      limpo.ultimoAto?.titulo,
    ]) {
      expect(campo).not.toContain(TRAVESSAO);
    }
  });

  it("tira o travessão do nome de cada cargo e do título de cada ato no detalhe", () => {
    const detalheSujo: ConcursoDetalhe = {
      ...CONCURSOS[0],
      cronograma: [],
      cargos: [
        {
          nome: `Analista ${TRAVESSAO} Judiciário`,
          codigo: null,
          escolaridade: null,
          area: null,
          jornadaHoras: null,
          requisitos: [],
          taxaInscricao: null,
          vagas: [],
          remuneracoes: [],
          evidencia: [],
        },
      ],
      origens: [],
      editalCitadoUrl: null,
    };

    const limpo = normalizarDetalhe(detalheSujo);

    expect(limpo.cargos[0].nome).toBe("Analista - Judiciário");
  });

  it("NÃO mexe na citação literal do ato: nem `origens[].texto` nem `faq[].trecho`, só `origens[].titulo`", () => {
    const detalheSujo: ConcursoDetalhe = {
      ...CONCURSOS[0],
      cronograma: [],
      cargos: [],
      origens: [
        {
          chave: "ato-1",
          url: null,
          titulo: `Edital ${TRAVESSAO} 2026`,
          fonte: null,
          vistoEm: "2026-01-01T00:00:00",
          texto: `Art. 1º ${TRAVESSAO} fica aberto o concurso.`,
          caracteres: 40,
          faq: [
            {
              pergunta: "quem_pode",
              situacao: "respondida",
              trecho: `pode se inscrever quem ${TRAVESSAO} tiver o requisito`,
              inicioChar: 0,
              fimChar: 10,
              motivoDescarte: null,
            },
          ],
          editalCitadoUrl: null,
        },
      ],
      editalCitadoUrl: null,
    };

    const limpo = normalizarDetalhe(detalheSujo);

    expect(limpo.origens[0].titulo).toBe("Edital - 2026");
    expect(limpo.origens[0].texto).toBe(detalheSujo.origens[0].texto);
    expect(limpo.origens[0].faq[0].trecho).toBe(detalheSujo.origens[0].faq[0].trecho);
  });
});

describe("tambemAbertos", () => {
  it("mesma UF, abertos, sem o próprio, no máximo 3", async () => {
    const base = (await listarConcursos({ situacoes: ["abertas"] }, HOJE)).itens.find((c) => c.uf);
    if (!base) return;
    const outros = await tambemAbertos(base, HOJE);
    expect(outros.length).toBeLessThanOrEqual(3);
    for (const c of outros) {
      expect(c.slug).not.toBe(base.slug);
      expect(c.ufs.includes(base.uf!) || c.uf === base.uf).toBe(true);
    }
  });
});

describe("facetas", () => {
  it("devolve todas as UFs com aberto quando o limite é 27", async () => {
    const { ufs } = await facetas(HOJE, { ufs: 27 });
    const padrao = await facetas(HOJE);
    expect(ufs.length).toBeGreaterThanOrEqual(padrao.ufs.length);
    expect(padrao.ufs.length).toBeLessThanOrEqual(12);
  });

  it("respeita um limite menor que o padrão", async () => {
    // O mock tem 11 UFs com aberto: um limite ignorado devolveria as 11, não
    // 1. Esse é o caso que pega a assinatura antiga (`facetas(hoje)`, que
    // aceita e descarta o segundo argumento em silêncio).
    const { ufs: uma } = await facetas(HOJE, { ufs: 1 });
    expect(uma).toHaveLength(1);
  });
});
