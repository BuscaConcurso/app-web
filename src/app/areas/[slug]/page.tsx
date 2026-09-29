import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartaoDeFato } from "@/components/concurso/FatosDoConcurso";
import { ListaDeConcursos } from "@/components/concurso/ListaDeConcursos";
import { CLASSE_DO_ICONE } from "@/components/home/Areas";
import { AcervoIncompleto } from "@/components/home/BlocoAlerta";
import { Abas, type ItemDeAba } from "@/components/ui/Abas";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import { Icone } from "@/components/ui/Icone";
import { Paginacao } from "@/components/ui/Paginacao";
import { Trilha, type Degrau } from "@/components/ui/Trilha";
import { areaDoSlug, hrefDaArea, type Area } from "@/lib/areas";
import { avisoDoAcervo, concursosDaArea } from "@/lib/concursos";
import type { Situacao } from "@/lib/consulta";
import { hojeCivilEmSaoPaulo, numero } from "@/lib/formato";
import { listaEstruturada } from "@/lib/listaEstruturada";
import {
  POR_PAGINA_DA_AREA,
  hrefDaListaDaArea,
  lerConsultaDaArea,
  listaDaArea,
  listaVaziaDaArea,
  type ConsultaDaArea,
  type ListaDaArea,
} from "@/lib/paginaDaArea";
import { tituloSemOrgao } from "@/lib/rotulos";

/**
 * A página de uma área: todos os concursos que a regra da área
 * (`casaComArea`, `areas.ts`) reconhece no acervo, abertos primeiro.
 *
 * **Sem `generateStaticParams`**, como a página do órgão: esta lê
 * `?situacao=` e `?pagina=` no servidor, e página que lê a query não é
 * prerenderizável por parâmetro de rota. A alternativa seria a de
 * `/busca/<slug>` (estática, com o filtro no navegador), e ela mandaria a
 * lista inteira ao navegador: 3.596 concursos em Educação. Slug que não é
 * uma das 12 áreas é 404, por `areaDoSlug`.
 */

/** Os rótulos curtos das abas, os mesmos da busca (`ListaDeResultados`). */
const ROTULO_DA_ABA: Record<Situacao, string> = {
  abertas: "Abertas",
  previstos: "Previstos",
  encerrados: "Encerrados",
};

function areaDaRota(slug: string): Area {
  const area = areaDoSlug(slug);
  if (!area) notFound();
  return area;
}

