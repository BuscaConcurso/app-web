import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartaoDeFato } from "@/components/concurso/FatosDoConcurso";
import { ListaDeResultados } from "@/components/busca/ListaDeResultados";
import { CLASSE_DO_ICONE } from "@/components/home/Areas";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import { Icone } from "@/components/ui/Icone";
import { Trilha, type Degrau } from "@/components/ui/Trilha";
import { areaDoSlug, hrefDaArea, type Area } from "@/lib/areas";
import { avisoDoAcervo, concursosDaArea, dimensoesDoAcervo } from "@/lib/concursos";
import { hojeCivilEmSaoPaulo, numero } from "@/lib/formato";
import { listaEstruturada } from "@/lib/listaEstruturada";
import {
  POR_PAGINA_DA_AREA,
  consultaDaArea,
  indexavelDaArea,
  listaDaArea,
} from "@/lib/paginaDaArea";
import { tituloSemOrgao } from "@/lib/rotulos";

/**
 * A página de uma área: todos os concursos que a regra da área
 * (`casaComArea`, `areas.ts`) reconhece no acervo, abertos primeiro.
 *
 * Embaixo do cabeçalho, a lista da busca inteira (`ListaDeResultados`):
 * coluna de filtros, ordem, abas de situação, chips e paginação, todos
 * presos a `/areas/<slug>` pelo `caminho` da consulta (`consultaDaArea`).
 *
 * **Sem `generateStaticParams`**, como a página do órgão: esta lê os
 * filtros da query no servidor, e página que lê a query não é
 * prerenderizável por parâmetro de rota. A alternativa seria a de
 * `/busca/<slug>` (estática, com o filtro no navegador), e ela mandaria a
 * lista inteira ao navegador: 3.596 concursos em Educação. Slug que não é
 * uma das 12 áreas é 404, por `areaDoSlug`.
 */

function areaDaRota(slug: string): Area {
  const area = areaDoSlug(slug);
  if (!area) notFound();
  return area;
}

export async function generateMetadata(
  props: PageProps<"/areas/[slug]">,
): Promise<Metadata> {
  const area = areaDaRota((await props.params).slug);
  const consulta = consultaDaArea(area, await props.searchParams);
  const total = (await concursosDaArea(area)).length;

  return {
    title: `Concursos de ${area.nome}`,
    description:
      `${numero(total)} ${total === 1 ? "concurso" : "concursos"} de ${area.nome} (${area.apoio}): ` +
      "abertos, previstos e encerrados, com vagas, salário, taxa e prazo de inscrição " +
      "e o link para o edital original.",
    alternates: { canonical: hrefDaArea(area) },
    // A lista filtrada, reordenada ou numa página adiante é a mesma lista
    // recortada: o canônico é a área inteira, e o recorte segue sendo seguido.
    robots: indexavelDaArea(consulta)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function PaginaDaArea(props: PageProps<"/areas/[slug]">) {
  const area = areaDaRota((await props.params).slug);
  const consulta = consultaDaArea(area, await props.searchParams);
  // Data civil de São Paulo, a mesma de /concursos, /busca e /orgaos.
  const hoje = hojeCivilEmSaoPaulo();
  const [itens, aviso, dimensoes] = await Promise.all([
    concursosDaArea(area),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
  ]);
  const lista = listaDaArea(itens, consulta, hoje);
  const { resultado } = lista;
  const trilha: Degrau[] = [
    { nome: "Concursos", href: "/concursos" },
    { nome: "Áreas", href: "/areas" },
    { nome: area.nome, href: hrefDaArea(area) },
  ];

  return (
    <>
      <div className="conteudo">
        <DadosEstruturados
          dados={listaEstruturada(
            `Concursos de ${area.nome}`,
            resultado.total,
            resultado.itens.map((concurso) => ({
              // O mesmo nome de item da lista da home (`src/app/page.tsx`).
              nome: `${concurso.orgao.nome}: ${tituloSemOrgao(concurso.titulo, concurso.orgao)}`,
              href: `/concursos/${concurso.slug}`,
            })),
            (resultado.pagina - 1) * POR_PAGINA_DA_AREA + 1,
          )}
        />
        <Trilha degraus={trilha} />

        <div className="flex flex-col gap-6">
          {/* O cabeçalho da página do órgão, com o quadrado do ícone do
              azulejo no lugar do selo. */}
          <header className="rounded-painel bg-cartao p-5 shadow-cartao md:px-10 md:py-9">
            <div className="flex items-start gap-4 md:gap-6">
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-[14px] md:size-[72px] md:rounded-[20px] ${CLASSE_DO_ICONE[area.tom]}`}
              >
                <Icone nome={area.icone} tamanho={30} />
              </span>
              <div className="min-w-0">
                <h1 className="font-titulo text-[1.375rem] leading-[1.15] font-bold tracking-[-0.02em] break-words text-balance md:text-[2rem] md:leading-[1.1] md:tracking-[-0.025em]">
                  Concursos de {area.nome}
                </h1>
                <p className="mt-1.5 text-sm text-tinta-600 md:text-[0.9375rem]">{area.apoio}</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-tinta-600 md:mt-6">
              {lista.total === 1
                ? "Um concurso desta área foi lido do diário oficial até agora."
                : `${numero(lista.total)} concursos desta área foram lidos do diário oficial até agora.`}{" "}
              A área junta os concursos pelo órgão, pelo cargo ou pelo título do edital.
            </p>
          </header>

          <div className="-mt-2 grid grid-cols-3 gap-2 max-md:fonte-grande:grid-cols-1 md:gap-3">
            <CartaoDeFato
              icone="aberto"
              cor="bg-verde-fundo text-verde-texto"
              rotulo="ABERTOS"
              valor={numero(lista.porSituacao.abertas)}
            />
            <CartaoDeFato
              icone="previsto"
              cor="bg-ouro-fundo text-ouro-sinal-texto"
              rotulo="PREVISTOS"
              valor={numero(lista.porSituacao.previstos)}
            />
            <CartaoDeFato
              icone="lista"
              cor="bg-anil-fundo text-anil-texto"
              rotulo="CONCURSOS"
              valor={numero(lista.total)}
            />
          </div>
        </div>
      </div>

      {/* A lista da busca, presa à área. O `h1` é o do cabeçalho acima. O
          aviso do acervo incompleto vem junto, no fim da lista. */}
      <ListaDeResultados
        consulta={consulta}
        titulo="Concursos desta área"
        nivelDoTitulo="h2"
        resultado={resultado}
        contagens={lista.contagens}
        aviso={aviso}
        dimensoes={dimensoes}
        hoje={hoje}
      />
    </>
  );
}
