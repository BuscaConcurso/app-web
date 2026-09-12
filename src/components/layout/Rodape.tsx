import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { Rotulo } from "@/components/ui/Etiqueta";
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

export function Rodape() {
  return (
    <footer className="mt-16 bg-escura text-white">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-8 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo tom="claro" tamanho={22} />
          <p className="mt-3 max-w-[28ch] text-[12px] leading-5 text-white/60">
            Editais de concurso público coletados na fonte, com rastro até o
            documento que originou cada dado.
          </p>
        </div>

        {COLUNAS.map((coluna) => (
          <nav key={coluna.titulo} aria-label={coluna.titulo}>
            <Rotulo className="text-white/50">{coluna.titulo}</Rotulo>
            <ul className="mt-3 flex flex-col gap-2">
              {coluna.links.map((link) => (
                <li key={link.rotulo}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-white/75 hover:text-white"
                  >
                    {link.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav aria-label="Concursos por estado">
          <Rotulo className="text-white/50">Por estado</Rotulo>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {UFS_EM_DESTAQUE.map((uf) => (
              <li key={uf}>
                <Link
                  href={`/concursos?uf=${uf}`}
                  className="text-[12px] text-white/75 hover:text-white"
                >
                  {NOME_UF[uf]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Degrau de superfície no lugar de uma linha: o canvas não usa borda. */}
      <div className="bg-white/5">
        <p className="mx-auto max-w-[1240px] px-4 py-5 text-xs text-white/45 sm:px-6">
          BuscaConcurso não organiza concursos. Confira sempre o edital
          original no diário oficial ou no site da banca antes de se
          inscrever.
        </p>
      </div>
    </footer>
  );
}
