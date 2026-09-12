import type { Metadata } from "next";
import { Archivo, Literata } from "next/font/google";
import "./globals.css";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { DESCRICAO_SITE, NOME_SITE, URL_SITE } from "@/lib/site";
import { SCRIPT_DO_TEMA } from "@/lib/tema";

/**
 * Literata em título e Archivo em todo o resto, número incluído.
 *
 * As duas são variáveis, então uma família cobre todos os pesos que o canvas
 * usa sem baixar um arquivo por peso. `next/font` as autohospeda, o que tira
 * a requisição para o Google e o deslocamento de layout que vem com ela.
 *
 * Duas famílias e não três: os números usam as figuras tabulares do próprio
 * Archivo, e a família a menos é uma requisição a menos no primeiro carregamento.
 */
const literata = Literata({
  subsets: ["latin", "latin-ext"],
  variable: "--fonte-literata",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--fonte-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: `${NOME_SITE}: concursos públicos abertos no Brasil`,
    template: `%s · ${NOME_SITE}`,
  },
  description: DESCRICAO_SITE,
  applicationName: NOME_SITE,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: NOME_SITE,
    url: "/",
    title: `${NOME_SITE}: concursos públicos abertos no Brasil`,
    description: DESCRICAO_SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${NOME_SITE}: concursos públicos abertos no Brasil`,
    description: DESCRICAO_SITE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  category: "education",
  /**
   * Dois arquivos, um por faixa de tamanho, como o canvas manda: abaixo de
   * 24 px as três linhas do documento viram um borrão amarelo, então o ícone
   * pequeno fica só com a lente. O PNG de 32 é o que a aba do navegador usa;
   * o SVG serve o resto, de atalho na tela inicial a favorito.
   */
  icons: {
    icon: [
      { url: "/icone-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icone.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/icone.svg", type: "image/svg+xml" },
  },
};

/**
 * Organization e WebSite ficam no layout porque valem para o site inteiro.
 * O SearchAction é o que habilita a caixa de busca do Google apontando para
 * a nossa própria busca, e por isso o `urlTemplate` precisa bater exatamente
 * com o parâmetro que `/concursos` lê.
 */
const dadosEstruturados = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${URL_SITE}/#organizacao`,
      name: NOME_SITE,
      url: URL_SITE,
      description: DESCRICAO_SITE,
    },
    {
      "@type": "WebSite",
      "@id": `${URL_SITE}/#site`,
      url: URL_SITE,
      name: NOME_SITE,
      inLanguage: "pt-BR",
      publisher: { "@id": `${URL_SITE}/#organizacao` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${URL_SITE}/concursos?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${literata.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        {/* Antes da primeira pintura, senão quem escolheu o contrário do
            sistema vê um lampejo do tema errado. O CSS já trata a ausência
            do atributo como "sistema", então isto só corrige a escolha
            explícita. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c"),
          }}
        />
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <Rodape />
      </body>
    </html>
  );
}
