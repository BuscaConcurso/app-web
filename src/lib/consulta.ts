/**
 * Filtro e ordenação, como funções puras.
 *
 * Ficam separadas da fachada de dados porque é aqui que mora o
 * comportamento que dá para errar: a busca sem acento, o E entre termos, e
 * sobretudo a ordenação "encerrando primeiro", onde um concurso sem data de
 * fim precisa ir para o fim da lista e não para o começo, que é onde
 * qualquer comparação ingênua o coloca.
 *
 * As dimensões de faceta aceitam vários valores. Dentro de uma dimensão a
 * relação é OU, entre dimensões é E: quem marca superior e médio quer os
 * dois, e quem marca São Paulo junto quer os dois em São Paulo. É como busca
 * por faceta funciona em qualquer lugar, e é o que os quadradinhos de
 * seleção do canvas prometem.
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
  /** Um só: vem do seletor da barra de busca, não da coluna de facetas. */
  uf?: Uf;
  escolaridades?: Escolaridade[];
  situacoes?: Situacao[];
  bancas?: string[];
  esferas?: Esfera[];
  salarioMin?: number;
  salarioMax?: number;
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
      concurso.orgao.sigla ?? "",
      concurso.orgao.municipio ?? "",
      concurso.banca?.nome ?? "",
      // O nome do cargo e a cidade da vaga. Sem os dois, procurar
      // "professor" ou o nome de uma cidade no acervo do engine não acha
      // nada: o título é o cabeçalho do ato e a cidade não está no órgão.
      //
      // `?? []` porque um `bc api` de versão anterior não manda estes
      // campos, e uma lista inteira em branco por causa de um servidor
      // desatualizado é caro demais para o que custa esta guarda.
      (concurso.nomesDeCargo ?? []).join(" "),
      (concurso.localidades ?? []).join(" "),
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

/** Lista vazia ou ausente não filtra nada. */
function vazia<T>(valores: T[] | undefined): valores is undefined {
  return !valores || valores.length === 0;
}

export function situacaoDoConcurso(
  concurso: ConcursoResumo,
  hoje: Date,
): Situacao {
  const tom = tomDoConcurso(concurso, hoje);
  if (tom === "aberto" || tom === "urgente") return "abertas";
  if (tom === "previsto") return "previstos";
  return "encerrados";
}

export function filtrar(
  itens: ConcursoResumo[],
  filtro: Filtro = {},
  hoje: Date = new Date(),
): ConcursoResumo[] {
  return itens.filter((concurso) => {
    if (filtro.q && !combinaComTermos(concurso, filtro.q)) return false;
    if (filtro.uf && concurso.uf !== filtro.uf) return false;

    if (!vazia(filtro.esferas)) {
      // Órgão sem esfera não casa com nenhuma esfera pedida — continua fora,
      // que é o que já acontecia quando o campo era declarado não anulável e
      // chegava nulo assim mesmo. Hoje isso é todo o acervo do engine, e o
      // aviso disso está em `/diagnostico`.
      const esfera = concurso.orgao.esfera;
      if (!esfera || !filtro.esferas.includes(esfera)) return false;
    }
    if (
      !vazia(filtro.bancas) &&
      (!concurso.banca || !filtro.bancas.includes(concurso.banca.slug))
    ) {
      return false;
    }
    if (
      !vazia(filtro.escolaridades) &&
      !concurso.escolaridades.some((e) => filtro.escolaridades!.includes(e))
    ) {
      return false;
    }
    if (
      !vazia(filtro.situacoes) &&
      !filtro.situacoes.includes(situacaoDoConcurso(concurso, hoje))
    ) {
      return false;
    }

    // Sem salário publicado não dá para afirmar que cabe na faixa pedida.
    if (filtro.salarioMin != null) {
      if (concurso.salarioAte == null) return false;
      if (concurso.salarioAte < filtro.salarioMin) return false;
    }
    if (filtro.salarioMax != null) {
      if (concurso.salarioAte == null) return false;
      if (concurso.salarioAte > filtro.salarioMax) return false;
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
