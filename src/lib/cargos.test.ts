import { describe, expect, it } from "vitest";
import { medirCargos, urlDoCargo } from "./cargos";
import { filtrar } from "./consulta";
import { slugDaBusca, termoDoSlug } from "./enderecoDaBusca";
import type { ConcursoResumo } from "./dominio";

let contador = 0;

function fixture(nomesDeCargo: string[], parcial: Partial<ConcursoResumo> = {}): ConcursoResumo {
  contador += 1;
  return {
    slug: `concurso-${contador}`,
    titulo: "Edital de abertura",
    tipo: "concurso_publico",
    status: "inscricoes_abertas",
    orgao: {
      slug: "ufx",
      nome: "Universidade Federal do Exemplo",
      sigla: null,
      esfera: "federal",
      poder: null,
      uf: "SP",
      municipio: null,
    },
    banca: null,
    uf: "SP",
    ufs: ["SP"],
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
    nomesDeCargo,
    localidades: [],
    editalUrl: null,
    ...parcial,
  };
}

/** `n` cópias do mesmo cargo, para o alcance passar do piso de 1%. */
function varios(n: number, nomes: string[]): ConcursoResumo[] {
  return Array.from({ length: n }, () => fixture(nomes));
}

/**
 * Enche o acervo com concursos sem cargo lido, para fixar o piso. São 695 no
 * acervo de verdade: o ato existe e o cargo não foi extraído dele.
 */
function ruido(n: number): ConcursoResumo[] {
  return Array.from({ length: n }, () => fixture([], { titulo: "Ato" }));
}

const rotulos = (acervo: ConcursoResumo[]) =>
  medirCargos(acervo).escolhidos.map((cargo) => cargo.rotulo);

const recusa = (acervo: ConcursoResumo[], termo: string) =>
  medirCargos(acervo).recusados.find((cargo) => cargo.termo === termo)?.motivo;

