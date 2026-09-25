import type { ConcursoDetalhe, ConcursoResumo } from "./dominio";
import { dataCurta, diasAte, moedaExata, paraDataLocal } from "./formato";
import { tomDoConcurso } from "./situacao";

export interface Passo { titulo: string; detalhe: string }
export interface Periodo { passados: number; total: number; fracao: number }

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function horaDoFim(c: ConcursoDetalhe): string | null {
  const evento = c.cronograma.find((e) => e.tipo === "fim_inscricao" && (e.inicio ?? e.fim) === c.inscricoesAte && e.hora);
  return evento?.hora ? evento.hora.replace(":", "h") : null;
}

export function passosDaInscricao(c: ConcursoDetalhe): Passo[] {
  const passos: Passo[] = [{ titulo: "Leia o edital", detalhe: "requisitos e documentos pedidos." }];
  if (c.taxaInscricao && c.taxaInscricao > 0) {
    passos.push({ titulo: `Pague a taxa de ${moedaExata(c.taxaInscricao)}`, detalhe: "pela guia indicada no edital." });
  }
  const hora = horaDoFim(c);
  passos.push({
    titulo: "Faça a inscrição",
    detalhe: c.inscricoesAte ? `até ${dataCurta(c.inscricoesAte)}${hora ? `, ${hora}` : ""}.` : "no endereço indicado no edital.",
  });
  return passos;
}

export function periodoDaInscricao(c: ConcursoResumo, hoje: Date): Periodo | null {
  if (!c.inscricoesDe || !c.inscricoesAte) return null;
  const total = diasAte(c.inscricoesAte, paraDataLocal(c.inscricoesDe));
  if (total <= 0) return null;
  const passados = Math.min(total, Math.max(0, total - diasAte(c.inscricoesAte, hoje)));
  return { passados, total, fracao: passados / total };
}

/**
 * "Encerra em N dias", só para quem está com inscrição aberta. Um previsto
 * com a data de fim já anunciada, ou um homologado cuja data de inscrição
 * ainda está no futuro, diziam "Encerra em 90 dias" na lateral, ao lado de
 * "Avisar quando abrir" ou da pílula "Homologado".
 */
export function prazoPorExtenso(c: ConcursoDetalhe, hoje: Date): { titulo: string; detalhe: string } | null {
  if (!c.inscricoesAte) return null;
  const tom = tomDoConcurso(c, hoje);
  if (tom === "previsto" || tom === "encerrado") return null;
  const dias = diasAte(c.inscricoesAte, hoje);
  if (dias < 0) return null;
  const titulo = dias === 0 ? "Encerra hoje" : dias === 1 ? "Encerra amanhã" : `Encerra em ${dias} dias`;
  const semana = SEMANA[paraDataLocal(c.inscricoesAte).getDay()];
  const hora = horaDoFim(c);
  return { titulo, detalhe: hora ? `${semana}, às ${hora} (Brasília)` : semana };
}

export function destinoDaInscricao(c: ConcursoDetalhe) {
  const edital = c.editalCitadoUrl ?? c.editalUrl;
  const href = edital ?? c.origens.find((o) => o.url)?.url ?? null;
  if (!href) return null;
  let host = "";
  try { host = new URL(href).host; } catch { return null; }
  return { href, host, rotulo: edital ? ("Ir para a inscrição" as const) : ("Ver o ato publicado" as const) };
}
