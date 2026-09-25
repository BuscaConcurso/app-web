"use client";

import {
  Suspense,
  useId,
  useRef,
  useSyncExternalStore,
  type FormEvent,
  type MouseEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sugestoes, useSugestoes } from "@/components/ui/Sugestoes";
import { Icone } from "@/components/ui/Icone";
import { UFS, type Uf } from "@/lib/dominio";
import { termoDaPagina } from "@/lib/enderecoDaBusca";
import { destinoDoFormulario } from "@/lib/parametros";
import {
  assinarTermosBuscados,
  termosBuscados,
  termosBuscadosNoServidor,
} from "@/lib/termosBuscados";
import { useAtalhoDeBusca } from "./useAtalhoDeBusca";

/**
 * A busca compacta do cabeçalho das páginas internas (ruling R27), transcrita
 * de `Concurso.dc.html:39-44`: uma cápsula de 46px, até 520px de largura,
 * raio de 12px, fundo `rebaixada`, lupa, campo de 15px e a dica de atalho
 * `/`. **Sem seletor de estado e sem botão**: Enter envia. Na home ela não
 * aparece (quem busca lá é `BuscaDoHero`, com estado e escolaridade).
 *
 * O esqueleto continua sendo um `<form method="get">` nativo: sem
 * JavaScript, Enter leva a `/concursos?q=...`, e o `proxy.ts` leva esse
 * endereço a `/busca/<slug>`. Com JavaScript a busca é navegação do cliente
 * (`router.push`), sem recarregar a página.
 *
 * O termo mostrado no campo sai do caminho (`termoDaPagina`): a barra está
 * no layout, que não recebe `searchParams`, e o termo mora em
 * `/busca/<slug>`. A UF da URL, quando existe, segue num campo escondido:
 * quem refina a busca dentro de um estado continua nele, e o filtro aparece
 * na coluna de filtros da página de resultados, onde pode ser tirado.
 *
 * ## O foco: o campo perde o anel, a cápsula ganha
 *
 * Em `<input>` o `:focus-visible` do navegador dispara também no clique do
 * mouse, então o anel aparecia sempre que alguém clicava para digitar. O
 * campo leva `data-sem-anel` (a regra de `globals.css`) e quem acende é a
 * cápsula inteira, com `has-[input:focus]`, nos 2px de `acao` do anel
 * global. Quem navega por teclado continua vendo onde está.
 *
 * ## Clicar em qualquer lugar da cápsula foca o campo
 *
 * A lupa e a dica `/` são decoração; o clique nelas vai para o campo.
 *
 * ## A lista de sugestões
 *
 * Ao focar, o campo abre a lista dos últimos termos que deram resultado. Ela
 * é aprimoramento: sem JavaScript não há `localStorage`, não há lista, e a
 * barra é o mesmo `<form method="get">` de sempre. Quem escreve na memória é
 * a página de resultados (`RegistroDaBusca`), a única que sabe quantos
 * resultados a busca deu; a barra só lê.
 *
 * ## O atalho "/"
 *
 * `useAtalhoDeBusca`, o mesmo do herói da home: "/" fora de um campo foca
 * esta caixa.
 */
export function BarraBusca({ uf }: { uf?: Uf }) {
  const caminho = usePathname();
  const router = useRouter();
  const q = termoDaPagina(caminho);

  const idCampo = `${useId()}-q`;

  const termos = useSyncExternalStore(
    assinarTermosBuscados,
    termosBuscados,
    termosBuscadosNoServidor,
  );

  const formulario = useRef<HTMLFormElement>(null);
  const campoDeTexto = useRef<HTMLInputElement>(null);
  useAtalhoDeBusca(campoDeTexto);

  const { raiz, campo, lista } = useSugestoes({
    itens: termos,
    /** Escolher uma sugestão é buscar por ela, pelo mesmo caminho do Enter. */
    aoEscolher: (termo) => {
      const campoDeBusca = campoDeTexto.current;
      if (!campoDeBusca) return;
      campoDeBusca.value = termo;
      formulario.current?.requestSubmit();
    },
  });

  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    router.push(
      destinoDoFormulario(String(dados.get("q") ?? ""), String(dados.get("uf") ?? "")),
    );
  };

  const aoClicarNaBarra = (evento: MouseEvent<HTMLFormElement>) => {
    const dentro = evento.currentTarget;
    const focado = document.activeElement;
    if (focado && focado !== document.body && dentro.contains(focado)) return;
    campoDeTexto.current?.focus();
  };

  return (
    <div ref={raiz} className="relative w-full">
      <form
        ref={formulario}
        action="/concursos"
        method="get"
        role="search"
        onSubmit={aoEnviar}
        onClick={aoClicarNaBarra}
        className="flex h-[46px] w-full cursor-text items-center gap-2.5 rounded-[12px] bg-rebaixada pr-2 pl-3.5 outline-acao outline-offset-2 has-[input:focus]:outline-2"
      >
        <Icone nome="busca" tamanho={18} className="shrink-0 text-tinta-600" />
        <label htmlFor={idCampo} className="sr-only">
          Buscar concursos
        </label>
        {/*
          `autoComplete="off"`: o navegador restaura o valor do campo no
          recarregamento, antes de o React hidratar, e o que ele restaura
          diverge do que o servidor renderizou.

          `key={caminho}`: a barra não remonta entre páginas, e
          `defaultValue` só vale na montagem. Com a chave, ao navegar para
          outra busca o campo nasce de novo com o termo novo.
        */}
        <input
          key={caminho}
          ref={campoDeTexto}
          id={idCampo}
          name="q"
          type="search"
          enterKeyHint="search"
          defaultValue={q}
          autoComplete="off"
          placeholder="Buscar cargo, órgão ou banca"
          data-sem-anel=""
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-tinta-900 outline-none placeholder:text-tinta-500 [&::-webkit-search-cancel-button]:hidden"
          {...campo}
        />
        {uf && <input type="hidden" name="uf" value={uf} />}
        <kbd
          aria-hidden="true"
          className="hidden h-6 min-w-6 shrink-0 items-center justify-center rounded-[6px] bg-cartao px-1 text-[12px] font-semibold text-tinta-600 shadow-[inset_0_-1px_0_var(--color-contorno)] sm:flex"
        >
          /
        </kbd>
      </form>

      <Sugestoes rotulo="Buscas recentes que deram resultado" lista={lista} />
    </div>
  );
}

/**
 * A barra do cabeçalho com a UF da URL.
 *
 * A UF da URL só existe via `useSearchParams`, e numa página estática isso
 * obriga um `Suspense`: o HTML leva a barra sem a UF (o `fallback`) e o
 * navegador desenha a que leu a URL. As duas têm a mesma caixa, então a
 * troca não desloca nada.
 */
export function BarraBuscaDoCabecalho() {
  return (
    <Suspense fallback={<BarraBusca />}>
      <BarraBuscaComUfDaUrl />
    </Suspense>
  );
}

function BarraBuscaComUfDaUrl() {
  const bruta = useSearchParams().get("uf") ?? "";
  const uf = (UFS as readonly string[]).includes(bruta) ? (bruta as Uf) : undefined;
  return <BarraBusca uf={uf} />;
}
