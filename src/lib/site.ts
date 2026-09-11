/**
 * Constantes do site que aparecem em metadata, sitemap e JSON-LD.
 *
 * A URL vem do ambiente para que preview e produção gerem canônicos
 * diferentes sem editar código. O padrão é o domínio de produção, porque um
 * canônico apontando para localhost em produção é pior do que um canônico
 * errado em desenvolvimento.
 */
export const URL_SITE =
  process.env.NEXT_PUBLIC_URL_SITE?.replace(/\/$/, "") ??
  "https://buscaconcurso.com.br";

export const NOME_SITE = "BuscaConcurso";

export const DESCRICAO_SITE =
  "Encontre concursos públicos abertos no Brasil por cargo, órgão, estado, " +
  "escolaridade e banca. Vagas, salário, taxa e prazo de inscrição de cada " +
  "edital, com o link para o documento original.";

export function urlAbsoluta(caminho: string): string {
  return `${URL_SITE}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
