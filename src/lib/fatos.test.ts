import { describe, expect, it } from "vitest";
import type { Cargo, ConcursoDetalhe } from "./dominio";
import { moedaExata } from "./formato";
import { fatosDoConcurso, notaComum, vagasDoCargo } from "./fatos";

const cargo = (sobre: Partial<Cargo> = {}): Cargo => ({
  nome: "Área X", codigo: null, escolaridade: "superior", area: null, jornadaHoras: 60,
  requisitos: [{ descricao: "Diploma em Medicina Veterinária", formacoes: [] }],
  taxaInscricao: 100, vagas: [{ localidade: null, uf: "RJ", ampla: 2, pcd: 0, negros: 0, outras: 0, total: 2, cadastroReserva: false, crQuantidade: null }],
  remuneracoes: [], evidencia: [], ...sobre,
});

const concurso = (cargos: Cargo[], sobre: Partial<ConcursoDetalhe> = {}) =>
  ({ vagas: 30, taxaInscricao: 100, salarioAte: null, cadastroReserva: false, escolaridades: ["superior"], cargos, ...sobre }) as ConcursoDetalhe;

describe("fatosDoConcurso", () => {
  it("são seis, na ordem do protótipo", () => {
    expect(fatosDoConcurso(concurso([cargo()])).map((f) => f.rotulo)).toEqual([
      "VAGAS", "REMUNERAÇÃO", "TAXA", "CARGA HORÁRIA", "ESCOLARIDADE", "CADASTRO RESERVA",
    ]);
  });

  it("vagas diz em quantas áreas", () => {
    const [vagas] = fatosDoConcurso(concurso(Array.from({ length: 16 }, () => cargo())));
    expect(vagas).toMatchObject({ valor: "30", apoio: "em 16 áreas", informado: true });
  });

  it("remuneração ausente é 'Não informada', e não R$ 0", () => {
    const remuneracao = fatosDoConcurso(concurso([cargo()]))[1];
    expect(remuneracao).toMatchObject({ valor: "Não informada", apoio: "o ato não diz", informado: false });
  });

  it("jornadas diferentes viram faixa", () => {
    const carga = fatosDoConcurso(concurso([cargo({ jornadaHoras: 20 }), cargo({ jornadaHoras: 40 })]))[3];
    expect(carga.valor).toBe("20 a 40 h");
  });

  it("sem cargo nenhum, nada quebra", () => {
    const fatos = fatosDoConcurso(concurso([], { vagas: null, taxaInscricao: null }));
    expect(fatos).toHaveLength(6);
    expect(fatos[0]).toMatchObject({ valor: "a definir", informado: false });
    expect(fatos[2]).toMatchObject({ valor: "Não informada", informado: false });
  });

  it("cadastro reserva sem vaga imediata", () => {
    expect(fatosDoConcurso(concurso([cargo()]))[5]).toMatchObject({ valor: "Não", apoio: "só vagas imediatas" });
  });
});

describe("notaComum", () => {
  it("resume o que vale para todas as áreas", () => {
    // A taxa usa `moedaExata`, que no Node formata com espaço fino (U+00A0)
    // entre "R$" e o número; embutir a chamada real evita depender de um
    // caractere invisível copiado à mão, sem mudar o texto do protótipo.
    expect(notaComum(Array.from({ length: 3 }, () => cargo()))).toBe(
      `nível superior, 60 h semanais, taxa de ${moedaExata(100)}, remuneração não informada no ato. Requisito: Diploma em Medicina Veterinária.`,
    );
  });

  it("é null quando os cargos diferem ou há um só", () => {
    expect(notaComum([cargo(), cargo({ jornadaHoras: 40 })])).toBeNull();
    expect(notaComum([cargo()])).toBeNull();
  });
});

describe("vagasDoCargo", () => {
  it("soma as vagas e é null sem vaga", () => {
    expect(vagasDoCargo(cargo())).toBe(2);
    expect(vagasDoCargo(cargo({ vagas: [] }))).toBeNull();
  });
});
