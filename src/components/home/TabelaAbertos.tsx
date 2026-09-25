import { Abas, type ItemDeAba } from "@/components/ui/Abas";
import { BotaoLink } from "@/components/ui/Botao";
import { Rotulo } from "@/components/ui/Etiqueta";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { LinhaConcurso } from "@/components/concurso/LinhaConcurso";
import type { ConcursoResumo } from "@/lib/dominio";
import { numero } from "@/lib/formato";

const HREF_ABERTOS = "/concursos?situacao=abertas";

function abas(total: number): ItemDeAba[] {
  return [
    {
      id: "todos",
      rotulo: (
        <>
          Todos <span className="text-tinta-500">{numero(total)}</span>
        </>
      ),
      href: HREF_ABERTOS,
      ativo: true,
    },
    { id: "superior", rotulo: "Superior", href: `${HREF_ABERTOS}&escolaridade=superior`, ativo: false },
    { id: "medio", rotulo: "Médio", href: `${HREF_ABERTOS}&escolaridade=medio`, ativo: false },
    {
      id: "fundamental",
      rotulo: "Fundamental",
      href: `${HREF_ABERTOS}&escolaridade=fundamental`,
      ativo: false,
    },
  ];
}

/**
 * "Inscrições abertas agora" (`Main.dc.html:187-269`): o cartão único da
 * lista de abertos, com as abas de escolaridade e as seis linhas em
 * destaque, cada uma levando ao detalhe do próprio concurso.
 *
 * **Não pagina nem filtra de verdade.** As abas e o "Ordenar" são âncoras
 * para `/concursos`, que é quem faz o trabalho de filtro e ordenação de
 * fato; aqui a home só mostra a amostra que `obterDestaques` já escolheu
 * (os seis abertos de prazo mais curto) e diz quantos ficaram de fora.
 */
export function TabelaAbertos({
  concursos,
  total,
  hoje,
}: {
  concursos: ConcursoResumo[];
  total: number;
  hoje: Date;
}) {
  return (
    <section className="conteudo mt-12 flex flex-col gap-4 md:mt-24 md:gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-2.5 hidden md:block">
            <Rotulo icone="aberto" tom="aberto">INSCRIÇÕES ABERTAS</Rotulo>
          </div>
          <h2 className="font-titulo text-[26px] leading-[1.08] font-bold tracking-[-0.025em] md:text-[40px] md:leading-[1.05] md:tracking-[-0.03em]">
            {numero(total)} concursos abertos agora
          </h2>
        </div>
        <BotaoLink href={HREF_ABERTOS} variante="secundario" tamanho="sm" icone="filtros" className="shrink-0 xl:hidden">
          Filtros
        </BotaoLink>
      </div>

      {/* Desktop: um cartão só, com as abas, o cabeçalho e as linhas de
          verdade, a partir de `xl`. Abaixo de 1280px as seis colunas não
          cabem e a de órgão e cargo encolhia até sobrar uma letra; ali ficam
          os cartões do celular. */}
      <div className="hidden overflow-hidden rounded-[20px] bg-cartao shadow-tabela xl:block">
        <div className="flex h-[72px] items-center gap-3 border-b border-linha-fraca px-5">
          <Abas rotulo="Escolaridade" itens={abas(total)} />
          <div className="flex-grow" />
          <BotaoLink href={HREF_ABERTOS} variante="secundario" icone="ordenar" iconeDepois="abaixo">
            Ordenar: prazo mais curto
          </BotaoLink>
          <BotaoLink href={HREF_ABERTOS} variante="secundario" icone="filtros">
            Filtros
          </BotaoLink>
        </div>

        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Concursos com inscrição aberta agora</caption>
          {/* As proporções de `Main.dc.html:206`
              (`2.6fr 1.2fr 0.9fr 1fr 1.2fr 150px`), num `<table>` de verdade.
              Em porcentagem e não em `calc((100% - 150px) * ...)`: o Chrome
              ignora `calc` que mistura porcentagem e pixel na largura de
              coluna, e a tabela caía no automático (a coluna de órgão e cargo
              encolhia até sobrar uma letra). As cinco somam 82%; a última,
              sem largura, fica com o resto (190px a 1280, 219px a 1440). */}
          <colgroup>
            <col className="w-[31%]" />
            <col className="w-[14%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col />
          </colgroup>
          <thead>
            <tr className="h-11 bg-pagina text-left text-xs font-bold tracking-[0.05em] whitespace-nowrap text-tinta-500 uppercase">
              <th scope="col" className="px-5 font-bold">
                Órgão e cargo
              </th>
              <th scope="col" className="pr-4 font-bold">
                Local
              </th>
              <th scope="col" className="pr-4 font-bold">
                Vagas
              </th>
              <th scope="col" className="pr-4 font-bold">
                Salário até
              </th>
              <th scope="col" className="pr-4 font-bold">
                Inscrições até
              </th>
              <th scope="col" className="px-5" />
            </tr>
          </thead>
          <tbody>
            {concursos.map((concurso) => (
              <LinhaConcurso key={concurso.slug} as="tr" concurso={concurso} hoje={hoje} />
            ))}
          </tbody>
        </table>

        <div className="flex h-[72px] items-center justify-between px-5 text-sm text-tinta-600">
          <span>
            Mostrando {numero(concursos.length)} de {numero(total)} · ordenados pelo prazo
          </span>
          <BotaoLink href={HREF_ABERTOS} variante="primario" iconeDepois="seta">
            Ver todos os {numero(total)}
          </BotaoLink>
        </div>
      </div>

      {/* Celular: cartões de verdade, um por concurso (`Mobile.dc.html:80-109`). */}
      <div className="flex flex-col gap-2.5 xl:hidden">
        <ul className="flex flex-col gap-2.5">
          {concursos.map((concurso) => (
            <li key={concurso.slug} className="min-w-0">
              <CartaoConcurso concurso={concurso} hoje={hoje} />
            </li>
          ))}
        </ul>
        <BotaoLink href={HREF_ABERTOS} variante="primario" iconeDepois="seta" className="mt-1 w-full">
          Ver todos os {numero(total)}
        </BotaoLink>
      </div>
    </section>
  );
}
