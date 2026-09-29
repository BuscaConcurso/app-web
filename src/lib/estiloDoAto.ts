import type { NomeDoIcone } from "@/components/ui/Icone";
import type { ConcursoStatus } from "./dominio";

/**
 * Ícone e cor pelo status do concurso do ato: `Main.dc.html:351-354`. Mora
 * aqui porque a home ("Saiu no DOU") e o feed do Diário pintam o ato igual.
 */
export function estiloDoAto(status: ConcursoStatus): { icone: NomeDoIcone; classe: string } {
  if (status === "homologado") return { icone: "homologado", classe: "bg-verde-fundo text-verde-texto" };
  if (status === "inscricoes_abertas") return { icone: "aberto", classe: "bg-verde-fundo text-verde-texto" };
  return { icone: "previsto", classe: "bg-ouro-fundo text-ouro-sinal-texto" };
}
