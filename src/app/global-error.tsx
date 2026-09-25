"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Archivo, Literata } from "next/font/google";
import "./globals.css";
import { Botao } from "@/components/ui/Botao";
import { Rotulo } from "@/components/ui/Etiqueta";
import { NOME_SITE } from "@/lib/site";
import { SCRIPT_DO_TEMA } from "@/lib/tema";

/**
 * O último recurso: a tela que aparece quando o próprio `layout.tsx` raiz
 * lança durante o render.
 *
 * **Por que existe além de `error.tsx`.** `error.js` embrulha `loading.js`,
 * `not-found.js`, `page.js` e os `layout.js` abaixo dele, mas não o
 * `layout.tsx` raiz nem o que ele monta diretamente na própria árvore (a
 * leitura do acervo do layout, em `acervoDoLayout`, já degrada em vez de
 * lançar por essa razão; e o rodapé, em `Rodape.tsx`, faz o mesmo com os
 * cargos em destaque). Ainda assim, um terceiro ponto sem rede de proteção
 * bastaria para chegar aqui: qualquer outra leitura nova que algum dia entrar
 * no `layout.tsx` sem o mesmo cuidado, ou um erro que não é de dado nenhum.
 * Sem este arquivo, esse caminho cairia na página padrão do Next, sem
 * identidade do site e sem link de volta (doc lida antes de escrever este
 * arquivo:
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`,
 * seção "Global Error").
 *
 * **Documento próprio.** `global-error` substitui o `layout.tsx` inteiro, e a
 * doc é explícita: ele precisa das próprias tags `<html>` e `<body>`, e de
 * importar estilo global e fonte por conta própria, porque nada do layout
 * raiz roda quando ele aparece. Por isso os mesmos `next/font/google` do
 * layout voltam aqui, e `globals.css` é importado de novo.
 *
 * **Sem `metadata`.** Limite de erro só existe como Client Component, e a
 * doc diz que `metadata`/`generateMetadata` não são suportados aqui; o
 * título vem de uma tag `<title>` escrita à mão dentro do `<head>`.
 *
 * **`<Link>` funciona aqui.** O contexto do roteador não é obra do
 * `layout.tsx` que falhou: é o próprio runtime do Next que o injeta acima
 * de qualquer layout de usuário, então `next/link` continua navegando sem
 * recarregar a página mesmo com o layout raiz derrubado.
 *
 * **Sem leitura de dado nenhuma.** Esta tela não pode depender do acervo:
 * se ela lesse `concursos.ts` e a API estivesse fora do ar, a página de
 * último recurso falharia pelo mesmo motivo que a trouxe à tela.
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

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang="pt-BR"
      className={`${literata.variable} ${archivo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <title>{`Algo deu errado · ${NOME_SITE}`}</title>
        <meta name="robots" content="noindex" />
        {/* Mesmo script do layout raiz: sem ele, esta tela pintaria sempre no
            tema claro e ignoraria a escolha de quem já usa o site. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col items-center justify-center bg-pagina px-4 py-10 font-interface text-tinta-900">
        <div className="w-full max-w-[480px] rounded-cartao bg-cartao px-6 py-14 text-center sm:py-16">
          <Rotulo>Erro</Rotulo>
          <h1 className="mt-2 font-titulo text-2xl font-semibold text-tinta-900 sm:text-[28px]">
            Algo deu errado ao carregar o site
          </h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 break-words text-tinta-600">
            O acervo pode estar fora do ar por um instante. Tente de novo em
            alguns segundos, ou volte para a home.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Botao variante="primario" onClick={() => retry()}>
              Tentar de novo
            </Botao>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-controle bg-rebaixada px-[18px] text-sm font-medium text-tinta-900 transition-colors hover:bg-linha"
            >
              Ir para a home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
