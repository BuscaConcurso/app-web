"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { RECURSOS_EM_BREVE, type RecursoEmBreve } from "@/lib/emBreve";

/**
 * O aviso passageiro embaixo da tela, o mesmo padrão de "toast" em todo
 * lugar do site em que isso é preciso: `BotaoEmBreve` aqui embaixo e
 * `useCompartilhar` (`components/concurso/useCompartilhar.ts`), para o
 * "Link copiado" de quem não tem `navigator.share`.
 *
 * `role="status"` e `aria-live="polite"` porque o aviso aparece sem que
 * ninguém tenha pedido foco nele. **A região fica sempre montada**, vazia
 * quando não há aviso, e só o texto dentro dela muda: uma região viva que
 * nasce junto com o texto muitas vezes não é anunciada. Quem chama passa
 * `null` (ou nada) quando não há o que dizer, e não desmonta o componente.
 *
 * `z-[60]` e `bottom-28` abaixo de `lg`: acima da barra de inscrição fixa do
 * celular (`BarraDeInscricao`, `z-10`, uns 90px de altura), que antes cobria
 * o aviso inteiro.
 */
export function AvisoFlutuante({ children }: { children?: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-28 left-1/2 z-[60] -translate-x-1/2 lg:bottom-6"
    >
      {children ? (
        <p className="rounded-[14px] bg-tinta-900 px-4 py-3 text-sm font-semibold text-cartao shadow-flutuante">
          {children}
        </p>
      ) : null}
    </div>
  );
}

/**
 * O botão sem função ainda. Em vez de fingir que faz algo ou desaparecer da
 * tela, ele avisa o que está por vir, com o `AvisoFlutuante` acima.
 */
export function BotaoEmBreve({
  recurso,
  className,
  children,
  "aria-label": ariaLabel,
  ...resto
}: {
  recurso: RecursoEmBreve;
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
} & Omit<
  ComponentProps<"button">,
  "className" | "children" | "aria-label" | "onClick" | "type"
>) {
  const [aberto, setAberto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Limpa o temporizador pendente se o botão sair da tela antes dos 4s.
  useEffect(() => () => clearTimeout(temporizador.current), []);

  function avisar() {
    setAberto(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAberto(false), 4000);
  }

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        className={className}
        onClick={avisar}
        {...resto}
      >
        {children}
      </button>
      <AvisoFlutuante>
        {aberto ? `Em breve: ${RECURSOS_EM_BREVE[recurso].titulo}` : null}
      </AvisoFlutuante>
    </>
  );
}
