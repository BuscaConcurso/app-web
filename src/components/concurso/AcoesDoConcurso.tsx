"use client";

import { AvisoFlutuante, BotaoEmBreve } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import { urlAbsoluta } from "@/lib/site";
import { useCompartilhar } from "./useCompartilhar";

const CLASSE_DO_BOTAO =
  "inline-flex h-[42px] items-center gap-2 rounded-controle bg-rebaixada px-[14px] text-sm font-semibold text-tinta-900 hover:bg-linha";

/**
 * As três ações do cabeçalho: `Concurso.dc.html:70-73`. Salvar não existe
 * ainda (`BotaoEmBreve`); Compartilhar usa a folha nativa quando o navegador
 * tem, o link copiado quando não tem; Pôr na agenda baixa o `.ics` e some
 * quando o concurso não tem data de fim de inscrição (`ics === null`).
 */
export function AcoesDoConcurso({
  slug,
  titulo,
  ics,
}: {
  slug: string;
  titulo: string;
  ics: string | null;
}) {
  const { compartilhar, linkCopiado } = useCompartilhar({
    titulo,
    url: urlAbsoluta(`/concursos/${slug}`),
  });

  function porNaAgenda() {
    if (!ics) return;
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <BotaoEmBreve recurso="salvos" className={CLASSE_DO_BOTAO}>
        <Icone nome="salvar" tamanho={17} />
        Salvar
      </BotaoEmBreve>
      <button type="button" onClick={compartilhar} className={CLASSE_DO_BOTAO}>
        <Icone nome="compartilhar" tamanho={17} />
        Compartilhar
      </button>
      {ics && (
        <button type="button" onClick={porNaAgenda} className={CLASSE_DO_BOTAO}>
          <Icone nome="agenda" tamanho={17} />
          Pôr na agenda
        </button>
      )}
      {linkCopiado && <AvisoFlutuante>Link copiado</AvisoFlutuante>}
    </div>
  );
}
