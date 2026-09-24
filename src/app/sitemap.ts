import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { listarOrgaos, listarSlugs } from "@/lib/concursos";
import { UFS, type Escolaridade } from "@/lib/dominio";
import { urlAbsoluta } from "@/lib/site";

/**
 * O mapa do site.
 *
 * Entram a home, a busca, as facetas finitas (estado e escolaridade), cada
 * órgão com mais de um concurso e cada concurso. Não entram as buscas por
 * texto livre, que são infinitas, nem `/estilo`, que é ferramenta de trabalho
 * e não conteúdo.
 *
 * **Os órgãos de um concurso só ficam de fora**, e são 195 dos 466. A página
 * deles é o cartão de um concurso que já está neste mesmo mapa com prioridade
 * maior: pôr as duas URLs é oferecer duas entradas para o mesmo conteúdo. A
 * página continua existindo, continua sendo seguida a partir da trilha do
 * concurso e do rodapé da home, e entra aqui sozinha no dia do segundo
 * concurso — dos 122 órgãos que tinham um só há 30 dias, 36 (30%) já têm dois
 * ou mais. O corte é medido no acervo a cada geração, não escrito à mão.
 */
const MINIMO_DE_CONCURSOS_NO_MAPA = 2;
const ESCOLARIDADES_INDEXAVEIS: Escolaridade[] = [
  "fundamental",
  "medio",
  "medio_tecnico",
  "superior",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fora do layout raiz: precisa da mesma marcação para não sair do build
  // congelado com o mock (ver `app/layout.tsx`).
  await connection();
  const agora = new Date();
  const slugs = await listarSlugs();
  const orgaos = (await listarOrgaos()).filter(
    ({ concursos }) => concursos.length >= MINIMO_DE_CONCURSOS_NO_MAPA,
  );

  return [
    {
      url: urlAbsoluta("/"),
      lastModified: agora,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: urlAbsoluta("/concursos"),
      lastModified: agora,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...UFS.map((uf) => ({
      url: urlAbsoluta(`/concursos?uf=${uf}`),
      lastModified: agora,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...ESCOLARIDADES_INDEXAVEIS.map((escolaridade) => ({
      url: urlAbsoluta(`/concursos?escolaridade=${escolaridade}`),
      lastModified: agora,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    // Entre a faceta e o concurso: um órgão é mais durável que uma busca por
    // estado e menos específico que um edital, que é o que a pessoa procura.
    ...orgaos.map(({ orgao }) => ({
      url: urlAbsoluta(`/orgaos/${orgao.slug}`),
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...slugs.map((slug) => ({
      url: urlAbsoluta(`/concursos/${slug}`),
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
