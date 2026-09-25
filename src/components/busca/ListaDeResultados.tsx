import Link from "next/link";
import type { ItemDeAba } from "@/components/ui/Abas";
import { ColunaFiltros } from "@/components/busca/ColunaFiltros";
import { LinkDaConsulta } from "@/components/busca/LinkDaConsulta";
import { RegistroDaBusca } from "@/components/busca/RegistroDaBusca";
import { ListaDeConcursos } from "@/components/concurso/ListaDeConcursos";
import { AcervoIncompleto } from "@/components/home/BlocoAlerta";
import { Rotulo } from "@/components/ui/Etiqueta";
import { Paginacao } from "@/components/ui/Paginacao";
import type {
  AvisoDoAcervo,
  ContagensDeFaceta,
  DimensoesDoAcervo,
  Pagina,
} from "@/lib/concursos";
import { ORDENS, SITUACOES, type Situacao } from "@/lib/consulta";
import { chipsAtivos } from "@/lib/filtrosAtivos";
import { numero } from "@/lib/formato";
import {
  urlDaBusca,
  urlSemFiltros,
  type ConsultaDaUrl,
} from "@/lib/parametros";
import { avisoDeFiltroSemDado } from "@/lib/rotulos";

/** Os rótulos curtos da aba de situação: cabem numa aba a 360px, ao contrário
 * de `SITUACOES` (`lib/consulta.ts`), que é o texto do chip e do rótulo do
 * filtro (mais longo, "Inscrições abertas") e continua o mesmo. */
const ROTULO_DA_ABA: Record<string, string> = {
  abertas: "Abertas",
  previstos: "Previstos",
  encerrados: "Encerrados",
};

/** `OpcaoDeFaceta.valor` é `string` (o mesmo tipo serve escolaridade e banca);
 * esta função é que garante, sem `as`, que o valor é mesmo uma `Situacao`
 * antes de entrar num campo que só aceita as três. */
function ehSituacao(valor: string): valor is Situacao {
  return valor in SITUACOES;
}

/**
 * O mesmo trilho de `Abas` (`Main.dc.html:195-200`), com `LinkDaConsulta` no
 * lugar do `next/link` que `Abas` usa por dentro.
 *
 * Não dá para usar `Abas` direto aqui: em `/busca/<slug>` filtrar por
 * situação precisa continuar sendo `history.pushState`, e não uma navegação
 * de verdade. É a mesma razão de existir de `LinkDaConsulta` (buscar de novo
 * o RSC do termo a cada clique, só para trocar a query, media 144 KB gzip
 * para "professor"). Todo item aqui tem `href`, então não há o ramo de botão
 * sem link que `Abas` também desenha.
 */
function TrilhoDeSituacao({ rotulo, itens }: { rotulo: string; itens: ItemDeAba[] }) {
  return (
    <div aria-label={rotulo} className="inline-flex items-center gap-1 rounded-[12px] bg-rebaixada p-1">
      {itens.map((item) => (
        <LinkDaConsulta
          key={item.id}
          href={item.href ?? "#"}
          aria-current={item.ativo ? "page" : undefined}
          className={`flex h-8 items-center justify-center gap-1.5 rounded-[9px] px-3 text-[13px] transition-colors ${
            item.ativo
              ? "bg-cartao font-semibold text-tinta-900 shadow-aba"
              : "font-medium text-tinta-600 hover:text-tinta-900"
          }`}
        >
          {item.rotulo}
        </LinkDaConsulta>
      ))}
    </div>
  );
}

/**
 * As situações como abas, no topo da lista (`Main.dc.html:195-200`, o mesmo
 * trilho de escolaridade da home). Clicar numa aba troca a situação por só
 * ela (é o que o `href` de cada uma pede, sempre um valor só), e "Todas"
 * volta a nenhuma. É a mesma simplificação que a home já faz para
 * escolaridade.
 *
 * **Marcar, porém, não é o mesmo que "só uma pode estar marcada".** A coluna
 * de filtros continua permitindo mais de uma situação ao mesmo tempo (é
 * multiescolha, um quadradinho por opção, e a URL aceita `?situacao=` várias
 * vezes), e os chips de `chipsAtivos` já mostram cada uma. Com duas
 * situações na URL e só a aba de uma marcada (ou nenhuma), o trilho dizia
 * "nenhum filtro" ou "só este" enquanto a lista de baixo respondia por dois,
 * Ruling R26. Por isso `ativo` aqui é "esta situação está entre as da
 * URL", não "é a única": toda aba cujo valor apareça em `consulta.situacoes`
 * fica marcada, e "Todas" só quando a lista está vazia.
 */
