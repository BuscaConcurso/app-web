import type { Metadata } from "next";
import { Archivo, Literata } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import "./globals.css";
import { AvisoDeOrigem } from "@/components/layout/AvisoDeOrigem";
import { Cabecalho } from "@/components/layout/Cabecalho";
import { GoogleTagManager } from "@/components/layout/GoogleTagManager";
import { Rodape } from "@/components/layout/Rodape";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import {
  dimensoesDoAcervo,
  origemDoAcervo,
  type DimensoesDoAcervo,
  type OrigemDoAcervo,
} from "@/lib/concursos";
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
 * a nossa própria busca. O `urlTemplate` continua `/concursos?q=`, o
 * parâmetro que o Google sabe preencher, e o `proxy.ts` leva esse endereço
 * com 308 para `/busca/<slug>`, com o resto da query.
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
 * Cinco minutos para toda página sem dado por requisição: a home, as de
 * conta e a busca por termo. O layout lê o acervo (a faixa de origem e o
 * rodapé), e sem este valor a rota ficaria só com o `revalidate` dos
 * `fetch`, que a memória de processo de `concursos.ts` pode pular. Página que
 * lê `searchParams` continua dinâmica por conta própria.
 */
export const revalidate = 300;

/**
 * O acervo que o layout raiz precisa: a faixa de origem e a contagem que a
 * barra de busca usa para saber se o filtro de estado tem o que filtrar.
 *
 * **O layout não pode lançar.** Ele envolve toda página do site, inclusive
 * `/entrar`, o cadastro e a 404 (`not-found.tsx`), e um erro aqui derruba
 * todas elas de uma vez: nem `error.tsx` alcança este nível, porque ele
 * embrulha `loading.js`, `not-found.js`, `page.js` e os `layout.js` abaixo
 * dele, não o próprio `layout.tsx` raiz (doc lida antes de escrever este
 * arquivo, em `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`).
 * Sob a regra R3 de `concursos.ts`, a API fora do ar sem leitura boa
 * guardada lança, e sem este envoltório essa falha bateria direto na
 * página padrão do Next, sem identidade nenhuma e sem link de volta:
 * exatamente o que `global-error.tsx` existe para nunca precisar mostrar.
 *
 * Degrada assim: sem faixa de origem (`origem: null`, e o layout nem chega
 * a montar `AvisoDeOrigem`) e com a barra de busca sem contagem nenhuma
 * (`comUf: 0` já é o bastante para `BarraBuscaDoCabecalho` desligar o
 * seletor de estado, ver `BarraBusca.tsx`). Uma página que realmente
 * precisa do acervo (a home, `/concursos`, `/busca/<termo>`) continua
 * lançando dela mesma, direto para o `error.tsx` daquela rota: só a leitura
 * feita aqui, para o cabeçalho, é que não pode empacar o site inteiro.
 */
async function acervoDoLayout(): Promise<{
  origem: OrigemDoAcervo | null;
  dimensoes: DimensoesDoAcervo;
}> {
  try {
    const [origem, dimensoes] = await Promise.all([
      origemDoAcervo(),
      dimensoesDoAcervo(),
    ]);
    return { origem, dimensoes };
  } catch (erro) {
    // Sinal do próprio Next (ver o mesmo comentário em `lerAcervoDaApi`,
    // `src/lib/concursos.ts`) não é falha do acervo e segue para cima, sem
    // virar degradação nem log.
    unstable_rethrow(erro);
    console.error(
      "[layout] acervo indisponível ao montar o cabeçalho; a página segue sem " +
        "a faixa de origem e sem contagem de estado na busca.",
      erro,
    );
    return { origem: null, dimensoes: { total: 0, comUf: 0, comEsfera: 0 } };
  }
}

/**
 * `async` por causa de uma leitura só: o acervo que a faixa de origem e a
 * busca do cabeçalho precisam.
 *
 * Ela fica no layout, e não em cada página, porque é o único lugar onde
 * nenhuma página nova pode esquecer de mostrá-la: a coisa que ela avisa, o
 * mock se passando por acervo, é justamente a que ninguém nota quando falta.
 * Não custa requisição: a leitura do acervo fica guardada no processo por
 * cinco minutos (`concursos.ts`), e sem `BC_API_URL` não há requisição
 * nenhuma. No build ela não congela o mock: com `BC_API_URL` fora do ar o
 * build falha, e sem a variável a faixa diz que é o mock.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { origem, dimensoes } = await acervoDoLayout();

  return (
    // `suppressHydrationWarning` é o que faltava para o aviso "A tree hydrated
    // but some attributes of the server rendered HTML didn't match" sumir. O
    // script de tema logo abaixo escreve `data-tema` no `<html>` ANTES de o
    // React hidratar (é o ponto dele, senão quem escolheu o escuro vê um
    // lampejo claro), e o servidor não tem como saber o que vai estar lá. A
    // divergência é deliberada e acontece em toda carga.
    //
    // O prop vale só para os atributos deste elemento, um nível: não esconde
    // divergência de nenhum filho. Antes deste conserto o mesmo aviso foi
    // atribuído à barra de busca e tratado com `autoComplete="off"`, que é
    // correto por outro motivo mas não era a causa: o log do `next dev`
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
        <GoogleTagManager />
        <SessionProvider>
          <DadosEstruturados dados={dadosEstruturados} />
          {/* `null` só quando o acervo falhou ao montar o layout
              (`acervoDoLayout`): sem origem para dizer, a faixa fica calada
              em vez de afirmar "api" ou "mock" sem ter lido nenhum dos dois. */}
          {origem && <AvisoDeOrigem origem={origem} />}
          <Cabecalho dimensoes={dimensoes} />
          <main className="flex-1">{children}</main>
          <Rodape />
        </SessionProvider>
      </body>
    </html>
  );
}
