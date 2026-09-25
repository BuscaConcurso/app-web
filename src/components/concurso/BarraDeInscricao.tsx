import { BotaoLink } from "@/components/ui/Botao";
import { moedaExata } from "@/lib/formato";

/**
 * A barra fixa de inscrição do celular, fim de `ConcursoMobile.dc.html`.
 *
 * Some com `destino` nulo: sem endereço de inscrição não há para onde o
 * botão levaria, e uma barra fixa vazia só tomaria espaço da tela. A
 * `page.tsx` compensa o espaço que ela ocupa com `pb-28` no `main`, para o
 * rodapé não ficar por baixo dela.
 */
export function BarraDeInscricao({
  taxa,
  destino,
}: {
  taxa: number | null;
  destino: { href: string; host: string; rotulo: string } | null;
}) {
  if (!destino) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-2.5 bg-cartao px-4 pt-3 pb-6 shadow-[0_-1px_0_var(--color-linha),0_-12px_30px_rgb(15_31_23/0.08)] lg:hidden">
      <div className="shrink-0">
        <div className="text-[12px] text-tinta-600">Taxa</div>
        <div className="text-[17px] font-bold text-tinta-900">
          {taxa ? moedaExata(taxa) : "Sem taxa"}
        </div>
      </div>
      <BotaoLink
        href={destino.href}
        target="_blank"
        rel="noopener noreferrer"
        variante="chamada"
        tamanho="lg"
        iconeDepois="externo"
        className="flex-grow"
      >
        {destino.rotulo}
      </BotaoLink>
    </div>
  );
}
