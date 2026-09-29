import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContextoDeSalvos, type ValorDeSalvos } from "./contexto";

/** Só para testes: renderiza no servidor com um valor de salvos feito na mão. */
export function renderizarComSalvos(valor: Partial<ValorDeSalvos>, elemento: ReactElement): string {
  const completo: ValorDeSalvos = {
    estado: "pronto",
    mapa: new Map(),
    resposta: null,
    emailConfirmado: true,
    recarregar: async () => {},
    salvar: async () => true,
    remover: async () => true,
    lembrar: async () => true,
    avisar: () => {},
    ...valor,
  };
  return renderToStaticMarkup(createElement(ContextoDeSalvos.Provider, { value: completo }, elemento));
}
