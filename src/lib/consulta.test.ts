import { describe, expect, it } from "vitest";
import type { ConcursoResumo, Escolaridade, Uf } from "./dominio";
import { filtrar, normalizar, ordenar } from "./consulta";

const HOJE = new Date(2026, 3, 10, 9, 0);

let contador = 0;

/**
 * `ufs` acompanha `uf` quando quem chama não disser o contrário, que é a
 * invariante do banco: `concurso.uf` é coluna gerada a partir de `ufs`, a UF
 * quando é uma só e nula quando são várias. Fixture em que as duas
 * discordassem testaria um estado que o banco não produz.
 */
function fixture(parcial: Partial<ConcursoResumo> = {}): ConcursoResumo {
  contador += 1;
  const ufs =
    parcial.ufs ??
    (parcial.uf !== undefined ? ([parcial.uf].filter(Boolean) as Uf[]) : undefined);
  return {
    slug: `concurso-${contador}`,
    titulo: "Analista judiciário",
    tipo: "concurso_publico",
    status: "inscricoes_abertas",
    orgao: {
      slug: "tjsp",
      nome: "Tribunal de Justiça de São Paulo",
      sigla: "TJSP",
      esfera: "estadual",
      poder: "judiciario",
      uf: "SP",
      municipio: "São Paulo",
    },
    banca: { slug: "vunesp", nome: "Vunesp" },
    uf: "SP",
    ufs: ["SP"] as Uf[],
    inscricoesDe: "2026-03-01",
    inscricoesAte: "2026-05-01",
    publicadoEm: "2026-02-20",
    previstoPara: null,
    vagas: 100,
    cadastroReserva: false,
    salarioAte: 10000,
    taxaInscricao: 90,
    escolaridades: ["superior"],
    nomesDeCargo: [],
    localidades: [],
    editalUrl: null,
    ...parcial,
    ...(ufs === undefined ? {} : { ufs }),
  };
}

describe("normalizar", () => {
  it("tira acento e caixa", () => {
    expect(normalizar("São Paulo")).toBe("sao paulo");
    expect(normalizar("  JUDICIÁRIO ")).toBe("judiciario");
  });
});

