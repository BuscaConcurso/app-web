"use client";

import { useEffect, type RefObject } from "react";

/**
 * O atalho "/": foca o campo de busca quando a pessoa não está digitando em
 * outro lugar da página.
 *
 * Não dispara dentro de `<input>`, `<textarea>`, `<select>` nem em elemento
 * `contentEditable`, e nem com modificador pressionado (`ctrl`, `cmd`,
 * `alt`), para não roubar um atalho de outra tecla ou do próprio navegador.
 *
 * Extraído para cá porque tanto a barra de busca do cabeçalho quanto o
 * campo do herói da home precisam do mesmo atalho, e as duas telas não têm
 * por que divergir na regra de quando ele dispara.
 */
export function useAtalhoDeBusca(campo: RefObject<HTMLInputElement | null>): void {
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "/" || evento.metaKey || evento.ctrlKey || evento.altKey) {
        return;
      }

      const alvo = document.activeElement;
      const emCampo =
        alvo instanceof HTMLElement &&
        (alvo.tagName === "INPUT" ||
          alvo.tagName === "TEXTAREA" ||
          alvo.tagName === "SELECT" ||
          alvo.isContentEditable);
      if (emCampo) return;

      evento.preventDefault();
      campo.current?.focus();
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [campo]);
}
