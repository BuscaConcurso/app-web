"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { caminhoParaVoltar, hrefParaEntrar } from "@/lib/salvos";

/**
 * O botão de salvar ou lembrar de quem não entrou: um link para `/entrar`
 * que volta para esta página. O `href` leva só o caminho (serve para abrir
 * noutra aba e sem JavaScript); no clique comum, a volta inclui a query da
 * página, lida naquele momento. Navegação completa e não `useRouter`: é uma
 * ida só até a tela de entrar, e assim o botão renderiza fora do app router.
 */
export function LinkParaEntrar({
  className,
  ariaLabel,
  children,
}: {
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const caminho = usePathname();

  function entrar(evento: MouseEvent<HTMLAnchorElement>) {
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0) return;
    evento.preventDefault();
    window.location.assign(hrefParaEntrar(caminhoParaVoltar(window.location)));
  }

  return (
    <Link href={hrefParaEntrar(caminho)} aria-label={ariaLabel} className={className} onClick={entrar}>
      {children}
    </Link>
  );
}
