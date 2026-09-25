/**
 * O que o selo do órgão desenha: o logo oficial, a sigla, ou a caixa lisa.
 *
 * Função pura para ter teste: o vitest daqui roda sem DOM, e o componente se
 * confere em `/estilo`. A regra da sigla é a que o `Selo` já tinha: string
 * vazia ou só espaço conta como ausência.
 */
export type Face =
  | { tipo: "logo"; url: string }
  | { tipo: "sigla"; letras: string }
  | { tipo: "vazio" };

const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1"]);

function urlDeImagem(bruta: string | null | undefined): string | null {
  const texto = bruta?.trim();
  if (!texto) return null;
  // Caminho da mesma origem ("/icone-32.png"), mas não "//host", que é outra origem.
  if (texto.startsWith("/") && !texto.startsWith("//")) return texto;
  try {
    const url = new URL(texto);
    if (url.protocol === "https:") return url.href;
    if (url.protocol === "http:" && HOSTS_LOCAIS.has(url.hostname)) return url.href;
  } catch {
    return null;
  }
  return null;
}

export function faceDoSelo({
  logoUrl,
  sigla,
}: {
  logoUrl?: string | null;
  sigla: string | null;
}): Face {
  const url = urlDeImagem(logoUrl);
  if (url) return { tipo: "logo", url };
  const letras = sigla?.trim() ?? "";
  return letras ? { tipo: "sigla", letras } : { tipo: "vazio" };
}
