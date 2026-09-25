"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Esconde o filho na home.
 *
 * A busca compacta do cabeçalho não aparece lá: a home tem a busca do herói
 * (fora do escopo desta tarefa), e duas caixas de busca na mesma tela
 * confundiriam qual delas vale.
 */
export function SoForaDaHome({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const caminho = usePathname();
  if (caminho === "/") return null;
  return <div className={className}>{children}</div>;
}
