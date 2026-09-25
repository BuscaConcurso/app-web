import { BotaoLink } from "@/components/ui/Botao";
import { moedaExata } from "@/lib/formato";

/**
 * A barra de inscrição do celular, fim de `ConcursoMobile.dc.html`.
 *
 * Some com `destino` nulo: sem endereço de inscrição não há para onde o
 * botão levaria, e uma barra fixa vazia só tomaria espaço da tela.
 *
 * **`sticky`, não `fixed`.** Um `position: fixed` gruda na tela pelo resto da
 * rolagem inteira do documento, e o rodapé (`Rodape.tsx`, fora desta página,
 * montado por `src/app/layout.tsx`) vem *depois* deste componente na árvore:
 * rolando até o fim, a barra fixa cobria a última linha dele (medido: o
 * endereço da GV Tech Lab ficava embaixo da barra). `sticky bottom-0` gruda
 * na base da tela enquanto a pessoa rola por dentro do container desta
 * página (o `<div>` de `page.tsx`, com o `pb-28` que abre o respiro), e
 * solta sozinho, sem JavaScript, assim que esse container termina, um pouco
 * antes do rodapé começar. `-mx-4 md:-mx-8` cancela a sangria lateral
 * do container (`conteudo`, 16px e 32px) para a barra continuar de ponta a
 * ponta, como um `fixed inset-x-0` desenharia.
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
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2.5 bg-cartao px-4 pt-3 pb-6 shadow-[0_-1px_0_var(--color-linha),0_-12px_30px_rgb(15_31_23/0.08)] md:-mx-8 lg:hidden">
      <div className="shrink-0">
        <div className="text-[12px] text-tinta-600">Taxa</div>
        <div className="text-[17px] font-bold text-tinta-900">
          {taxa ? moedaExata(taxa) : "Sem taxa"}
        </div>
      </div>
      <BotaoLink
        href={destino.href}
        target="_blank"
        rel="nofollow noopener noreferrer"
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
