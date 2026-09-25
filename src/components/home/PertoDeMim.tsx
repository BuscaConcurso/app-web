"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AvisoFlutuante } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import type { Uf } from "@/lib/dominio";
import { ufDeCoordenada, type Contornos } from "@/lib/localizacao";
import {
  assinarUfLembrada,
  lembrarUf,
  ufLembrada,
  ufLembradaNoServidor,
} from "@/lib/ufLembrada";

/** A mesma cápsula dos outros atalhos do herói, `Main.dc.html:72-77`. */
export const CLASSE_CHIP_DO_HERO =
  "inline-flex h-[38px] items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]";

/** Para onde vai a lista de abertos do estado, ou a de todo o Brasil. */
export function destinoPertoDeMim(uf: Uf | null): string {
  return uf ? `/concursos?situacao=abertas&uf=${uf}` : "/concursos?situacao=abertas";
}

type Falha = "negada" | "falhou" | "fora";

const AVISO_DA_FALHA: Record<Falha, string> = {
  negada: "Sem acesso à localização. Escolha o estado na lista.",
  falhou: "Não deu para descobrir seu estado. Escolha na lista.",
  fora: "Você parece estar fora do Brasil. Escolha o estado na lista.",
};

/**
 * Pergunta a posição ao navegador e acha o estado nos contornos do próprio
 * site (`lib/localizacao.ts`): a coordenada não sai da máquina. O arquivo de
 * contornos só é baixado depois da permissão.
 */
async function detectarUf(): Promise<Uf | Falha> {
  if (!window.isSecureContext || !("geolocation" in navigator)) return "negada";
  try {
    const posicao = await new Promise<GeolocationPosition>((resolver, rejeitar) =>
      navigator.geolocation.getCurrentPosition(resolver, rejeitar, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000,
      }),
    );
    const resposta = await fetch("/geo/uf.json");
    if (!resposta.ok) return "falhou";
    const contornos: Contornos = await resposta.json();
    return ufDeCoordenada(contornos, posicao.coords.longitude, posicao.coords.latitude) ?? "fora";
  } catch (erro) {
    const negada =
      typeof GeolocationPositionError !== "undefined" &&
      erro instanceof GeolocationPositionError &&
      erro.code === erro.PERMISSION_DENIED;
    return negada ? "negada" : "falhou";
  }
}

/**
 * O chip "Perto de mim" do herói, e também o link "Usar minha localização"
 * do mapa por estado (`PorEstado.tsx`, `Main.dc.html:311`).
 *
 * **A localização só é pedida no clique**: nenhuma página pede
 * sozinha ao carregar. "Perto de mim" com um estado já lembrado
 * (`ufLembrada`) vai direto para a lista dele; sem estado, e sempre em
 * "Usar minha localização" (`sempreDetectar`), o clique pede a posição,
 * lembra o estado achado e abre a lista dele. Recusa, falha ou posição fora
 * do Brasil viram um aviso, e a pessoa fica onde estava.
 *
 * O esqueleto é um link de verdade: sem JavaScript ele leva à lista (do
 * estado lembrado, ou de todo o Brasil).
 */
export function PertoDeMim({
  className = CLASSE_CHIP_DO_HERO,
  id,
  children = "Perto de mim",
  sempreDetectar = false,
}: {
  className?: string;
  id?: string;
  children?: ReactNode;
  sempreDetectar?: boolean;
} = {}) {
  const router = useRouter();
  const uf = useSyncExternalStore(assinarUfLembrada, ufLembrada, ufLembradaNoServidor);
  const [procurando, setProcurando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(temporizador.current), []);

  async function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    if (uf && !sempreDetectar) return;
    // Abrir em outra aba (ctrl, cmd, shift ou botão do meio) segue o link
    // como qualquer outro, sem pedir localização.
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey || evento.button !== 0) {
      return;
    }
    evento.preventDefault();
    if (procurando) return;
    setAviso(null);
    setProcurando(true);
    const achado = await detectarUf();
    setProcurando(false);
    if (achado === "negada" || achado === "falhou" || achado === "fora") {
      setAviso(AVISO_DA_FALHA[achado]);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setAviso(null), 4000);
      return;
    }
    lembrarUf(achado);
    router.push(destinoPertoDeMim(achado));
  }

  return (
    <>
      <Link
        id={id}
        href={destinoPertoDeMim(uf)}
        onClick={aoClicar}
        aria-busy={procurando || undefined}
        className={className}
      >
        <Icone nome="mira" tamanho={16} />
        {procurando ? "Procurando seu estado…" : children}
      </Link>
      <AvisoFlutuante>{aviso}</AvisoFlutuante>
    </>
  );
}
