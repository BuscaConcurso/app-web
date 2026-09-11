/**
 * Filtro e ordenação, como funções puras.
 *
 * Ficam separadas da fachada de dados porque é aqui que mora o
 * comportamento que dá para errar: a busca sem acento, o E entre termos, e
 * sobretudo a ordenação "encerrando primeiro", onde um concurso sem data de
 * fim precisa ir para o fim da lista e não para o começo, que é onde
 * qualquer comparação ingênua o coloca.
 */
import type {
  ConcursoResumo,
  Escolaridade,
  Esfera,
  Uf,
} from "./dominio";
import { tomDoConcurso } from "./situacao";

export type Ordem = "encerrando" | "recentes" | "vagas" | "salario";

export const ORDENS: Record<Ordem, string> = {
  encerrando: "Encerrando primeiro",
  recentes: "Publicados recentemente",
  vagas: "Mais vagas",
  salario: "Maior salário",
};

/** Os três grupos que o painel de filtros oferece. */
export type Situacao = "abertas" | "previstos" | "encerrados";

export const SITUACOES: Record<Situacao, string> = {
  abertas: "Inscrições abertas",
  previstos: "Previstos",
  encerrados: "Encerrados",
};

export interface Filtro {
  q?: string;
  uf?: Uf;
  escolaridade?: Escolaridade;
  situacao?: Situacao;
  banca?: string;
  esfera?: Esfera;
  salarioMin?: number;
}

/** Minúscula e sem acento, para "sao paulo" achar "São Paulo". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function textoBuscavel(concurso: ConcursoResumo): string {
  return normalizar(
    [
      concurso.titulo,
      concurso.orgao.nome,
      concurso.orgao.sigla,
      concurso.orgao.municipio ?? "",
      concurso.banca?.nome ?? "",
    ].join(" "),
  );
}

function combinaComTermos(concurso: ConcursoResumo, q: string): boolean {
  const alvo = textoBuscavel(concurso);
  // Todos os termos precisam aparecer. Quem digita "analista judiciario"
  // quer as duas palavras, não a união de tudo que tem "analista".
  return normalizar(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((termo) => alvo.includes(termo));
}

function combinaComSituacao(
  concurso: ConcursoResumo,
  situacao: Situacao,
  hoje: Date,
): boolean {
  const tom = tomDoConcurso(concurso, hoje);
  if (situacao === "abertas") return tom === "aberto" || tom === "urgente";
  if (situacao === "previstos") return tom === "previsto";
  return tom === "encerrado";
}

export function filtrar(
  itens: ConcursoResumo[],
  filtro: Filtro = {},
  hoje: Date = new Date(),
): ConcursoResumo[] {
  return itens.filter((concurso) => {
    if (filtro.q && !combinaComTermos(concurso, filtro.q)) return false;
    if (filtro.uf && concurso.uf !== filtro.uf) return false;
    if (filtro.esfera && concurso.orgao.esfera !== filtro.esfera) return false;
    if (filtro.banca && concurso.banca?.slug !== filtro.banca) return false;
    if (
      filtro.escolaridade &&
      !concurso.escolaridades.includes(filtro.escolaridade)
    ) {
      return false;
    }
    if (filtro.salarioMin != null) {
      // Sem salário publicado não dá para afirmar que passa do piso pedido.
      if (concurso.salarioAte == null) return false;
      if (concurso.salarioAte < filtro.salarioMin) return false;
    }
    if (
      filtro.situacao &&
      !combinaComSituacao(concurso, filtro.situacao, hoje)
    ) {
      return false;
    }
    return true;
  });
}

/** Valor ausente vai sempre para o fim, em qualquer ordenação. */
function comparar(
  a: number | null,
  b: number | null,
  direcao: "asc" | "desc",
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direcao === "asc" ? a - b : b - a;
}

function tempoDe(iso: string | null): number | null {
  return iso === null ? null : new Date(`${iso}T00:00:00`).getTime();
}

export function ordenar(
  itens: ConcursoResumo[],
  ordem: Ordem = "encerrando",
  hoje: Date = new Date(),
): ConcursoResumo[] {
  const copia = [...itens];
  if (ordem === "recentes") {
    return copia.sort((a, b) =>
      comparar(tempoDe(a.publicadoEm), tempoDe(b.publicadoEm), "desc"),
    );
  }
  if (ordem === "vagas") {
    return copia.sort((a, b) => comparar(a.vagas, b.vagas, "desc"));
  }
  if (ordem === "salario") {
    return copia.sort((a, b) => comparar(a.salarioAte, b.salarioAte, "desc"));
  }

  // Encerrando primeiro. Prazo que já passou não é iminente, então os
  // encerrados descem para depois de tudo que ainda tem prazo aberto.
  const corte = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  ).getTime();
  return copia.sort((a, b) => {
    const pa = tempoDe(a.inscricoesAte);
    const pb = tempoDe(b.inscricoesAte);
    const vencidoA = pa !== null && pa < corte;
    const vencidoB = pb !== null && pb < corte;
    if (vencidoA !== vencidoB) return vencidoA ? 1 : -1;
    const porPrazo = comparar(pa, pb, vencidoA ? "desc" : "asc");
    if (porPrazo !== 0) return porPrazo;
    return comparar(a.vagas, b.vagas, "desc");
  });
}
