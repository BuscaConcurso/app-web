"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCompartilhar } from "@/components/concurso/useCompartilhar";
import { BarraBuscaDoCabecalho } from "@/components/busca/BarraBusca";
import { Logo } from "@/components/marca/Logo";
import { BotaoEmBreve, AvisoFlutuante } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import { urlAbsoluta } from "@/lib/site";
import { MenuConta } from "./MenuConta";
import { BarraUtilitaria } from "./BarraUtilitaria";
import { GavetaDeNavegacao, NavPrincipal } from "./NavPrincipal";

/**
 * O cabeçalho: a barra utilitária e, embaixo dela, a nav.
 *
 * `atualizadoEm` chega pronto de `src/app/layout.tsx`: a data quando o
 * acervo veio da API, `null` quando não. É a `BarraUtilitaria` quem decide se
 * mostra a frase.
 *
 * **Duas navs, conforme a página** (ruling R27):
 *
 * - Na home, `Main.dc.html:34-51`: logo, as cinco abas (com ícone a partir
 *   de 1440px) ocupando o meio, e o grupo da direita com salvos, alertas e
 *   Entrar, 8px entre eles. Sem busca: quem busca lá é o herói.
 * - Nas páginas internas, `Concurso.dc.html:34-56`: logo, a busca compacta
 *   (até 520px), espaço, três abas em texto, alertas e Entrar.
 *
 * Abaixo de `lg` as duas viram o cabeçalho do celular (`Mobile.dc.html:21-25`,
 * ruling R15): logo, alertas e o menu, em 64px; fora da home a busca desce
 * para uma fileira própria, de largura inteira. **Uma busca só, nunca duas
 * montadas**: a mesma caixa é reposicionada por CSS. A `<nav>` é
 * `flex-wrap`; a busca nasce `order-last basis-full` (quebra para a fileira
 * de baixo) e vira `lg:order-none lg:flex-1` (volta para o lado da logo).
 *
 * A fileira mora no `conteudo` (ruling R28): de 1280px para cima ela é a
 * do artboard de 1440px.
 *
 * **O cabeçalho do celular na página do concurso** (`ConcursoMobile.dc.html:21-27`)
 * é outro, de 60px: voltar, o símbolo da marca, compartilhar e salvar.
 * `usePathname` decide (`naPaginaDoConcurso`): `/concursos/<slug>` e não
 * `/concursos`. Nessas páginas a nav de sempre só fica `hidden` abaixo de
 * `lg`.
 */
