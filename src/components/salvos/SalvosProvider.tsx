"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AvisoFlutuante } from "@/components/ui/EmBreve";
import { authenticatedRequest, useSession } from "@/lib/auth/session";
import { acoesDeSalvos, mapaDe, type MapaDeSalvos, type RespostaDeSalvos } from "@/lib/salvos";
import { ContextoDeSalvos, type ValorDeSalvos } from "./contexto";

const VAZIO: MapaDeSalvos = new Map();

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
 * /v1/me/salvos`) e mantidos num mapa slug para `lembrar`, que é o que os
 * botões pintam. Salvar, remover e lembrar são otimistas (`acoesDeSalvos`).
 *
 * O que foi lido fica marcado com o dono (o id da conta): depois de sair e
 * entrar com outra conta, o mapa da anterior não aparece nem por um instante,
 * e não é preciso um efeito para limpá-lo.
 */
export function SalvosProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const conta = session.status === "authenticated" ? (session.profile?.id ?? null) : null;

  const [lido, setLido] = useState<{
    dono: string;
    estado: "pronto" | "falhou";
    resposta: RespostaDeSalvos | null;
  } | null>(null);
  const [mapa, setMapa] = useState<MapaDeSalvos>(VAZIO);
  const mapaAtual = useRef<MapaDeSalvos>(VAZIO);
  const [aviso, setAviso] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(null), 4000);
  }, []);

  const escrever = useCallback((novo: MapaDeSalvos) => {
    mapaAtual.current = novo;
    setMapa(novo);
  }, []);

  const ler = useCallback(async (dono: string) => {
    try {
      const resposta = await authenticatedRequest<RespostaDeSalvos>("/v1/me/salvos");
      escrever(mapaDe(resposta));
      setLido({ dono, estado: "pronto", resposta });
    } catch {
      setLido((anterior) => ({
        dono,
        estado: "falhou",
        resposta: anterior?.dono === dono ? anterior.resposta : null,
      }));
    }
  }, [escrever]);

  const recarregar = useCallback(async () => {
    if (conta) await ler(conta);
  }, [conta, ler]);

  useEffect(() => {
    // Como no `SessionProvider`: o estado só muda quando a leitura volta.
    if (!conta) return;
    void authenticatedRequest<RespostaDeSalvos>("/v1/me/salvos").then(
      (resposta) => {
        escrever(mapaDe(resposta));
        setLido({ dono: conta, estado: "pronto", resposta });
      },
      () => setLido({ dono: conta, estado: "falhou", resposta: null }),
    );
  }, [conta, escrever]);

  // Montadas no clique, não na renderização: leem o mapa pela referência,
  // que só vale fora do render.
  const acoes = useCallback(
    () => acoesDeSalvos({ ler: () => mapaAtual.current, escrever, api: apiDeSalvos, avisar }),
    [escrever, avisar],
  );
  const salvar = useCallback((slug: string) => acoes().salvar(slug), [acoes]);
  const remover = useCallback((slug: string) => acoes().remover(slug), [acoes]);
  const lembrar = useCallback((slug: string, ligar: boolean) => acoes().lembrar(slug, ligar), [acoes]);

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
      mapa: doDono ? mapa : VAZIO,
      resposta: doDono?.resposta ?? null,
      emailConfirmado: Boolean(session.profile?.emailVerifiedAt),
      recarregar,
      salvar,
      remover,
      lembrar,
      avisar,
    };
  }, [session.status, session.profile, conta, lido, mapa, recarregar, salvar, remover, lembrar, avisar]);

  return (
    <ContextoDeSalvos.Provider value={valor}>
      {children}
      <AvisoFlutuante>{aviso}</AvisoFlutuante>
    </ContextoDeSalvos.Provider>
  );
}