export async function generateMetadata(
  props: PageProps<"/areas/[slug]">,
): Promise<Metadata> {
  const area = areaDaRota((await props.params).slug);
  const consulta = lerConsultaDaArea(await props.searchParams);
  const total = (await concursosDaArea(area)).length;

  return {
    title: `Concursos de ${area.nome}`,
    description:
      `${numero(total)} ${total === 1 ? "concurso" : "concursos"} de ${area.nome} (${area.apoio}): ` +
      "abertos, previstos e encerrados, com vagas, salário, taxa e prazo de inscrição " +
      "e o link para o edital original.",
    alternates: { canonical: hrefDaArea(area) },
    // A lista filtrada ou numa página adiante é a mesma lista recortada: o
    // canônico é a área inteira, e o recorte segue sendo seguido.
    robots:
      consulta.situacao || consulta.pagina > 1
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

function abasDaArea(area: Area, consulta: ConsultaDaArea, lista: ListaDaArea): ItemDeAba[] {
  const aba = (situacao: Situacao | null, rotulo: string, total: number): ItemDeAba => ({
    id: situacao ?? "todas",
    rotulo: (
      <>
        {rotulo} <span className="text-tinta-500">{numero(total)}</span>
      </>
    ),
    // Trocar de aba volta à página 1: a página 3 de "Todas" não existe em
    // "Abertas".
    href: hrefDaListaDaArea(area, { situacao, pagina: 1 }),
    ativo: consulta.situacao === situacao,
  });
  return [
    aba(null, "Todas", lista.total),
    ...(Object.keys(ROTULO_DA_ABA) as Situacao[]).map((situacao) =>
      aba(situacao, ROTULO_DA_ABA[situacao], lista.contagens[situacao]),
    ),
  ];
}

export default async function PaginaDaArea(props: PageProps<"/areas/[slug]">) {
  const area = areaDaRota((await props.params).slug);
  const consulta = lerConsultaDaArea(await props.searchParams);
  // Data civil de São Paulo, a mesma de /concursos, /busca e /orgaos.
  const hoje = hojeCivilEmSaoPaulo();
  const [itens, aviso] = await Promise.all([concursosDaArea(area), avisoDoAcervo()]);
  const lista = listaDaArea(itens, consulta, hoje);
  const { pagina } = lista;

  const trilha: Degrau[] = [
    { nome: "Concursos", href: "/concursos" },
    { nome: "Áreas", href: "/areas" },
    { nome: area.nome, href: hrefDaArea(area) },
  ];

  return (
    <div className="conteudo pb-8 md:pb-12">
      <DadosEstruturados
        dados={listaEstruturada(
          `Concursos de ${area.nome}`,
          pagina.total,
          pagina.itens.map((concurso) => ({
            // O mesmo nome de item da lista da home (`src/app/page.tsx`).
            nome: `${concurso.orgao.nome}: ${tituloSemOrgao(concurso.titulo, concurso.orgao)}`,
            href: `/concursos/${concurso.slug}`,
          })),
          (pagina.pagina - 1) * POR_PAGINA_DA_AREA + 1,
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
            valor={numero(lista.contagens.abertas)}
          />
          <CartaoDeFato
            icone="previsto"
            cor="bg-ouro-fundo text-ouro-sinal-texto"
            rotulo="PREVISTOS"
            valor={numero(lista.contagens.previstos)}
          />
          <CartaoDeFato
            icone="lista"
            cor="bg-anil-fundo text-anil-texto"
            rotulo="CONCURSOS"
            valor={numero(lista.total)}
          />
        </div>

        {/* `nav` com nome, para o leitor de tela anunciar o grupo de filtros
            (o `aria-label` do trilho sozinho, numa `div` sem papel, não é
            lido). A rolagem é para a largura do celular, e o `p-1 -m-1` dá
            espaço ao anel de foco, que o `overflow` cortaria rente. */}
        <nav aria-label="Situação" className="-m-1 max-w-[calc(100%+0.5rem)] overflow-x-auto p-1">
          <Abas rotulo="Situação" tamanho="sm" itens={abasDaArea(area, consulta, lista)} />
        </nav>

        <section>
          <h2 className="sr-only">Os concursos desta área</h2>
          {pagina.itens.length > 0 ? (
            <ListaDeConcursos itens={pagina.itens} hoje={hoje} />
          ) : (
            <p className="rounded-cartao bg-cartao p-6 text-sm text-tinta-600 shadow-cartao">
              {listaVaziaDaArea(consulta.situacao)}
            </p>
          )}
        </section>

        {pagina.paginas > 1 && (
          <div className="flex flex-col items-center gap-2">
            <Paginacao
              pagina={pagina.pagina}
              paginas={pagina.paginas}
              hrefDe={(numeroDaPagina) =>
                hrefDaListaDaArea(area, { situacao: consulta.situacao, pagina: numeroDaPagina })
              }
            />
            <p className="text-[0.75rem] text-tinta-600">
              {numero(pagina.total)} concursos, {numero(POR_PAGINA_DA_AREA)} por página
            </p>
          </div>
        )}

        {/* O mesmo aviso da busca e do órgão: esta lista também é só o acervo
            que tem cargo ou evento lido. */}
        {aviso && <AcervoIncompleto aviso={aviso} />}
      </div>
    </div>
  );
}
