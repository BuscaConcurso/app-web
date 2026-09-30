"use client";

import { useLayoutEffect, useState } from "react";
import { enderecoSemToken } from "./tokenDaUrl";

/**
 * O token que a página recebeu pela URL, guardado no estado, e a barra de
 * endereço sem ele. `useLayoutEffect` para rodar antes dos efeitos comuns da
 * página (a verificação de e-mail usa o token num `useEffect`). O
 * `replaceState` nativo é integrado ao roteador do Next e não recarrega nada.
 */
export function useTokenDaUrl(doServidor: string | undefined): string | undefined {
  const [token] = useState(doServidor);
  useLayoutEffect(() => {
    const endereco = enderecoSemToken(window.location);
    if (endereco !== null) window.history.replaceState(null, "", endereco);
  }, []);
  return token;
}
