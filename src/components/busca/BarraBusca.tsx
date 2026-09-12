"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { UFS, type Uf } from "@/lib/dominio";
import { ufDeCoordenada, type Contornos } from "@/lib/localizacao";
import { NOME_UF } from "@/lib/rotulos";
import {
  assinarUfLembrada,
  lembrarUf,
  ufLembrada,
  ufLembradaNoServidor,
} from "@/lib/ufLembrada";

/**
 * A barra de busca.
 *
 * O esqueleto continua sendo um `<form method="get">` nativo: submeter leva a
 * `/concursos?q=...&uf=...`, uma URL que o buscador rastreia e que funciona
 * antes de qualquer hidratação. O JavaScript daqui só acrescenta a
 * pré-seleção do estado, e a barra inteira segue funcionando sem ele.
 *
 * Três regras governam a detecção:
 *
 *   1. Nunca dispara busca sozinha. Preenche o seletor e avisa, e a pessoa
 *      decide. Localização que submete busca por conta própria tira o usuário
 *      de onde ele estava.
 *   2. Nunca pede permissão sem gesto. No primeiro acesso aparece um botão, e
 *      o prompt do navegador só sobe se a pessoa clicar nele. A exceção é
 *      quem já concedeu antes, caso em que a Permissions API permite resolver
 *      em silêncio, sem prompt.
 *   3. A coordenada não sai da máquina. Os contornos dos estados vêm do nosso
 *      próprio servidor e a conta acontece no navegador. O arquivo só é
 *      baixado depois da permissão, então quem recusa não paga por ele.
 */
type Origem = "detectada" | "lembrada";
type Estado = "ocioso" | "detectando" | "negada" | "falhou" | "fora";

