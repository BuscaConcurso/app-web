import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { Rotulo } from "@/components/ui/Etiqueta";
import { cargosEmDestaque } from "@/lib/concursos";
import { NOME_UF } from "@/lib/rotulos";
import type { Uf } from "@/lib/dominio";

const UFS_EM_DESTAQUE: Uf[] = ["SP", "RJ", "MG", "BA", "RS", "PR", "PE", "DF"];

const COLUNAS = [
  {
    titulo: "Buscar",
    links: [
      { rotulo: "Todos os concursos", href: "/concursos" },
      { rotulo: "Inscrições abertas", href: "/concursos?situacao=abertas" },
      { rotulo: "Concursos previstos", href: "/concursos?situacao=previstos" },
      { rotulo: "Nível superior", href: "/concursos?escolaridade=superior" },
      { rotulo: "Nível médio", href: "/concursos?escolaridade=medio" },
    ],
  },
  {
    titulo: "O projeto",
    links: [
      { rotulo: "Como coletamos os editais", href: "/estilo" },
      { rotulo: "Design system", href: "/estilo" },
    ],
  },
];

/**
 * `async` por causa dos cargos, que saem de uma medição do acervo — ver
 * `cargosEmDestaque()` e, atrás dela, `src/lib/cargos.ts`.
 *
 * Eles não são uma quinta coluna, e a razão foi medida a 1240px. Com quatro
 * colunas cada uma tem 269px; com cinco, 206px. Os dez rótulos vão de 38px
 * ("Agente") a 155px ("Assistente em Administração"), então todos caberiam
 * em 206px — empilhados, dez linhas, contra as cinco da coluna mais alta que
 * o rodapé tem hoje. Deitados numa fileira de largura inteira eles somam
 * 869px com os vãos, dentro dos 1183 da linha, e viram uma linha só. A 375px
 * a fileira quebra em três linhas e 111px, com `scrollWidth` igual a
 * `clientWidth` — nenhuma rolagem lateral.
 *
 * E sem número ao lado, ao contrário dos blocos da home: o resto do rodapé —
 * "Inscrições abertas", "São Paulo" — também não tem, e uma contagem só aqui
 * faria parecer que os outros links valem menos. O número está do outro lado
 * do link, no topo da busca.
 */
export async function Rodape() {
  const cargos = await cargosEmDestaque();

  return (
    <footer className="mt-16 bg-rodape text-rodape-texto">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-8 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo tom="claro" tamanho={26} />
          <p className="mt-3 max-w-[28ch] text-[12px] leading-5 text-rodape-suave">
            Editais de concurso público coletados na fonte, com rastro até o
            documento que originou cada dado.
          </p>
        </div>

        {COLUNAS.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo}>
            <Rotulo className="text-rodape-tenue">{coluna.titulo}</Rotulo>
            <ul className="mt-3 flex flex-col gap-2">
              {coluna.links.map((link) => (
                <li key={link.rotulo}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-rodape-suave hover:text-rodape-texto"
                  >
                    {link.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav aria-label="Concursos por estado">
          <Rotulo className="text-rodape-tenue">Por estado</Rotulo>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {UFS_EM_DESTAQUE.map((uf) => (
              <li key={uf}>
                <Link
                  href={`/concursos?uf=${uf}`}
                  className="text-[12px] text-rodape-suave hover:text-rodape-texto"
                >
                  {NOME_UF[uf]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {cargos.length > 0 && (
          <nav aria-label="Concursos por cargo" className="md:col-span-4">
            <Rotulo className="text-rodape-tenue">Por cargo</Rotulo>
            {/* `flex-wrap` e `min-w-0` no item: rótulo de cargo pode ser
                comprido, e item de flex nasce com `min-width: auto`, que o
                proíbe de encolher abaixo do conteúdo. É a mesma armadilha
                que já deu 204px de rolagem lateral na coluna "por órgão" da
                home. */}
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {cargos.map((cargo) => (
                <li key={cargo.href} className="min-w-0">
                  <Link
                    href={cargo.href}
                    className="text-[12px] text-rodape-suave hover:text-rodape-texto"
                  >
                    {cargo.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Degrau de superfície no lugar de uma linha: o canvas não usa borda. */}
      <div className="bg-rodape-faixa">
        <p className="mx-auto max-w-[1240px] px-4 py-5 text-xs text-rodape-tenue sm:px-6">
          BuscaConcurso não organiza concursos. Confira sempre o edital
          original no diário oficial ou no site da banca antes de se
          inscrever.
        </p>
      </div>
    </footer>
  );
}
