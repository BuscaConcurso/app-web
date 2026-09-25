"use client";

import { useEffect, useRef, useState } from "react";

export const MENSAGEM_LINK_COPIADO = "Link copiado";
export const MENSAGEM_FALHA_AO_COPIAR = "Não deu para copiar o link";

/**
 * O que `resolverCompartilhamento` precisa do `navigator`, e nada mais: o
 * suficiente para testar a decisão com um substituto, sem `jsdom` nem mock
 * do objeto global inteiro.
 */
export interface NavegadorParaCompartilhar {
  share?: (dados: { title: string; url: string }) => Promise<void>;
  clipboard?: { writeText: (texto: string) => Promise<void> };
}

/**
 * A decisão pura do botão "Compartilhar": dado o navegador (ou um
 * substituto de teste) e o que compartilhar, devolve o aviso a mostrar, ou
 * `null` quando não há nada a avisar.
 *
 * `navigator.share`, quando existe, abre a folha nativa do sistema; `null`
 * nos dois desfechos dela, porque tanto o compartilhamento ter dado certo
 * quanto a pessoa ter cancelado (a folha rejeita com `AbortError`) já
 * mostraram o que tinham para mostrar em outro lugar, que não é este toast.
 * Uma falha por outro motivo do sistema operacional cai no mesmo `null`: não
 * há o que este código, rodando depois da folha já ter fechado, tem para
 * dizer sobre ela.
 *
 * Sem `navigator.share`, o retorno cai para `navigator.clipboard`: copiado
 * com sucesso avisa "Link copiado"; sem `clipboard` (contexto sem HTTPS, por
 * exemplo) ou com a cópia rejeitada, o aviso é o de falha, nunca uma
 * promessa rejeitada sem tratamento.
 */
export async function resolverCompartilhamento(
  navegador: NavegadorParaCompartilhar,
  dados: { titulo: string; url: string },
): Promise<string | null> {
  if (navegador.share) {
    try {
      await navegador.share({ title: dados.titulo, url: dados.url });
    } catch {
      // Cancelamento (`AbortError`) ou outra falha da folha nativa: nada a
      // avisar por aqui.
    }
    return null;
  }

  if (!navegador.clipboard) return MENSAGEM_FALHA_AO_COPIAR;

  try {
    await navegador.clipboard.writeText(dados.url);
    return MENSAGEM_LINK_COPIADO;
  } catch {
    return MENSAGEM_FALHA_AO_COPIAR;
  }
}

/**
 * O botão "Compartilhar" do cabeçalho do concurso, num hook próprio porque o
 * cabeçalho de celular (Task 14) repete o mesmo botão no topo da tela, e as
 * duas telas precisam da mesma decisão (`resolverCompartilhamento`, acima).
 *
 * O aviso, quando há um, some sozinho depois de 4 segundos, o mesmo tempo do
 * `BotaoEmBreve`.
 */
export function useCompartilhar({ titulo, url }: { titulo: string; url: string }) {
  const [aviso, setAviso] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  async function compartilhar() {
    const mensagem = await resolverCompartilhamento(navigator, { titulo, url });
    if (mensagem === null) return;
    setAviso(mensagem);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(null), 4000);
  }

  return { compartilhar, aviso };
}