describe("medirCargos", () => {
  it("o piso de alcance é 1% do acervo", () => {
    expect(medirCargos(ruido(1000)).piso).toBe(10);
    expect(medirCargos(ruido(4649)).piso).toBe(47);
  });

  it("reduz as variações de professor a um link só, o de maior alcance", () => {
    const acervo = [
      ...varios(60, ["Professor Substituto"]),
      ...varios(30, ["Professor do Magistério Superior"]),
      ...varios(20, ["Professor Visitante"]),
      ...ruido(90),
    ];
    expect(rotulos(acervo)).toEqual(["Professor"]);
    expect(recusa(acervo, "professor substituto")).toMatch(/já entrou/);
    expect(recusa(acervo, "professor visitante")).toMatch(/já entrou/);
  });

  /**
   * As três grafias estão todas no acervo: "Matemática" sozinha em 29
   * concursos, "Professor Substituto de Matemática" e "Professor Substituto -
   * Matemática". A do meio é o que derruba a fidelidade — a disciplina está
   * no nome do cargo sem ser o cargo.
   */
  it("recusa a disciplina, que é a área do cargo e não o cargo", () => {
    const acervo = [
      ...varios(40, ["Professor Substituto de Matemática"]),
      ...varios(20, ["Professor Substituto - Matemática"]),
      ...varios(20, ["Matemática"]),
      ...ruido(120),
    ];
    expect(rotulos(acervo)).toEqual(["Professor"]);
    expect(recusa(acervo, "matematica")).toBe("fidelidade 0.50");
  });

  it("recusa a palavra que só aparece no meio do nome de outro cargo", () => {
    const acervo = [
      ...varios(80, ["Professor do Ensino Básico, Técnico e Tecnológico"]),
      ...varios(15, ["Técnico de Laboratório"]),
      ...ruido(105),
    ];
    // "Técnico" sozinho sai, porque quase tudo que ele devolve é professor.
    // Quem representa a família é o nome concreto, que não tem esse problema.
    expect(rotulos(acervo)).toEqual(["Professor", "Técnico de Laboratório"]);
    expect(recusa(acervo, "tecnico")).toBe("fidelidade 0.16");
  });

  it("a especialização depois do traço conta como cargo", () => {
    const acervo = [
      ...varios(30, ["Especialista em Tecnologia Nuclear - Engenheiro Mecânico"]),
      ...varios(30, ["Analista - Especialidade: Engenheiro Civil"]),
      ...ruido(140),
    ];
    expect(rotulos(acervo)).toContain("Engenheiro");
  });

  it("escolaridade não é cargo, por mais que o ato a escreva no lugar dele", () => {
    const acervo = [...varios(60, ["Mestrado"]), ...varios(40, ["Doutorado"]), ...ruido(100)];
    expect(rotulos(acervo)).toEqual([]);
    expect(recusa(acervo, "mestrado")).toBe("escolaridade, não cargo");
    expect(recusa(acervo, "doutorado")).toBe("escolaridade, não cargo");
  });

  it("cargo raro fica de fora, por mais limpo que seja o nome", () => {
    const acervo = [...varios(9, ["Bibliotecário"]), ...ruido(991)];
    expect(rotulos(acervo)).toEqual([]);
    expect(recusa(acervo, "bibliotecario")).toBe("alcance 9, abaixo do piso de 10");
  });

  it("nunca inventa um rótulo cortando o nome no meio", () => {
    const acervo = [...varios(60, ["Técnico em Assuntos Educacionais"]), ...ruido(140)];
    expect(rotulos(acervo)).toEqual(["Técnico"]);
    for (const cargo of medirCargos(acervo).recusados) {
      expect(cargo.termo).not.toBe("tecnico em assuntos");
    }
  });

  it("o rótulo é a grafia que os atos mais usaram", () => {
    const acervo = [
      ...varios(40, ["Administrador"]),
      ...varios(20, ["ADMINISTRADOR"]),
      ...ruido(140),
    ];
    expect(rotulos(acervo)).toEqual(["Administrador"]);
  });

  /**
   * Empate de alcance entre a cabeça e o nome inteiro fica com a cabeça: as
   * duas abrem a mesma página, e a mais curta é a que serve a mais gente.
   */
  it("entre dois links para a mesma página, entra o rótulo mais geral", () => {
    const acervo = [...varios(60, ["Assistente em Administração"]), ...ruido(140)];
    expect(rotulos(acervo)).toEqual(["Assistente"]);
  });

  it("acervo sem cargo nenhum não produz link nenhum", () => {
    expect(medirCargos([]).escolhidos).toEqual([]);
    expect(rotulos(Array.from({ length: 50 }, () => fixture([])))).toEqual([]);
  });

  it("servidor antigo, sem `nomesDeCargo`, não derruba a medição", () => {
    const acervo = Array.from({ length: 50 }, () => {
      const concurso = fixture([]);
      delete (concurso as Partial<ConcursoResumo>).nomesDeCargo;
      return concurso;
    });
    expect(medirCargos(acervo).escolhidos).toEqual([]);
  });

  /**
   * A garantia que o rodapé precisa: o número ao lado do link é o tamanho da
   * página que o link abre, e nenhum link abre uma busca vazia. Sem isto a
   * medição e o filtro podem divergir em silêncio, e o rodapé vira uma
   * parede de links para lista vazia — que é pior que rodapé sem cargo.
   */
  it("cada link escolhido devolve exatamente o alcance medido, e nunca zero", () => {
    const acervo = [
      ...varios(80, ["Professor Substituto"]),
      ...varios(40, ["Analista Judiciário"]),
      ...varios(30, ["Engenheiro Civil"]),
      ...varios(25, ["Assistente em Administração"]),
      ...ruido(100),
    ];
    const { escolhidos } = medirCargos(acervo);
    expect(escolhidos.length).toBeGreaterThan(0);
    for (const cargo of escolhidos) {
      expect(filtrar(acervo, { q: termoDoSlug(slugDaBusca(cargo.termo)) })).toHaveLength(cargo.alcance);
      expect(urlDoCargo(cargo)).toBe(`/busca/${slugDaBusca(cargo.termo)}`);
      expect(cargo.alcance).toBeGreaterThan(0);
    }
  });

  it("sai do maior alcance para o menor", () => {
    const acervo = [
      ...varios(80, ["Professor Substituto"]),
      ...varios(40, ["Analista Judiciário"]),
      ...varios(20, ["Engenheiro Civil"]),
      ...ruido(60),
    ];
    const alcances = medirCargos(acervo).escolhidos.map((c) => c.alcance);
    expect(alcances).toEqual([...alcances].sort((a, b) => b - a));
  });
});
