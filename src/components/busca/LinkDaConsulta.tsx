"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";

/**
 * Liga o modo "consulta no navegador" para os links de filtro, ordenação,
 * chip e página que estiverem dentro. Quem liga é `ResultadosDaBusca`, em
 * `/busca/<slug>`; fora dele (em `/concursos`, em `/orgaos`) o valor é
 * `false` e os links são `next/link` comuns.
 */
const ConsultaNoNavegador = createContext(false);

export function ConsultaNoNavegadorProvider({ children }: { children: ReactNode }) {
  return <ConsultaNoNavegador.Provider value>{children}</ConsultaNoNavegador.Provider>;
}

/**
 * O link de uma consulta: filtro, chip, ordenação ou página.
 *
 * Em `/busca/<slug>` a página é estática e a lista já está inteira no
 * navegador (`buscaLocal.ts`). Um `next/link` ali buscaria de novo o payload
 * RSC do termo a cada clique (medido: 144 KB gzip e 2,3 MB de JSON para
 * "professor"), só para trocar a query. Então, quando o destino é o mesmo
 * caminho e só a query muda, o clique vira `history.pushState`, que o Next
 * liga ao `useSearchParams`
 * (node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md),
 * e a lista se refaz sem rede.
 *
 * O `href` continua de verdade no HTML: sem JavaScript e para o buscador, o
 * link funciona como qualquer âncora. Clique com modificador (nova aba,
 * nova janela) ou com `target` fica com o navegador.
 *
 * `rolarAoTopo` é da paginação: página nova se lê de cima. Filtro e chip
 * mantêm a posição, que é onde a pessoa estava mexendo.
 */
export function LinkDaConsulta({
  href,
  onClick,
  rolarAoTopo = false,
  ...resto
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string; rolarAoTopo?: boolean }) {
  const noNavegador = useContext(ConsultaNoNavegador);

  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    onClick?.(evento);
    if (!noNavegador || evento.defaultPrevented) return;
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) {
      return;
    }
    if (resto.target && resto.target !== "_self") return;
    const destino = new URL(href, window.location.href);
    if (destino.origin !== window.location.origin) return;
    if (destino.pathname !== window.location.pathname) return;
    evento.preventDefault();
    window.history.pushState(null, "", `${destino.pathname}${destino.search}`);
    if (rolarAoTopo) window.scrollTo({ top: 0 });
  }

  // Sem prefetch no modo do navegador: o clique não vai ao servidor, e cada
  // link visível pediria um pedaço de RSC à toa (medido: um por link, ao
  // entrar na tela).
  return (
    <Link
      href={href}
      onClick={aoClicar}
      {...(noNavegador ? { prefetch: false } : {})}
      {...resto}
    />
  );
}

/**
 * O formulário GET de uma consulta (a faixa de salário), com a mesma regra
 * do link: em `/busca/<slug>`, enviar para o mesmo caminho vira
 * `history.pushState` com a query que o navegador montaria, campo vazio
 * incluído, e a lista se refaz sem rede. Fora dali, e sem JavaScript, é o
 * `<form method="get">` de sempre.
 */
export function FormularioDaConsulta({
  action,
  onSubmit,
  ...resto
}: Omit<ComponentProps<"form">, "action" | "method"> & { action: string }) {
  const noNavegador = useContext(ConsultaNoNavegador);

  function aoEnviar(evento: Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0]) {
    onSubmit?.(evento);
    if (!noNavegador || evento.defaultPrevented) return;
    const destino = new URL(action, window.location.href);
    if (destino.origin !== window.location.origin) return;
    if (destino.pathname !== window.location.pathname) return;
    evento.preventDefault();
    const campos = new URLSearchParams();
    for (const [nome, valor] of new FormData(evento.currentTarget)) {
      if (typeof valor === "string") campos.append(nome, valor);
    }
    const query = campos.toString();
    window.history.pushState(null, "", query ? `${destino.pathname}?${query}` : destino.pathname);
  }

  return <form action={action} method="get" onSubmit={aoEnviar} {...resto} />;
}