export function abasDeSituacao(consulta: ConsultaDaUrl, contagens: ContagensDeFaceta): ItemDeAba[] {
  const total = contagens.situacoes.reduce((soma, opcao) => soma + opcao.total, 0);
  const nenhuma = consulta.situacoes.length === 0;

  return [
    {
      id: "todas",
      rotulo: (
        <>
          Todas <span className="text-tinta-500">{numero(total)}</span>
        </>
      ),
      href: urlDaBusca(consulta, { situacoes: [], pagina: 1 }),
      ativo: nenhuma,
    },
    ...contagens.situacoes
      .filter((opcao): opcao is typeof opcao & { valor: Situacao } => ehSituacao(opcao.valor))
      .map((opcao) => {
        const valor = opcao.valor;
        return {
          id: valor,
          rotulo: (
            <>
              {ROTULO_DA_ABA[valor] ?? opcao.rotulo}{" "}
              <span className="text-tinta-500">{numero(opcao.total)}</span>
            </>
          ),
          href: urlDaBusca(consulta, { situacoes: [valor], pagina: 1 }),
          ativo: consulta.situacoes.includes(valor),
        };
      }),
  ];
}

/**
 * A lista de uma busca: título, contagem, ordenação, chips, cartões,
 * paginação e o aviso do acervo, com a coluna de filtros ao lado.
 *
 * Sem `"use client"` e sem hook, e não é `async`: o servidor a desenha em
 * `/concursos`, e o navegador em `/busca/<slug>` (`ResultadosDaBusca`). Tudo
 * o que ela mostra chega pronto por prop.
 */
