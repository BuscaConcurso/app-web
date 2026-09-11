import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // `/estilo` é a vitrine do design system, ferramenta de trabalho.
      disallow: ["/estilo"],
    },
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
