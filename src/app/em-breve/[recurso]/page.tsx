import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Azulejos, FAIXA_MARCA } from "@/components/marca/Azulejos";
import { BotaoLink } from "@/components/ui/Botao";
import { RECURSOS_EM_BREVE, recursoEmBreve } from "@/lib/emBreve";

/**
 * O destino de todo botão sem função e todo link sem endereço: em vez de um
 * `href="#"` que não leva a lugar nenhum, um endereço de verdade que diz o
 * que está por vir. `noindex` porque não é conteúdo para o buscador achar,
 * é um recado para quem já está no site.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function EmBreve({
  params,
}: PageProps<"/em-breve/[recurso]">) {
  const recurso = recursoEmBreve((await params).recurso);
  if (!recurso) notFound();
  const { titulo, frase } = RECURSOS_EM_BREVE[recurso];

  return (
    <section className="mx-auto grid max-w-[1216px] gap-8 px-4 py-16 md:grid-cols-[1fr_440px] md:px-0">
      <div className="flex flex-col justify-center gap-4">
        {/* `acao` é só superfície (ruling R7): o texto verde usa
            `verde-texto`, que é a mesma cor no claro e o par que passa
            contraste no escuro. */}
        <p className="text-[13px] font-bold tracking-[0.06em] text-verde-texto">
          EM BREVE
        </p>
        <h1 className="font-titulo text-[40px] font-bold leading-[1.05] tracking-[-0.03em] break-words">
          {titulo}
        </h1>
        <p className="max-w-[520px] text-[17px] leading-[1.55] text-tinta-600">
          {frase}
        </p>
        <BotaoLink
          href="/"
          variante="primario"
          tamanho="md"
          iconeDepois="seta"
          className="self-start"
        >
          Voltar para o início
        </BotaoLink>
      </div>
      <Azulejos
        ladrilhos={FAIXA_MARCA}
        colunas={6}
        className="hidden rounded-painel md:grid"
      />
    </section>
  );
}
