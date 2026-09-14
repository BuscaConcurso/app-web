import { describe, expect, it } from "vitest";
import type { ConcursoDetalhe } from "./dominio";
import {
  avisoDeFiltroSemDado,
  cargosDoCartao,
  etiquetasDeVagas,
  linhaDeContexto,
  textoDeRodape,
  tituloComOrgao,
} from "./rotulos";

describe("tituloComOrgao", () => {
  it("órgão sem sigla não deixa dois-pontos solto no começo", () => {
    // Era assim que o título da aba e o `og:title` saíam com o acervo real:
    // ": EDITAL Nº 1, DE 12 DE MAIO DE 2026".
    expect(tituloComOrgao(null, "EDITAL Nº 1")).toBe("EDITAL Nº 1");
  });

  it("com sigla, o título continua o do canvas", () => {
    expect(tituloComOrgao("TJSP", "Analista judiciário")).toBe(
      "TJSP: Analista judiciário",
    );
  });
});

/**
 * A linha de contexto do cartão ("Estadual · Judiciário · São Paulo, SP") com
 * o órgão como o acervo do engine o entrega hoje: sem esfera em nenhum dos
 * 1.332 órgãos, e sem `poder`, que não existe no banco. Os dois campos são
 * anuláveis no tipo justamente por isso, e este teste fixa o que a tela faz
 * com a ausência.
 */
describe("linhaDeContexto", () => {
  it("órgão sem esfera e sem poder não vira separador vazio", () => {
    const linha = linhaDeContexto({
      esfera: null,
      poder: null,
      uf: null,
      municipio: null,
    });

    expect(linha).toBe("Nacional");
    expect(linha).not.toContain(" · ");
  });

  it("com esfera e poder, a linha continua a do canvas", () => {
    expect(
      linhaDeContexto({
        esfera: "estadual",
        poder: "judiciario",
        uf: "SP",
        municipio: "São Paulo",
      }),
    ).toBe("Estadual · Judiciário · São Paulo, SP");
  });
});

describe("textoDeRodape", () => {
  const BASE = {
    slug: "x",
    titulo: "Edital nº 1",
    tipo: "concurso_publico",
    status: "previsto",
    orgao: {
      slug: "o",
      nome: "Órgão",
      sigla: null,
      esfera: null,
      poder: null,
      uf: null,
      municipio: null,
    },
    banca: null,
    uf: null,
    ufs: [],
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
    cronograma: [],
    cargos: [],
    origens: [],
    editalCitadoUrl: null,
  } satisfies ConcursoDetalhe;

  const CARGO = {
    nome: "Professor",
    codigo: null,
    escolaridade: null,
    area: null,
    jornadaHoras: null,
    requisitos: [],
    taxaInscricao: null,
    vagas: [],
    remuneracoes: [],
    evidencia: [],
  };

  const EVENTO = {
    tipo: "publicacao_edital",
    ato: "49284164",
    inicio: "2026-05-13",
    fim: null,
    hora: null,
    localidades: [],
    observacao: null,
    evidencia: "EDITAL Nº 1",
  } satisfies ConcursoDetalhe["cronograma"][number];

  it("não fala mais de API não conectada, e manda conferir na banca", () => {
    const texto = textoDeRodape({ ...BASE, cronograma: [EVENTO] });

    expect(texto).not.toContain("API");
    expect(texto).not.toContain("PDF do edital");
    expect(texto).toContain("site da banca");
    expect(texto).toContain("o cronograma");
  });

  it("diz o que existe neste concurso, não o que existe em geral", () => {
    const so_cargos = textoDeRodape({ ...BASE, cargos: [CARGO] });
    const os_dois = textoDeRodape({
      ...BASE,
      cargos: [CARGO],
      cronograma: [EVENTO],
    });

    expect(so_cargos).toContain("os cargos");
    expect(so_cargos).not.toContain("o cronograma");
    expect(os_dois).toContain("o cronograma e os cargos");
  });

  it("concurso ainda não lido não promete conteúdo nenhum", () => {
    const texto = textoDeRodape(BASE);

    expect(texto).toContain("ainda não foi lido");
    expect(texto).not.toContain("Esta página mostra");
  });

  it("remuneração ausente é dita, em vez de ficar por conta do leitor", () => {
    const sem = textoDeRodape({ ...BASE, cargos: [CARGO] });
    const com = textoDeRodape({
      ...BASE,
      cargos: [
        {
          ...CARGO,
          remuneracoes: [
            { base: 9000, total: null, tipo: "mensal", observacao: null },
          ],
        },
      ],
    });

    expect(sem).toContain("O ato não informou remuneração.");
    expect(com).not.toContain("não informou remuneração");
  });
});

