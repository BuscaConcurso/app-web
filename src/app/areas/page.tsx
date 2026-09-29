import type { Metadata } from "next";
import { Azulejo } from "@/components/home/Areas";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import { Trilha, type Degrau } from "@/components/ui/Trilha";
import { hrefDaArea } from "@/lib/areas";
import { resumoDasAreas } from "@/lib/concursos";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";
import { listaEstruturada } from "@/lib/listaEstruturada";

/**
 * `/areas`: as 12 áreas da home em página própria, cada uma com quantos
 * concursos abertos tem e quantos tem ao todo.
 *
 * ISR de cinco minutos, o mesmo `revalidate` da home e do acervo
 * (`VALIDADE_DO_ACERVO_S`): a contagem nunca é mais velha que a lista que o
 * azulejo abre. A página não lê query, então é estática.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Concursos por área",
  description:
    "Tribunais, polícia, educação, saúde e as outras áreas do serviço público, " +
    "cada uma com os concursos abertos, previstos e encerrados.",
  alternates: { canonical: "/areas" },
};

const TRILHA: Degrau[] = [
  { nome: "Concursos", href: "/concursos" },
  { nome: "Áreas", href: "/areas" },
];

export default async function PaginaDasAreas() {
  // Data civil de São Paulo, como na home: "aberto" não depende do fuso de
  // quem lê.
  const resumo = await resumoDasAreas(hojeCivilEmSaoPaulo());

  return (
    <div className="conteudo pb-8 md:pb-12">
      <DadosEstruturados
        dados={listaEstruturada(
          "Concursos por área",
          resumo.length,
          resumo.map(({ area }) => ({ nome: `Concursos de ${area.nome}`, href: hrefDaArea(area) })),
        )}
      />
      <Trilha degraus={TRILHA} />

      <header className="mb-6 md:mb-8">
        <h1 className="font-titulo text-[1.625rem] leading-[1.08] font-bold tracking-[-0.025em] md:text-[2.5rem] md:leading-[1.05] md:tracking-[-0.03em]">
          Concursos por área
        </h1>
        <p className="mt-2 max-w-[40rem] text-sm leading-6 text-tinta-600 md:text-[0.9375rem]">
          Cada área junta os concursos pelo órgão, pelo cargo ou pelo título do
          edital. Um concurso pode estar em mais de uma: o de um tribunal com vaga
          de TI está em Tribunais e em Tecnologia.
        </p>
      </header>

      {/* As mesmas colunas da home (`Areas.tsx`), com uma linha a mais em cada
          azulejo; no celular, duas colunas, porque a contagem não cabe nas
          três da home. */}
      <div className="grid grid-cols-2 gap-2 fonte-grande:grid-cols-1 md:grid-cols-3 md:gap-3 xl:grid-cols-6 fonte-grande:xl:grid-cols-3">
        {resumo.map(({ area, abertos, total }) => (
          <Azulejo key={area.slug} area={area} resumo={{ abertos, total }} />
        ))}
      </div>
    </div>
  );
}
