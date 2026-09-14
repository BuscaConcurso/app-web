import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cartao, Selo } from "@/components/ui/Cartao";
import { Paginacao } from "@/components/ui/Paginacao";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { AcervoIncompleto } from "@/components/home/BlocoAlerta";
import { avisoDoAcervo, obterOrgao } from "@/lib/concursos";
import { ordenar } from "@/lib/consulta";
import { nomeCurtoDoOrgao, resumoDoOrgao } from "@/lib/orgaos";
import { numero } from "@/lib/formato";
import { linhaDeContexto } from "@/lib/rotulos";
import { urlAbsoluta } from "@/lib/site";

/**
 * A página do órgão: o nível acima do concurso.
 *
 * Ela existe porque a hierarquia pedida — órgão acima, concurso abaixo — só
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
 * **Sem `generateStaticParams`**, ao contrário da página do concurso: esta lê
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
      `Concursos públicos ${sigla ? `do ${sigla} — ` : "do "}${orgao.nome}. ` +
      `${resumoDoOrgao(concursos.length)} Vagas, salário, taxa e prazo de ` +
      "inscrição de cada edital, com o link para o documento original.",
    alternates: { canonical: `/orgaos/${orgao.slug}` },
    // Um órgão de um concurso só tem, nesta página, o cartão de um concurso
    // que já tem página própria e indexada. Duas URLs indexáveis para o mesmo
    // conteúdo é a duplicata que o `robots` existe para evitar — e é a mesma
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
  const hoje = new Date();
  const aviso = await avisoDoAcervo();

  // A mesma ordem padrão da busca: o que ainda dá para fazer primeiro, o que
  // já encerrou depois. Numa lista que é a história de um órgão, a alternativa
  // seria a ordem cronológica — e ela poria o edital de 2024 acima do que
  // fecha inscrição na semana que vem.
  const ordenados = ordenar(concursos, "encerrando", hoje);
  const paginas = Math.max(Math.ceil(ordenados.length / POR_PAGINA), 1);
  const pagina = Math.min(paginaPedida((await props.searchParams).pagina), paginas);
  const itens = ordenados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const trilha = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Concursos",
        item: urlAbsoluta("/concursos"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: orgao.nome,
        item: urlAbsoluta(`/orgaos/${orgao.slug}`),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[880px] px-4 py-5 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(trilha).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Trilha" className="mb-5 text-[12px] text-tinta-600">
        <Link
          href="/concursos"
          className="underline underline-offset-4 hover:text-tinta-900"
        >
          Concursos
        </Link>
        <span aria-hidden="true"> / </span>
        {/* O nível atual, e por isso não é link. É também onde a sigla
            aparece como texto de verdade: o `Selo` é `aria-hidden`, então sem
            esta linha a sigla não existiria para quem ouve a página. */}
        <span aria-current="page" className="text-tinta-900">
          {nomeCurtoDoOrgao(orgao)}
        </span>
      </nav>

      <div className="flex flex-col gap-6">
        <Cartao as="header" className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Selo sigla={orgao.sigla} />
            <div className="min-w-0">
              <h1 className="font-titulo text-[21px] leading-8 font-semibold tracking-[-0.01em] text-balance">
                {orgao.nome}
              </h1>
              <p className="mt-1 text-sm text-tinta-600">
                {linhaDeContexto(orgao)}
              </p>
            </div>
          </div>
          {/* A frase antes da lista, e não um contador ao lado do título: com
              um concurso só — 195 dos 466 órgãos — o que a página tem a dizer
              é justamente que ela não é um índice. Ver `resumoDoOrgao`. */}
          <p className="mt-5 text-sm leading-6 text-tinta-600">
            {resumoDoOrgao(ordenados.length)}
          </p>
        </Cartao>

        <section>
          <h2 className="sr-only">
            {ordenados.length === 1
              ? "O concurso deste órgão"
              : "Os concursos deste órgão"}
          </h2>
          <ul className="grid gap-2">
            {itens.map((concurso) => (
              // `min-w-0` pelo mesmo motivo da busca: item de grid tem
              // `min-width: auto`, e uma etiqueta que não encolhe estica a
              // lista e a página inteira.
              <li key={concurso.slug} className="min-w-0">
                <CartaoConcurso concurso={concurso} hoje={hoje} />
              </li>
            ))}
          </ul>
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
