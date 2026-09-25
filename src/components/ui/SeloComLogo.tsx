"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * O logo do órgão na caixa do selo, com queda para `alternativa` quando a
 * imagem não carrega.
 *
 * `lado` é o lado da caixa em pixels e `raio` a classe do canto, os mesmos
 * do selo com sigla no mesmo tamanho (`Selo` em `Cartao.tsx`): trocar de
 * face não move o título ao lado nem muda o contorno.
 *
 * Fundo branco nos dois temas (`bg-logo-fundo`, que o escuro não inverte):
 * logo oficial é desenhado para fundo claro. `alt` vazio porque o nome do
 * órgão está escrito ao lado, e o leitor de tela não ganha nada ouvindo o
 * nome duas vezes.
 *
 * O `useEffect` cobre a imagem que quebrou antes da hidratação: nesse caso o
 * `onError` do React nunca dispara, e sem a conferência o cartão ficaria com
 * um quadrado branco mudo.
 */
export function SeloComLogo({
  url,
  lado,
  raio,
  alternativa,
}: {
  url: string;
  lado: number;
  raio: string;
  alternativa: ReactNode;
}) {
  const [falhou, setFalhou] = useState(false);
  const imagem = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imagem.current;
    if (img && img.complete && img.naturalWidth === 0) setFalhou(true);
  }, []);

  if (falhou) return alternativa;

  return (
    <span
      aria-hidden="true"
      data-selo="logo"
      className={[
        "flex shrink-0 items-center justify-center overflow-hidden border border-linha bg-logo-fundo",
        lado >= 72 ? "p-2" : "p-1",
        raio,
      ].join(" ")}
      style={{ width: lado, height: lado }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- o engine já entrega o arquivo no tamanho final, com cache imutável */}
      <img
        ref={imagem}
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        className="max-h-full max-w-full object-contain"
        onError={() => setFalhou(true)}
      />
    </span>
  );
}