describe("avisoDeFiltroSemDado", () => {
  const NADA = { total: 325, comUf: 0, comEsfera: 0 };
  const TUDO = { total: 325, comUf: 325, comEsfera: 325 };

  it("explica o estado que o acervo não tem como responder", () => {
    const texto = avisoDeFiltroSemDado({ uf: "ES" }, NADA);

    // A primeira asserção é a que o teste promete: existe explicação. Sem
    // ela, a falha aparece como "null não é string", que não diz nada sobre
    // o que quebrou.
    expect(texto, "filtro sem dado tem de explicar").not.toBeNull();
    expect(texto).toContain("Espírito Santo");
    expect(texto).toContain("325");
    // A frase existe para marcar esta diferença, e é ela que não pode sumir.
    expect(texto).toContain("não sabemos, não que não exista");
  });

  it("explica a esfera pelo mesmo motivo", () => {
    const texto = avisoDeFiltroSemDado({ esferas: ["federal"] }, NADA);

    expect(texto, "filtro sem dado tem de explicar").not.toBeNull();
    expect(texto).toContain("esfera");
  });

  it("cala quando o acervo tem o dado", () => {
    expect(avisoDeFiltroSemDado({ uf: "ES" }, TUDO)).toBeNull();
    expect(avisoDeFiltroSemDado({ esferas: ["federal"] }, TUDO)).toBeNull();
  });

  it("cala quando ninguém filtrou por estado nem por esfera", () => {
    expect(avisoDeFiltroSemDado({}, NADA)).toBeNull();
    expect(avisoDeFiltroSemDado({ esferas: [] }, NADA)).toBeNull();
  });
});

describe("textoDeRodape com o endereço do edital", () => {
  it("manda a pessoa para o endereço quando o ato informa um", () => {
    const BASE = {
      slug: "x",
      titulo: "Edital nº 1",
      tipo: "concurso_publico",
      status: "previsto",
      orgao: {
        slug: "o",
        nome: "Órgão",
        sigla: null,
        esfera: null,
        poder: null,
        uf: null,
        municipio: null,
      },
      banca: null,
      uf: null,
      ufs: [],
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
      cronograma: [],
      cargos: [],
      origens: [],
      editalCitadoUrl: null,
    } satisfies ConcursoDetalhe;

    const com = textoDeRodape({
      ...BASE,
      editalCitadoUrl: "https://www.vunesp.com.br/X",
    });
    const sem = textoDeRodape(BASE);

    expect(com).toContain("está logo abaixo");
    // Sem endereço, a frase continua dizendo onde procurar em geral, em vez
    // de apontar para uma seção que não vai ter link nenhum.
    expect(sem).toContain("site da banca");
    expect(sem).not.toContain("logo abaixo");
  });
});

