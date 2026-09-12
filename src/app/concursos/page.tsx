import type { Metadata } from "next";
import Link from "next/link";
import { ColunaFiltros } from "@/components/busca/ColunaFiltros";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { BarraBusca } from "@/components/home/BarraBusca";
import { Paginacao } from "@/components/ui/Paginacao";
import { contagensDeFaceta, listarConcursos } from "@/lib/concursos";
import { ORDENS, SITUACOES } from "@/lib/consulta";
import { moeda, numero } from "@/lib/formato";
import {
  lerConsulta,
  urlDaBusca,
  urlSemValor,
  type ConsultaDaUrl,
} from "@/lib/parametros";
import { NOME_UF, ROTULO_ESCOLARIDADE, ROTULO_ESFERA } from "@/lib/rotulos";
import { BANCAS } from "@/mocks/bancas";

/**
 * Busca.
 *
 * A query string é a fonte da verdade: a coluna de filtros, a ordenação e a
 * paginação escrevem nela por âncora, e a página só lê. Isso mantém a busca
 * inteira sem JavaScript de cliente, faz cada combinação ter endereço
 * próprio e deixa o botão de voltar do navegador funcionar como as pessoas
 * esperam.
 */
function tituloDaBusca(consulta: ConsultaDaUrl): string {
  const partes: string[] = [];

  if (consulta.q) partes.push(consulta.q);
  else if (consulta.escolaridades.length === 1) {
    partes.push(
      `Concursos de nível ${ROTULO_ESCOLARIDADE[consulta.escolaridades[0]].toLowerCase()}`,
    );
  } else if (consulta.situacoes.length === 1) {
    const [situacao] = consulta.situacoes;
    if (situacao === "previstos") partes.push("Concursos previstos");
    else if (situacao === "encerrados") partes.push("Concursos encerrados");
    else partes.push("Concursos com inscrições abertas");
  } else partes.push("Concursos públicos");

  if (consulta.uf) partes.push(`em ${NOME_UF[consulta.uf]}`);
  return partes.join(" ");
}

