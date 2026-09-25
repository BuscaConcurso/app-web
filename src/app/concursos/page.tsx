import type { Metadata } from "next";
import { ListaDeResultados } from "@/components/busca/ListaDeResultados";
import {
  avisoDoAcervo,
  contagensDeFaceta,
  dimensoesDoAcervo,
  listarConcursos,
} from "@/lib/concursos";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";
import {
  filtroDaConsulta,
  lerConsulta,
  tituloDaListaDeConcursos,
  urlDaBusca,
  type ConsultaDaUrl,
} from "@/lib/parametros";

/**
 * Busca.
 *
 * A query string é a fonte da verdade: a coluna de filtros, a ordenação e a
 * paginação escrevem nela por âncora, e a página só lê. Isso mantém a busca
 * inteira sem JavaScript de cliente, faz cada combinação ter endereço
 * próprio e deixa o botão de voltar do navegador funcionar como as pessoas
 * esperam.
 */

export async function generateMetadata(
  props: PageProps<"/concursos">,
): Promise<Metadata> {
  const consulta = lerConsulta(await props.searchParams);
  const titulo = tituloDaListaDeConcursos(consulta);

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
  // Data civil de São Paulo, a mesma de /busca: ver `hojeCivilEmSaoPaulo`.
  const hoje = hojeCivilEmSaoPaulo();
  const consulta = lerConsulta(await props.searchParams);
  const filtro = filtroDaConsulta(consulta);
  const [resultado, contagens, aviso, dimensoes] = await Promise.all([
    listarConcursos({ ...filtro, ordem: consulta.ordem, pagina: consulta.pagina }, hoje),
    contagensDeFaceta(filtro, hoje),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
  ]);

  return (
    <ListaDeResultados
      consulta={consulta}
      titulo={tituloDaListaDeConcursos(consulta)}
      resultado={resultado}
      contagens={contagens}
      aviso={aviso}
      dimensoes={dimensoes}
      hoje={hoje}
    />
  );
}
