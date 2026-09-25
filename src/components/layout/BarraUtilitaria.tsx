import Link from "next/link";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import { hrefEmBreve } from "@/lib/emBreve";
import { SeletorDeTema } from "./SeletorDeTema";

/** O sinal de menos (U+2212), não o hífen nem o travessão. */
const MENOS = "−";

/**
 * A barra utilitária: a faixa escura acima da nav (`Main.dc.html:24-31`).
 *
 * Some abaixo de `md`: alto contraste, tamanho da fonte e o link de método
 * já cabem no menu do celular, que é onde a gaveta de navegação mora; repetir
 * os dois lugares só duplicaria controle.
 *
 * `atualizadoEm` é `null` quando o layout não confirmou que o acervo veio da
 * API (ver `acervoDoLayout`, `src/app/layout.tsx`): sem isso, afirmar "atualizado
 * em hoje" sobre o mock seria uma data que a fonte não sustenta.
 */
export function BarraUtilitaria({
  atualizadoEm,
}: {
  atualizadoEm: string | null;
}) {
  return (
    <div className="hidden h-9 items-center justify-between bg-utilitaria px-[112px] text-[13px] text-utilitaria-texto md:flex">
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden="true" className="flex gap-0.5">
          <span className="h-1 w-3.5 bg-[#2FA35F]" />
          <span className="h-1 w-3.5 bg-[#F2C230]" />
          <span className="h-1 w-3.5 bg-[#5C7FD6]" />
        </span>
        {/* A frase inteira só a partir de `xl`: entre 768 e 1279px ela e o
            grupo da direita não cabem na mesma linha de 36px, e a barra
            quebrava em duas. Ali fica só a data, ou a frase curta. */}
        <span className="hidden truncate xl:inline">
          Dados públicos, lidos do Diário Oficial e das bancas
          {atualizadoEm !== null && ` · Atualizado em ${atualizadoEm}`}
        </span>
        <span className="truncate xl:hidden">
          {atualizadoEm !== null ? `Atualizado em ${atualizadoEm}` : "Dados públicos"}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-4 whitespace-nowrap lg:gap-[22px]">
        {/* Abaixo de `lg` o rótulo sai e fica o ícone (com o nome no
            `aria-label`), para a data à esquerda caber sem cortar. */}
        <BotaoEmBreve
          recurso="alto-contraste"
          aria-label="Alto contraste"
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          <Icone nome="contraste" tamanho={15} />
          <span className="hidden lg:inline">Alto contraste</span>
        </BotaoEmBreve>

        <span className="flex gap-1">
          <BotaoEmBreve
            recurso="tamanho-da-fonte"
            aria-label="Diminuir fonte"
            className="px-1 text-[13px] font-semibold"
          >
            A{MENOS}
          </BotaoEmBreve>
          <BotaoEmBreve
            recurso="tamanho-da-fonte"
            aria-label="Aumentar fonte"
            className="px-1 text-[13px] font-semibold"
          >
            A+
          </BotaoEmBreve>
        </span>

        <SeletorDeTema compacto />

        <Link href={hrefEmBreve("como-lemos")} className="hover:underline">
          Como lemos os editais
        </Link>
      </div>
    </div>
  );
}
