/**
 * A regra de `IdentificacaoNaAnalitica`, fora do componente: ele importa a
 * sessão, e a sessão carrega `lib/auth/api.ts`, que exige a variável da api
 * na carga do módulo (o mesmo motivo de `lib/salvos.ts`).
 */
export type Mudanca = { acao: "identificar"; id: string } | { acao: "esquecer" };

/**
 * O que fazer com a analítica quando a sessão muda. Enquanto a sessão
 * carrega, nada: o `loading` do começo de toda página não é saída de conta.
 */
export function mudancaDeConta(
  anterior: string | null,
  status: "loading" | "authenticated" | "anonymous",
  id: string | null,
): Mudanca | null {
  if (status === "authenticated" && id && id !== anterior) return { acao: "identificar", id };
  if (status === "anonymous" && anterior) return { acao: "esquecer" };
  return null;
}
