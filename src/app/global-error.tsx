"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NOME_SITE } from "@/lib/site";

/**
 * O último recurso: a tela que aparece quando o próprio `layout.tsx` raiz
 * lança durante o render.
 *
 * **Por que existe além de `error.tsx`.** `error.js` embrulha `loading.js`,
 * `not-found.js`, `page.js` e os `layout.js` abaixo dele, mas não o
 * `layout.tsx` raiz nem o que ele monta diretamente na própria árvore. Ainda
 * assim, um ponto sem rede de proteção bastaria para chegar aqui. Sem este
 * arquivo, esse caminho cairia na página padrão do Next, sem identidade do
 * site e sem link de volta (doc lida antes de escrever este arquivo:
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`,
 * seção "Global Error").
 *
 * **Documento próprio, e sem nada além dele.** `global-error` substitui o
 * `layout.tsx` inteiro, e a doc é explícita: ele precisa das próprias tags
 * `<html>` e `<body>`. Diferente do resto do site, ele não importa
 * `globals.css` nem usa classe do Tailwind, e não carrega o Bricolage
 * Grotesque nem o Public Sans por `next/font`: o que quebrou pode ter sido o
 * próprio layout que injeta a folha de estilo, e um crash antes disso deixaria
 * esta tela sem uma regra sequer, texto em cima de texto. Por isso as cores e
 * a fonte são inline, com `system-ui`, e os únicos três hex do sistema todo
 * fora dos azulejos, do logo e da imagem de OG: Papel `#F6F4EE`, tinta
 * `#0F1F17`, botão `#0B6B3A`.
 *
 * **Sem tema escuro.** Pela mesma razão: alternar de tema aqui dependeria do
 * script que o `layout.tsx` injeta (`SCRIPT_DO_TEMA`), e este arquivo não
 * pode presumir que ele rodou. A tela fica sempre no claro fixo.
 *
 * **Sem `metadata`.** Limite de erro só existe como Client Component, e a
 * doc diz que `metadata`/`generateMetadata` não são suportados aqui; o
 * título vem de uma tag `<title>` escrita à mão dentro do `<head>`.
 *
 * **`<Link>` funciona aqui.** O contexto do roteador não é obra do
 * `layout.tsx` que falhou: é o próprio runtime do Next que o injeta acima
 * de qualquer layout de usuário, então `next/link` continua navegando sem
 * recarregar a página mesmo com o layout raiz derrubado, e sem precisar de
 * CSS nenhum para isso.
 *
 * **Sem leitura de dado nenhuma.** Esta tela não pode depender do acervo:
 * se ela lesse `concursos.ts` e a API estivesse fora do ar, a página de
 * último recurso falharia pelo mesmo motivo que a trouxe à tela.
 */
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
    <html lang="pt-BR">
      <head>
        <title>{`Algo deu errado · ${NOME_SITE}`}</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: "40px 16px",
          background: "#F6F4EE",
          color: "#0F1F17",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Erro
        </p>
        <h1 style={{ margin: 0, maxWidth: 480, fontSize: 26, fontWeight: 700 }}>
          Algo deu errado ao carregar o site
        </h1>
        <p style={{ margin: 0, maxWidth: 440, fontSize: 14, lineHeight: 1.6 }}>
          O acervo pode estar fora do ar por um instante. Tente de novo em
          alguns segundos, ou volte para a home.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: 44,
              padding: "0 22px",
              border: "none",
              borderRadius: 11,
              background: "#0B6B3A",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 18px",
              borderRadius: 11,
              background: "#EAE6DA",
              color: "#0F1F17",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Ir para a home
          </Link>
        </div>
      </body>
    </html>
  );
}
