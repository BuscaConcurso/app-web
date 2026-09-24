import type { Metadata } from "next";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { LinhaConcurso } from "@/components/concurso/LinhaConcurso";
import { AcervoIncompleto, BlocoAlerta } from "@/components/home/BlocoAlerta";
import { BlocosSeo } from "@/components/home/BlocosSeo";
import { Hero } from "@/components/home/Hero";
import { Secao } from "@/components/home/Secao";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import {
  avisoDoAcervo,
  dimensoesDoAcervo,
  facetas,
  obterDestaques,
} from "@/lib/concursos";
import { dataLonga } from "@/lib/formato";
import { tituloSemOrgao } from "@/lib/rotulos";
import { DESCRICAO_SITE, NOME_SITE, urlAbsoluta } from "@/lib/site";

export const metadata: Metadata = {
  title: `${NOME_SITE}: concursos públicos abertos no Brasil`,
  description: DESCRICAO_SITE,
  alternates: { canonical: "/" },
};

function isoDeHoje(hoje: Date): string {
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

/** ISR de cinco minutos, o mesmo tempo da leitura do acervo (`concursos.ts`). */
export const revalidate = 300;

export default async function Home() {
  const hoje = new Date();
  const destaques = await obterDestaques(hoje);
  const { ufs, bancas, orgaos } = await facetas(hoje);
  const aviso = await avisoDoAcervo();
  const dimensoes = await dimensoesDoAcervo();

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
        // — ver `tituloSemOrgao`. Sem o recorte, os itens desta lista saíam
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
        atualizadoEm={dataLonga(isoDeHoje(hoje))}
        dimensoes={dimensoes}
      />

      {destaques.encerrando.length > 0 && (
        <Secao
          titulo="Encerra esta semana"
          apoio="Inscrições que fecham nos próximos sete dias."
          href="/concursos?situacao=abertas"
          hrefRotulo="Ver tudo que está aberto"
        >
          <ul className="grid gap-2">
            {destaques.encerrando.map((concurso) => (
              <li key={concurso.slug}>
                <LinhaConcurso concurso={concurso} hoje={hoje} acao="Abrir" />
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Secao
        titulo="Inscrições abertas agora"
        apoio="Ordenado por quem fecha primeiro."
        href="/concursos?situacao=abertas"
        hrefRotulo={`Ver os ${destaques.totalAbertos} abertos`}
      >
        <ul className="grid gap-2 lg:grid-cols-2">
          {destaques.abertos.map((concurso) => (
            // `min-w-0` pelo mesmo motivo da lista da busca: item de grid não
            // encolhe abaixo do min-content sem isto, e o mesmo cartão está
            // aqui.
            <li key={concurso.slug} className="min-w-0">
              <CartaoConcurso concurso={concurso} hoje={hoje} />
            </li>
          ))}
        </ul>
      </Secao>

      {destaques.atualizados.length > 0 && (
        <Secao
          titulo="Últimas atualizações"
          apoio="Concursos com ato novo no Diário Oficial da União, do mais recente para o mais antigo."
        >
          <ul className="grid gap-2">
            {destaques.atualizados.map((concurso) => (
              <li key={concurso.slug}>
                <LinhaConcurso
                  concurso={concurso}
                  hoje={hoje}
                  acao="Ver"
                  ato={concurso.ultimoAto ?? undefined}
                />
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {destaques.previstos.length > 0 && (
        <Secao
          titulo="Previstos"
          apoio="Autorizados ou com banca definida, ainda sem edital publicado."
          href="/concursos?situacao=previstos"
          hrefRotulo="Ver todos os previstos"
        >
          <ul className="grid gap-2">
            {destaques.previstos.map((concurso) => (
              <li key={concurso.slug}>
                <LinhaConcurso concurso={concurso} hoje={hoje} acao="Avisar" />
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {aviso && (
        <section className="mx-auto max-w-[1240px] px-4 pb-5 sm:px-6">
          <AcervoIncompleto aviso={aviso} />
        </section>
      )}

      <BlocoAlerta totalAbertos={destaques.totalAbertos} />

      <BlocosSeo ufs={ufs} bancas={bancas} orgaos={orgaos} />
    </>
  );
}