describe("etiquetasDeVagas", () => {
  const NADA = { vagasPcd: null, vagasNegros: null, cadastroReserva: false };

  it("não etiqueta nada quando o ato não disse nada de vaga", () => {
    // 2.646 dos 3.071 cartões do acervo. A fileira de etiquetas é de
    // tamanho variável e por isso não consegue mostrar ausência: quem diz
    // "não sabemos quantas" é a casa "Vagas" do bloco de números, que é
    // desenhada sempre. Uma etiqueta apagada aqui repetiria aquilo em 70%
    // dos cartões e empurraria para baixo, no celular, as que afirmam algo.
    expect(etiquetasDeVagas(NADA)).toEqual([]);
  });

  it("não repete o total: a etiqueta diz para quem, o bloco diz quantas", () => {
    // Uma etiqueta de total apareceria em 922 cartões repetindo o número
    // logo abaixo, e em 602 deles diria "1 vaga".
    expect(etiquetasDeVagas({ ...NADA, vagasPcd: 3 })).toEqual(["3 vagas PcD"]);
  });

  it("diz o cadastro de reserva por extenso, e sozinho quando é só ele", () => {
    // 171 cartões do acervo: soma zero e cadastro de reserva. O bloco de
    // números mostrava "CR" numa casa de número, como se fosse quantidade.
    expect(etiquetasDeVagas({ ...NADA, cadastroReserva: true })).toEqual([
      "Cadastro reserva",
    ]);
  });

  it("junta a reserva legal e o cadastro, nesta ordem", () => {
    // O caso mais carregado do acervo: 59 concursos têm PcD e negros, e 83
    // dos que têm número também têm cadastro de reserva — a etiqueta é o
    // único lugar onde este último fato aparece nesses 83 cartões.
    expect(
      etiquetasDeVagas({ vagasPcd: 21, vagasNegros: 84, cadastroReserva: true }),
    ).toEqual(["21 vagas PcD", "84 vagas para negros", "Cadastro reserva"]);
  });

  it("concorda o singular e agrupa o milhar", () => {
    expect(etiquetasDeVagas({ ...NADA, vagasPcd: 1 })).toEqual(["1 vaga PcD"]);
    expect(etiquetasDeVagas({ ...NADA, vagasNegros: 1 })).toEqual([
      "1 vaga para negros",
    ]);
    expect(etiquetasDeVagas({ ...NADA, vagasNegros: 1200 })).toEqual([
      "1.200 vagas para negros",
    ]);
  });

  it("resumo de engine mais velho não vira etiqueta nenhuma", () => {
    // O caso que aconteceu de verdade: o app subiu com `vagasPcd` e
    // `vagasNegros` antes de o engine passar a publicá-los. Os campos chegam
    // `undefined`, `Intl.NumberFormat().format(undefined)` devolve "NaN", e a
    // busca anunciou "NaN vagas PcD" em cartões reais — uma reserva de vaga
    // afirmada a partir de um campo que não existia.
    //
    // O tipo não protege: `acervo()` faz `await resposta.json()` e anota o
    // resultado com `ConcursoResumo` sem conferir campo nenhum. Por isso o
    // `as` aqui — ele reproduz exatamente a mentira que o `fetch` conta.
    const antigo = {
      vagas: 18,
      cadastroReserva: false,
    } as Parameters<typeof etiquetasDeVagas>[0];

    expect(etiquetasDeVagas(antigo)).toEqual([]);
    // E o mesmo para um resumo sem campo algum, que é o limite do caso.
    expect(etiquetasDeVagas({})).toEqual([]);
  });

  it("valor que não é número finito é ausência, nunca texto com o valor", () => {
    // Um a um, porque cada um chega por um caminho diferente: `undefined` de
    // campo que não veio, `NaN` de conta que deu errado, string de JSON
    // frouxo. Nenhum deles pode virar afirmação.
    for (const lixo of [undefined, NaN, Infinity, -Infinity, "12", null]) {
      const etiquetas = etiquetasDeVagas({
        vagasPcd: lixo,
        vagasNegros: lixo,
        cadastroReserva: lixo,
      } as Parameters<typeof etiquetasDeVagas>[0]);
      expect(etiquetas).toEqual([]);
    }
  });

  it("negativo também não vira etiqueta", () => {
    // Não existe no acervo (as colunas são `not null` e a extração não grava
    // negativo), e é justamente por isso: se um dia existir, é dado estragado,
    // e "-3 vagas PcD" seria a tela repetindo o estrago em voz alta.
    expect(etiquetasDeVagas({ ...NADA, vagasPcd: -3 })).toEqual([]);
  });

  it("zero não vira etiqueta, pelo mesmo motivo de não virar número", () => {
    // O engine já manda nulo; se um dia mandar zero, a etiqueta não pode
    // afirmar "0 vagas PcD" — o ato não reservar nenhuma e o ato não ter
    // repartido são coisas diferentes, e nenhum ato do acervo diz a
    // primeira.
    expect(etiquetasDeVagas({ ...NADA, vagasPcd: 0, vagasNegros: 0 })).toEqual([]);
  });
});

