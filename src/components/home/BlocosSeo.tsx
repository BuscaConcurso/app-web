import Link from "next/link";
import { Rotulo } from "@/components/ui/Etiqueta";
import type { LinkDeFaceta } from "@/lib/concursos";

/**
 * Os links internos do rodapé da home.
 *
 * Cada linha aqui é uma âncora de verdade para uma URL de busca já filtrada.
 * É o que distribui autoridade da home, que ranqueia por termo genérico,
 * para as combinações de filtro, que ranqueiam por cauda longa. Um menu com
 * JavaScript no lugar disto teria a mesma aparência e nenhum dos efeitos.
 *
 * **O rótulo saiu de dentro do cartão**, como nas seções do detalhe e pelo
 * mesmo motivo — com o bloco desenhado, o rótulo dentro dele disputava com a
 * primeira linha da lista. Aqui ele não usa `Secao` porque o invólucro é um
 * `<nav>` com nome acessível e o título é um `h3` sob o `h2` da faixa, e não
 * um `<section>` com `h2`; o que se repete é a distância, 8px do rótulo ao
 * bloco contra os 8px de vão entre as colunas da grade.
 */
function Coluna({
  titulo,
  links,
}: {
  titulo: string;
  links: LinkDeFaceta[];
}) {
  return (
    <nav aria-label={titulo}>
      <Rotulo as="h3" className="mb-2">
        {titulo}
      </Rotulo>
      <ul className="flex flex-col rounded-caixa bg-cartao p-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-baseline justify-between gap-3 rounded-controle px-2 py-1.5 text-sm text-tinta-800 transition-colors hover:bg-rebaixada"
            >
              {/* `min-w-0` é o que conserta a rolagem horizontal no celular,
                  e `truncate` era a causa. Item de flex nasce com
                  `min-width: auto`, que o proíbe de encolher abaixo do
                  conteúdo; com `white-space: nowrap` junto (que é o que
                  `truncate` liga), a largura mínima do item vira a linha
                  INTEIRA. Um nome de órgão de 190 caracteres esticava a
                  coluna, a grade inteira ia junto, e o documento ganhava
                  204 px de rolagem lateral — medido em Chrome a 400 px:
                  `scrollWidth 689` contra `clientWidth 485`, e 485 contra
                  485 depois.

                  E quebra de linha em vez de reticências porque cortar
                  esconderia o que distingue dois órgãos congelados pela
                  resolução, que só diferem no fim do caminho
                  (".../Campus X"). Trocar rolagem por ambiguidade seria
                  piorar. */}
              <span className="min-w-0 break-words">{link.rotulo}</span>
              <span className="numero shrink-0 text-xs text-tinta-500">
                {link.total}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BlocosSeo({
  ufs,
  bancas,
  orgaos,
}: {
  ufs: LinkDeFaceta[];
  bancas: LinkDeFaceta[];
  orgaos: LinkDeFaceta[];
}) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em]">
        Onde procurar
      </h2>
      <p className="mt-1 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
        Os recortes mais buscados do acervo. O número ao lado é quantos
        concursos estão com inscrição aberta agora em cada um.
      </p>

      {/* `gap-y-6` contra os `gap-x-2`: empilhadas no celular, as colunas
          ficam uma embaixo da outra e o rótulo de cada uma mora fora do seu
          cartão. Com o vão de 7px dos dois lados — o mesmo do `mb-2` do
          rótulo —, o "POR ÓRGÃO" ficava exatamente no meio do caminho entre o
          cartão de cima e o seu, sem pertencer a nenhum dos dois. 21px em
          cima contra 7 embaixo desfaz o empate; lado a lado, a partir de
          `md`, o vão vertical não separa nada e o horizontal continua 7. */}
      <div className="mt-5 grid gap-x-2 gap-y-6 md:grid-cols-3">
        <Coluna titulo="Por estado" links={ufs} />
        <Coluna titulo="Por órgão" links={orgaos} />
        <Coluna titulo="Por banca" links={bancas} />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <div className="rounded-caixa bg-cartao p-5">
          <h3 className="font-titulo text-lg font-semibold">
            De onde vêm estes dados
          </h3>
          <p className="mt-2 text-sm leading-6 text-tinta-600">
            Um robô visita todos os dias as bancas organizadoras e os diários
            oficiais, baixa cada edital publicado e extrai dele o cargo, o
            número de vagas, a remuneração, a taxa e o cronograma. Cada campo
            que aparece nesta página guarda a referência do arquivo que o
            originou, então dá para conferir a informação no documento
            original em vez de acreditar na nossa palavra.
          </p>
        </div>
        <div className="rounded-caixa bg-cartao p-5">
          <h3 className="font-titulo text-lg font-semibold">
            Como usar a busca
          </h3>
          <p className="mt-2 text-sm leading-6 text-tinta-600">
            Digite o cargo que você quer, o nome do órgão ou a sigla da banca.
            Combine com o estado para ver só o que dá para prestar perto de
            casa, e use os filtros de escolaridade e salário para cortar o
            que não serve. Cada combinação vira um endereço próprio, que você
            pode salvar nos favoritos ou transformar em alerta por e-mail.
          </p>
        </div>
      </div>
    </section>
  );
}
