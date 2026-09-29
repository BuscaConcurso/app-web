"use client";

import { useEffect, useRef } from "react";
import { esquecer, identificar } from "@/lib/analitica";
import { useSession } from "@/lib/auth/session";
import { mudancaDeConta } from "@/lib/contaNaAnalitica";

/**
 * Liga a conta à analítica pelo id interno (nunca o e-mail), e desliga ao
 * sair. Não desenha nada; mora no layout, dentro do `SessionProvider`.
 */
export function IdentificacaoNaAnalitica() {
  const { status, profile } = useSession();
  const anterior = useRef<string | null>(null);
  const id = profile?.id ?? null;

  useEffect(() => {
    const mudanca = mudancaDeConta(anterior.current, status, id);
    if (mudanca?.acao === "identificar") identificar(mudanca.id);
    if (mudanca?.acao === "esquecer") esquecer();
    if (status !== "loading") anterior.current = status === "authenticated" ? id : null;
  }, [status, id]);

  return null;
}
