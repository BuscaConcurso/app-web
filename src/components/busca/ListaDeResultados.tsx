import Link from "next/link";
import { ColunaFiltros } from "@/components/busca/ColunaFiltros";
import { LinkDaConsulta } from "@/components/busca/LinkDaConsulta";
import { RegistroDaBusca } from "@/components/busca/RegistroDaBusca";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { AcervoIncompleto } from "@/components/home/BlocoAlerta";
import { Paginacao } from "@/components/ui/Paginacao";
import type {
  AvisoDoAcervo,
  ContagensDeFaceta,
  DimensoesDoAcervo,
  Pagina,
} from "@/lib/concursos";
import { ORDENS } from "@/lib/consulta";
import { chipsAtivos } from "@/lib/filtrosAtivos";
import { numero } from "@/lib/formato";
import {
  urlDaBusca,
  urlSemFiltros,
  type ConsultaDaUrl,
} from "@/lib/parametros";
import { avisoDeFiltroSemDado } from "@/lib/rotulos";

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

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start">
        <ColunaFiltros
          consulta={consulta}
          contagens={contagens}
          total={resultado.total}
        />

        <div className="min-w-0 flex-1">
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
              <h1 className="font-titulo text-[21px] leading-8 font-semibold tracking-[-0.01em] break-words">
                {titulo}
              </h1>
              <p className="mt-1 text-[12px] text-tinta-600">
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
                      ? "bg-inverso text-inverso-texto"
                      : "bg-rebaixada text-tinta-800 hover:bg-tinta-200"
                  }`}
                >
                  {ORDENS[chave]}
                </LinkDaConsulta>
              ))}
            </nav>
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
            <div className="mt-5 rounded-caixa bg-cartao px-6 py-12 text-center">
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
            <ul className="mt-4 grid gap-2 xl:grid-cols-2">
              {resultado.itens.map((concurso) => (
                // `min-w-0`: item de grid tem `min-width: auto`, que vale o
                // min-content do conteúdo, então uma etiqueta que se recusa
                // a encolher (`whitespace-nowrap`) estica a célula, a lista e
                // a página. Medido a 375px: 2 dos 15 nomes de banca do acervo
                // passam dos 319px úteis da fileira e davam scroll horizontal
                // na busca. O corte é da `Etiqueta`; aqui é só a licença para
                // encolher.
                <li key={concurso.slug} className="min-w-0">
                  {/* `ufDoFiltro` só aqui: é a busca que faz a pergunta
                      "por que este veio", e é só ela que tem a resposta. */}
                  <CartaoConcurso
                    concurso={concurso}
                    hoje={hoje}
                    ufDoFiltro={consulta.uf}
                  />
                </li>
              ))}
            </ul>
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
