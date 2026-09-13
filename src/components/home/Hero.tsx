import Link from "next/link";
import { BarraBusca } from "@/components/busca/BarraBusca";
import { Ilustracao } from "./Ilustracao";
import { numero } from "@/lib/formato";

/**
 * Os atalhos que valem sempre: escolaridade e busca por texto, que o acervo
 * responde hoje.
 */
const ATALHOS = [
  { rotulo: "Nível superior", href: "/concursos?escolaridade=superior" },
  { rotulo: "Nível médio", href: "/concursos?escolaridade=medio" },
  { rotulo: "Tribunais", href: "/concursos?q=tribunal" },
  { rotulo: "Polícia", href: "/concursos?q=policia" },
];

/**
 * Os atalhos de esfera, que só aparecem quando algum órgão do acervo tem
 * esfera — hoje, nenhum dos 325.
 *
 * Aqui esconder é a resposta certa, e é diferente do seletor de estado: um
 * atalho não é um controle que a pessoa foi procurar, é uma sugestão nossa.
 * Sugerir um caminho que leva a uma lista vazia é mandar alguém para um beco;
 * não sugerir não afirma nada. Quem chegar em `/concursos?esfera=federal` por
 * um link antigo continua recebendo a explicação na página da busca, que é
 * onde ela faz falta.
 */
const ATALHOS_DE_ESFERA = [
  { rotulo: "Federais", href: "/concursos?esfera=federal" },
  { rotulo: "Prefeituras", href: "/concursos?esfera=municipal" },
];

export function Hero({
  totalAbertos,
  atualizadoEm,
  dimensoes,
}: {
  totalAbertos: number;
  atualizadoEm: string;
  dimensoes: { total: number; comUf: number; comEsfera: number };
}) {
  const atalhos =
    dimensoes.comEsfera > 0 ? [...ATALHOS, ...ATALHOS_DE_ESFERA] : ATALHOS;
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
        <BarraBusca dimensoes={dimensoes} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-tinta-500">Atalhos:</span>
        {atalhos.map((atalho) => (
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
