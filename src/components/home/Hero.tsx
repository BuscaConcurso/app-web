import Link from "next/link";
import { BarraBusca } from "@/components/busca/BarraBusca";
import { Ilustracao } from "./Ilustracao";
import { numero } from "@/lib/formato";

const ATALHOS = [
  { rotulo: "Nível superior", href: "/concursos?escolaridade=superior" },
  { rotulo: "Nível médio", href: "/concursos?escolaridade=medio" },
  { rotulo: "Tribunais", href: "/concursos?q=tribunal" },
  { rotulo: "Polícia", href: "/concursos?q=policia" },
  { rotulo: "Federais", href: "/concursos?esfera=federal" },
  { rotulo: "Prefeituras", href: "/concursos?esfera=municipal" },
];

export function Hero({
  totalAbertos,
  atualizadoEm,
}: {
  totalAbertos: number;
  atualizadoEm: string;
}) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 pt-8 pb-6 sm:px-6 sm:pt-10">
      <div className="flex items-center justify-between gap-10">
        <div>
          <h1 className="max-w-[18ch] font-titulo text-[27px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-[34px]">
            Concursos públicos abertos, em um lugar só
          </h1>
          <p className="mt-4 max-w-[54ch] text-[13px] leading-6 text-tinta-600 text-pretty">
            Buscamos os editais direto nas bancas e nos diários oficiais,
            extraímos cargo, vaga, salário e prazo de cada um, e guardamos o
            link para o documento original. Hoje são{" "}
            <strong className="numero font-medium text-tinta-900">
              {numero(totalAbertos)}
            </strong>{" "}
            concursos com inscrição aberta.
          </p>
        </div>

        {/* Só a partir do desktop: no celular o espaço vertical vale mais
            para o campo de busca do que para um desenho. */}
        <Ilustracao className="hidden w-[230px] shrink-0 lg:block" />
      </div>

      <div className="mt-6">
        <BarraBusca />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-tinta-500">Atalhos:</span>
        {ATALHOS.map((atalho) => (
          <Link
            key={atalho.rotulo}
            href={atalho.href}
            className="rounded-controle bg-rebaixada px-3 py-1.5 text-[12px] font-medium text-tinta-800 transition-colors hover:bg-tinta-200"
          >
            {atalho.rotulo}
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-tinta-500">
        Acervo atualizado em {atualizadoEm}.
      </p>
    </section>
  );
}
