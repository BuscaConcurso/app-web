/**
 * `GET /api/areas`: as 12 áreas com os concursos abertos ou previstos de
 * cada uma (`areasDaApi`). Pública: é o mesmo dado das páginas de área.
 *
 * Quem lê é o job do resumo semanal da api, uma vez por execução. Estática
 * com `revalidate` de cinco minutos, o mesmo do acervo
 * (`VALIDADE_DO_ACERVO_S`): passar as 12 regras pelo acervo inteiro a cada
 * pedido seria trabalho repetido numa rota que qualquer um pode chamar.
 */
import { areasParaOResumo } from "@/lib/concursos";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  return Response.json(await areasParaOResumo(hojeCivilEmSaoPaulo()));
}
