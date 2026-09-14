import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlocoDeNumeros, Cartao, Numero, Selo } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Secao } from "@/components/ui/Secao";
import { AtosPublicados } from "@/components/concurso/AtosPublicados";
import { Avaliacao } from "@/components/concurso/Avaliacao";
import { Cargos, tituloDosCargos } from "@/components/concurso/Cargos";
import { Cronograma } from "@/components/concurso/Cronograma";
import { Faq, cabecalhoDoFaq, temFaq } from "@/components/concurso/Faq";
import { listarSlugs, obterDetalhe } from "@/lib/concursos";
import {
  dataLonga,
  hojeEmSaoPaulo,
  moeda,
  moedaExata,
  numero,
  vagasTexto,
} from "@/lib/formato";
import {
  ROTULO_ESCOLARIDADE,
  linhaDeContexto,
  textoDeRodape,
  tituloComOrgao,
} from "@/lib/rotulos";
import { ESTILO_DO_TOM, rotuloDeSituacao, tomDoConcurso } from "@/lib/situacao";
import { urlAbsoluta } from "@/lib/site";

/**
 * Página do concurso, versão reduzida.
 *
 * Existe porque um cartão de resultado precisa levar a algum lugar. Mostra o
 * que o resumo já traz; cargos, cronograma completo e histórico de
 * retificação dependem das tabelas que só a API vai expor.
 */
export async function generateStaticParams() {
  return (await listarSlugs()).map((slug) => ({ slug }));
}


export async function generateMetadata(
  props: PageProps<"/concursos/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const concurso = await obterDetalhe(slug);
  if (!concurso) return { title: "Concurso não encontrado" };

  return {
    title: tituloComOrgao(concurso.orgao.sigla, concurso.titulo),
    description:
      `${concurso.orgao.nome}. ` +
      `${vagasTexto(concurso.vagas, concurso.cadastroReserva)}` +
      (concurso.salarioAte ? `, salário até ${moeda(concurso.salarioAte)}` : "") +
      (concurso.inscricoesAte
        ? `, inscrições até ${dataLonga(concurso.inscricoesAte)}.`
        : "."),
    alternates: { canonical: `/concursos/${concurso.slug}` },
  };
}

