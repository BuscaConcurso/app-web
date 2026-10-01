import { mapaDeArtigos } from "@/lib/artigos";
import { unstable_rethrow } from "next/navigation";
import { chaveDaNoticia, noticiasRecentes, NOTICIAS_POR_MAPA, partesDasNoticias, xmlDeNoticias, xmlDoIndice } from "@/lib/sitemapNoticias";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const prefixo = new URL(request.url).searchParams.get("parte");
  if (prefixo !== null && !/^[a-f0-9]{1,64}$/.test(prefixo)) {
    return new Response("Parte inválida", { status: 404 });
  }
  try {
    const itens = noticiasRecentes(await mapaDeArtigos(), new Date());
    // Partes de um índice anterior continuam válidas após despublicações.
    // Se uma parte crescer além de 1000, falha temporariamente; o índice novo
    // anuncia subdivisões, sem truncar notícias ou aninhar sitemapindex.
    const xml = prefixo !== null
      ? xmlDeNoticias(itens.filter(item => chaveDaNoticia(item).startsWith(prefixo)))
      : itens.length > NOTICIAS_POR_MAPA
        ? xmlDoIndice(partesDasNoticias(itens).map(parte => `/sitemap-noticias.xml?parte=${parte}`))
        : xmlDeNoticias(itens);
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-cache" } });
  } catch (erro) {
    unstable_rethrow(erro);
    return new Response("Mapa de notícias temporariamente indisponível", { status: 503, headers: { "Retry-After": "300", "Cache-Control": "no-store" } });
  }
}
