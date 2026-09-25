"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icone } from "@/components/ui/Icone";
import { Gaveta } from "@/components/ui/Revelador";
import { ITENS_DA_NAV } from "./itensDaNav";
import { SeletorDeTema } from "./SeletorDeTema";

export { ITENS_DA_NAV, type ItemDaNav } from "./itensDaNav";

/** A caixa vazia: nenhuma query, para a versão sem estado ativo. */
const SEM_BUSCA = new URLSearchParams();

function Abas({ caminho, busca }: { caminho: string; busca: URLSearchParams }) {
  return (
    <>
      {ITENS_DA_NAV.map((item) => {
        const ativo = item.ativo(caminho, busca);
        return (
          <Link
            key={item.rotulo}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex h-10 items-center gap-2 rounded-[10px] px-3 text-[15px] ${
              ativo
                ? "bg-verde-fundo font-semibold text-verde-texto"
                : "font-medium text-tinta-900 hover:bg-rebaixada"
            }`}
          >
            <Icone nome={item.icone} tamanho={18} />
            {item.rotulo}
          </Link>
        );
      })}
    </>
  );
}

/** A parte que sabe a aba ativa: só ela paga o custo de `useSearchParams`. */
function AbasComBusca({ caminho }: { caminho: string }) {
  const busca = useSearchParams();
  return <Abas caminho={caminho} busca={busca} />;
}

/**
 * O corte entre a nav de abas e a gaveta do celular muda com a página.
 *
 * Na home não há busca nenhuma disputando espaço com as abas (a busca
 * compacta some lá, ver `SoForaDaHome`), e as cinco cabem a partir de `lg`,
 * como o protótipo mede (`Main.dc.html:34-51`).
 *
 * Fora da home, a busca entra na mesma fileira, e as duas só cabem lado a
 * lado num monitor bem largo. Medido com os `112px` de margem do protótipo:
 * a logo, as cinco abas inteiras e o trio salvos/alertas/entrar somados já
 * passam de 1200px, e sobram só 166px para a cápsula de busca a 1440px (a
 * ponto de cortar o seletor de estado) e ainda menos que isso a `1600px`
 * (o botão "Buscar" cortava para "Busc"). A `1700px` o botão sai inteiro e
 * só o texto do campo é que abrevia; é o primeiro ponto sem corte visível,
 * medido por captura de tela. Por isso, fora da home, é a busca quem ocupa
 * o lugar das abas até esse ponto, e a gaveta do celular continua sendo o
 * caminho até `ITENS_DA_NAV` num intervalo bem mais largo do que na home.
 */
function useCorteDaNav() {
  const caminho = usePathname();
  const naHome = caminho === "/";
  return {
    caminho,
    classeDasAbas: naHome ? "hidden lg:flex" : "hidden min-[1700px]:flex",
    classeDaGaveta: naHome ? "lg:hidden" : "min-[1700px]:hidden",
  };
}

/**
 * A nav de abas do cabeçalho: Abertos, Previstos, Diário Oficial, Áreas e
 * Estados (`Main.dc.html:39-45`), com a aba ativa acesa pela regra de
 * `ITENS_DA_NAV` (`./itensDaNav`).
 *
 * `useSearchParams` pede um limite de `<Suspense>` em rota estática (ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`),
 * e o remédio é o mesmo do `BarraBuscaDoCabecalho`: o HTML sai com a nav sem
 * nenhuma aba acesa (`caminho` vazio não casa com rota nenhuma), e o cliente
 * troca pela versão de verdade assim que sabe a URL.
 */
export function NavPrincipal({ className }: { className?: string }) {
  const { caminho, classeDasAbas } = useCorteDaNav();
  return (
    <div className={`${classeDasAbas} items-center gap-1 ${className ?? ""}`}>
      <Suspense fallback={<Abas caminho="" busca={SEM_BUSCA} />}>
        <AbasComBusca caminho={caminho} />
      </Suspense>
    </div>
  );
}

/**
 * A gaveta do celular (e da faixa `lg`-`xl` fora da home, ver `useCorteDaNav`):
 * os mesmos `ITENS_DA_NAV` da nav de desktop, mais o seletor de tema. Fechar
 * ao navegar já é comportamento de `Gaveta` (`useRevelador`, `Revelador.tsx`).
 */
export function GavetaDeNavegacao() {
  const { classeDaGaveta } = useCorteDaNav();
  return (
    <Gaveta
      rotulo={<Icone nome="menu" tamanho={20} />}
      nome="Abrir menu"
      titulo="Menu"
      largura="estreita"
      gatilho="size-11 justify-center rounded-controle text-tinta-900 transition-colors hover:bg-rebaixada"
      className={classeDaGaveta}
    >
      <div className="flex flex-col gap-1">
        {ITENS_DA_NAV.map((item) => (
          <Link
            key={item.rotulo}
            href={item.href}
            className="flex h-11 items-center gap-3 rounded-controle px-3 text-[15px] font-medium text-tinta-900 hover:bg-rebaixada"
          >
            <Icone nome={item.icone} tamanho={18} />
            {item.rotulo}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-linha pt-4">
        <span className="text-[13px] font-medium text-tinta-600">Tema</span>
        <SeletorDeTema />
      </div>
    </Gaveta>
  );
}
