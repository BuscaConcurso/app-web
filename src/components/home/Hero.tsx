import Link from "next/link";
import type { ReactNode } from "react";
import { Rotulo } from "@/components/ui/Etiqueta";
import type { DimensoesDoAcervo, LinkDeFaceta } from "@/lib/concursos";
import { numero } from "@/lib/formato";
import { Ilustracao } from "./Ilustracao";

/**
 * Os atalhos que valem sempre: escolaridade e busca por texto, que o acervo
 * responde hoje.
 */
const ATALHOS = [
  { rotulo: "Nível superior", href: "/concursos?escolaridade=superior" },
  { rotulo: "Nível médio", href: "/concursos?escolaridade=medio" },
  { rotulo: "Nível médio técnico", href: "/concursos?escolaridade=medio_tecnico" },
  { rotulo: "Nível fundamental", href: "/concursos?escolaridade=fundamental" },
  { rotulo: "Tribunais", href: "/busca/tribunal" },
  { rotulo: "Polícia", href: "/busca/policia" },
];

/**
 * Os atalhos de esfera, que só aparecem quando algum órgão do acervo tem
 * esfera.
 *
 * Aqui esconder é a resposta certa, e é diferente do seletor de estado: um
 * atalho não é um controle que a pessoa foi procurar, é uma sugestão nossa.
 * Sugerir um caminho que leva a uma lista vazia é mandar alguém para um beco;
 * não sugerir não afirma nada.
 */
const ATALHOS_DE_ESFERA = [
  { rotulo: "Federais", href: "/concursos?esfera=federal" },
  { rotulo: "Prefeituras", href: "/concursos?esfera=municipal" },
];

/**
 * Um atalho do acesso rápido. `max-w-full` e o rótulo com `min-w-0
 * break-words`: um chip é item de flex, e sem isso um nome comprido não
 * encolhe e estica a página no celular (a mesma armadilha documentada em
 * `Etiqueta` e em `BlocosSeo`).
 */
function Chip({
  href,
  rotulo,
  total,
}: {
  href: string;
  rotulo: string;
  total?: number;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-controle bg-rebaixada px-3 text-[12px] font-medium text-tinta-800 transition-colors hover:bg-tinta-200"
    >
      <span className="min-w-0 break-words">{rotulo}</span>
      {total !== undefined && (
        <span className="numero text-tinta-600">{numero(total)}</span>
      )}
    </Link>
  );
}

/**
 * Uma fileira do acesso rápido: o rótulo acima no celular e à esquerda a
 * partir de `sm`, numa coluna de largura fixa para os chips das três
 * fileiras começarem na mesma vertical.
 */
function Fileira({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <nav
      aria-label={titulo}
      className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4"
    >
      <Rotulo as="h3" className="sm:pt-2">
        {titulo}
      </Rotulo>
      <ul className="flex min-w-0 flex-wrap gap-2">{children}</ul>
    </nav>
  );
}

/**
 * O topo da home.
 *
 * **A caixa de busca saiu daqui.** Ela mora no cabeçalho de toda página, e
 * repetir a mesma barra logo abaixo seria dizer a mesma coisa duas vezes na
 * primeira tela. O que sobra ao topo é a hierarquia nova: o que o site é
 * (o título e o número de concursos abertos) e, logo abaixo, o acesso rápido
 * por estado, por cargo e pelos recortes fixos. As faixas de concursos vêm
 * depois, como antes.
 *
 * O acesso rápido é um cartão só, sem borda nem sombra: o degrau de
 * `pagina` para `cartao` é a separação, e dentro dele as fileiras se separam
 * por espaço. Os estados sobem dos blocos do fim da página para cá porque
 * "concurso no meu estado" é a pergunta mais comum de quem chega, e agora
 * que a barra não ocupa o meio da tela ela tem espaço na primeira dobra.
 */
export function Hero({
  totalAbertos,
  atualizadoEm,
  dimensoes,
  ufs,
  cargos,
}: {
  totalAbertos: number;
  atualizadoEm: string;
  dimensoes: DimensoesDoAcervo;
  /** Os estados com mais concursos abertos, de `facetas`. */
  ufs: LinkDeFaceta[];
  /** Os cargos mais frequentes do acervo, de `cargosEmDestaque`. */
  cargos: LinkDeFaceta[];
}) {
  const atalhos =
    dimensoes.comEsfera > 0 ? [...ATALHOS, ...ATALHOS_DE_ESFERA] : ATALHOS;

  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-7 pb-5 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between gap-10">
        <div className="min-w-0">
          <h1 className="max-w-[20ch] font-titulo text-[27px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-[36px]">
            Concursos públicos abertos, em um lugar só
          </h1>
          <p className="mt-3 max-w-[56ch] text-[14px] leading-6 text-tinta-600 text-pretty">
            Hoje são{" "}
            <strong className="numero font-semibold text-tinta-900">
              {numero(totalAbertos)} concursos com inscrição aberta
            </strong>
            . Buscamos os editais direto nas bancas e nos diários oficiais,
            extraímos cargo, vaga, salário e prazo de cada um, e guardamos o
            link para o documento original.
          </p>
          <p className="mt-2 text-xs text-tinta-500">
            Acervo atualizado em {atualizadoEm}.
          </p>
        </div>

        {/* Só a partir do desktop: no celular o espaço vertical vale mais
            para o acesso rápido do que para um desenho. */}
        <Ilustracao className="hidden w-[210px] shrink-0 lg:block" />
      </div>

      <div className="mt-6 rounded-caixa bg-cartao p-4 sm:p-5">
        <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em]">
          Acesso rápido
        </h2>
        {/* As duas contagens medem coisas diferentes, e o chip sozinho não
            diria qual: o estado conta os abertos agora (`facetas`), o cargo
            conta o acervo inteiro (`cargosEmDestaque`, ver o porquê lá). */}
        <p className="mt-0.5 text-[12px] leading-5 text-tinta-600">
          Nos estados, o número é de concursos abertos agora; nos cargos, de
          concursos no acervo.
        </p>
        <div className="mt-4 grid gap-4">
          {ufs.length > 0 && (
            <Fileira titulo="Por estado">
              {ufs.map((uf) => (
                <li key={uf.href} className="max-w-full">
                  <Chip href={uf.href} rotulo={uf.rotulo} total={uf.total} />
                </li>
              ))}
            </Fileira>
          )}
          {cargos.length > 0 && (
            <Fileira titulo="Por cargo">
              {cargos.map((cargo) => (
                <li key={cargo.href} className="max-w-full">
                  <Chip href={cargo.href} rotulo={cargo.rotulo} total={cargo.total} />
                </li>
              ))}
            </Fileira>
          )}
          <Fileira titulo="Atalhos">
            {atalhos.map((atalho) => (
              <li key={atalho.href} className="max-w-full">
                <Chip href={atalho.href} rotulo={atalho.rotulo} />
              </li>
            ))}
          </Fileira>
        </div>
      </div>
    </section>
  );
}
