import type { Metadata } from "next";
import { Archivo, Literata } from "next/font/google";
import "./globals.css";
import { AvisoDeOrigem } from "@/components/layout/AvisoDeOrigem";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { Rodape } from "@/components/layout/Rodape";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import { origemDoAcervo } from "@/lib/concursos";
import { DESCRICAO_SITE, NOME_SITE, URL_SITE } from "@/lib/site";
import { SCRIPT_DO_TEMA } from "@/lib/tema";
import { SessionProvider } from "@/lib/auth/session";

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

/**
 * `async` por causa de uma linha só: a faixa que diz de onde o acervo veio.
 *
 * Ela fica no layout, e não em cada página, porque é o único lugar onde
 * nenhuma página nova pode esquecer de mostrá-la — e a coisa que ela avisa, o
 * mock se passando por acervo, é justamente a que ninguém nota quando falta.
 * Não custa requisição: o `fetch` do Next memoriza a chamada que a página já
 * faz no mesmo render, e sem `BC_API_URL` não há requisição nenhuma.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const origem = await origemDoAcervo();

  return (
    // `suppressHydrationWarning` é o que faltava para o aviso "A tree hydrated
    // but some attributes of the server rendered HTML didn't match" sumir. O
    // script de tema logo abaixo escreve `data-tema` no `<html>` ANTES de o
    // React hidratar — é o ponto dele, senão quem escolheu o escuro vê um
    // lampejo claro —, e o servidor não tem como saber o que vai estar lá. A
    // divergência é deliberada e acontece em toda carga.
    //
    // O prop vale só para os atributos deste elemento, um nível: não esconde
    // divergência de nenhum filho. Antes deste conserto o mesmo aviso foi
    // atribuído à barra de busca e tratado com `autoComplete="off"`, que é
    // correto por outro motivo mas não era a causa — o log do `next dev`
    // mostrou o diff apontando para `data-tema` no `<html>`.
    <html
      lang="pt-BR"
      className={`${literata.variable} ${archivo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Antes da primeira pintura, senão quem escolheu o contrário do
            sistema vê um lampejo do tema errado. O CSS já trata a ausência
            do atributo como "sistema", então isto só corrige a escolha
            explícita. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SessionProvider>
          <DadosEstruturados dados={dadosEstruturados} />
          <AvisoDeOrigem origem={origem} />
          <Cabecalho />
          <main className="flex-1">{children}</main>
          <Rodape />
        </SessionProvider>
      </body>
    </html>
  );
}
