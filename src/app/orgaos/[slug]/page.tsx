import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Selo } from "@/components/ui/Cartao";
import { Paginacao } from "@/components/ui/Paginacao";
import { Trilha, type Degrau } from "@/components/ui/Trilha";
import { CartaoDeFato } from "@/components/concurso/FatosDoConcurso";
import { ListaDeConcursos } from "@/components/concurso/ListaDeConcursos";
import { AcervoIncompleto } from "@/components/home/BlocoAlerta";
import { avisoDoAcervo, obterOrgao } from "@/lib/concursos";
import { ordenar } from "@/lib/consulta";
import { nomeCurtoDoOrgao, resumoDoOrgao } from "@/lib/orgaos";
import { hojeCivilEmSaoPaulo, numero } from "@/lib/formato";
import { linhaDeContexto } from "@/lib/rotulos";
import { tomDoConcurso } from "@/lib/situacao";

/**
 * A página do órgão: o nível acima do concurso.
 *
 * Ela existe porque a hierarquia pedida (órgão acima, concurso abaixo) só
 * é hierarquia se o nível de cima for um lugar. Sem ela, a trilha da página
 * do concurso nomeia o órgão e não leva a lugar nenhum, que é texto com cara
 * de link.
 *
 * **Não há rota de órgão na API.** A lista sai do mesmo `/acervo` que a
 * busca lê, e a medição que sustenta essa decisão está no cabeçalho de
 * `src/lib/orgaos.ts`. O que ela garante, e que uma rota nova não garantiria,
 * é que esta página liste exatamente o que a busca lista: é a mesma lista,
 * filtrada, não uma segunda consulta com a mesma intenção.
 *
 * **Sem `generateStaticParams`**, como a página do concurso: esta lê
 * `?pagina=`, como a busca, e uma página que depende da query string não é
 * prerenderizável por parâmetro de rota. São 466 endereços e eles rendem sob
 * demanda, como `/concursos` já faz.
 */

/** O mesmo tamanho de página da busca: lista de concurso se lê igual aqui. */
const POR_PAGINA = 20;

function paginaPedida(bruto: string | string[] | undefined): number {
  const texto = Array.isArray(bruto) ? bruto[0] : bruto;
  const pagina = Number(texto);
  return Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
}

