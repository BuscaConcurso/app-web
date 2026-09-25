"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { Icone } from "@/components/ui/Icone";
import { assinarUfLembrada, ufLembrada, ufLembradaNoServidor } from "@/lib/ufLembrada";

/** A mesma cápsula dos outros atalhos do herói, `Main.dc.html:72-77`. */
export const CLASSE_CHIP_DO_HERO =
  "inline-flex h-[38px] items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]";

/**
 * O chip "Perto de mim" do herói, e também o link "Usar minha localização"
 * do mapa por estado (`PorEstado.tsx`, `Main.dc.html:311`): a mesma lógica de
 * UF lembrada, só o desenho (e o texto) muda por chamador.
 *
 * Não pede geolocalização por conta própria: usa a UF já lembrada
 * (`ufLembrada`, a mesma memória da barra de busca do cabeçalho) para montar
 * `?uf=`. Sem UF lembrada, manda para a lista de abertos com `#localizacao`,
 * a âncora de onde a busca oferece detectar a localização.
 */
export function PertoDeMim({
  className = CLASSE_CHIP_DO_HERO,
  id,
  children = "Perto de mim",
}: {
  className?: string;
  id?: string;
  children?: ReactNode;
} = {}) {
  const uf = useSyncExternalStore(assinarUfLembrada, ufLembrada, ufLembradaNoServidor);
  const href = uf
    ? `/concursos?situacao=abertas&uf=${uf}`
    : "/concursos?situacao=abertas#localizacao";

  return (
    <Link id={id} href={href} className={className}>
      <Icone nome="mira" tamanho={16} />
      {children}
    </Link>
  );
}
