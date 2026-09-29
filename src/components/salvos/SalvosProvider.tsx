"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AvisoFlutuante } from "@/components/ui/EmBreve";
import { authenticatedRequest, useSession } from "@/lib/auth/session";
import {
  criarSincronizadorDeSalvos,
  normalizarRespostaDeSalvos,
  type MapaDeSalvos,
  type RespostaDeSalvos,
} from "@/lib/salvos";
import { ContextoDeSalvos, type ValorDeSalvos } from "./contexto";

const VAZIO: MapaDeSalvos = new Map();
const semMapa = () => VAZIO;

const apiDeSalvos = {
  salvar: (slug: string, lembrar?: boolean) =>
    authenticatedRequest(`/v1/me/salvos/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: lembrar === undefined ? undefined : { lembrar },
    }),
  remover: (slug: string) =>
    authenticatedRequest(`/v1/me/salvos/${encodeURIComponent(slug)}`, { method: "DELETE" }),
};

/**
 * Os salvos da conta, carregados uma vez quando há sessão (`GET
 * /v1/me/salvos`). O mapa que os botões pintam vem do
 * `criarSincronizadorDeSalvos`: cliques otimistas, um pedido por concurso de
 * cada vez, e a lista carregada nunca passa por cima de um clique pendente.
 *
 * Um sincronizador por conta: depois de sair e entrar com outra, nada da
 * anterior aparece.
 */
export function SalvosProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const conta = session.status === "authenticated" ? (session.profile?.id ?? null) : null;

  const [aviso, setAviso] = useState<{ texto: string; vez: number } | null>(null);
  const [lido, setLido] = useState<{
    dono: string;
    estado: "pronto" | "falhou";
    resposta: RespostaDeSalvos | null;
  } | null>(null);

  const sincronizador = useMemo(
    () =>
      conta === null
        ? null
        : criarSincronizadorDeSalvos({
            api: apiDeSalvos,
            avisar: (texto) => setAviso((anterior) => ({ texto, vez: (anterior?.vez ?? 0) + 1 })),
          }),
    [conta],
  );
  const mapa = useSyncExternalStore(
    sincronizador?.observar ?? semObservar,
    sincronizador?.mapa ?? semMapa,
    semMapa,
  );

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const ler = useCallback(async () => {
    if (!conta || !sincronizador) return;
    const marca = sincronizador.marca();
    try {
      const resposta = await authenticatedRequest<RespostaDeSalvos>("/v1/me/salvos").then(normalizarRespostaDeSalvos);
      sincronizador.carregar(resposta, marca);
      setLido({ dono: conta, estado: "pronto", resposta });
    } catch {
      setLido((anterior) => ({
        dono: conta,
        estado: "falhou",
        resposta: anterior?.dono === conta ? anterior.resposta : null,
      }));
    }
  }, [conta, sincronizador]);

  useEffect(() => {
    // Como no `SessionProvider`: o estado só muda quando a leitura volta.
    if (!conta || !sincronizador) return;
    const marca = sincronizador.marca();
    void authenticatedRequest<RespostaDeSalvos>("/v1/me/salvos").then(normalizarRespostaDeSalvos).then(
      (resposta) => {
        sincronizador.carregar(resposta, marca);
        setLido({ dono: conta, estado: "pronto", resposta });
      },
      () => setLido({ dono: conta, estado: "falhou", resposta: null }),
    );
  }, [conta, sincronizador]);

  const avisar = useCallback((texto: string) => setAviso((anterior) => ({ texto, vez: (anterior?.vez ?? 0) + 1 })), []);

  const valor = useMemo<ValorDeSalvos>(() => {
    const doDono = lido && lido.dono === conta ? lido : null;
    const estado =
      session.status === "anonymous"
        ? "anonimo"
        : session.status === "loading" || !doDono
          ? "carregando"
          : doDono.estado;
    return {
      estado,
      mapa,
      resposta: doDono?.resposta ?? null,
      emailConfirmado: Boolean(session.profile?.emailVerifiedAt),
      recarregar: ler,
      salvar: (slug) => sincronizador?.salvar(slug) ?? Promise.resolve(false),
      remover: (slug) => sincronizador?.remover(slug) ?? Promise.resolve(false),
      lembrar: (slug, ligar) => sincronizador?.lembrar(slug, ligar) ?? Promise.resolve(false),
      avisar,
    };
  }, [session.status, session.profile, conta, lido, mapa, ler, sincronizador, avisar]);

  return (
    <ContextoDeSalvos.Provider value={valor}>
      {children}
      <AvisoFlutuante>{aviso?.texto ?? null}</AvisoFlutuante>
    </ContextoDeSalvos.Provider>
  );
}

function semObservar(): () => void {
  return () => {};
}
