/**
 * Carrega uma fonte estática do Google Fonts para o Satori (o motor por trás
 * de `next/og`), pelo truque conhecido de não mandar `User-Agent` de
 * navegador: sem ele, a Google devolve TTF em vez de WOFF2, o único par de
 * formato que o Satori lê (`ImageResponse` só aceita `ttf`, `otf` e `woff`).
 * Hoje o único chamador é `src/app/opengraph-image.tsx`, mas a função é
 * genérica (família, peso e recorte de texto por parâmetro) porque a lógica
 * não tem nada de específico da home.
 *
 * **Falha degrada para `null`, nunca lança.** Rede fora do ar, resposta
 * fora de 2xx, ou um CSS sem a linha `src: url(...) format('...')` (a Google
 * muda o formato de recorte de vez em quando) são os três jeitos de dar
 * errado, e nenhum deles pode derrubar a rota da imagem de OG: sem a fonte
 * customizada, `ImageResponse` ainda desenha com a fonte padrão do Satori.
 * `AbortSignal.timeout` limita cada `fetch` a `tempoLimiteMs`, para uma rede
 * pendurada não travar a geração da imagem (nem, em build estático, o build
 * inteiro) esperando uma resposta que não chega.
 *
 * `fetchImpl` existe para o teste poder injetar um `fetch` de mentira sem
 * tocar a rede de verdade nem depender de `vi.stubGlobal`.
 */
const TEMPO_LIMITE_PADRAO_MS = 3000;

export async function carregarFonteGoogle({
  familia,
  peso,
  texto,
  fetchImpl = fetch,
  tempoLimiteMs = TEMPO_LIMITE_PADRAO_MS,
}: {
  familia: string;
  peso: number;
  texto: string;
  fetchImpl?: typeof fetch;
  tempoLimiteMs?: number;
}): Promise<ArrayBuffer | null> {
  try {
    const url =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familia)}` +
      `:wght@${peso}&text=${encodeURIComponent(texto)}`;
    const respostaCss = await fetchImpl(url, {
      signal: AbortSignal.timeout(tempoLimiteMs),
    });
    if (!respostaCss.ok) return null;

    const css = await respostaCss.text();
    const referencia = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
    if (!referencia) return null;

    const respostaFonte = await fetchImpl(referencia[1], {
      signal: AbortSignal.timeout(tempoLimiteMs),
    });
    if (!respostaFonte.ok) return null;

    return await respostaFonte.arrayBuffer();
  } catch {
    return null;
  }
}
