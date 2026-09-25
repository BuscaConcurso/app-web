/**
 * A regra que decide como o cartão se pinta.
 *
 * É a única lógica de negócio real desta fase, e o motivo de o design
 * funcionar: numa lista de trinta editais, o fundo do cartão é o que faz os
 * dois que fecham esta semana saltarem sozinhos. Errar aqui é mostrar como
 * urgente algo que já encerrou, ou esconder o que fecha amanhã no meio do
 * cinza.
 */
import { DIAS_DE_URGENCIA, type ConcursoResumo, type Tom } from "./dominio";
import { diasAte, prazoRelativo } from "./formato";
import { ROTULO_STATUS } from "./rotulos";

/** Status em que o concurso ainda nem virou edital. */
const STATUS_PREVISTOS = new Set<ConcursoResumo["status"]>([
  "previsto",
  "autorizado",
  "banca_definida",
]);

/**
 * Status sem ação possível para o candidato: ou acabou, ou o processo seguiu
 * para uma fase em que não se entra mais. Todos ficam cinza, cada um com o
 * seu rótulo.
 */
const STATUS_SEM_ACAO = new Set<ConcursoResumo["status"]>([
  "inscricoes_encerradas",
  "provas",
  "resultado",
  "homologado",
  "suspenso",
  "cancelado",
  "encerrado",
]);

export function tomDoConcurso(
  concurso: Pick<ConcursoResumo, "status" | "inscricoesAte">,
  hoje: Date = new Date(),
): Tom {
  if (STATUS_SEM_ACAO.has(concurso.status)) return "encerrado";
  if (STATUS_PREVISTOS.has(concurso.status)) return "previsto";

  // Resta `inscricoes_abertas`. Sem data de fim, o edital está aberto por
  // prazo indeterminado ou a data ainda não foi extraída do PDF; em nenhum
  // dos dois casos dá para chamar de urgente.
  if (!concurso.inscricoesAte) return "aberto";

  const dias = diasAte(concurso.inscricoesAte, hoje);
  if (dias < 0) return "encerrado";
  return dias <= DIAS_DE_URGENCIA ? "urgente" : "aberto";
}

/**
 * O texto da etiqueta de situação. No cartão urgente ele troca o status pelo
 * prazo, que é a informação que faz alguém agir.
 */
export function rotuloDeSituacao(
  concurso: Pick<ConcursoResumo, "status" | "inscricoesAte">,
  hoje: Date = new Date(),
): string {
  const tom = tomDoConcurso(concurso, hoje);
  if (tom === "urgente" && concurso.inscricoesAte) {
    return prazoRelativo(concurso.inscricoesAte, hoje) ?? ROTULO_STATUS[concurso.status];
  }
  if (tom === "encerrado" && concurso.status === "inscricoes_abertas") {
    // A data passou mas ninguém atualizou o status na origem ainda.
    return "Inscrições encerradas";
  }
  return ROTULO_STATUS[concurso.status];
}

/** As classes de fundo e de ponto por tom, para o cartão e a etiqueta. */
export const ESTILO_DO_TOM: Record<
  Tom,
  { cartao: string; chip: string; ponto: string; apoio: string; bloco: string }
> = {
  aberto: {
    cartao: "bg-cartao",
    chip: "bg-verde-fundo text-verde-texto",
    ponto: "bg-verde",
    apoio: "text-tinta-600",
    bloco: "bg-rebaixada",
  },
  urgente: {
    cartao: "bg-urgente",
    chip: "bg-urucum-fundo text-urucum-texto",
    ponto: "bg-urucum",
    apoio: "text-urucum-texto",
    bloco: "bg-urgente-chip",
  },
  previsto: {
    cartao: "bg-previsto",
    chip: "bg-ouro-fundo text-ouro-sinal-texto",
    ponto: "bg-ouro-sinal-texto",
    apoio: "text-ouro-sinal-texto",
    bloco: "bg-previsto-chip",
  },
  encerrado: {
    cartao: "bg-encerrado",
    chip: "bg-rebaixada text-tinta-600",
    ponto: "bg-tinta-500",
    apoio: "text-tinta-600",
    bloco: "bg-encerrado-chip",
  },
};
