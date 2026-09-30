import Link from "next/link";
import { Icone } from "@/components/ui/Icone";
import { destinoDaChamada } from "@/lib/chamadaDoResumo";

/**
 * As nove células decorativas do lado direito (`Main.dc.html:396-406`): um
 * fundo e um círculo por célula, cada um deslocado para um canto. Puramente
 * decorativo (`aria-hidden`), e some no celular: `Mobile.dc.html:112-114` usa
 * só duas bolhas soltas, não a grade inteira.
 *
 * As cores do protótipo viram token: `#0E5C35`, o único hex sem par exato no
 * tema, cai no `acao` mais próximo (a mesma família de verde).
 */
const CELULAS = [
  { fundo: "bg-ouro", circulo: "bg-acao", tamanho: 226, posicao: { left: 0, top: 0 } },
  { fundo: "bg-anil", circulo: "bg-cartao", tamanho: 57, posicao: { left: 28, top: 28 } },
  { fundo: "bg-pagina", circulo: "bg-ouro", tamanho: 226, posicao: { left: -113, top: -113 } },
  { fundo: "bg-acao", circulo: "bg-cartao", tamanho: 113, posicao: { left: 0, top: -57 } },
  { fundo: "bg-ouro", circulo: "bg-anil", tamanho: 226, posicao: { left: -113, top: 0 } },
  { fundo: "bg-acao", circulo: "bg-ouro", tamanho: 113, posicao: { left: 0, top: 57 } },
  { fundo: "bg-anil", circulo: "bg-ouro", tamanho: 226, posicao: { left: 0, top: -113 } },
  { fundo: "bg-pagina", circulo: "bg-acao", tamanho: 226, posicao: { left: 0, top: 0 } },
  { fundo: "bg-acao", circulo: "bg-ouro", tamanho: 41, posicao: { left: 36, top: 36 } },
] as const;

const GARANTIAS = ["Sem custo", "Um e-mail por semana", "Cancele com um clique"];

/** "e-mail" não quebra no hífen: no celular, "e-" ficava sozinho no fim da linha. */
const TITULO = (
  <>
    Os concursos da sua área, toda segunda no seu <span className="whitespace-nowrap">e-mail.</span>
  </>
);

/**
 * A chamada do resumo semanal, no bloco amarelo que antes prometia o alerta
 * por edital (spec do resumo semanal, §8). Só apresentação: quem sabe se há
 * sessão é o `BlocoAlerta`. Sem campo de e-mail: a adesão é na conta.
 */
export function ChamadaDoResumo({ logado, compacto = false }: { logado: boolean; compacto?: boolean }) {
  const destino = destinoDaChamada(logado);

  if (compacto) {
    return (
      <section className="relative flex flex-col gap-3.5 overflow-hidden rounded-[22px] bg-faixa p-6 text-white">
        <span aria-hidden="true" className="absolute -top-9 -right-9 size-[72px] rounded-full bg-ouro" />
        <div className="relative flex items-center gap-2 text-[0.75rem] font-bold tracking-[0.06em] text-ouro">
          <Icone nome="email" tamanho={16} />
          RESUMO SEMANAL
        </div>
        <h2 className="relative font-titulo text-[1.375rem] leading-[1.15] font-bold tracking-[-0.02em]">{TITULO}</h2>
        <Link
          href={destino.href}
          className="relative flex h-12 items-center justify-center rounded-[12px] bg-cartao font-bold text-verde-texto shadow-[inset_0_0_0_2px_var(--color-ouro)]"
        >
          {destino.rotulo}
        </Link>
        {destino.entrar && (
          <Link href={destino.entrar} className="relative self-center text-sm font-bold text-white underline">
            Já tem conta? Entrar
          </Link>
        )}
      </section>
    );
  }

  return (
    <div className="conteudo mt-12 md:mt-24">
      <section
        id="alerta"
        className="overflow-hidden rounded-[22px] bg-faixa text-white lg:flex lg:h-[21.25rem] lg:rounded-[28px]"
      >
        <div className="relative flex flex-col gap-4 overflow-hidden p-6 lg:flex-grow lg:justify-center lg:gap-[18px] lg:p-0 lg:pl-14">
          {/* Duas bolhas soltas no celular, no lugar da grade de 9 do desktop. */}
          <span aria-hidden="true" className="absolute -right-10 -bottom-10 size-[110px] rounded-full bg-anil lg:hidden" />
          <span aria-hidden="true" className="absolute right-10 -bottom-[30px] size-[60px] rounded-full bg-ouro lg:hidden" />

          <div className="relative flex items-center gap-2.5 text-[0.8125rem] font-bold tracking-[0.06em] text-ouro">
            <Icone nome="email" tamanho={18} />
            RESUMO SEMANAL
          </div>
          <h2 className="relative font-titulo text-[1.625rem] leading-[1.1] font-bold tracking-[-0.03em] lg:max-w-[40rem] lg:text-[2.75rem] lg:leading-[1.05]">
            {TITULO}
          </h2>

          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
            <Link
              href={destino.href}
              className="flex h-[3.25rem] shrink-0 items-center justify-center rounded-[13px] bg-ouro px-6 font-bold text-ouro-texto lg:h-14 lg:rounded-[14px] lg:text-base"
            >
              {destino.rotulo}
            </Link>
            {destino.entrar && (
              <Link href={destino.entrar} className="self-start text-sm font-bold text-white underline lg:self-center">
                Já tem conta? Entrar
              </Link>
            )}
          </div>

          <div className="relative text-[0.8125rem] text-faixa-texto lg:flex lg:gap-6 lg:text-sm">
            <span className="lg:hidden">{GARANTIAS.join(" · ")}</span>
            {GARANTIAS.map((garantia) => (
              <span key={garantia} className="hidden items-center gap-1.5 lg:flex">
                <Icone nome="check" tamanho={16} className="text-ouro" />
                {garantia}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden w-[340px] shrink-0 grid-cols-3 grid-rows-3 lg:grid">
          {CELULAS.map((celula, indice) => (
            <div key={indice} className={`relative overflow-hidden ${celula.fundo}`}>
              <span
                aria-hidden="true"
                className={`absolute rounded-full ${celula.circulo}`}
                style={{
                  left: celula.posicao.left,
                  top: celula.posicao.top,
                  width: celula.tamanho,
                  height: celula.tamanho,
                }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
