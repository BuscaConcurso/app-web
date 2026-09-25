/**
 * Os fatos do concurso e a nota comum das áreas, para a página de detalhe.
 *
 * `fatosDoConcurso` são os seis cartões fixos do protótipo, sempre nessa
 * ordem e sempre seis: um concurso sem cargo nenhum ainda diz "a definir" ou
 * "Não informada" em cada um, porque a linha existe para mostrar que falta
 * dado, não para sumir quando falta (mesma regra de `cargosDoCartao`, em
 * `rotulos.ts`). `notaComum` resume o que é igual em todas as áreas do
 * concurso, para não repetir a mesma frase em cada cargo da lista.
 */
import type { Cargo, ConcursoDetalhe } from "./dominio";
import { moeda, moedaExata, numero } from "./formato";
import { ROTULO_ESCOLARIDADE } from "./rotulos";

export interface Fato {
  rotulo:
    | "VAGAS"
    | "REMUNERAÇÃO"
    | "TAXA"
    | "CARGA HORÁRIA"
    | "ESCOLARIDADE"
    | "CADASTRO RESERVA";
  valor: string;
  apoio: string;
  informado: boolean;
}

const NAO_INFORMADA = { valor: "Não informada", apoio: "o ato não diz", informado: false };

/** A soma das vagas do cargo, e `null` quando o ato não detalhou nenhuma. */
export function vagasDoCargo(cargo: Cargo): number | null {
  if (cargo.vagas.length === 0) return null;
  return cargo.vagas.reduce((soma, vaga) => soma + vaga.total, 0);
}

/** Um valor só quando é único; um intervalo "min a max" quando varia. */
function faixa(valores: number[], formatar: (n: number) => string): string | null {
  if (valores.length === 0) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  return min === max ? formatar(min) : `${formatar(min)} a ${formatar(max)}`;
}

/**
 * A taxa de inscrição como se lê: a do concurso e a de cada cargo, um valor
 * só quando todas coincidem e "min a max" quando variam; `null` quando o ato
 * não informou nenhuma. É a mesma para o fato TAXA e para a barra de
 * inscrição do celular, que antes lia só a do concurso e dizia "Sem taxa"
 * quando a taxa vinha por cargo.
 */
export function taxaDoConcurso(concurso: Pick<ConcursoDetalhe, "taxaInscricao" | "cargos">): string | null {
  const taxas = [concurso.taxaInscricao, ...concurso.cargos.map((c) => c.taxaInscricao)].filter(
    (t): t is number => t !== null && t > 0,
  );
  return faixa(taxas, moeda);
}

/** As remunerações informadas dos cargos, positivas, `total` antes de `base`. */
function remuneracoes(cargos: Cargo[]): number[] {
  return cargos
    .flatMap((c) => c.remuneracoes.map((r) => r.total ?? r.base))
    .filter((v): v is number => v !== null && v > 0);
}

export function fatosDoConcurso(concurso: ConcursoDetalhe): Fato[] {
  const { cargos } = concurso;
  const areas = cargos.length;
  const jornadas = cargos
    .map((c) => c.jornadaHoras)
    .filter((h): h is number => h !== null && h > 0);
  const taxa = taxaDoConcurso(concurso);
  const salario =
    faixa(remuneracoes(cargos), moeda) ??
    (concurso.salarioAte ? `até ${moeda(concurso.salarioAte)}` : null);
  const escolaridade = concurso.escolaridades[0];
  const formacao = cargos[0]?.requisitos[0]?.formacoes[0] ?? null;
  const reserva =
    concurso.cadastroReserva || cargos.some((c) => c.vagas.some((v) => v.cadastroReserva));

  return [
    concurso.vagas
      ? {
          rotulo: "VAGAS",
          valor: numero(concurso.vagas),
          apoio: areas > 1 ? `em ${areas} áreas` : areas === 1 ? "em 1 área" : "",
          informado: true,
        }
      : { rotulo: "VAGAS", valor: "a definir", apoio: "o ato não diz", informado: false },
    salario
      ? { rotulo: "REMUNERAÇÃO", valor: salario, apoio: "por mês", informado: true }
      : { rotulo: "REMUNERAÇÃO", ...NAO_INFORMADA },
    taxa
      ? { rotulo: "TAXA", valor: taxa, apoio: "por inscrição", informado: true }
      : { rotulo: "TAXA", ...NAO_INFORMADA },
    jornadas.length
      ? {
          rotulo: "CARGA HORÁRIA",
          valor: `${faixa(jornadas, String)} h`,
          apoio: "por semana",
          informado: true,
        }
      : { rotulo: "CARGA HORÁRIA", ...NAO_INFORMADA },
    escolaridade
      ? {
          rotulo: "ESCOLARIDADE",
          valor: ROTULO_ESCOLARIDADE[escolaridade],
          apoio: formacao ?? "",
          informado: true,
        }
      : { rotulo: "ESCOLARIDADE", ...NAO_INFORMADA },
    reserva
      ? { rotulo: "CADASTRO RESERVA", valor: "Sim", apoio: "além das vagas", informado: true }
      : {
          rotulo: "CADASTRO RESERVA",
          valor: "Não",
          apoio: "só vagas imediatas",
          informado: true,
        },
  ];
}

/**
 * O que vale igual para todas as áreas do concurso, numa frase só, ou `null`
 * quando há um cargo só (nada a resumir) ou os cargos discordam em algo.
 */
export function notaComum(cargos: Cargo[]): string | null {
  if (cargos.length < 2) return null;
  const [primeiro] = cargos;
  const iguais = <T,>(ler: (c: Cargo) => T) =>
    cargos.every((c) => JSON.stringify(ler(c)) === JSON.stringify(ler(primeiro)));
  if (
    !iguais((c) => c.escolaridade) ||
    !iguais((c) => c.jornadaHoras) ||
    !iguais((c) => c.taxaInscricao) ||
    !iguais((c) => c.remuneracoes) ||
    !iguais((c) => c.requisitos.map((r) => r.descricao))
  ) {
    return null;
  }

  const partes: string[] = [];
  if (primeiro.escolaridade) {
    partes.push(`nível ${ROTULO_ESCOLARIDADE[primeiro.escolaridade].toLowerCase()}`);
  }
  if (primeiro.jornadaHoras) partes.push(`${primeiro.jornadaHoras} h semanais`);
  if (primeiro.taxaInscricao) partes.push(`taxa de ${moedaExata(primeiro.taxaInscricao)}`);
  const salario = faixa(remuneracoes([primeiro]), moeda);
  partes.push(salario ? `remuneração de ${salario}` : "remuneração não informada no ato");
  const requisito = primeiro.requisitos[0]?.descricao;
  return `${partes.join(", ")}.${requisito ? ` Requisito: ${requisito.replace(/\.$/, "")}.` : ""}`;
}
