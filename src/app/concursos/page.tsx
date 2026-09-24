import type { Metadata } from "next";
import { BarraBusca } from "@/components/busca/BarraBusca";
import { ListaDeResultados } from "@/components/busca/ListaDeResultados";
import {
  avisoDoAcervo,
  contagensDeFaceta,
  dimensoesDoAcervo,
  listarConcursos,
} from "@/lib/concursos";
import {
  filtroDaConsulta,
  lerConsulta,
  urlDaBusca,
  type ConsultaDaUrl,
} from "@/lib/parametros";
import { NOME_UF, ROTULO_ESCOLARIDADE } from "@/lib/rotulos";

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

export default async function BuscaDeConcursos(
  props: PageProps<"/concursos">,
) {
  const hoje = new Date();
  const consulta = lerConsulta(await props.searchParams);
  const filtro = filtroDaConsulta(consulta);
  const [resultado, contagens, aviso, dimensoes] = await Promise.all([
    listarConcursos({ ...filtro, ordem: consulta.ordem, pagina: consulta.pagina }, hoje),
    contagensDeFaceta(filtro, hoje),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <BarraBusca q={consulta.q} uf={consulta.uf} compacta dimensoes={dimensoes} />
      <ListaDeResultados
        consulta={consulta}
        titulo={tituloDaBusca(consulta)}
        resultado={resultado}
        contagens={contagens}
        aviso={aviso}
        dimensoes={dimensoes}
        hoje={hoje}
      />
    </div>
  );
}