describe("filtrar", () => {
  it("acha sem acento e exige todos os termos", () => {
    const itens = [
      fixture({ titulo: "Analista judiciário" }),
      fixture({ titulo: "Técnico judiciário" }),
    ];
    expect(filtrar(itens, { q: "analista judiciario" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "judiciario" }, HOJE)).toHaveLength(2);
    expect(filtrar(itens, { q: "analista fiscal" }, HOJE)).toHaveLength(0);
  });

  it("busca também pelo órgão e pela banca", () => {
    const itens = [fixture()];
    expect(filtrar(itens, { q: "tjsp" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "vunesp" }, HOJE)).toHaveLength(1);
  });

  it("busca pelo nome do cargo, que não está no título", () => {
    // É como o acervo do engine é: o título é o cabeçalho do ato publicado
    // ("Universidade Federal de Pelotas — Edital nº 10/2026") e a palavra que
    // o candidato digita está no cargo. Nenhum dos 181 títulos do acervo tem
    // "professor"; 105 dos 181 têm um cargo de professor.
    const itens = [
      fixture({
        titulo: "Universidade Federal de Pelotas — Edital nº 10/2026",
        nomesDeCargo: ["Professor Visitante Indígena"],
      }),
      fixture({ titulo: "Edital nº 2/2026", nomesDeCargo: ["Auditor fiscal"] }),
    ];

    expect(filtrar(itens, { q: "professor" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "professor visitante" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "auditor" }, HOJE)).toHaveLength(1);
  });

  it("busca pela cidade da vaga, que não está no órgão", () => {
    // `orgao.municipio` é nulo nos 1.332 órgãos do acervo; a cidade está na
    // vaga, escrita pelo ato. E sem acento, como qualquer busca daqui.
    const itens = [
      fixture({
        orgao: { ...fixture().orgao, municipio: null, uf: null },
        localidades: ["Goiânia"],
      }),
      fixture({
        orgao: { ...fixture().orgao, municipio: null, uf: null },
        localidades: ["Coxim"],
      }),
    ];

    expect(filtrar(itens, { q: "goiania" }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { q: "coxim" }, HOJE)).toHaveLength(1);
  });

  it("concurso de um servidor antigo, sem os campos novos, não derruba a busca", () => {
    // Um `bc api` de versão anterior não manda `nomesDeCargo` nem
    // `localidades`. A lista inteira em branco por causa disso seria caro
    // demais para o que custa a guarda.
    const antigo = fixture();
    delete (antigo as Partial<ConcursoResumo>).nomesDeCargo;
    delete (antigo as Partial<ConcursoResumo>).localidades;

    expect(filtrar([antigo], { q: "analista" }, HOJE)).toHaveLength(1);
  });

  it("acha o concurso multiestadual em cada um dos seus estados", () => {
    // São 7 no acervo, e o do IBGE tem vaga em 23 estados. `uf` é nula neles
    // por desenho — é o cartão que não pode afirmar um estado só —, e um
    // filtro que olhasse `uf` os deixaria fora de todo estado.
    const nacional = fixture({
      titulo: "Censo",
      uf: null,
      ufs: ["ES", "SP", "BA"],
    });
    const paulista = fixture({ uf: "SP" });

    expect(filtrar([nacional, paulista], { uf: "ES" }, HOJE)).toHaveLength(1);
    expect(filtrar([nacional, paulista], { uf: "BA" }, HOJE)).toHaveLength(1);
    expect(filtrar([nacional, paulista], { uf: "SP" }, HOJE)).toHaveLength(2);
    expect(filtrar([nacional, paulista], { uf: "RJ" }, HOJE)).toHaveLength(0);
  });

  it("concurso sem estado nenhum continua fora do filtro de estado", () => {
    const semEstado = fixture({ uf: null, ufs: [] });

    expect(filtrar([semEstado], { uf: "SP" }, HOJE)).toHaveLength(0);
    // E aparece quando ninguém filtra por estado: ausência não é exclusão.
    expect(filtrar([semEstado], {}, HOJE)).toHaveLength(1);
  });

  it("servidor antigo, sem `ufs`, não derruba o filtro de estado", () => {
    const antigo = fixture({ uf: "SP" });
    delete (antigo as Partial<ConcursoResumo>).ufs;

    // Sem `ufs`, ele não casa nenhum estado — mas a lista não quebra, e a
    // busca por texto continua achando.
    expect(filtrar([antigo], { uf: "SP" }, HOJE)).toHaveLength(0);
    expect(filtrar([antigo], { q: "analista" }, HOJE)).toHaveLength(1);
  });

  it("combina estado com escolaridade", () => {
    const itens = [
      fixture({ uf: "SP", escolaridades: ["superior"] }),
      fixture({ uf: "SP", escolaridades: ["medio"] }),
      fixture({ uf: "RJ" as Uf, escolaridades: ["superior"] }),
    ];
    const achados = filtrar(
      itens,
      { uf: "SP", escolaridades: ["superior" as Escolaridade] },
      HOJE,
    );
    expect(achados).toHaveLength(1);
    expect(achados[0].uf).toBe("SP");
    expect(achados[0].escolaridades).toContain("superior");
  });

  // Dentro de uma dimensão a relação é OU: quem marca superior e médio quer
  // os dois, não a interseção, que seria vazia na maioria dos editais.
  it("soma os valores dentro de uma dimensão", () => {
    const itens = [
      fixture({ escolaridades: ["superior"] }),
      fixture({ escolaridades: ["medio"] }),
      fixture({ escolaridades: ["fundamental"] }),
    ];
    expect(
      filtrar(itens, { escolaridades: ["superior", "medio"] }, HOJE),
    ).toHaveLength(2);
  });

  // Entre dimensões a relação é E: superior ou médio, mas só em São Paulo.
  it("multiplica as dimensões entre si", () => {
    const itens = [
      fixture({ uf: "SP", escolaridades: ["superior"] }),
      fixture({ uf: "SP", escolaridades: ["fundamental"] }),
      fixture({ uf: "RJ" as Uf, escolaridades: ["medio"] }),
    ];
    expect(
      filtrar(itens, { uf: "SP", escolaridades: ["superior", "medio"] }, HOJE),
    ).toHaveLength(1);
  });

  it("basta uma escolaridade do concurso bater com uma da lista", () => {
    const itens = [fixture({ escolaridades: ["superior", "medio"] })];
    expect(filtrar(itens, { escolaridades: ["medio"] }, HOJE)).toHaveLength(1);
  });

  it("lista vazia não filtra nada", () => {
    const itens = [fixture(), fixture({ escolaridades: ["medio"] })];
    expect(
      filtrar(itens, { escolaridades: [], situacoes: [], bancas: [] }, HOJE),
    ).toHaveLength(2);
  });

  it("agrupa urgente e aberto sob inscrições abertas", () => {
    const itens = [
      fixture({ inscricoesAte: "2026-04-12" }),
      fixture({ inscricoesAte: "2026-06-12" }),
      fixture({ status: "previsto", inscricoesAte: null }),
      fixture({ status: "encerrado", inscricoesAte: "2026-01-10" }),
    ];
    expect(filtrar(itens, { situacoes: ["abertas"] }, HOJE)).toHaveLength(2);
    expect(filtrar(itens, { situacoes: ["previstos"] }, HOJE)).toHaveLength(1);
    expect(filtrar(itens, { situacoes: ["encerrados"] }, HOJE)).toHaveLength(1);
    expect(
      filtrar(itens, { situacoes: ["previstos", "encerrados"] }, HOJE),
    ).toHaveLength(2);
  });

  it("concurso sem banca não entra em filtro de banca", () => {
    const itens = [fixture(), fixture({ banca: null })];
    expect(filtrar(itens, { bancas: ["vunesp"] }, HOJE)).toHaveLength(1);
  });

  it("descarta salário desconhecido quando há faixa pedida", () => {
    const itens = [
      fixture({ salarioAte: 12000 }),
      fixture({ salarioAte: 4000 }),
      fixture({ salarioAte: null }),
    ];
    const achados = filtrar(itens, { salarioMin: 5000 }, HOJE);
    expect(achados).toHaveLength(1);
    expect(achados[0].salarioAte).toBe(12000);
  });

  it("respeita o teto da faixa de salário", () => {
    const itens = [
      fixture({ salarioAte: 12000 }),
      fixture({ salarioAte: 4000 }),
    ];
    const achados = filtrar(itens, { salarioMin: 3000, salarioMax: 5000 }, HOJE);
    expect(achados).toHaveLength(1);
    expect(achados[0].salarioAte).toBe(4000);
  });
});

