"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O botão "Compartilhar" do cabeçalho do concurso, num hook próprio porque o
 * cabeçalho de celular (Task 14) repete o mesmo botão no topo da tela, e as
 * duas telas precisam da mesma decisão: `navigator.share` quando existe (a
 * folha nativa do sistema, com o título e o link já prontos), e
 * `navigator.clipboard.writeText` quando não existe, com o aviso "Link
 * copiado" por 4 segundos, o mesmo tempo do `BotaoEmBreve`.
 *
 * Cancelar a folha nativa (botão Voltar, X) não é erro: `navigator.share`
 * rejeita a promessa com `AbortError` nesse caso, e não há nada a avisar.
 */
export function useCompartilhar({ titulo, url }: { titulo: string; url: string }) {
  const [linkCopiado, setLinkCopiado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  async function compartilhar() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // A pessoa cancelou a folha nativa; nada a fazer.
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setLinkCopiado(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setLinkCopiado(false), 4000);
  }

  return { compartilhar, linkCopiado };
}
