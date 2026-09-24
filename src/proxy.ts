import { NextResponse, type NextRequest } from "next/server";
import { destinoCanonico } from "@/lib/enderecoDaBusca";

/**
 * A forma canônica da busca, antes de qualquer render.
 *
 * Aqui, e não na página, por dois motivos: `/busca/<slug>` é estática e não
 * pode ler a query (redirecionar dali perderia `?uf=SP`), e `/concursos?q=`
 * precisa sair antes de a listagem gastar um render inteiro. A regra está em
 * `destinoCanonico`, com teste; este arquivo só a aplica com 308.
 */
export function proxy(request: NextRequest) {
  const destino = destinoCanonico(request.nextUrl.pathname, request.nextUrl.searchParams);
  return destino
    ? NextResponse.redirect(new URL(destino, request.url), 308)
    : NextResponse.next();
}

export const config = {
  matcher: ["/concursos", "/busca/:termo"],
};