describe("ordenar", () => {
  it("põe quem encerra antes na frente e quem não tem prazo no fim", () => {
    const itens = [
      fixture({ slug: "sem-prazo", inscricoesAte: null, status: "previsto" }),
      fixture({ slug: "maio", inscricoesAte: "2026-05-20" }),
      fixture({ slug: "abril", inscricoesAte: "2026-04-14" }),
    ];
    expect(ordenar(itens, "encerrando", HOJE).map((c) => c.slug)).toEqual([
      "abril",
      "maio",
      "sem-prazo",
    ]);
  });

  // Quem tem prazo correndo vem primeiro, depois quem ainda pode abrir, e
  // por último o que já venceu. Um previsto sem data continua sendo notícia
  // útil; um edital encerrado, não.
  it("põe o vencido depois de tudo que ainda pode acontecer", () => {
    const itens = [
      fixture({ slug: "vencido", inscricoesAte: "2026-03-01", status: "encerrado" }),
      fixture({ slug: "aberto", inscricoesAte: "2026-05-20" }),
      fixture({ slug: "sem-prazo", inscricoesAte: null, status: "previsto" }),
    ];
    expect(ordenar(itens, "encerrando", HOJE).map((c) => c.slug)).toEqual([
      "aberto",
      "sem-prazo",
      "vencido",
    ]);
  });

  it("desempata por número de vagas", () => {
    const itens = [
      fixture({ slug: "poucas", inscricoesAte: "2026-04-20", vagas: 10 }),
      fixture({ slug: "muitas", inscricoesAte: "2026-04-20", vagas: 900 }),
    ];
    expect(ordenar(itens, "encerrando", HOJE)[0].slug).toBe("muitas");
  });

  it("ordena por vagas, salário e publicação com nulos no fim", () => {
    const itens = [
      fixture({ slug: "a", vagas: null, salarioAte: null, publicadoEm: null }),
      fixture({ slug: "b", vagas: 50, salarioAte: 9000, publicadoEm: "2026-01-01" }),
      fixture({ slug: "c", vagas: 500, salarioAte: 20000, publicadoEm: "2026-03-01" }),
    ];
    expect(ordenar(itens, "vagas", HOJE).map((c) => c.slug)).toEqual(["c", "b", "a"]);
    expect(ordenar(itens, "salario", HOJE).map((c) => c.slug)).toEqual(["c", "b", "a"]);
    expect(ordenar(itens, "recentes", HOJE).map((c) => c.slug)).toEqual(["c", "b", "a"]);
  });

  it("não altera o vetor recebido", () => {
    const itens = [
      fixture({ slug: "maio", inscricoesAte: "2026-05-20" }),
      fixture({ slug: "abril", inscricoesAte: "2026-04-14" }),
    ];
    ordenar(itens, "encerrando", HOJE);
    expect(itens.map((c) => c.slug)).toEqual(["maio", "abril"]);
  });
});
