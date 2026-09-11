import type { Banca } from "@/lib/dominio";

/** As organizadoras que mais aparecem no acervo do engine, mais as regionais. */
export const BANCAS = {
  cebraspe: { slug: "cebraspe", nome: "Cebraspe" },
  vunesp: { slug: "vunesp", nome: "Vunesp" },
  fgv: { slug: "fgv", nome: "FGV" },
  fcc: { slug: "fcc", nome: "FCC" },
  ibfc: { slug: "ibfc", nome: "IBFC" },
  ibade: { slug: "ibade", nome: "Ibade" },
  quadrix: { slug: "quadrix", nome: "Quadrix" },
  aocp: { slug: "aocp", nome: "AOCP" },
  consulplan: { slug: "consulplan", nome: "Instituto Consulplan" },
  idecan: { slug: "idecan", nome: "Idecan" },
} satisfies Record<string, Banca>;

export type SlugBanca = keyof typeof BANCAS;