export default async function PaginaDoConcurso(
  props: PageProps<"/concursos/[slug]">,
) {
  const { slug } = await props.params;
  const concurso = await obterDetalhe(slug);
  if (!concurso) notFound();

  const hoje = new Date();
  // A data civil brasileira, para a linha do tempo: ver `hojeEmSaoPaulo`.
  const hojeCivil = hojeEmSaoPaulo(hoje);
  const tom = tomDoConcurso(concurso, hoje);
  const estilo = ESTILO_DO_TOM[tom];

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
        name: tituloComOrgao(concurso.orgao.sigla, concurso.titulo),
        item: urlAbsoluta(`/concursos/${concurso.slug}`),
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
        <Link href="/concursos" className="underline underline-offset-4 hover:text-tinta-900">
          Concursos
        </Link>
        <span aria-hidden="true"> / </span>
        {/* Sem sigla, o nome do órgão — que no acervo do engine ainda é o
            caminho de hierarquia do Diário, daí o corte em uma linha. */}
        <span className="inline-block max-w-[40ch] truncate align-bottom">
          {concurso.orgao.sigla ?? concurso.orgao.nome}
        </span>
      </nav>

      {/*
        Uma pilha de blocos, e não seções empilhadas por margem dentro de um
        cartão só. O que separa um bloco do outro é o mesmo degrau que separa
        o cartão da busca da página: fundo do cartão sobre o cinza da página,
        sem borda e sem sombra.

        **Só o primeiro bloco é pintado pelo tom.** O fundo colorido é o sinal
        de situação, e a situação é um fato do concurso, não de cada seção:
        repetir o salmão de "encerra em 3 dias" atrás do cronograma, dos
        cargos e do ato afirmaria quatro vezes a mesma coisa e gastaria a
        única cor forte da tela. Cinza por padrão, cor só onde informa.

        Isso também acerta um desencontro que existia: `bg-bloco` é o rebaixo
        de dentro do cartão branco, e dentro do cartão `encerrado` ele ficava
        mais CLARO que o fundo, então a lista de cargos parecia levantada em
        vez de rebaixada. Com cada seção no seu bloco branco, o rebaixo volta
        a rebaixar.

        A pilha não inventa um terceiro nível de superfície: continuam sendo
        página < cartão < bloco, os mesmos três de `globals.css`. O que mudou
        foi quantos cartões existem, não quantos degraus.

        **O rótulo de cada seção mora fora do seu bloco** (`Secao`), e é por
        isso que o vão aqui dobrou de 12 para 24px: ele deixou de separar duas
        caixas e passou a separar um assunto do título do assunto seguinte.
        Dentro da `Secao`, o título fica a 8px do cartão que ele rotula — um
        terço do vão de fora, que é o que faz o título pertencer ao bloco de
        baixo em vez de flutuar entre os dois. Os dois blocos sem título (o do
        órgão e a nota de rodapé) entram na mesma pilha e usam o mesmo vão.
      */}
      <div className="flex flex-col gap-6">
        <Cartao tom={tom} as="article" className="p-6 sm:p-8">
          <header className="flex items-start gap-4">
            <Selo sigla={concurso.orgao.sigla} tom={tom} />
            <div className="min-w-0">
              <h1 className="font-titulo text-[21px] leading-8 font-semibold tracking-[-0.01em] text-balance">
                {concurso.orgao.nome}
              </h1>
              <p className={`mt-1 text-sm ${estilo.apoio}`}>
                {linhaDeContexto(concurso.orgao)}
              </p>
            </div>
          </header>

          <p className="mt-5 text-lg font-semibold text-tinta-900">
            {concurso.titulo}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Etiqueta tom={tom} comPonto>
              {rotuloDeSituacao(concurso, hoje)}
            </Etiqueta>
            {concurso.escolaridades.map((escolaridade) => (
              <Etiqueta key={escolaridade}>
                {ROTULO_ESCOLARIDADE[escolaridade]}
              </Etiqueta>
            ))}
            {concurso.banca && <Etiqueta>Banca: {concurso.banca.nome}</Etiqueta>}
          </div>

          <BlocoDeNumeros className="mt-6 grid-cols-2 sm:grid-cols-4">
            <Numero rotulo="Vagas">
              {concurso.vagas === null ? "a definir" : numero(concurso.vagas)}
            </Numero>
            <Numero rotulo="Salário até">
              {concurso.salarioAte === null
                ? "a definir"
                : moeda(concurso.salarioAte)}
            </Numero>
            <Numero rotulo="Taxa">
              {concurso.taxaInscricao === null
                ? "a definir"
                : moedaExata(concurso.taxaInscricao)}
            </Numero>
            <Numero rotulo="Cadastro reserva">
              {concurso.cadastroReserva ? "sim" : "não"}
            </Numero>
          </BlocoDeNumeros>
        </Cartao>

        {/* O cronograma não some quando está vazio: 170 concursos do acervo
            (3,7%) não têm data nenhuma lida, e nesses o bloco é o que diz que
            ninguém achou data — some ele, e a página afirma por omissão que o
            concurso não tem cronograma. O título fica com o bloco nos dois
            casos, então não há título órfão. */}
        <Secao
          titulo="Cronograma"
          apoio="Cada data com a procedência: de qual ato publicado ela foi lida."
        >
          {concurso.cronograma.length > 0 ? (
            <Cronograma eventos={concurso.cronograma} hoje={hojeCivil} />
          ) : (
            <p className="text-sm text-tinta-600">
              Nenhuma data foi lida do ato publicado até agora.
              {concurso.previstoPara
                ? ` O concurso é de ${concurso.previstoPara}.`
                : ""}
            </p>
          )}
        </Secao>

        {/* Aqui, sim, o bloco inteiro pode não existir — e com ele o título.
            Um "Cargos" sobre nada seria o título órfão que o cronograma vazio
            não é: não há o que dizer sobre cargo que o ato não listou, e a
            linha de rodapé da página já conta o que falta. */}
        {concurso.cargos.length > 0 && (
          <Secao titulo={tituloDosCargos(concurso.cargos)}>
            <Cargos cargos={concurso.cargos} />
          </Secao>
        )}

        {/* O FAQ antes do texto do ato, e não depois: ele é a leitura do
            documento, e o documento é a evidência atrás dela. Cada resposta
            tem link para o ato que a produziu, logo abaixo. */}
        {temFaq(concurso.origens) && (
          <Secao {...cabecalhoDoFaq(concurso.origens)}>
            <Faq origens={concurso.origens} />
          </Secao>
        )}

        {/* A avaliação do concurso, aqui e em nenhum outro ponto da página:
            um voto por concurso por pessoa, decisão do parceiro humano. O
            porquê deste ponto e não do rodapé está medido no comentário do
            componente — em resumo, é o fim da LEITURA. O que vem abaixo,
            quando vem, é o ato como saiu no diário: a fonte para conferir,
            não mais coisa nossa para avaliar. Pôr o controle depois dele o
            empurraria para baixo da dobra em todos os concursos do acervo,
            em vez de metade. */}
        <Avaliacao slug={concurso.slug} />

        {concurso.origens.length > 0 && (
          <Secao
            titulo={
              concurso.origens.length === 1
                ? "O ato publicado"
                : "Os atos publicados"
            }
            apoio="O ato como saiu no diário oficial, na íntegra — que pode ser o extrato, não o edital completo. O edital com anexos e programa de provas fica no site da banca."
          >
            <AtosPublicados origens={concurso.origens} />
          </Secao>
        )}

        {/* O rodapé também é um bloco, com a mesma sangria lateral e menos
            altura: é uma nota sobre a página, não uma seção dela. */}
        <p className="rounded-caixa bg-cartao px-6 py-5 text-sm leading-6 text-tinta-600 sm:px-8">
          {textoDeRodape(concurso)}
        </p>
      </div>
    </div>
  );
}
