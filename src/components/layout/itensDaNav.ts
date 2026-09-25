import type { NomeDoIcone } from "@/components/ui/Icone";
import { hrefEmBreve } from "@/lib/emBreve";

/**
 * Os itens da nav: dado puro, sem `"use client"`.
 *
 * Mora fora de `NavPrincipal.tsx` de propósito. Aquele arquivo é `"use
 * client"`, e todo export de um módulo cliente vira referência opaca para
 * quem importa de um Componente de Servidor: `Cabecalho.tsx` (servidor)
 * precisa da lista de verdade para a gaveta do celular, e importar
 * `ITENS_DA_NAV` de `./NavPrincipal` ali quebra em tempo de execução
 * (`ITENS_DA_NAV.map is not a function`, medido com o Turbopack do `next
 * dev`; ver `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`).
 * Vitest não aplica essa fronteira, e é por isso que o teste passava mesmo
 * com o bug: ele só prova a regra da aba ativa, não o limite cliente/servidor.
 *
 * `NavPrincipal.tsx` reexporta este módulo, então quem só conhece aquele
 * arquivo (como `NavPrincipal.test.ts`) continua importando de lá.
 */
export interface ItemDaNav {
  rotulo: string;
  icone: NomeDoIcone;
  href: string;
  ativo: (caminho: string, busca: URLSearchParams) => boolean;
  /**
   * Só na nav da home (`Main.dc.html:39-45`). A nav das páginas internas
   * divide a fileira com a busca compacta e leva três abas em texto
   * (`Concurso.dc.html:47-49`); a gaveta do celular leva todas.
   */
  soNaHome?: boolean;
}

export const ITENS_DA_NAV = [
  {
    rotulo: "Abertos",
    icone: "aberto",
    href: "/concursos?situacao=abertas",
    ativo: (caminho, busca) =>
      caminho === "/concursos" && busca.get("situacao") === "abertas",
  },
  {
    rotulo: "Previstos",
    icone: "previsto",
    href: "/concursos?situacao=previstos",
    ativo: (caminho, busca) =>
      caminho === "/concursos" && busca.get("situacao") === "previstos",
  },
  {
    rotulo: "Diário Oficial",
    icone: "diario",
    href: hrefEmBreve("diario-oficial"),
    ativo: (caminho) => caminho === hrefEmBreve("diario-oficial"),
  },
  {
    rotulo: "Áreas",
    icone: "areas",
    href: hrefEmBreve("areas"),
    ativo: (caminho) => caminho === hrefEmBreve("areas"),
    soNaHome: true,
  },
  {
    rotulo: "Estados",
    icone: "estados",
    href: "/#estados",
    ativo: () => false,
    soNaHome: true,
  },
] satisfies ItemDaNav[];
