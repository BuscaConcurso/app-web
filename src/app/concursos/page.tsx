import type { Metadata } from "next";
import Link from "next/link";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { BarraBusca } from "@/components/home/BarraBusca";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Paginacao } from "@/components/ui/Paginacao";
import { listarConcursos } from "@/lib/concursos";
import { ORDENS, SITUACOES } from "@/lib/consulta";
import { moeda, numero } from "@/lib/formato";
import { comParametro, lerConsulta, type ConsultaDaUrl } from "@/lib/parametros";
import { NOME_UF, ROTULO_ESCOLARIDADE, ROTULO_ESFERA } from "@/lib/rotulos";
import { BANCAS } from "@/mocks/bancas";

/**
 * Busca, versão reduzida.
 *
 * A coluna de filtros do canvas ainda não está aqui: esta rodada entrega a
 * home e o design system, e esta página existe para que a busca da home leve
 * a algum lugar de verdade. O que já funciona é o essencial: a query string
 * é a fonte da verdade, cada filtro ativo pode ser removido por um link, e a
 * ordenação e a paginação também são links. Quando a coluna de filtros
 * entrar, ela escreve nesta mesma URL.
 */
function tituloDaBusca(consulta: ConsultaDaUrl): string {
  const partes: string[] = [];
  if (consulta.q) partes.push(consulta.q);
  else if (consulta.escolaridade) {
    partes.push(`Concursos de nível ${ROTULO_ESCOLARIDADE[consulta.escolaridade].toLowerCase()}`);
  } else if (consulta.situacao === "previstos") partes.push("Concursos previstos");
  else if (consulta.situacao === "encerrados") partes.push("Concursos encerrados");
  else partes.push("Concursos públicos");

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
    alternates: { canonical: comParametro(consulta, "pagina", consulta.pagina) },
    // Uma busca por texto livre gera infinitas URLs quase iguais. As facetas
    // (estado, escolaridade, banca) são finitas e valem indexação; a busca
    // digitada, não.
    robots: consulta.q ? { index: false, follow: true } : { index: true, follow: true },
  };
}

interface FiltroAtivo {
  rotulo: string;
  chave: keyof ConsultaDaUrl;
}

function filtrosAtivos(consulta: ConsultaDaUrl): FiltroAtivo[] {
  const ativos: FiltroAtivo[] = [];
  if (consulta.q) ativos.push({ rotulo: `"${consulta.q}"`, chave: "q" });
  if (consulta.uf) ativos.push({ rotulo: NOME_UF[consulta.uf], chave: "uf" });
  if (consulta.escolaridade) {
    ativos.push({
      rotulo: ROTULO_ESCOLARIDADE[consulta.escolaridade],
      chave: "escolaridade",
    });
  }
  if (consulta.esfera) {
    ativos.push({ rotulo: ROTULO_ESFERA[consulta.esfera], chave: "esfera" });
  }
  if (consulta.situacao) {
    ativos.push({ rotulo: SITUACOES[consulta.situacao], chave: "situacao" });
  }
  if (consulta.banca) {
    ativos.push({
      rotulo: BANCAS[consulta.banca as keyof typeof BANCAS].nome,
      chave: "banca",
    });
  }
  if (consulta.salarioMin) {
    ativos.push({
      rotulo: `Acima de ${moeda(consulta.salarioMin)}`,
      chave: "salarioMin",
    });
  }
  return ativos;
}

export default async function BuscaDeConcursos(
  props: PageProps<"/concursos">,
) {
  const hoje = new Date();
  const consulta = lerConsulta(await props.searchParams);
  const { q, uf, escolaridade, esfera, situacao, banca, salarioMin, ordem, pagina } =
    consulta;

  const resultado = await listarConcursos(
    { q, uf, escolaridade, esfera, situacao, banca, salarioMin, ordem, pagina },
    hoje,
  );
  const ativos = filtrosAtivos(consulta);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
      <BarraBusca q={q} uf={uf} compacta />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-titulo text-[28px] leading-9 font-semibold tracking-[-0.01em]">
            {tituloDaBusca(consulta)}
          </h1>
          <p className="mt-1 text-[13px] text-tinta-600">
            <strong className="numero font-medium text-tinta-900">
              {numero(resultado.total)}
            </strong>{" "}
            {resultado.total === 1 ? "concurso encontrado" : "concursos encontrados"}
          </p>
        </div>

        <nav aria-label="Ordenação" className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-tinta-500">Ordenar por</span>
          {(Object.keys(ORDENS) as (keyof typeof ORDENS)[]).map((chave) => (
            <Link
              key={chave}
              href={comParametro({ ...consulta, pagina: 1 }, "ordem", chave)}
              aria-current={chave === ordem ? "true" : undefined}
              className={`rounded-controle px-3 py-1.5 text-[13px] font-medium transition-colors ${
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

      {ativos.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {ativos.map((filtro) => (
            <Link
              key={filtro.chave}
              href={comParametro({ ...consulta, pagina: 1 }, filtro.chave, undefined)}
              className="inline-flex items-center gap-2 rounded-[5px] bg-verde-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-verde-600"
            >
              {filtro.rotulo}
              <span aria-hidden="true" className="text-white/70">
                ×
              </span>
              <span className="sr-only">remover filtro</span>
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
        <div className="mt-6 rounded-caixa bg-cartao px-6 py-12 text-center">
          <p className="font-titulo text-lg font-semibold">
            Nenhum concurso com esses filtros
          </p>
          <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-6 text-tinta-600">
            Tente remover o estado ou a escolaridade. Se o concurso que você
            procura ainda não saiu, crie um alerta e avisamos quando o edital
            for publicado.
          </p>
          <Etiqueta className="mt-4">
            <Link href="/concursos">Ver todos os concursos</Link>
          </Etiqueta>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {resultado.itens.map((concurso) => (
            <li key={concurso.slug}>
              <CartaoConcurso concurso={concurso} hoje={hoje} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex justify-center">
        <Paginacao
          pagina={resultado.pagina}
          paginas={resultado.paginas}
          hrefDe={(numeroDaPagina) =>
            comParametro(consulta, "pagina", numeroDaPagina)
          }
        />
      </div>
    </div>
  );
}
