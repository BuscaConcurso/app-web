"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ConsultaNoNavegadorProvider } from "./LinkDaConsulta";
import { ListaDeResultados } from "./ListaDeResultados";
import { aplicarConsulta } from "@/lib/buscaLocal";
import type { AvisoDoAcervo, DimensoesDoAcervo } from "@/lib/concursos";
import type { ConcursoResumo } from "@/lib/dominio";
import { termoDoSlug } from "@/lib/enderecoDaBusca";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";
import { lerConsulta, parametrosDaUrl, type Parametros } from "@/lib/parametros";

export interface DadosDaBusca {
  slug: string;
  titulo: string;
  itens: ConcursoResumo[];
  aviso: AvisoDoAcervo | null;
  dimensoes: DimensoesDoAcervo;
}

/**
 * A lista de `/busca/<slug>` para uma query já lida.
 *
 * Existe separada de `ResultadosDaBuscaNaUrl` porque é também o `fallback`
 * do `Suspense`: no HTML pré-renderizado vai a primeira página sem filtro,
 * que é exatamente o canônico, e é isso que o buscador lê. No navegador a
 * versão que lê a URL toma o lugar dela.
 *
 * `hoje` num `useState` com inicializador, e não o relógio solto no render:
 * a regra de pureza do React trata relógio no corpo do componente como efeito
 * colateral. É a data civil de São Paulo, e não a do fuso do navegador, para
 * "abertas" e "encerrando" darem o mesmo que /concursos no servidor.
 */
export function ResultadosDaBusca({
  parametros,
  ...dados
}: DadosDaBusca & { parametros: Parametros }) {
  const [hoje] = useState(() => hojeCivilEmSaoPaulo());
  const consulta = lerConsulta({ ...parametros, q: termoDoSlug(dados.slug) });
  const { resultado, contagens } = aplicarConsulta(dados.itens, consulta, hoje);
  // O provedor liga os links de filtro, chip, ordenação e página ao
  // `history.pushState` (ver `LinkDaConsulta`): a lista inteira já está aqui,
  // e buscar de novo o payload do termo só para trocar a query seria rede à
  // toa.
  return (
    <ConsultaNoNavegadorProvider>
      <ListaDeResultados
        consulta={consulta}
        titulo={dados.titulo}
        resultado={resultado}
        contagens={contagens}
        aviso={dados.aviso}
        dimensoes={dados.dimensoes}
        hoje={hoje}
      />
    </ConsultaNoNavegadorProvider>
  );
}

/** A mesma lista, com a query da barra de endereço. Mora dentro de `Suspense`. */
export function ResultadosDaBuscaNaUrl(dados: DadosDaBusca) {
  const busca = useSearchParams();
  return <ResultadosDaBusca {...dados} parametros={parametrosDaUrl(busca)} />;
}
