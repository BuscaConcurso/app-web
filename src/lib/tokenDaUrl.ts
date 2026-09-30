/**
 * O token dos links de e-mail (descadastro, redefinição de senha, verificação
 * e troca de e-mail) chega na query. Enquanto está na barra de endereço, ele
 * vaza para o histórico, para o `Referer` de qualquer link seguido e para a
 * analítica. A página o lê uma vez e tira da barra (`useTokenDaUrl`).
 */
export function enderecoSemToken(local: { pathname: string; search: string; hash: string }): string | null {
  const parametros = new URLSearchParams(local.search);
  if (!parametros.has("token")) return null;
  parametros.delete("token");
  const query = parametros.toString();
  return `${local.pathname}${query ? `?${query}` : ""}${local.hash}`;
}
