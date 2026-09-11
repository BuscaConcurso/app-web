import type { Metadata } from "next";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { LinhaConcurso } from "@/components/concurso/LinhaConcurso";
import { BlocoAlerta } from "@/components/home/BlocoAlerta";
import { BlocosSeo } from "@/components/home/BlocosSeo";
import { Hero } from "@/components/home/Hero";
import { Secao } from "@/components/home/Secao";
import { facetas, obterDestaques } from "@/lib/concursos";
import { dataLonga } from "@/lib/formato";
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

export default async function Home() {
  const hoje = new Date();
  const destaques = await obterDestaques(hoje);
  const { ufs, bancas, orgaos } = await facetas(hoje);

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
        name: `${concurso.orgao.nome}: ${concurso.titulo}`,
      }),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listaEstruturada).replace(/</g, "\\u003c"),
        }}
      />

      <Hero
        totalAbertos={destaques.totalAbertos}
        atualizadoEm={dataLonga(isoDeHoje(hoje))}
      />

      {destaques.encerrando.length > 0 && (
        <Secao
          titulo="Encerra esta semana"
          apoio="Inscrições que fecham nos próximos sete dias."
          href="/concursos?situacao=abertas"
          hrefRotulo="Ver tudo que está aberto"
        >
          <ul className="grid gap-3">
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
        <ul className="grid gap-3 lg:grid-cols-2">
          {destaques.abertos.map((concurso) => (
            <li key={concurso.slug}>
              <CartaoConcurso concurso={concurso} hoje={hoje} />
            </li>
          ))}
        </ul>
      </Secao>

      {destaques.previstos.length > 0 && (
        <Secao
          titulo="Previstos"
          apoio="Autorizados ou com banca definida, ainda sem edital publicado."
          href="/concursos?situacao=previstos"
          hrefRotulo="Ver todos os previstos"
        >
          <ul className="grid gap-3">
            {destaques.previstos.map((concurso) => (
              <li key={concurso.slug}>
                <LinhaConcurso concurso={concurso} hoje={hoje} acao="Avisar" />
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <BlocoAlerta totalAbertos={destaques.totalAbertos} />

      <BlocosSeo ufs={ufs} bancas={bancas} orgaos={orgaos} />
    </>
  );
}
