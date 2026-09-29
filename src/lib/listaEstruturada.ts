/**
 * Uma lista de páginas na forma que o buscador lê (`ItemList`), para as
 * páginas de área. A home monta a dela à mão (`src/app/page.tsx`); aqui a
 * forma fica num lugar só, com teste, pela lição de `trilha.ts`: o que dá
 * para errar é a posição que começa em zero e a URL relativa onde o schema
 * pede absoluta, e nada disso se vê olhando a página.
 */
import { urlAbsoluta } from "./site";

export interface ItemDaLista {
  nome: string;
  /** O caminho no site, começando em `/`. */
  href: string;
}

/**
 * `total` é o tamanho da lista inteira, não o da página: a página de uma
 * área mostra 20 de centenas. `primeiraPosicao` é a posição do primeiro item
 * desta página (21 na página 2), para a lista contar como a tela conta.
 */
export function listaEstruturada(
  nome: string,
  total: number,
  itens: ItemDaLista[],
  primeiraPosicao = 1,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nome,
    numberOfItems: total,
    itemListElement: itens.map((item, indice) => ({
      "@type": "ListItem",
      position: primeiraPosicao + indice,
      url: urlAbsoluta(item.href),
      name: item.nome,
    })),
  };
}