describe("cargosDoCartao", () => {
  it("mostra o cargo único inteiro, que é o caso de 2.360 dos 2.717", () => {
    expect(cargosDoCartao(["Escrevente técnico judiciário"])).toEqual({
      texto: "Escrevente técnico judiciário",
      informado: true,
    });
  });

  it("junta os poucos que cabem sem cortar nada", () => {
    // A lista completa tem mediana de 23 caracteres no acervo: o caso normal
    // é caber tudo, e nele não pode sobrar sinal de corte nenhum.
    expect(cargosDoCartao(["Analista judiciário", "Técnico judiciário"])).toEqual({
      texto: "Analista judiciário · Técnico judiciário",
      informado: true,
    });
  });

  it("quando corta, diz quantos cortou", () => {
    // Sumir com cargos em silêncio faria o cartão descrever um concurso menor
    // do que ele é — e quem procura o cargo que sumiu concluiria que ele não
    // existe. O acervo tem um concurso com 91 cargos.
    const nomes = Array.from({ length: 91 }, (_, i) => `Cargo número ${i + 1}`);
    const { texto } = cargosDoCartao(nomes);

    expect(texto.startsWith("Cargo número 1 · Cargo número 2")).toBe(true);
    expect(texto.length).toBeLessThanOrEqual(84);
    expect(texto).toMatch(/ · e mais \d+$/);
    const cortados = Number(texto.match(/e mais (\d+)$/)![1]);
    const mostrados = texto.split(" · ").length - 1;
    // A conta fecha: o que aparece mais o que foi declarado dá o total.
    expect(mostrados + cortados).toBe(91);
  });

  it("nome que não cabe sozinho cede, e o aviso de corte sobrevive", () => {
    // O maior nome de cargo do acervo tem 290 caracteres — 59 cartões caem
    // aqui. Deixar o nome inteiro empurraria "e mais 1" para fora das linhas
    // visíveis e o cartão voltaria a sumir com cargo em silêncio. Cortar o nome
    // diz as duas verdades: este nome continua, e há mais cargos.
    const gigante = "Professor do Magistério Superior - ".repeat(9);
    const { texto, informado } = cargosDoCartao([gigante, "Pedagogo"]);

    expect(informado).toBe(true);
    expect(texto.startsWith("Professor do Magistério Superior")).toBe(true);
    expect(texto).toContain("…");
    expect(texto.endsWith(" · e mais 1")).toBe(true);
    expect(texto.length).toBeLessThanOrEqual(84);
  });

  it("o texto nunca passa do que cabe em duas linhas, medido a 375px", () => {
    // 84 caracteres: a 375px o maior texto que ainda ocupa uma linha só tem
    // 47, e duas linhas dão folga. É este limite que garante que o aviso não seja ele
    // próprio a coisa cortada — a honestidade do cartão não pode depender de
    // uma regra de CSS.
    const casos = [
      ["Pedagogo"],
      Array.from({ length: 91 }, (_, i) => `Cargo número ${i + 1}`),
      ["x".repeat(290)],
      ["x".repeat(290), "Pedagogo", "Analista"],
      Array.from({ length: 40 }, () => "Professor do Magistério Superior"),
    ];
    for (const caso of casos) {
      expect(cargosDoCartao(caso).texto.length).toBeLessThanOrEqual(84);
    }
  });

  it("sem cargo, a linha diz que não sabe em vez de sumir", () => {
    // 354 dos 3.071 concursos do acervo. Uma linha que some quando falta dado
    // não consegue mostrar que falta dado.
    expect(cargosDoCartao([])).toEqual({
      texto: "não informados",
      informado: false,
    });
  });

  it("campo que não veio é ausência, e não derruba o cartão", () => {
    // Mesmo caso do "NaN vagas PcD": o tipo promete `string[]`, quem entrega é
    // o JSON de outro processo. `nomes.length` em `undefined` derrubaria a
    // busca inteira.
    for (const lixo of [undefined, null, "Professor", 7, {}]) {
      expect(cargosDoCartao(lixo)).toEqual({
        texto: "não informados",
        informado: false,
      });
    }
  });

  it("descarta entrada vazia em vez de virar separador solto", () => {
    expect(cargosDoCartao(["Pedagogo", "", "   ", null]).texto).toBe("Pedagogo");
  });
});
