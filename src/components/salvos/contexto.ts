"use client";

import { createContext, useContext } from "react";
import type { MapaDeSalvos, RespostaDeSalvos } from "@/lib/salvos";

/**
 * O contexto dos salvos, separado do `SalvosProvider` para que quem só lê
 * (os botões) não carregue `lib/auth/api.ts`, que exige a variável da api na
 * carga do módulo, e para que os testes forneçam um valor na mão.
 */
export interface ValorDeSalvos {
  /** `anonimo` sem sessão; `carregando` enquanto a sessão ou a lista chegam. */
  estado: "anonimo" | "carregando" | "pronto" | "falhou";
  mapa: MapaDeSalvos;
  /** A última lista completa lida da api, para a página `/salvos`. */
  resposta: RespostaDeSalvos | null;
  /** O e-mail da conta está confirmado (os lembretes só saem assim). */
  emailConfirmado: boolean;
  recarregar(): Promise<void>;
  salvar(slug: string): Promise<boolean>;
  remover(slug: string): Promise<boolean>;
  lembrar(slug: string, ligar: boolean): Promise<boolean>;
  /** O aviso flutuante dos salvos, um só para a página inteira. */
  avisar(texto: string): void;
}

export const ContextoDeSalvos = createContext<ValorDeSalvos | null>(null);

/**
 * Fora do `SalvosProvider` (um bloco renderizado solto num teste, ou na
 * página `/estilo`) o botão aparece no estado neutro, sem salvar nada, em
 * vez de derrubar a árvore inteira.
 */
const FORA_DO_PROVIDER: ValorDeSalvos = {
  estado: "carregando",
  mapa: new Map(),
  resposta: null,
  emailConfirmado: false,
  recarregar: async () => {},
  salvar: async () => false,
  remover: async () => false,
  lembrar: async () => false,
  avisar: () => {},
};

export function useSalvos(): ValorDeSalvos {
  return useContext(ContextoDeSalvos) ?? FORA_DO_PROVIDER;
}
