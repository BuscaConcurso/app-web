"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icone } from "@/components/ui/Icone";
import { hrefParaEntrar } from "@/lib/salvos";
import { useSalvos } from "./contexto";

/**
 * O botão Salvar dos seis lugares do site. Cada lugar passa as próprias
 * classes, como fazia com o `BotaoEmBreve` que este substitui; o botão só
 * decide o estado.
 *
 * Sem sessão é um link para `/entrar`, que volta para esta mesma página: o
 * concurso não é salvo sozinho na volta, a pessoa clica de novo (spec de
 * salvos, §2). Com sessão é um botão de alternar (`aria-pressed`), com o
 * marcador preenchido e o rótulo "Salvo" quando está salvo.
 */
export function BotaoSalvar({
  slug,
  className,
  tamanhoDoIcone = 18,
  comTexto = false,
}: {
  slug: string;
  className?: string;
  tamanhoDoIcone?: number;
  /** Mostra "Salvar"/"Salvo" ao lado do ícone; sem isso, o rótulo vai no `aria-label`. */
  comTexto?: boolean;
}) {
  const salvos = useSalvos();
  const caminho = usePathname();
  const salvo = salvos.mapa.has(slug);
  const rotulo = salvo ? "Salvo" : "Salvar";
  const conteudo = (
    <>
      <Icone nome={salvo ? "salvo" : "salvar"} tamanho={tamanhoDoIcone} />
      {comTexto && rotulo}
    </>
  );

  if (salvos.estado === "anonimo") {
    return (
      <Link href={hrefParaEntrar(caminho)} aria-label={comTexto ? undefined : "Salvar"} className={className}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={salvo}
      aria-label={comTexto ? undefined : rotulo}
      className={className}
      onClick={() => void (salvo ? salvos.remover(slug) : salvos.salvar(slug))}
    >
      {conteudo}
    </button>
  );
}
