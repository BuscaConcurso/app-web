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
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="flex gap-0.5">
          <span className="h-1 w-3.5 bg-[#2FA35F]" />
          <span className="h-1 w-3.5 bg-[#F2C230]" />
          <span className="h-1 w-3.5 bg-[#5C7FD6]" />
        </span>
        <span>
          Dados públicos, lidos do Diário Oficial e das bancas
          {atualizadoEm !== null && ` · Atualizado em ${atualizadoEm}`}
        </span>
      </div>

      <div className="flex items-center gap-[22px]">
        <BotaoEmBreve
          recurso="alto-contraste"
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          <Icone nome="contraste" tamanho={15} />
          Alto contraste
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
