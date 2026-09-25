"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCompartilhar } from "@/components/concurso/useCompartilhar";
import { BarraBuscaDoCabecalho } from "@/components/busca/BarraBusca";
import { Logo } from "@/components/marca/Logo";
import { BotaoEmBreve, AvisoFlutuante } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import type { DimensoesDoAcervo } from "@/lib/concursos";
import { urlAbsoluta } from "@/lib/site";
import { MenuConta } from "./MenuConta";
import { BarraUtilitaria } from "./BarraUtilitaria";
import { GavetaDeNavegacao, NavPrincipal } from "./NavPrincipal";
import { SoForaDaHome } from "./SoForaDaHome";

/**
 * O cabeçalho: a barra utilitária e, embaixo dela, a nav de 76px do
 * protótipo novo (`Main.dc.html:23-51`).
 *
 * `atualizadoEm` chega pronto de `src/app/layout.tsx`: `dataCurta(hojeEmSaoPaulo())`
 * quando o acervo veio da API, `null` quando não. É a `BarraUtilitaria` quem
 * decide se mostra a frase, o cabeçalho só entrega o valor adiante.
 *
 * A busca compacta (`BarraBuscaDoCabecalho`) some na home, por trás de
 * `SoForaDaHome`: a home tem a busca do herói (fora do escopo desta tarefa),
 * e duas caixas de busca juntas confundiriam qual delas vale.
 *
 * **Uma `<BarraBuscaDoCabecalho>` só, nunca duas montadas ao mesmo tempo**
 * (R15 da revisão). Fora da home ela precisa aparecer em dois lugares
 * diferentes conforme a largura: ao lado das abas a partir de `lg`
 * (`Main.dc.html:48`), numa fileira própria de largura inteira abaixo de
 * `lg` (`Mobile.dc.html:21-27`). A primeira tentativa fez isso com dois
 * `<SoForaDaHome>` (um escondido por `hidden`, o outro visível): os dois
 * ficavam de pé ao mesmo tempo, porque `hidden` só esconde, não desmonta, e
 * a busca tem estado de verdade (o pedido de geolocalização, guardado numa
 * ref por instância) que não pode disparar duas vezes por carga de página.
 * A solução é a mesma caixa, reposicionada por CSS: `<nav>` é `flex-wrap`,
 * a busca nasce com `basis-full` (força a quebra de linha sozinha, depois
 * de logo/alertas/gaveta, que vêm antes na ordem) e vira `lg:flex-1
 * lg:order-2` (encaixa ao lado das abas, mesma ordem delas, resolvida pela
 * posição no código) a partir de `lg`. `min-h-*` no lugar de `h-*` no
 * `<nav>` é o que deixa a caixa crescer quando a fileira de baixo aparece,
 * sem cortar nem sobrepor a borda inferior.
 *
 * O alerta (`Meus alertas`) fica sempre visível, em qualquer largura
 * (`Mobile.dc.html:25`, `Main.dc.html:48`); salvos e o gatilho de conta
 * continuam só no desktop (`hidden lg:flex`).
 *
 * `NavPrincipal` (as abas) e `GavetaDeNavegacao` (a gaveta com os mesmos
 * itens) nunca aparecem juntas: o corte entre elas está em `NavPrincipal.tsx`
 * (`useCorteDaNav`), porque ele muda com a página, e não só com a largura da
 * tela. Fechar a gaveta ao navegar já é comportamento de `Gaveta`
 * (`useRevelador`, `Revelador.tsx`), sem nada extra a escrever aqui.
 *
 * **O cabeçalho do celular na página do concurso** (Task 14,
 * `ConcursoMobile.dc.html:21-27`) é outro, de 60px: voltar, o símbolo da
 * marca, compartilhar e salvar, sem busca nem abas. `usePathname` decide
 * (`naPaginaDoConcurso`, abaixo): `/concursos/<slug>` e não `/concursos`
 * (a lista continua com a nav de sempre), e é por isso que este componente
 * virou `"use client"`: o resto dele (`BarraUtilitaria`, `NavPrincipal`...)
 * não precisa de nada do cliente, só esta escolha precisa. Nessas páginas a
 * nav de 76/16 de sempre não desmonta, só fica `hidden` abaixo de `lg`
 * (`classeDaNav`), e ela volta a aparecer normalmente a partir dali, ao lado
 * da lateral da Task 14.
 */
export function Cabecalho({
  dimensoes,
  atualizadoEm,
}: {
  dimensoes: DimensoesDoAcervo;
  atualizadoEm: string | null;
}) {
  const caminho = usePathname();
  const segmentos = caminho.split("/").filter(Boolean);
  // `/concursos/<slug>`, não `/concursos` (a lista): a lista continua com a
  // nav de sempre em toda largura.
  const naPaginaDoConcurso = segmentos[0] === "concursos" && segmentos.length > 1;

  const classeDaNav = `${naPaginaDoConcurso ? "hidden lg:flex" : "flex"} min-h-16 flex-wrap items-center gap-x-4 gap-y-2 border-b border-linha bg-cartao px-4 md:min-h-[76px] md:gap-x-10 md:gap-y-3 md:px-[112px]`;

  return (
    <header className="bg-cartao">
      <BarraUtilitaria atualizadoEm={atualizadoEm} />

      {naPaginaDoConcurso && <CabecalhoCelularDoConcurso />}

      <nav aria-label="Principal" className={classeDaNav}>
        <Link
          href="/"
          aria-label="BuscaConcurso, página inicial"
          className="flex shrink-0 items-center"
        >
          <Logo tamanho={36} />
        </Link>

        <NavPrincipal className="order-2" />

        {/* O alerta fica visível em toda largura; salvos e a conta são só
            do desktop (abaixo). */}
        <BotaoEmBreve
          recurso="alertas"
          aria-label="Meus alertas"
          className="relative order-3 flex size-11 shrink-0 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
        >
          <Icone nome="alerta" tamanho={20} />
          {/* A bolinha de aviso, `Main.dc.html:48`: sinal só, sem número,
              porque não há contagem de alerta nenhuma para mostrar ainda. */}
          <span
            aria-hidden="true"
            className="absolute top-[10px] right-[11px] size-2 rounded-full bg-urucum ring-2 ring-cartao"
          />
        </BotaoEmBreve>

        <div className="order-4 hidden items-center gap-2 lg:flex">
          <BotaoEmBreve
            recurso="salvos"
            aria-label="Salvos"
            className="flex size-11 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
          >
            <Icone nome="salvar" tamanho={20} />
          </BotaoEmBreve>

          <MenuConta />
        </div>

        <GavetaDeNavegacao className="order-5" />

        {/* Abaixo de `lg`, `basis-full` força esta caixa (única) a quebrar
            para a própria linha, depois de logo/alertas/gaveta (ver a
            docstring acima). A partir de `lg` ela reencolhe e entra na
            mesma fileira das abas. */}
        <SoForaDaHome className="order-6 min-w-0 basis-full lg:order-2 lg:flex-1">
          <BarraBuscaDoCabecalho dimensoes={dimensoes} />
        </SoForaDaHome>
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
