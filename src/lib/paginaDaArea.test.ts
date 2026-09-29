import { describe, expect, it } from "vitest";
import { areaDoSlug } from "./areas";
import { ordenar, situacaoDoConcurso } from "./consulta";
import { POR_PAGINA_DA_AREA, consultaDaArea, indexavelDaArea, listaDaArea } from "./paginaDaArea";
import { CONCURSOS } from "@/mocks/concursos";

const HOJE = new Date(2026, 3, 10, 9, 0);
const saude = areaDoSlug("saude")!;

const consultaEm = (parametros: Record<string, string | string[]> = {}) => consultaDaArea(saude, parametros);

describe("consultaDaArea", () => {
  it("lê os filtros da busca e fixa o caminho da área, sem termo", () => {
    const consulta = consultaDaArea(saude, { escolaridade: "superior", uf: "SP", q: "professor", pagina: "2" });
    expect(consulta.caminho).toBe("/areas/saude");
    expect(consulta.q).toBeUndefined();
    expect(consulta.escolaridades).toEqual(["superior"]);
    expect(consulta.uf).toBe("SP");
    expect(consulta.pagina).toBe(2);
  });

  it("os endereços antigos da área continuam valendo", () => {
    const consulta = consultaDaArea(saude, { situacao: "abertas", pagina: "2" });
    expect(consulta.situacoes).toEqual(["abertas"]);
    expect(consulta.pagina).toBe(2);
    expect(consultaDaArea(saude, { situacao: "constructor", pagina: "-3" })).toMatchObject({ situacoes: [], pagina: 1 });
  });
});

describe("listaDaArea", () => {
  it("em cada situação, a ordem da busca (encerrando primeiro), e pagina", () => {
    const { resultado } = listaDaArea(CONCURSOS, consultaEm(), HOJE);
    const ordemDaBusca = ordenar(CONCURSOS, "encerrando", HOJE);
    const esperada = (["abertas", "previstos", "encerrados"] as const).flatMap((situacao) =>
      ordemDaBusca.filter((c) => situacaoDoConcurso(c, HOJE) === situacao),
    );
    expect(resultado.itens.map((c) => c.slug)).toEqual(esperada.slice(0, POR_PAGINA_DA_AREA).map((c) => c.slug));
    expect(resultado.total).toBe(CONCURSOS.length);
  });

  it("os filtros da busca recortam a área, e cada faceta conta só a área filtrada", () => {
    const { resultado, contagens, total } = listaDaArea(CONCURSOS, consultaEm({ escolaridade: "superior" }), HOJE);
    expect(total).toBe(CONCURSOS.length);
    const superiores = CONCURSOS.filter((c) => c.escolaridades.includes("superior"));
    expect(resultado.total).toBe(superiores.length);
    for (const concurso of resultado.itens) expect(concurso.escolaridades).toContain("superior");
    const somaDasSituacoes = contagens.situacoes.reduce((soma, opcao) => soma + opcao.total, 0);
    expect(somaDasSituacoes).toBe(superiores.length);
  });

  it("a situação filtra, e a contagem de cada aba é o que ela mostra", () => {
    const { contagens } = listaDaArea(CONCURSOS, consultaEm(), HOJE);
    for (const opcao of contagens.situacoes) {
      const { resultado } = listaDaArea(CONCURSOS, consultaEm({ situacao: opcao.valor }), HOJE);
      expect(resultado.total, opcao.valor).toBe(opcao.total);
      for (const concurso of resultado.itens) expect(situacaoDoConcurso(concurso, HOJE)).toBe(opcao.valor);
    }
  });

  it("os cartões contam a área inteira, com ou sem filtro", () => {
    const semFiltro = listaDaArea(CONCURSOS, consultaEm(), HOJE).porSituacao;
    const comFiltro = listaDaArea(CONCURSOS, consultaEm({ escolaridade: "superior", situacao: "abertas" }), HOJE).porSituacao;
    expect(comFiltro).toEqual(semFiltro);
    expect(semFiltro.abertas + semFiltro.previstos + semFiltro.encerrados).toBe(CONCURSOS.length);
  });

  it("outra ordem pedida é a da busca, sem o agrupamento por situação", () => {
    const { resultado } = listaDaArea(CONCURSOS, consultaEm({ ordem: "vagas" }), HOJE);
    expect(resultado.itens.map((c) => c.slug)).toEqual(
      ordenar(CONCURSOS, "vagas", HOJE).slice(0, POR_PAGINA_DA_AREA).map((c) => c.slug),
    );
  });

  it("página além do fim vira a última, e não uma lista vazia", () => {
    const { resultado } = listaDaArea(CONCURSOS.slice(0, 3), consultaEm({ pagina: "999" }), HOJE);
    expect(resultado.pagina).toBe(1);
    expect(resultado.itens).toHaveLength(3);
  });

  it("lista vazia é página 1 de 1, sem lançar", () => {
    const { resultado, total } = listaDaArea([], consultaEm({ situacao: "abertas", pagina: "4" }), HOJE);
    expect(total).toBe(0);
    expect(resultado.pagina).toBe(1);
    expect(resultado.paginas).toBe(1);
  });

  it("em Todas, abertos primeiro, depois previstos, depois encerrados, mesmo sem data ou com data futura", () => {
    const base = CONCURSOS[0];
    const homologadoComPrazoFuturo = { ...base, slug: "homologado", status: "homologado" as const, inscricoesAte: "2026-04-12" };
    const abertoSemData = { ...base, slug: "aberto-sem-data", status: "inscricoes_abertas" as const, inscricoesAte: null };
    const previsto = { ...base, slug: "previsto", status: "previsto" as const, inscricoesAte: null };
    const abertoComData = { ...base, slug: "aberto-com-data", status: "inscricoes_abertas" as const, inscricoesAte: "2026-04-20" };
    const { resultado } = listaDaArea(
      [homologadoComPrazoFuturo, previsto, abertoSemData, abertoComData],
      consultaEm(),
      HOJE,
    );
    expect(resultado.itens.map((c) => situacaoDoConcurso(c, HOJE))).toEqual(["abertas", "abertas", "previstos", "encerrados"]);
    // Dentro de cada situação, a ordem de `ordenar`: o prazo mais perto primeiro.
    expect(resultado.itens.map((c) => c.slug)).toEqual(["aberto-com-data", "aberto-sem-data", "previsto", "homologado"]);
  });
});

describe("indexavelDaArea", () => {
  it("só a área inteira, na primeira página, entra no índice", () => {
    expect(indexavelDaArea(consultaEm())).toBe(true);
    expect(indexavelDaArea(consultaEm({ situacao: "abertas" }))).toBe(false);
    expect(indexavelDaArea(consultaEm({ escolaridade: "superior" }))).toBe(false);
    expect(indexavelDaArea(consultaEm({ ordem: "vagas" }))).toBe(false);
    expect(indexavelDaArea(consultaEm({ pagina: "2" }))).toBe(false);
  });
});