export function Cabecalho({ atualizadoEm }: { atualizadoEm: string | null }) {
  const caminho = usePathname();
  const naHome = caminho === "/";
  const segmentos = caminho.split("/").filter(Boolean);
  const naPaginaDoConcurso = segmentos[0] === "concursos" && segmentos.length > 1;

  const classeDaNav = `${naPaginaDoConcurso ? "hidden lg:block" : "block"} border-b border-linha bg-cartao`;
  const classeDaFileira = [
    "conteudo flex flex-wrap items-center gap-x-1",
    "lg:h-[76px] lg:flex-nowrap lg:gap-x-6",
    naHome ? "xl:gap-x-10" : "xl:gap-x-7",
  ].join(" ");

  return (
    <header className="bg-cartao">
      <BarraUtilitaria atualizadoEm={atualizadoEm} />

      {naPaginaDoConcurso && <CabecalhoCelularDoConcurso />}

      <nav aria-label="Principal" className={classeDaNav}>
        <div className={classeDaFileira}>
          <Link
            href="/"
            aria-label="BuscaConcurso, página inicial"
            className="flex h-16 shrink-0 items-center lg:h-auto"
          >
            <span className="lg:hidden">
              <Logo tamanho={32} />
            </span>
            {/* Entre 1024 e 1279px só o símbolo: com a palavra, a busca das
                páginas internas ficava com uns 130px. */}
            <span className="hidden lg:block xl:hidden">
              <Logo variante="simbolo" tamanho={36} />
            </span>
            <span className="hidden xl:block">
              <Logo tamanho={36} />
            </span>
          </Link>

          {!naHome && (
            <div className="order-last min-w-0 basis-full pb-3 lg:order-none lg:max-w-[520px] lg:flex-1 lg:basis-auto lg:pb-0">
              <BarraBuscaDoCabecalho />
            </div>
          )}

          <NavPrincipal className={naHome ? "lg:flex-1" : "lg:ml-auto"} />

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0 lg:gap-2">
            {naHome && (
              <BotaoEmBreve
                recurso="salvos"
                aria-label="Salvos"
                className="hidden size-11 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada lg:flex"
              >
                <Icone nome="salvar" tamanho={20} />
              </BotaoEmBreve>
            )}

            <BotaoEmBreve
              recurso="alertas"
              aria-label="Meus alertas"
              className="relative flex size-11 shrink-0 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
            >
              <Icone nome="alerta" tamanho={20} />
              {/* A bolinha de aviso, `Main.dc.html:48`: sinal só, sem número. */}
              <span
                aria-hidden="true"
                className="absolute top-[10px] right-[11px] size-2 rounded-full bg-urucum ring-2 ring-cartao"
              />
            </BotaoEmBreve>

            <div className="hidden lg:flex">
              <MenuConta />
            </div>

            <GavetaDeNavegacao />
          </div>
        </div>
      </nav>
    </header>
  );
}

/**
 * O cabeçalho de 60px da página do concurso no celular
 * (`ConcursoMobile.dc.html:21-27`): voltar, o símbolo da marca, compartilhar
 * e salvar. `lg:hidden` porque a partir de `lg` a nav de sempre volta.
 *
 * **Voltar** usa `router.back()` só quando `document.referrer` é do mesmo
 * host (voltou de outra página deste site); de fora do site, ou sem
 * histórico nenhum, vai para `/concursos` em vez de sair do site ou travar
 * numa pilha de histórico vazia.
 *
 * **Compartilhar** reaproveita `useCompartilhar` (o mesmo de
 * `AcoesDoConcurso`), com o título da aba e o endereço da página atual: o
 * cabeçalho não recebe o concurso como prop, só a rota já diz qual é.
 */
function CabecalhoCelularDoConcurso() {
  const router = useRouter();
  const caminho = usePathname();
  const { compartilhar, aviso } = useCompartilhar({
    titulo: typeof document !== "undefined" ? document.title : "",
    url: urlAbsoluta(caminho),
  });

  function voltar() {
    if (typeof document !== "undefined" && document.referrer) {
      try {
        if (new URL(document.referrer).host === window.location.host) {
          router.back();
          return;
        }
      } catch {
        // `document.referrer` malformado: cai no destino fixo abaixo.
      }
    }
    router.push("/concursos");
  }

  return (
    <div className="flex h-[60px] items-center gap-1 border-b border-linha bg-cartao px-2 lg:hidden">
      <button
        type="button"
        onClick={voltar}
        aria-label="Voltar"
        className="flex size-11 shrink-0 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
      >
        <Icone nome="voltar" tamanho={22} />
      </button>

      <Link href="/" aria-label="BuscaConcurso, página inicial" className="flex shrink-0 items-center">
        <Logo variante="simbolo" tamanho={28} />
      </Link>

      <span className="grow" />

      <button
        type="button"
        onClick={compartilhar}
        aria-label="Compartilhar"
        className="flex size-11 shrink-0 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
      >
        <Icone nome="compartilhar" tamanho={20} />
      </button>

      <BotaoEmBreve
        recurso="salvos"
        aria-label="Salvar"
        className="flex size-11 shrink-0 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
      >
        <Icone nome="salvar" tamanho={20} />
      </BotaoEmBreve>

      {aviso && <AvisoFlutuante>{aviso}</AvisoFlutuante>}
    </div>
  );
}
