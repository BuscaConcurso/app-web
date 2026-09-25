"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icone } from "@/components/ui/Icone";
import { Gaveta } from "@/components/ui/Revelador";
import { useSession } from "@/lib/auth/session";
import { ITENS_DA_NAV } from "./itensDaNav";
import { SeletorDeTema } from "./SeletorDeTema";

export { ITENS_DA_NAV, type ItemDaNav } from "./itensDaNav";

/** A caixa vazia: nenhuma query, para a versão sem estado ativo. */
const SEM_BUSCA = new URLSearchParams();

function Abas({
  caminho,
  busca,
  naHome,
}: {
  caminho: string;
  busca: URLSearchParams;
  naHome: boolean;
}) {
  return (
    <>
      {ITENS_DA_NAV.filter((item) => naHome || !item.soNaHome).map((item) => {
        const ativo = item.ativo(caminho, busca);
        return (
          <Link
            key={item.rotulo}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-3 text-[15px] whitespace-nowrap ${
              ativo
                ? "bg-verde-fundo font-semibold text-verde-texto"
                : "font-medium text-tinta-900 hover:bg-rebaixada"
            }`}
          >
            {/* Ícone só na home e só a partir de `xl`, onde o `conteudo`
                já tem os 1216px do artboard: abaixo disso as cinco abas com
                ícone não cabem ao lado da logo e do grupo da direita. */}
            {naHome && (
              <Icone nome={item.icone} tamanho={18} className="hidden xl:block" />
            )}
            {item.rotulo}
          </Link>
        );
      })}
    </>
  );
}

/** A parte que sabe a aba ativa: só ela paga o custo de `useSearchParams`. */
function AbasComBusca({ caminho, naHome }: { caminho: string; naHome: boolean }) {
  const busca = useSearchParams();
  return <Abas caminho={caminho} busca={busca} naHome={naHome} />;
}

/**
 * A nav de abas do cabeçalho, a partir de `lg`; abaixo disso quem leva os
 * mesmos itens é a gaveta (`GavetaDeNavegacao`).
 *
 * Na home são as cinco abas de `Main.dc.html:39-45`. Nas páginas internas a
 * fileira é dividida com a busca compacta e leva só Abertos,
 * Previstos e Diário Oficial, em texto (`Concurso.dc.html:47-49`).
 *
 * `useSearchParams` pede um limite de `<Suspense>` em rota estática (ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`):
 * o HTML sai com a nav sem nenhuma aba acesa (`caminho` vazio não casa com
 * rota nenhuma), e o cliente troca pela versão de verdade assim que sabe a
 * URL.
 */
export function NavPrincipal({ className }: { className?: string }) {
  const caminho = usePathname();
  const naHome = caminho === "/";
  return (
    <div className={`hidden items-center gap-1 lg:flex ${className ?? ""}`}>
      <Suspense fallback={<Abas caminho="" busca={SEM_BUSCA} naHome={naHome} />}>
        <AbasComBusca caminho={caminho} naHome={naHome} />
      </Suspense>
    </div>
  );
}

/**
 * A gaveta do celular, abaixo de `lg`: os mesmos `ITENS_DA_NAV` da nav de desktop, mais o seletor de tema. Fechar
 * ao navegar já é comportamento de `Gaveta` (`useRevelador`, `Revelador.tsx`).
 */
export function GavetaDeNavegacao({ className }: { className?: string }) {
  // Abaixo de `lg` o botão "Entrar" do cabeçalho some (só cabem logo,
  // alertas e menu, `Mobile.dc.html:21-25`), e sem esta linha a gaveta era o
  // único caminho que faltava: no celular não havia como entrar na conta.
  const logado = useSession().status === "authenticated";
  return (
    <Gaveta
      rotulo={<Icone nome="menu" tamanho={20} />}
      nome="Abrir menu"
      titulo="Menu"
      largura="estreita"
      gatilho="size-11 justify-center rounded-controle bg-rebaixada text-tinta-900 transition-colors hover:bg-linha"
      className={`lg:hidden ${className ?? ""}`}
    >
      <div className="flex flex-col gap-1">
        {ITENS_DA_NAV.flatMap((item) => {
          const classe =
            "h-11 items-center gap-3 rounded-controle px-3 text-[15px] font-medium text-tinta-900 hover:bg-rebaixada";
          const conteudo = (
            <>
              <Icone nome={item.icone} tamanho={18} />
              {item.rotulo}
            </>
          );
          // Com `hrefCelular`, dois links e só um visível por largura: o
          // destino de `href` não existe abaixo de `md`.
          if (!("hrefCelular" in item) || !item.hrefCelular) {
            return [
              <Link key={item.rotulo} href={item.href} className={`flex ${classe}`}>
                {conteudo}
              </Link>,
            ];
          }
          return [
            <Link key={`${item.rotulo}-celular`} href={item.hrefCelular} className={`flex md:hidden ${classe}`}>
              {conteudo}
            </Link>,
            <Link key={item.rotulo} href={item.href} className={`hidden md:flex ${classe}`}>
              {conteudo}
            </Link>,
          ];
        })}
      </div>

      <div className="mt-4 border-t border-linha pt-4">
        <Link
          href={logado ? "/conta" : "/entrar"}
          className="flex h-11 items-center gap-3 rounded-controle px-3 text-[15px] font-semibold text-tinta-900 hover:bg-rebaixada"
        >
          <Icone nome="entrar" tamanho={18} />
          {logado ? "Minha conta" : "Entrar"}
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-linha pt-4">
        <span className="text-[13px] font-medium text-tinta-600">Tema</span>
        <SeletorDeTema />
      </div>
    </Gaveta>
  );
}
