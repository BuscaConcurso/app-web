import { TIPOS_DE_ARTIGO, TAMANHO_MAXIMO_DA_BUSCA, type FiltroDeArtigos, type TipoDeArtigo } from "./artigos";
import { NOME_UF } from "./rotulos";

export type ParametrosDeArtigos = Record<string, string | string[] | undefined>;
export const ROTULO_TIPO_ARTIGO: Record<TipoDeArtigo, string> = {
  concurso: "Análise de concurso",
  semanal_nacional: "Panorama nacional",
  semanal_uf: "Panorama por estado",
  prazos_semana: "Prazos da semana",
  mensal_escolaridade: "Por escolaridade",
};

export function consultaDeArtigos(parametros: ParametrosDeArtigos): FiltroDeArtigos {
  const unico = (chave: string) => typeof parametros[chave] === "string" ? parametros[chave].trim() : "";
  const numero = unico("pagina");
  const pagina = /^\d+$/.test(numero) && Number.isSafeInteger(Number(numero)) && Number(numero) > 0 ? Number(numero) : 1;
  const tipo = unico("tipo") as TipoDeArtigo;
  const uf = unico("uf").toUpperCase();
  const q = unico("q").split("\u0000").join("").trim().slice(0, TAMANHO_MAXIMO_DA_BUSCA);
  return {
    pagina,
    ...(TIPOS_DE_ARTIGO.includes(tipo) ? { tipo } : {}),
    ...(Object.hasOwn(NOME_UF, uf) ? { uf } : {}),
    ...(q ? { q } : {}),
    ordem: unico("ordem") === "relevantes" ? "relevantes" : "recentes",
  };
}

export function parametrosDosArtigos(filtro: FiltroDeArtigos): URLSearchParams {
  const parametros = new URLSearchParams();
  if (filtro.pagina > 1) parametros.set("pagina", String(filtro.pagina));
  for (const chave of ["tipo", "uf", "q"] as const) {
    if (filtro[chave]) parametros.set(chave, filtro[chave]);
  }
  if (filtro.ordem === "relevantes") parametros.set("ordem", filtro.ordem);
  return parametros;
}

export function hrefDosArtigos(caminho: string, filtro: FiltroDeArtigos, pagina = filtro.pagina): string {
  const busca = parametrosDosArtigos({ ...filtro, pagina }).toString();
  return busca ? `${caminho}?${busca}` : caminho;
}