export async function generateMetadata(
  props: PageProps<"/concursos">,
): Promise<Metadata> {
  const consulta = lerConsulta(await props.searchParams);
  const titulo = tituloDaBusca(consulta);

  return {
    title: titulo,
    description:
      `Vagas, salário, taxa e prazo de inscrição de ${titulo.toLowerCase()}. ` +
      "Dados extraídos do edital original, com link para o documento.",
    alternates: { canonical: urlDaBusca(consulta) },
    // Uma busca por texto livre gera infinitas URLs quase iguais, e uma
    // combinação de muitas facetas também. Uma faceta só é finita e vale
    // indexação; o resto segue os links sem entrar no índice.
    robots:
      consulta.q || quantasDimensoes(consulta) > 1
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

function quantasDimensoes(consulta: ConsultaDaUrl): number {
  return [
    consulta.escolaridades.length > 0,
    consulta.situacoes.length > 0,
    consulta.bancas.length > 0,
    consulta.esferas.length > 0,
    !!consulta.uf,
    !!consulta.salarioMin || !!consulta.salarioMax,
  ].filter(Boolean).length;
}

interface Chip {
  chave: string;
  rotulo: string;
  href: string;
}

/** Um chip por valor, não por dimensão: cada um sai sozinho. */
function chipsAtivos(consulta: ConsultaDaUrl): Chip[] {
  const chips: Chip[] = [];

  if (consulta.q) {
    chips.push({
      chave: "q",
      rotulo: `"${consulta.q}"`,
      href: urlDaBusca(consulta, { q: undefined, pagina: 1 }),
    });
  }
  if (consulta.uf) {
    chips.push({
      chave: "uf",
      rotulo: NOME_UF[consulta.uf],
      href: urlDaBusca(consulta, { uf: undefined, pagina: 1 }),
    });
  }
  for (const situacao of consulta.situacoes) {
    chips.push({
      chave: `situacao-${situacao}`,
      rotulo: SITUACOES[situacao],
      href: urlSemValor(consulta, "situacoes", situacao),
    });
  }
  for (const escolaridade of consulta.escolaridades) {
    chips.push({
      chave: `escolaridade-${escolaridade}`,
      rotulo: ROTULO_ESCOLARIDADE[escolaridade],
      href: urlSemValor(consulta, "escolaridades", escolaridade),
    });
  }
  for (const esfera of consulta.esferas) {
    chips.push({
      chave: `esfera-${esfera}`,
      rotulo: ROTULO_ESFERA[esfera],
      href: urlSemValor(consulta, "esferas", esfera),
    });
  }
  for (const banca of consulta.bancas) {
    chips.push({
      chave: `banca-${banca}`,
      rotulo: BANCAS[banca as keyof typeof BANCAS].nome,
      href: urlSemValor(consulta, "bancas", banca),
    });
  }
  if (consulta.salarioMin || consulta.salarioMax) {
    const min = consulta.salarioMin;
    const max = consulta.salarioMax;
    chips.push({
      chave: "salario",
      rotulo:
        min && max
          ? `${moeda(min)} a ${moeda(max)}`
          : min
            ? `Acima de ${moeda(min)}`
            : `Até ${moeda(max!)}`,
      href: urlDaBusca(consulta, {
        salarioMin: undefined,
        salarioMax: undefined,
        pagina: 1,
      }),
    });
  }

  return chips;
}

export default async function BuscaDeConcursos(
  props: PageProps<"/concursos">,
) {
  const hoje = new Date();
  const consulta = lerConsulta(await props.searchParams);
  const {
    q,
    uf,
    escolaridades,
    situacoes,
    bancas,
    esferas,
    salarioMin,
    salarioMax,
    ordem,
    pagina,
  } = consulta;

  const filtro = {
    q,
    uf,
    escolaridades,
    situacoes,
    bancas,
    esferas,
    salarioMin,
    salarioMax,
  };
  const resultado = await listarConcursos({ ...filtro, ordem, pagina }, hoje);
  const contagens = await contagensDeFaceta(filtro, hoje);
  const chips = chipsAtivos(consulta);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <BarraBusca q={q} uf={uf} compacta />

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start">
        <ColunaFiltros
          consulta={consulta}
          contagens={contagens}
          total={resultado.total}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-titulo text-[21px] leading-8 font-semibold tracking-[-0.01em]">
                {tituloDaBusca(consulta)}
              </h1>
              <p className="mt-1 text-[12px] text-tinta-600">
                <strong className="numero font-medium text-tinta-900">
                  {numero(resultado.total)}
                </strong>{" "}
                {resultado.total === 1
                  ? "concurso encontrado"
                  : "concursos encontrados"}
              </p>
            </div>

            <nav
              aria-label="Ordenação"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="text-[12px] text-tinta-500">Ordenar por</span>
              {(Object.keys(ORDENS) as (keyof typeof ORDENS)[]).map((chave) => (
                <Link
                  key={chave}
                  href={urlDaBusca(consulta, { ordem: chave, pagina: 1 })}
                  aria-current={chave === ordem ? "true" : undefined}
                  className={`rounded-controle px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    chave === ordem
                      ? "bg-escura text-white"
                      : "bg-rebaixada text-tinta-800 hover:bg-tinta-200"
                  }`}
                >
                  {ORDENS[chave]}
                </Link>
              ))}
            </nav>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.chave}
                  href={chip.href}
                  aria-label={`Remover filtro ${chip.rotulo}`}
                  className="inline-flex items-center gap-2 rounded-[5px] bg-verde-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-verde-600"
                >
                  {chip.rotulo}
                  <span aria-hidden="true" className="text-white/70">
                    ×
                  </span>
                </Link>
              ))}
              <Link
                href="/concursos"
                className="px-2 text-xs font-medium text-tinta-600 underline underline-offset-4 hover:text-tinta-900"
              >
                Limpar filtros
              </Link>
            </div>
          )}

          {resultado.itens.length === 0 ? (
            <div className="mt-5 rounded-caixa bg-cartao px-6 py-12 text-center">
              <p className="font-titulo text-lg font-semibold">
                Nenhum concurso com esses filtros
              </p>
              <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-6 text-tinta-600">
                Tente remover o estado ou a escolaridade. Se o concurso que
                você procura ainda não saiu, crie um alerta e avisamos quando o
                edital for publicado.
              </p>
              <Link
                href="/concursos"
                className="mt-4 inline-flex h-10 items-center rounded-controle bg-verde-700 px-4 text-sm font-semibold text-white hover:bg-verde-600"
              >
                Ver todos os concursos
              </Link>
            </div>
          ) : (
            <ul className="mt-4 grid gap-2 xl:grid-cols-2">
              {resultado.itens.map((concurso) => (
                <li key={concurso.slug}>
                  <CartaoConcurso concurso={concurso} hoje={hoje} />
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
        </div>
      </div>
    </div>
  );
}