export async function generateMetadata(
  props: PageProps<"/orgaos/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const encontrado = await obterOrgao(slug);
  if (!encontrado) return { title: "Órgão não encontrado" };

  const { orgao, concursos } = encontrado;
  const sigla = orgao.sigla?.trim();

  return {
    title: sigla ? `${orgao.nome} (${sigla})` : orgao.nome,
    description:
      `Concursos públicos ${sigla ? `do ${sigla}, ` : "do "}${orgao.nome}. ` +
      `${resumoDoOrgao(concursos.length)} Vagas, salário, taxa e prazo de ` +
      "inscrição de cada edital, com o link para o documento original.",
    alternates: { canonical: `/orgaos/${orgao.slug}` },
    // Um órgão de um concurso só tem, nesta página, o cartão de um concurso
    // que já tem página própria e indexada. Duas URLs indexáveis para o mesmo
    // conteúdo é a duplicata que o `robots` existe para evitar, e é a mesma
    // regra que `/concursos` aplica à busca por texto livre. O endereço
    // continua valendo, continua sendo seguido, e volta a ser indexável
    // sozinho no dia do segundo concurso: dos 122 órgãos que tinham um só há
    // 30 dias, 36 já têm dois ou mais.
    robots:
      concursos.length === 1
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

export default async function PaginaDoOrgao(
  props: PageProps<"/orgaos/[slug]">,
) {
  const { slug } = await props.params;
  const encontrado = await obterOrgao(slug);
  // 404 quando nenhum concurso do acervo nomeia este órgão. O porquê de não
  // ser uma página vazia está em `acharOrgao`: lista vazia com título afirma
  // "este órgão não tem concurso", e o que há é "nenhum foi lido até aqui".
  if (!encontrado) notFound();

  const { orgao, concursos } = encontrado;
  // Data civil de São Paulo, a mesma de /concursos e /busca: "aberto" e
  // "urgente" não podem depender do fuso de quem está lendo.
  const hoje = hojeCivilEmSaoPaulo();
  const aviso = await avisoDoAcervo();

  // A mesma ordem padrão da busca: o que ainda dá para fazer primeiro, o que
  // já encerrou depois. Numa lista que é a história de um órgão, a alternativa
  // seria a ordem cronológica, e ela poria o edital de 2024 acima do que
  // fecha inscrição na semana que vem.
  const ordenados = ordenar(concursos, "encerrando", hoje);
  const paginas = Math.max(Math.ceil(ordenados.length / POR_PAGINA), 1);
  const pagina = Math.min(paginaPedida((await props.searchParams).pagina), paginas);
  const itens = ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // Os três fatos do cabeçalho: abertos (inclui os urgentes, que também têm
  // inscrição aberta), previstos e o total, na mesma caixa de
  // `FatosDoConcurso` (`CartaoDeFato`, a forma genérica dela).
  const abertos = ordenados.filter((concurso) => {
    const tom = tomDoConcurso(concurso, hoje);
    return tom === "aberto" || tom === "urgente";
  }).length;
  const previstos = ordenados.filter((concurso) => tomDoConcurso(concurso, hoje) === "previsto").length;

  // Dois degraus: Concursos > este órgão. A mesma lista desenha a tela e o
  // `BreadcrumbList`: ver `Trilha` para o defeito que essa regra guarda.
  //
  // O degrau leva `nomeCurtoDoOrgao`, e agora o dado estruturado leva também.
  // Antes ele mandava `orgao.nome` por extenso enquanto a tela mostrava a
  // sigla, que é a mesma classe de divergência de origem, só que dentro de um
  // degrau em vez de entre dois. O nome por extenso é o `h1` logo abaixo.
  const trilha: Degrau[] = [
    { nome: "Concursos", href: "/concursos" },
    { nome: nomeCurtoDoOrgao(orgao), href: `/orgaos/${orgao.slug}` },
  ];

  return (
    <div className="conteudo pb-8 md:pb-12">
      <Trilha degraus={trilha} />

      <div className="flex flex-col gap-6">
        {/* O mesmo desenho do cabeçalho do concurso (`CabecalhoDoConcurso`):
            o selo grande, o `h1` e a linha de contexto. O `h1` aqui é o nome
            do órgão, não o de um cargo, e o acervo tem nome de órgão de até
            90 caracteres, então o tamanho fica mais contido que o do
            concurso (30/48px) para não estourar a 360px. */}
        <header className="rounded-painel bg-cartao p-5 shadow-cartao md:px-10 md:py-9">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="md:hidden">
              <Selo sigla={orgao.sigla} tamanho={44} />
            </div>
            <div className="hidden md:block">
              <Selo sigla={orgao.sigla} tamanho={72} />
            </div>
            <div className="min-w-0">
              <h1 className="font-titulo text-[22px] leading-[1.15] font-bold tracking-[-0.02em] break-words text-balance md:text-[32px] md:leading-[1.1] md:tracking-[-0.025em]">
                {orgao.nome}
              </h1>
              <p className="mt-1.5 text-sm text-tinta-600 md:text-[15px]">
                {linhaDeContexto(orgao)}
              </p>
            </div>
          </div>

          {/* A frase antes da lista, e não só o número da caixa "CONCURSOS"
              logo abaixo: com um concurso só (195 dos 466 órgãos), o que a página
              tem a dizer é justamente que ela não é um índice. Ver
              `resumoDoOrgao`. */}
          <p className="mt-5 text-sm leading-6 text-tinta-600 md:mt-6">
            {resumoDoOrgao(ordenados.length)}
          </p>
        </header>

        {/* Os fatos numa grade própria, fora do cartão do cabeçalho, como
            na página do concurso (`Concurso.dc.html:90`): dentro dele eram
            cartão sobre cartão, só com a sombra de baixo, e pareciam
            quebrados. */}
        <div className="-mt-2 grid grid-cols-3 gap-2 md:gap-3">
          <CartaoDeFato
            icone="aberto"
            cor="bg-verde-fundo text-verde-texto"
            rotulo="ABERTOS"
            valor={numero(abertos)}
          />
          <CartaoDeFato
            icone="previsto"
            cor="bg-ouro-fundo text-ouro-sinal-texto"
            rotulo="PREVISTOS"
            valor={numero(previstos)}
          />
          <CartaoDeFato
            icone="lista"
            cor="bg-anil-fundo text-anil-texto"
            rotulo="CONCURSOS"
            valor={numero(ordenados.length)}
          />
        </div>

        <section>
          <h2 className="sr-only">
            {ordenados.length === 1
              ? "O concurso deste órgão"
              : "Os concursos deste órgão"}
          </h2>
          {/* `semOrgao`: o órgão é o `h1` desta página. Repeti-lo em cada
              linha ou cartão o escreveria de novo, ver `orgaoECargo`. */}
          <ListaDeConcursos itens={itens} hoje={hoje} semOrgao />
        </section>

        {paginas > 1 && (
          <div className="flex flex-col items-center gap-2">
            <Paginacao
              pagina={pagina}
              paginas={paginas}
              hrefDe={(numeroDaPagina) =>
                numeroDaPagina > 1
                  ? `/orgaos/${orgao.slug}?pagina=${numeroDaPagina}`
                  : `/orgaos/${orgao.slug}`
              }
            />
            <p className="text-[12px] text-tinta-600">
              {numero(ordenados.length)} concursos, {numero(POR_PAGINA)} por
              página
            </p>
          </div>
        )}

        {/* O mesmo aviso da busca, pela mesma razão: esta lista também é só o
            acervo que tem cargo ou evento lido, e sem ele a página afirma por
            omissão que o órgão não tem mais nada no diário. */}
        {aviso && <AcervoIncompleto aviso={aviso} />}
      </div>
    </div>
  );
}
