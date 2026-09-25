import Link from "next/link";
import { Selo } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoResumo } from "@/lib/dominio";
import { dataCurta, moeda, numero } from "@/lib/formato";
import { tituloSemOrgao } from "@/lib/rotulos";

/** "R$ 13.753", "Banca IADES" ou "30 vagas"/"Vagas a definir", nessa ordem de prioridade. */
function detalheDoConcurso(concurso: ConcursoResumo): string {
  if (concurso.salarioAte) return moeda(concurso.salarioAte);
  if (concurso.banca) return `Banca ${concurso.banca.nome}`;
  if (concurso.vagas) return `${numero(concurso.vagas)} ${concurso.vagas === 1 ? "vaga" : "vagas"}`;
  return "Vagas a definir";
}

/**
 * "TAMBÉM ABERTOS NO {UF}" da lateral do concurso (`Concurso.dc.html:241-246`):
 * até três outros concursos com inscrição aberta na mesma UF
 * (`tambemAbertos`, `lib/concursos.ts`). Some quando a lista vier vazia: um
 * título sem linha nenhuma embaixo afirmaria uma busca que não achou nada.
 */
export function TambemAbertos({
  nomeUf,
  concursos,
}: {
  nomeUf: string;
  concursos: ConcursoResumo[];
}) {
  if (concursos.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-[22px] bg-cartao p-6 shadow-cartao">
      <div className="mb-2 flex items-center gap-2 text-[12px] font-bold tracking-[0.05em] text-tinta-500">
        <Icone nome="local" tamanho={16} />
        TAMBÉM ABERTOS NO {nomeUf.toUpperCase()}
      </div>
      {concursos.map((concurso, indice) => (
        <Link
          key={concurso.slug}
          href={`/concursos/${concurso.slug}`}
          className={`flex items-center gap-3 py-2.5 text-tinta-900 ${
            indice < concursos.length - 1 ? "border-b border-linha-fraca" : ""
          }`}
        >
          <Selo sigla={concurso.orgao.sigla} tamanho={36} />
          <div className="min-w-0 flex-grow">
            <div className="truncate text-sm font-bold">
              {concurso.nomesDeCargo[0] ?? tituloSemOrgao(concurso.titulo, concurso.orgao)}
            </div>
            <div className="truncate text-[13px] text-tinta-600">
              {detalheDoConcurso(concurso)}
              {concurso.inscricoesAte ? ` · até ${dataCurta(concurso.inscricoesAte)}` : ""}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
