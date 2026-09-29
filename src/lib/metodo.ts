/**
 * O que a página "Como lemos os editais" lê do acervo, e a frase que sai
 * disso.
 *
 * A página é texto: com a API fora do ar e sem leitura boa guardada,
 * `numerosDoAcervo()` lança (a regra de `carregar`, em `concursos.ts`), e
 * derrubar a explicação do método com um 500 por causa de uma frase de
 * números seria pior do que calar a frase. É o mesmo padrão de
 * `acervoDoLayout` (`src/app/layout.tsx`).
 */
import { unstable_rethrow } from "next/navigation";
import type { NumerosDoAcervo } from "./concursos";
import { numero } from "./formato";

export async function numerosSemDerrubar(
  ler: () => Promise<NumerosDoAcervo>,
): Promise<NumerosDoAcervo | null> {
  try {
    return await ler();
  } catch (erro) {
    // Sinal do próprio Next não é falha do acervo e segue para cima.
    unstable_rethrow(erro);
    console.error(
      "[como-lemos] acervo indisponível para os números; a página sai sem eles.",
      erro,
    );
    return null;
  }
}

export function aberturaDoMetodo(numeros: NumerosDoAcervo | null): string {
  const base =
    "Cada concurso do BuscaConcurso sai de um ato publicado no Diário Oficial da União. " +
    "Esta página conta onde procuramos, o que lemos, como organizamos cada concurso e o que pode estar errado.";
  if (!numeros) return base;
  return (
    `${base} Hoje a lista tem ${numero(numeros.concursos)} concursos de ${numero(numeros.orgaos)} ` +
    `órgãos, com ${numero(numeros.bancas)} bancas organizadoras citadas nos atos.`
  );
}
