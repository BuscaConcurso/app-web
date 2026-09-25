import type { Metadata } from "next";
import { Areas } from "@/components/home/Areas";
import { BlocoAlerta } from "@/components/home/BlocoAlerta";
import { ComoFunciona } from "@/components/home/ComoFunciona";
import { EncerramSemana } from "@/components/home/EncerramSemana";
import { Hero } from "@/components/home/Hero";
import { Numeros } from "@/components/home/Numeros";
import { PorEstado } from "@/components/home/PorEstado";
import { TabelaAbertos } from "@/components/home/TabelaAbertos";
import { VemAiEDou } from "@/components/home/VemAiEDou";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import {
  avisoDoAcervo,
  dimensoesDoAcervo,
  facetas,
  obterDestaques,
} from "@/lib/concursos";
import { hojeCivilEmSaoPaulo, somaOuNull } from "@/lib/formato";
import { tituloSemOrgao } from "@/lib/rotulos";
import { DESCRICAO_SITE, NOME_SITE, urlAbsoluta } from "@/lib/site";

export const metadata: Metadata = {
  title: `${NOME_SITE}: concursos públicos abertos no Brasil`,
  description: DESCRICAO_SITE,
  alternates: { canonical: "/" },
};

/** ISR de cinco minutos, o mesmo tempo da leitura do acervo (`concursos.ts`). */
export const revalidate = 300;

export default async function Home() {
  // O dia civil de São Paulo, não o relógio cru do processo: tudo que
  // decide por dia (destaques, facetas, "encerra hoje", a tabela) lê daqui.
  // Um servidor em UTC viraria o dia às 21h de Brasília.
  const hoje = hojeCivilEmSaoPaulo();
  const [destaques, { ufs, bancas, orgaos }, aviso, dimensoes] = await Promise.all([
    obterDestaques(hoje),
    facetas(hoje, { ufs: 27 }),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
  ]);

  /**
   * ItemList sobre os concursos em destaque. Descreve para o buscador que
   * esta página é uma lista ordenada de itens concretos, e não um texto
   * corrido sobre concursos.
   */
  const listaEstruturada = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Concursos com inscrição aberta",
    numberOfItems: destaques.totalAbertos,
    itemListElement: [...destaques.encerrando, ...destaques.abertos].map(
      (concurso, indice) => ({
        "@type": "ListItem",
        position: indice + 1,
        url: urlAbsoluta(`/concursos/${concurso.slug}`),
        // O órgão está colado no nome do item, então o título entra recortado
        // (ver `tituloSemOrgao`). Sem o recorte, os itens desta lista saíam
        // com o nome do órgão duas vezes na mesma string.
        name: `${concurso.orgao.nome}: ${tituloSemOrgao(
          concurso.titulo,
          concurso.orgao,
        )}`,
      }),
    ),
  };

  return (
    <>
      <DadosEstruturados dados={listaEstruturada} />

      <Hero
        totalAbertos={destaques.totalAbertos}
        destaque={destaques.encerrando[0] ?? destaques.abertos[0] ?? null}
        novoAto={destaques.atualizados[0] ?? null}
      />

      <Numeros
        totalAbertos={destaques.totalAbertos}
        vagasPrevistas={somaOuNull(destaques.previstos.map((concurso) => concurso.vagas))}
        atosLidos={aviso?.total ?? dimensoes.total}
      />

      <Areas />

      <EncerramSemana concursos={destaques.encerrando} hoje={hoje} />

      <TabelaAbertos concursos={destaques.abertos} total={destaques.totalAbertos} hoje={hoje} />

      <PorEstado ufs={ufs} orgaos={orgaos} bancas={bancas} />

      <VemAiEDou previstos={destaques.previstos} atualizados={destaques.atualizados} />

      <ComoFunciona aviso={aviso} />

      <BlocoAlerta totalAbertos={destaques.totalAbertos} />
    </>
  );
}