export function ListaDeResultados({
  consulta,
  titulo,
  resultado,
  contagens,
  aviso,
  dimensoes,
  hoje,
}: {
  consulta: ConsultaDaUrl;
  titulo: string;
  resultado: Pagina;
  contagens: ContagensDeFaceta;
  aviso: AvisoDoAcervo | null;
  dimensoes: DimensoesDoAcervo;
  hoje: Date;
}) {
  const chips = chipsAtivos(consulta);
  const semDado = avisoDeFiltroSemDado(consulta, dimensoes);
  // O chip do termo não conta como filtro: com `q`, `chipsAtivos` sempre o
  // devolve, e contar só `chips.length` nunca daria zero numa busca.
  const soOTermo = chips.every((chip) => chip.chave === "q");
  // O rótulo do cabeçalho: "BUSCA" para quem digitou um termo, "INSCRIÇÕES
  // ABERTAS" para quem chegou por filtro ou por `/concursos` puro, a mesma
  // dupla de rótulos que a home usa para a tabela de abertos.
  const ehBusca = Boolean(consulta.q);

  return (
    <>
      {/*
        Não desenha nada: só grava o termo na memória do navegador quando a
        busca deu resultado. Mora aqui, e não dentro da `BarraBusca`, porque
        quem sabe o desfecho é esta lista: a barra está no cabeçalho de toda
        página, onde ninguém tem esse número.

        `filtrada` sai de `chips`, que é a mesma lista de filtros ativos que a
        tela desenha logo abaixo, sem o chip do termo (`soOTermo`): sem uma
        segunda contagem para divergir da primeira. Ela existe porque zero com filtro não é culpa do termo:
        "analista" no Acre devolve zero por causa do Acre, e esquecer o termo
        aí seria punir o inocente.
      */}
      <RegistroDaBusca
        termo={consulta.q}
        resultados={resultado.total}
        filtrada={!soOTermo}
      />

      <div className="grid gap-6 px-4 py-12 md:px-[112px] lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <ColunaFiltros
          consulta={consulta}
          contagens={contagens}
          total={resultado.total}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            {/* `min-w-0` para o `break-words` do `h1` ter efeito: item de flex
                tem `min-width: auto`, e `overflow-wrap: break-word` não muda a
                largura mínima intrínseca de um bloco, ela continua sendo a da
                maior palavra. Sem os dois juntos o título não quebra, ele
                estica a coluna. O título da busca é `q` quando há texto livre,
                então ele é texto de URL: medido a 375px, `?q=` com o edital
                "11/2026/SEGAP/COALEP/CGGP/DAGES-FUNAI" (título real do
                acervo, do tipo que se cola na busca) dava 36px de rolagem
                lateral. */}
            <div className="min-w-0">
              <Rotulo icone={ehBusca ? "busca" : "aberto"} tom={ehBusca ? "anil" : "aberto"} className="mb-2.5">
                {ehBusca ? "BUSCA" : "INSCRIÇÕES ABERTAS"}
              </Rotulo>
              <h1 className="font-titulo text-[26px] leading-[1.08] font-bold tracking-[-0.025em] break-words md:text-[40px] md:leading-[1.05] md:tracking-[-0.03em]">
                {titulo}
              </h1>
              <p className="mt-2 text-[12px] text-tinta-600">
                <strong className="numero font-medium text-tinta-900">
                  {numero(resultado.total)}
                </strong>{" "}
                {resultado.total === 1
                  ? "concurso encontrado"
                  : "concursos encontrados"}
              </p>
              {/* Zero resultados por falta de dado nosso não é zero
                  resultados. Quem marcou "Espírito Santo" e recebeu uma lista
                  vazia conclui que não há concurso no estado dele. */}
              {semDado && (
                <p className="mt-1.5 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
                  {semDado}
                </p>
              )}
            </div>

            <nav
              aria-label="Ordenação"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="text-[12px] text-tinta-500">Ordenar por</span>
              {(Object.keys(ORDENS) as (keyof typeof ORDENS)[]).map((chave) => (
                <LinkDaConsulta
                  key={chave}
                  href={urlDaBusca(consulta, { ordem: chave, pagina: 1 })}
                  aria-current={chave === consulta.ordem ? "true" : undefined}
                  className={`rounded-controle px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    chave === consulta.ordem
                      ? "bg-tinta-900 text-cartao"
                      : "bg-rebaixada text-tinta-900 hover:bg-linha"
                  }`}
                >
                  {ORDENS[chave]}
                </LinkDaConsulta>
              ))}
            </nav>
          </div>

          {/* As situações, em aba, no topo da lista: `ColunaFiltros` não tem
              mais o grupo de checkbox de situação, que "virou" isto. */}
          <div className="mt-4 overflow-x-auto">
            <TrilhoDeSituacao rotulo="Situação" itens={abasDeSituacao(consulta, contagens)} />
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <LinkDaConsulta
                  key={chip.chave}
                  href={chip.href}
                  aria-label={`Remover filtro ${chip.rotulo}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-[5px] bg-acao px-2.5 py-1 text-xs font-semibold text-acao-texto hover:bg-acao-hover"
                >
                  {/* O chip de `q` carrega texto de URL, do mesmo tamanho que
                      o do `h1` acima: sem corte ele passava dos 375px sozinho.
                      O rótulo inteiro continua no `aria-label` do link. */}
                  <span className="min-w-0 truncate">{chip.rotulo}</span>
                  <span aria-hidden="true" className="shrink-0 text-white/70">
                    ×
                  </span>
                </LinkDaConsulta>
              ))}
              <LinkDaConsulta
                href={urlSemFiltros(consulta)}
                className="px-2 text-xs font-medium text-tinta-600 underline underline-offset-4 hover:text-tinta-900"
              >
                Limpar filtros
              </LinkDaConsulta>
            </div>
          )}

          {resultado.itens.length === 0 ? (
            <div className="mt-5 rounded-cartao bg-cartao px-6 py-12 text-center">
              {/* Sem filtro nenhum, o zero é do termo, e sugerir tirar o
                  estado ou a escolaridade seria mandar mexer no que não
                  está marcado. */}
              {consulta.q && soOTermo ? (
                <>
                  <p className="font-titulo text-lg font-semibold">
                    Nenhum concurso encontrado para esta busca
                  </p>
                  <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-6 text-tinta-600">
                    Tente outra palavra, ou crie um alerta e avisamos quando
                    sair um edital que casa com ela.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-titulo text-lg font-semibold">
                    Nenhum concurso com esses filtros
                  </p>
                  <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-6 text-tinta-600">
                    Tente remover o estado ou a escolaridade. Se o concurso que
                    você procura ainda não saiu, crie um alerta e avisamos quando o
                    edital for publicado.
                  </p>
                </>
              )}
              <Link
                href="/concursos"
                className="mt-4 inline-flex h-10 items-center rounded-controle bg-acao px-4 text-sm font-semibold text-acao-texto hover:bg-acao-hover"
              >
                Ver todos os concursos
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <ListaDeConcursos itens={resultado.itens} hoje={hoje} ufDoFiltro={consulta.uf} />
            </div>
          )}

          {resultado.paginas > 1 && (
            <div className="mt-8 flex justify-center">
              <Paginacao
                pagina={resultado.pagina}
                paginas={resultado.paginas}
                hrefDe={(numeroDaPagina) =>
                  urlDaBusca(consulta, { pagina: numeroDaPagina })
                }
              />
            </div>
          )}

          {/* Aqui a contagem de resultados aparece escrita, e é aqui que o
              silêncio sobre o resto do acervo mais engana: "12 concursos
              encontrados" sobre um acervo de 4.838, dos quais 189 estão fora
              da lista por motivos diferentes entre si. */}
          {aviso && (
            <div className="mt-6">
              <AcervoIncompleto aviso={aviso} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
