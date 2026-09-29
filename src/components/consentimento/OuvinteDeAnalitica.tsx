"use client";

import { useEffect } from "react";
import { registrar } from "@/lib/analitica";
import { eventoDoElemento } from "@/lib/eventosNaPagina";

/**
 * Um ouvinte só, no documento, para os eventos declarados com
 * `data-analitica-*` (`lib/eventosNaPagina.ts`): o clique num link marcado
 * e o envio de um formulário marcado. Na fase de captura, para registrar
 * antes de um `preventDefault` do próprio link (`LinkDaConsulta`) ou da
 * saída para outra aba.
 *
 * Formulário manda também os campos listados em `data-analitica-campos`
 * (a faixa de salário: `salarioMin,salarioMax`), com o valor digitado.
 */
export function OuvinteDeAnalitica() {
  useEffect(() => {
    function registrarDo(elemento: HTMLElement, extra: Record<string, string> = {}) {
      const achado = eventoDoElemento(elemento.dataset);
      if (!achado) return;
      // `campos` só diz ao ouvinte o que ler do formulário; não é propriedade.
      const propriedades = Object.fromEntries(
        Object.entries(achado.propriedades).filter(([nome]) => nome !== "campos"),
      );
      registrar(achado.evento, { ...propriedades, ...extra, pagina: window.location.pathname });
    }

    function aoClicar(evento: MouseEvent) {
      const alvo = evento.target instanceof Element ? evento.target.closest<HTMLElement>("a[data-analitica], button[data-analitica]") : null;
      if (alvo) registrarDo(alvo);
    }

    function aoEnviar(evento: SubmitEvent) {
      const formulario = evento.target;
      if (!(formulario instanceof HTMLFormElement) || !formulario.dataset.analitica) return;
      const extra: Record<string, string> = {};
      const dados = new FormData(formulario);
      for (const nome of (formulario.dataset.analiticaCampos ?? "").split(",").filter(Boolean)) {
        const valor = dados.get(nome);
        if (typeof valor === "string" && valor.trim()) extra[nome] = valor.trim();
      }
      registrarDo(formulario, extra);
    }

    document.addEventListener("click", aoClicar, true);
    document.addEventListener("submit", aoEnviar, true);
    return () => {
      document.removeEventListener("click", aoClicar, true);
      document.removeEventListener("submit", aoEnviar, true);
    };
  }, []);

  return null;
}