/** Só é verdade depois da hidratação, sem `setState` em efeito nem piscar. */
function useHidratado(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function BarraBusca({
  q,
  uf,
  compacta = false,
}: {
  q?: string;
  uf?: string;
  compacta?: boolean;
}) {
  const hidratado = useHidratado();
  const lembrada = useSyncExternalStore(
    assinarUfLembrada,
    ufLembrada,
    ufLembradaNoServidor,
  );

  /** `null` significa que a pessoa não mexeu no seletor nesta navegação. */
  const [manual, setManual] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [detectada, setDetectada] = useState(false);

  // A UF da URL vem de uma escolha explícita e ganha da memória. O que a
  // pessoa mexer agora ganha das duas.
  const escolhida = manual ?? uf ?? lembrada ?? "";

  const origem: Origem | null = (() => {
    if (manual !== null || uf || !escolhida) return null;
    return detectada ? "detectada" : "lembrada";
  })();

  const detectar = useCallback(async () => {
    setEstado("detectando");
    try {
      const posicao = await new Promise<GeolocationPosition>(
        (resolver, rejeitar) =>
          navigator.geolocation.getCurrentPosition(resolver, rejeitar, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 10 * 60 * 1000,
          }),
      );

      const resposta = await fetch("/geo/uf.json");
      if (!resposta.ok) throw new Error("contornos indisponíveis");
      const contornos = (await resposta.json()) as Contornos;

      const encontrada = ufDeCoordenada(
        contornos,
        posicao.coords.longitude,
        posicao.coords.latitude,
      );

      if (!encontrada) {
        setEstado("fora");
        return;
      }
      setManual(null);
      setDetectada(true);
      setEstado("ocioso");
      lembrarUf(encontrada);
    } catch (erro) {
      const negada =
        typeof GeolocationPositionError !== "undefined" &&
        erro instanceof GeolocationPositionError &&
        erro.code === erro.PERMISSION_DENIED;
      setEstado(negada ? "negada" : "falhou");
    }
  }, []);

  useEffect(() => {
    // Já sabemos o estado por URL ou por memória: nada a descobrir.
    if (uf || lembrada) return;

    // Sem gesto, só resolve quem já concedeu antes. Aí não há prompt.
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((permissao) => {
        if (permissao.state === "granted") void detectar();
      })
      .catch(() => {
        // Navegador sem Permissions API fica com o botão, que é o caminho
        // seguro de qualquer forma.
      });
  }, [uf, lembrada, detectar]);

  const trocar = (valor: string) => {
    setManual(valor);
    setDetectada(false);
    setEstado("ocioso");
    lembrarUf((valor as Uf) || null);
  };

  const podeDetectar =
    hidratado &&
    "geolocation" in navigator &&
    !escolhida &&
    estado !== "detectando";

  const altura = compacta ? "h-9" : "h-11";
  const corpo = compacta ? "text-sm" : "text-base";

  return (
    <div>
      <form
        action="/concursos"
        method="get"
        role="search"
        className={`flex flex-col gap-2 rounded-caixa bg-cartao sm:flex-row sm:items-center ${
          compacta ? "p-2" : "p-2.5"
        }`}
      >
        <div className="flex flex-1 items-center gap-2.5 rounded-controle px-3">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-4 shrink-0 text-tinta-500"
          >
            <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="m13.6 13.6 3.2 3.2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <label htmlFor="busca-q" className="sr-only">
            Cargo, órgão ou banca
          </label>
          <input
            id="busca-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Cargo, órgão ou banca. Ex.: analista judiciário"
            className={`w-full bg-transparent text-tinta-900 outline-none placeholder:text-tinta-400 ${altura} ${corpo}`}
          />
        </div>

        <div className="flex gap-2">
          <label htmlFor="busca-uf" className="sr-only">
            Estado
          </label>
          <div className="relative">
            <select
              id="busca-uf"
              name="uf"
              value={escolhida}
              onChange={(evento) => trocar(evento.target.value)}
              className={`w-full cursor-pointer appearance-none rounded-controle bg-rebaixada pr-9 pl-3 text-sm font-medium text-tinta-900 outline-none sm:w-[11rem] ${altura}`}
            >
              <option value="">Todo o Brasil</option>
              {UFS.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {NOME_UF[sigla]}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tinta-600"
            >
              <path
                d="M4 6.5 8 10.5l4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <button
            type="submit"
            className={`shrink-0 rounded-controle bg-verde-700 px-6 font-semibold text-white transition-colors hover:bg-verde-600 ${altura} ${corpo}`}
          >
            Buscar
          </button>
        </div>
      </form>

      <div
        aria-live="polite"
        className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-tinta-500"
      >
        {podeDetectar && (
          <button
            type="button"
            onClick={detectar}
            className="inline-flex items-center gap-1.5 font-medium text-tinta-600 underline underline-offset-[3px] hover:text-verde-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="size-3.5"
            >
              <path
                d="M8 14.5S13 10.4 13 6.7A5 5 0 0 0 3 6.7C3 10.4 8 14.5 8 14.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="8"
                cy="6.6"
                r="1.7"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            Usar minha localização
          </button>
        )}

        {estado === "detectando" && <span>Procurando seu estado…</span>}

        {estado === "ocioso" && origem && (
          <>
            <span>
              {origem === "detectada"
                ? `Mostrando ${NOME_UF[escolhida as Uf]} pela sua localização.`
                : `Guardamos ${NOME_UF[escolhida as Uf]} da sua última visita.`}
            </span>
            <button
              type="button"
              onClick={() => trocar("")}
              className="font-medium text-tinta-600 underline underline-offset-[3px] hover:text-verde-700"
            >
              Ver todo o Brasil
            </button>
          </>
        )}

        {estado === "negada" && (
          <span>Sem acesso à localização. Escolha o estado na lista.</span>
        )}
        {estado === "falhou" && (
          <span>Não deu para descobrir seu estado. Escolha na lista.</span>
        )}
        {estado === "fora" && (
          <span>Você parece estar fora do Brasil. Escolha o estado na lista.</span>
        )}
      </div>
    </div>
  );
}
