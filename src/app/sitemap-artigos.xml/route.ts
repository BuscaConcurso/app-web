import { mapaDeArtigos } from "@/lib/artigos";
import { unstable_rethrow } from "next/navigation";
import { xmlDeArtigos } from "@/lib/sitemapNoticias";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return new Response(xmlDeArtigos(await mapaDeArtigos()), {
      headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (erro) {
    unstable_rethrow(erro);
    return new Response("Mapa de artigos temporariamente indisponível", { status: 503, headers: { "Retry-After": "300", "Cache-Control": "no-store" } });
  }
}
