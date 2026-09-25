"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * As abas do celular (`ConcursoMobile.dc.html`, o bloco `role="tablist"`):
 * Cronograma, Áreas e Perguntas.
 *
 * Os painéis já vêm prontos do servidor, em `paineis[].conteudo` (a
 * `page.tsx` monta cada `<section id="...">`); este componente só decide
 * qual mostrar. É por isso que ele pode ser `"use client"` sem custar a
 * renderização no servidor de dentro dos painéis: o conteúdo já chega
 * renderizado, como filho, e o componente só embrulha e alterna `hidden`.
 *
 * A partir de `lg` a lista de abas some (`lg:hidden`) e todo painel fica
 * visível (`lg:block` sempre, mesmo no inativo): é a mesma pilha de sempre,
 * sem abas nenhuma, do desenho de desktop (`Concurso.dc.html`).
 */
export function AbasDoConcurso({
  paineis,
}: {
  paineis: { id: string; rotulo: string; conteudo: ReactNode }[];
}) {
  const [ativa, setAtiva] = useState(0);
  const botoesRef = useRef<(HTMLButtonElement | null)[]>([]);

  function irPara(indice: number) {
    const proxima = (indice + paineis.length) % paineis.length;
    setAtiva(proxima);
    botoesRef.current[proxima]?.focus();
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      irPara(ativa + 1);
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      irPara(ativa - 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Seções"
        onKeyDown={aoTeclar}
        className="flex gap-1 rounded-[12px] bg-rebaixada p-1 lg:hidden"
      >
        {paineis.map((painel, indice) => {
          const ativo = indice === ativa;
          return (
            <button
              key={painel.id}
              ref={(el) => {
                botoesRef.current[indice] = el;
              }}
              type="button"
              role="tab"
              id={`aba-${painel.id}`}
              aria-selected={ativo}
              aria-controls={`painel-${painel.id}`}
              tabIndex={ativo ? 0 : -1}
              onClick={() => setAtiva(indice)}
              className={`flex h-[38px] flex-grow items-center justify-center rounded-[9px] text-[13px] ${
                ativo
                  ? "bg-cartao font-semibold text-tinta-900 shadow-aba"
                  : "font-medium text-tinta-600"
              }`}
            >
              {painel.rotulo}
            </button>
          );
        })}
      </div>

      {paineis.map((painel, indice) => (
        <div
          key={painel.id}
          role="tabpanel"
          id={`painel-${painel.id}`}
          aria-labelledby={`aba-${painel.id}`}
          tabIndex={0}
          className={indice === ativa ? "lg:block" : "hidden lg:block"}
        >
          {painel.conteudo}
        </div>
      ))}
    </div>
  );
}
