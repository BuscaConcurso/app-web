/** As seções de `/conta`, na ordem da tela. */
const SECOES = ["perfil", "senha", "email", "provedores", "sessoes", "avisos"] as const;

/**
 * A seção que o hash nomeia. A rolagem por âncora do navegador acontece antes
 * de a conta carregar, quando a seção ainda não existe; a tela rola sozinha
 * depois, por esta função.
 */
export function secaoDoHash(hash: string): string | null {
  const id = hash.replace(/^#/u, "");
  return SECOES.find((secao) => secao === id) ?? null;
}
