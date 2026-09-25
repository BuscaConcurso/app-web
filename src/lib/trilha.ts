/**
 * A trilha de navegação como uma lista de degraus, e nada além disso.
 *
 * Existe por causa de um defeito que já aconteceu: a trilha da página do
 * concurso era escrita à mão em JSX e o `BreadcrumbList` que o buscador lê
 * era escrito à mão logo acima, no mesmo arquivo. Quando o degrau do órgão
 * ganhou endereço, a lista estruturada passou a declarar três degraus e a
 * tela continuou mostrando dois: cada uma dizendo uma hierarquia diferente
 * do mesmo lugar. Duas listas paralelas divergem; a questão é quando.
 *
 * Então há **uma lista só**: `Degrau[]`. `Trilha`
 * (src/components/ui/Trilha.tsx) desenha a tela a partir dela e chama
 * `trilhaEstruturada` com a mesma lista para o buscador. Nenhum dos dois
 * caminhos aceita um degrau que o outro não tenha, porque não há um segundo
 * lugar onde escrever um.
 *
 * O que é dado puro fica aqui, com teste, pelo mesmo motivo de `consulta.ts`
 * e `orgaos.ts`: o que dá para errar é a forma do `BreadcrumbList` (posição
 * que começa em zero, URL relativa onde o schema pede absoluta, nome que não
 * é o da tela), e isso não se confere olhando a página.
 */
import { urlAbsoluta } from "./site";

/** Um degrau da trilha: o que a pessoa lê e para onde ele leva. */
export interface Degrau {
  /**
   * O texto do degrau. **É o mesmo na tela e no `BreadcrumbList`**: é essa
   * a regra que o defeito de origem quebrou, e é por isso que há um campo só.
   */
  nome: string;
  /**
   * O caminho no site, começando em `/`. Vira link na tela em todo degrau
   * menos o último, e vira `item` absoluto no dado estruturado em todos.
   */
  href: string;
}

/**
 * A mesma lista, na forma que o buscador lê.
 *
 * `position` começa em 1: o schema.org conta degraus, não índices de array,
 * e uma lista que começa em 0 é silenciosamente ignorada.
 *
 * `item` absoluto em **todos** os degraus, o último incluído. O Google
 * permite omitir o `item` do degrau corrente, mas omitir é uma segunda regra
 * para lembrar, e o que temos aqui é justamente o histórico de esquecer a
 * segunda regra. O degrau corrente já se identifica por ser o último e por
 * carregar a URL canônica da própria página.
 */
export function trilhaEstruturada(degraus: Degrau[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: degraus.map((degrau, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      name: degrau.nome,
      item: urlAbsoluta(degrau.href),
    })),
  };
}
