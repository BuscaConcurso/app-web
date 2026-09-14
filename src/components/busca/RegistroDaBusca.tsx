"use client";

/**
 * Quem escreve na memória de termos buscados.
 *
 * ## Por que isto existe em vez de uma propriedade a mais na barra
 *
 * A regra do pedido é que **só entra termo que deu resultado**, e quem sabe
 * se deu resultado é a página: `resultado.total` sai de `listarConcursos`, do
 * lado do servidor, depois que a busca já aconteceu. A barra recebe `q` e
 * `uf` por propriedade e não faz ideia do desfecho — ela renderiza igual
 * tendo a busca devolvido 4.648 concursos ou nenhum.
 *
 * Havia dois caminhos. O primeiro era dar à `BarraBusca` uma propriedade
 * `resultados` e deixá-la gravar. Ele foi recusado porque emenda na barra um
 * estado que não é dela: a barra apareceria na home e na vitrine do design
 * system com uma propriedade que só a busca sabe preencher, e a regra de
 * "quando guardar" ficaria escondida dentro de um componente que existe para
 * outra coisa.
 *
 * O segundo, que é este: **um componente que não desenha nada e só registra**.
 * A barra fica com um papel só, o de ler a memória e sugerir; este fica com o
 * outro, o de escrever. Quem os une é a página, que é onde os dois fatos —
 * a consulta e o total — estão na mesma linha.
 *
 * A política em si (o que entra, o que sai, o que é o mesmo termo) não está
 * aqui: está em `registrarBusca`, em `src/lib/termosBuscados.ts`, porque
 * regra que dá para errar é regra que precisa de teste, e teste de lógica
 * neste projeto mora em `src/lib/`.
 *
 * ## Como a página usa
 *
 * ```tsx
 * <RegistroDaBusca
 *   termo={q}
 *   resultados={resultado.total}
 *   filtrada={quantosFiltros(consulta) > 0}
 * />
 * ```
 *
 * Nada vai para o servidor: é `localStorage` do navegador da pessoa, e é por
 * isso que o registro acontece num efeito de cliente e não na renderização.
 */

import { useEffect } from "react";
import { registrarBusca } from "@/lib/termosBuscados";

export function RegistroDaBusca({
  termo,
  resultados,
  filtrada,
}: {
  /** O `q` da busca. Ausente quando a pessoa só navegou por filtro. */
  termo?: string;
  /** Quantos concursos a busca devolveu, antes da paginação. */
  resultados: number;
  /** Se havia filtro além do texto — UF, faceta ou faixa de salário. */
  filtrada: boolean;
}) {
  useEffect(() => {
    // `registrarBusca` é idempotente de propósito: promover o termo que já
    // está em primeiro não muda a lista e não avisa ninguém, então a segunda
    // passada do modo estrito não custa uma renderização.
    registrarBusca({ termo, resultados, filtrada });
  }, [termo, resultados, filtrada]);

  return null;
}
