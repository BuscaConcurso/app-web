/**
 * `GET /api/areas`: as 12 áreas com os concursos abertos ou previstos de
 * cada uma (`areasDaApi`), e quando o acervo por trás dela foi lido. Pública:
 * é o mesmo dado das páginas de área.
 *
 * Quem lê é o job do resumo semanal da api, uma vez por semana. Por isso é
 * dinâmica e sem cache de CDN: uma rota estática com `revalidate` serve a
 * cópia velha ao primeiro pedido depois de expirar, e com um cliente só por
 * semana essa cópia seria a da semana anterior (ou a do build). O acervo já
 * fica guardado em processo por cinco minutos (`lerAcervoDaApi`).
 */
import { areasParaOResumo } from "@/lib/concursos";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await areasParaOResumo(hojeCivilEmSaoPaulo()), {
    headers: { "cache-control": "no-store" },
  });
}
