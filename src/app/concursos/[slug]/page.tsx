import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { Secao } from "@/components/ui/Secao";
import { Trilha, type Degrau } from "@/components/ui/Trilha";
import { AtosPublicados } from "@/components/concurso/AtosPublicados";
import { Avaliacao } from "@/components/concurso/Avaliacao";
import { CabecalhoDoConcurso } from "@/components/concurso/CabecalhoDoConcurso";
import { Cargos, tituloDosCargos } from "@/components/concurso/Cargos";
import { Cronograma } from "@/components/concurso/Cronograma";
import { Faq, cabecalhoDoFaq, temFaq } from "@/components/concurso/Faq";
import { FatosDoConcurso } from "@/components/concurso/FatosDoConcurso";
import { obterDetalhe } from "@/lib/concursos";
import { fatosDoConcurso } from "@/lib/fatos";
import { dataLonga, hojeEmSaoPaulo, moeda, vagasTexto } from "@/lib/formato";
import { textoDeRodape, tituloComOrgao } from "@/lib/rotulos";
import { nomeCurtoDoOrgao } from "@/lib/orgaos";

/**
 * Página do concurso, versão reduzida.
 *
 * Existe porque um cartão de resultado precisa levar a algum lugar. Mostra o
 * que o resumo já traz; cargos, cronograma completo e histórico de
 * retificação dependem das tabelas que só a API vai expor.
 */
export async function generateMetadata(
  props: PageProps<"/concursos/[slug]">,
): Promise<Metadata> {
  // Na requisição, sempre: o detalhe vem de `obterDetalhe` com `no-store`, e
  // `no-store` dentro de rota que o Next julgou estática é o 500
  // `DYNAMIC_SERVER_USAGE` de produção. Com `generateStaticParams` o build
  // tentaria pré-renderizar os 4.700 concursos para descobrir isso.
  await connection();
  const { slug } = await props.params;
  const concurso = await obterDetalhe(slug);
  if (!concurso) return { title: "Concurso não encontrado" };

  return {
    // `tituloComOrgao` prefixa a sigla, e aqui ela ganha o seu lugar: só
    // 3.034 dos 4.649 órgãos têm sigla, e nos outros 1.615 o título da aba, o
    // `og:title` e o que vai no link compartilhado são o título e mais nada.
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
  // Na requisição, sempre: o detalhe vem de `obterDetalhe` com `no-store`, e
  // `no-store` dentro de rota que o Next julgou estática é o 500
  // `DYNAMIC_SERVER_USAGE` de produção. Com `generateStaticParams` o build
  // tentaria pré-renderizar os 4.700 concursos para descobrir isso.
  await connection();
  const { slug } = await props.params;
  const concurso = await obterDetalhe(slug);
  if (!concurso) notFound();
  if (concurso.slug !== slug) {
    permanentRedirect(`/concursos/${encodeURIComponent(concurso.slug)}`);
  }

  const hoje = new Date();
  // A data civil brasileira, para a linha do tempo: ver `hojeEmSaoPaulo`.
  const hojeCivil = hojeEmSaoPaulo(hoje);

  // Três degraus, e o do meio é o que passou a existir: Concursos > órgão >
  // este concurso. É uma lista só, e `Trilha` desenha a tela e emite o
  // `BreadcrumbList` a partir dela — ver o componente para o defeito que essa
  // regra guarda. O nível do órgão só pode entrar aqui porque agora ele tem
  // endereço.
  //
  // O degrau do órgão leva `nomeCurtoDoOrgao` — a sigla quando existe, o nome
  // quando não (36 órgãos do acervo ainda têm por nome o caminho de hierarquia
  // do Diário). Agora o dado estruturado diz o mesmo, que é o que ele existe
  // para fazer; antes ele mandava `orgao.nome` por extenso enquanto a tela
  // mostrava a sigla. O nome por extenso continua na página, no bloco do selo.
  const trilha: Degrau[] = [
    { nome: "Concursos", href: "/concursos" },
    {
      nome: nomeCurtoDoOrgao(concurso.orgao),
      href: `/orgaos/${concurso.orgao.slug}`,
    },
    { nome: concurso.titulo, href: `/concursos/${concurso.slug}` },
  ];

  return (
    <div className="mx-auto max-w-[880px] px-4 py-5 sm:px-6">
      <Trilha degraus={trilha} />

      {/*
        Uma pilha de blocos, e não seções empilhadas por margem dentro de um
        cartão só. O que separa um bloco do outro é o mesmo degrau que separa
        o cartão da busca da página: fundo do cartão sobre o cinza da página,
        sem borda e sem sombra.

        **A cor do tom mora só na pílula de situação, dentro do cabeçalho.**
        O cabeçalho inteiro é branco, como todo bloco da pilha (desenho novo,
        Task 12); repetir o salmão de "encerra em 3 dias" atrás dele, do
        cronograma, dos cargos e do ato afirmaria quatro vezes a mesma coisa e
        gastaria a única cor forte da tela. Cinza por padrão, cor só onde
        informa.

        Isso também acerta um desencontro que existia: `bg-rebaixada` é o rebaixo
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
        <CabecalhoDoConcurso concurso={concurso} hoje={hoje} />

        <FatosDoConcurso fatos={fatosDoConcurso(concurso)} />

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
            apoio="O ato como saiu no diário oficial, na íntegra. Pode ser o extrato, não o edital completo: o edital com anexos e programa de provas fica no site da banca."
          >
            <AtosPublicados origens={concurso.origens} />
          </Secao>
        )}

        {/* O rodapé também é um bloco, com a mesma sangria lateral e menos
            altura: é uma nota sobre a página, não uma seção dela. */}
        <p className="rounded-cartao bg-cartao px-6 py-5 text-sm leading-6 text-tinta-600 sm:px-8">
          {textoDeRodape(concurso)}
        </p>
      </div>
    </div>
  );
}
