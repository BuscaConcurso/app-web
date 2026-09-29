/**
 * As páginas institucionais: "Como lemos os editais", "Acessibilidade" e
 * "Contato". Eram três recursos de `RECURSOS_EM_BREVE` (`emBreve.ts`) e
 * viraram páginas de texto.
 *
 * Este módulo não importa nada com `@/`: `next.config.ts` lê
 * `REDIRECIONAMENTOS_DO_EM_BREVE` daqui, e o alias do `tsconfig` não vale
 * para o arquivo de configuração.
 */

export const PAGINAS_INSTITUCIONAIS = {
  "como-lemos": { titulo: "Como lemos os editais", href: "/como-lemos-os-editais" },
  acessibilidade: { titulo: "Acessibilidade", href: "/acessibilidade" },
  contato: { titulo: "Contato", href: "/contato" },
} as const;

export type PaginaInstitucional = keyof typeof PAGINAS_INSTITUCIONAIS;

/**
 * O endereço `/em-breve/<recurso>` que cada página teve, redirecionado com
 * 308: é permanente, e quem guardou o link antigo (ou o buscador que o
 * seguiu) chega na página de verdade. A chave de cada página é o nome que o
 * recurso tinha em `RECURSOS_EM_BREVE`, então o endereço antigo sai dela.
 */
export const REDIRECIONAMENTOS_DO_EM_BREVE = (
  Object.entries(PAGINAS_INSTITUCIONAIS) as [
    PaginaInstitucional,
    (typeof PAGINAS_INSTITUCIONAIS)[PaginaInstitucional],
  ][]
).map(([recurso, { href }]) => ({
  source: `/em-breve/${recurso}`,
  destination: href,
  permanent: true,
}));
