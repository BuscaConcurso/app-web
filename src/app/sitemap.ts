import type { MetadataRoute } from "next";
import { listarSlugs } from "@/lib/concursos";
import { UFS, type Escolaridade } from "@/lib/dominio";
import { urlAbsoluta } from "@/lib/site";

/**
 * O mapa do site.
 *
 * Entram a home, a busca, as facetas finitas (estado e escolaridade) e cada
 * concurso. Não entram as buscas por texto livre, que são infinitas, nem
 * `/estilo`, que é ferramenta de trabalho e não conteúdo.
 */
const ESCOLARIDADES_INDEXAVEIS: Escolaridade[] = [
  "fundamental",
  "medio",
  "medio_tecnico",
  "superior",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const agora = new Date();
  const slugs = await listarSlugs();

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
    ...slugs.map((slug) => ({
      url: urlAbsoluta(`/concursos/${slug}`),
      lastModified: agora,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
