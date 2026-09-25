/**
 * As 12 áreas da home, na ordem do protótipo.
 *
 * Nome e apoio saem de `docs/prototipo/Main.dc.html:133-144`, o ícone da
 * Task 3 e o tom do fundo do ícone. O termo é o que a área busca: ele
 * alimenta `hrefDaArea`, que usa `caminhoDaBusca` para não duplicar a regra
 * de slug que a busca por texto já segue.
 *
 * Cada termo foi conferido contra o acervo local antes do commit (ver
 * `task-7-report.md`); nenhum voltou zero, então nenhum precisou de troca
 * por sinônimo.
 */
import type { NomeDoIcone } from "@/components/ui/Icone";
import { caminhoDaBusca } from "./parametros";

export interface Area {
  nome: string;
  apoio: string;
  icone: NomeDoIcone;
  tom: "verde" | "anil" | "ouro" | "urucum";
  termo: string;
}

export const AREAS: Area[] = [
  { nome: "Tribunais", apoio: "TJ, TRT, TRF, TRE", icone: "tribunais", tom: "verde", termo: "tribunal" },
  { nome: "Polícia e segurança", apoio: "PF, PRF, PM, PC", icone: "policia", tom: "anil", termo: "policia" },
  { nome: "Educação", apoio: "Universidades e IFs", icone: "educacao", tom: "ouro", termo: "professor" },
  { nome: "Saúde", apoio: "Hospitais e SUS", icone: "saude", tom: "urucum", termo: "saude" },
  { nome: "Fiscal e controle", apoio: "Receita, TCU, CGU", icone: "fiscal", tom: "verde", termo: "auditor" },
  { nome: "Bancos e estatais", apoio: "BB, Caixa, BNDES", icone: "estatais", tom: "anil", termo: "banco" },
  { nome: "Forças Armadas", apoio: "Marinha, Exército, FAB", icone: "forcas", tom: "anil", termo: "militar" },
  { nome: "Prefeituras", apoio: "Municípios do país", icone: "prefeituras", tom: "ouro", termo: "prefeitura" },
  { nome: "Conselhos", apoio: "CRA, COREN, CREA", icone: "conselhos", tom: "verde", termo: "conselho" },
  { nome: "Tecnologia", apoio: "Analista de TI e dados", icone: "tecnologia", tom: "anil", termo: "tecnologia" },
  { nome: "Administrativo", apoio: "Técnico e assistente", icone: "administrativo", tom: "urucum", termo: "administrativo" },
  { nome: "Ambiente e agro", apoio: "IBAMA, ICMBio, CONAB", icone: "ambiente", tom: "verde", termo: "ambiental" },
];

/** Para onde o azulejo da área leva: a busca pelo termo dela. */
export function hrefDaArea(area: Area): string {
  return caminhoDaBusca(area.termo);
}
