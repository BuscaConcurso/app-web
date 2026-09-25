import Link from "next/link";
import { BarraBuscaDoCabecalho } from "@/components/busca/BarraBusca";
import { Logo } from "@/components/marca/Logo";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import type { DimensoesDoAcervo } from "@/lib/concursos";
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
 * `NavPrincipal` (as abas) e `GavetaDeNavegacao` (a gaveta com os mesmos
 * itens) nunca aparecem juntas: o corte entre elas está em `NavPrincipal.tsx`
 * (`useCorteDaNav`), porque ele muda com a página, e não só com a largura da
 * tela. Fechar a gaveta ao navegar já é comportamento de `Gaveta`
 * (`useRevelador`, `Revelador.tsx`), sem nada extra a escrever aqui.
 */
export function Cabecalho({
  dimensoes,
  atualizadoEm,
}: {
  dimensoes: DimensoesDoAcervo;
  atualizadoEm: string | null;
}) {
  return (
    <header className="bg-cartao">
      <BarraUtilitaria atualizadoEm={atualizadoEm} />

      <nav
        aria-label="Principal"
        className="flex h-16 items-center gap-4 border-b border-linha bg-cartao px-4 md:h-[76px] md:gap-10 md:px-[112px]"
      >
        <Link
          href="/"
          aria-label="BuscaConcurso, página inicial"
          className="flex shrink-0 items-center"
        >
          <Logo tamanho={36} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-6">
          <NavPrincipal />
          <SoForaDaHome className="min-w-0 flex-1">
            <BarraBuscaDoCabecalho dimensoes={dimensoes} />
          </SoForaDaHome>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <BotaoEmBreve
            recurso="salvos"
            aria-label="Salvos"
            className="flex size-11 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
          >
            <Icone nome="salvar" tamanho={20} />
          </BotaoEmBreve>

          <BotaoEmBreve
            recurso="alertas"
            aria-label="Meus alertas"
            className="relative flex size-11 items-center justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
          >
            <Icone nome="alerta" tamanho={20} />
            {/* A bolinha de aviso, `Main.dc.html:48`: sinal só, sem número,
                porque não há contagem de alerta nenhuma para mostrar ainda. */}
            <span
              aria-hidden="true"
              className="absolute top-[10px] right-[11px] size-2 rounded-full bg-urucum ring-2 ring-cartao"
            />
          </BotaoEmBreve>

          <MenuConta />
        </div>

        <GavetaDeNavegacao />
      </nav>
    </header>
  );
}
