import Link from "next/link";
import type { ReactNode } from "react";
import { BuscaDoHero } from "./BuscaDoHero";
import { Mosaico } from "./Mosaico";
import { CLASSE_CHIP_DO_HERO, PertoDeMim } from "./PertoDeMim";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoResumo } from "@/lib/dominio";
import { numero } from "@/lib/formato";

/**
 * Embrulha um chip do herói para reordená-lo e/ou escondê-lo por breakpoint,
 * sem tocar na classe do chip em si (`CLASSE_CHIP_DO_HERO`, de
 * `PertoDeMim.tsx`, que é `"use client"`).
 *
 * **Por que um embrulho, e não `${CLASSE_CHIP_DO_HERO}` numa string só:**
 * um valor que atravessa a fronteira de cliente para um Server Component
 * (este arquivo não tem `"use client"`) só é utilizável passado por
 * referência direta (`className={CLASSE_CHIP_DO_HERO}`, como o primeiro
 * chip abaixo faz). Qualquer operação que o transforme em texto (template
 * string, `.replace()`, `.join()`) aciona o mecanismo de referência de
 * cliente do React/Next por baixo, e em vez da classe o navegador recebe o
 * texto de uma função de erro (`"Attempted to call ... from the server"`),
 * sem nenhum estilo de pílula. Foi exatamente esse bug que apareceu na
 * primeira versão desta correção, com `` `order-3 ${CLASSE_CHIP_DO_HERO}` ``.
 *
 * **Por que não um `<span className="hidden lg:contents">`** (a primeira
 * ideia, e a que gerava o cabeçalho do concurso): `display: contents` tira o
 * embrulho da árvore de caixas, e um elemento sem caixa não tem `order` para
 * aplicar: quem precisaria do `order` é o próprio `<Link>` lá dentro, e
 * escrevê-lo nele exigiria mexer na classe do chip de novo. Aqui o embrulho
 * FICA como caixa (`inline-flex`), e é ele que recebe `hidden`/`order`; o
 * `self-start` evita que o `align-items: stretch` padrão da fileira estique
 * o embrulho (sem altura própria) e descentralize o chip lá dentro.
 */
function EmbrulhoDoChip({
  ordem,
  soDesktop = false,
  children,
}: {
  ordem?: string;
  soDesktop?: boolean;
  children: ReactNode;
}) {
  // `soDesktop`: só `hidden lg:inline-flex`, nunca os dois junto com um
  // `inline-flex` incondicional à parte: é a mesma classe de exibição dos
  // dois lados (`hidden` e `inline-flex`, mesmo peso), e ficaria de novo ao
  // sabor da ordem de geração do Tailwind, como o bug desta correção.
  const exibicao = soDesktop ? "hidden lg:inline-flex" : "inline-flex";
  const classes = [exibicao, "self-start", ordem].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}

/**
 * O topo da home: o herói verde com a busca, o mosaico de azulejos com o
 * concurso em destaque, e (fora daqui, logo abaixo) a faixa de números.
 *
 * `Main.dc.html:54-79` no desktop, o começo de `Mobile.dc.html` no celular.
 * As duas telas têm textos diferentes de propósito (o parágrafo do celular é
 * mais curto, os chips mudam de rótulo): em vez de um texto só tentando
 * servir aos dois tamanhos, cada marcação mora aqui, e o CSS decide qual
 * aparece (`md:hidden`/`hidden md:inline`), sem duplicar o componente.
 *
 * **Server component.** A busca em si (`BuscaDoHero`) e o chip "Perto de
 * mim" (`PertoDeMim`) são filhos clientes, porque dependem de memória do
 * navegador; o resto do herói é HTML estático, e é por isso que
 * `Hero.test.ts` consegue renderizar isto com `renderToStaticMarkup`, sem
 * hidratar nada.
 */
export function Hero({
  totalAbertos,
  destaque,
  novoAto,
}: {
  totalAbertos: number;
  /** O concurso do cartão flutuante. `null` não desenha o cartão. */
  destaque: ConcursoResumo | null;
  /** O concurso do último ato do Diário. `null` não desenha a pílula. */
  novoAto: ConcursoResumo | null;
}) {
  return (
    // A faixa verde vai de ponta a ponta; o conteúdo mora no `conteudo`
    // (`globals.css`). Em fileira (texto de 700px e o mosaico) só a partir de
    // `lg`: abaixo disso a coluna de 700px não cabe ao lado de nada. O
    // mosaico entra em `xl`, onde o `conteudo` já tem os 1216px do artboard.
    <section className="overflow-hidden bg-faixa text-white">
      <div className="conteudo flex flex-col gap-4 py-7 md:py-10 lg:min-h-[620px] lg:flex-row lg:gap-10 lg:py-0 xl:gap-16">
        <div className="relative flex flex-col gap-4 lg:w-[700px] lg:shrink-0 lg:justify-center lg:gap-6 lg:pb-10">
          {/* O sol dourado que só aparece no celular (`Mobile.dc.html:29`);
              no desktop o mosaico de azulejos já cumpre o papel decorativo. */}
          <span
            aria-hidden="true"
            className="absolute -top-[60px] -right-[60px] size-[120px] rounded-full bg-ouro md:hidden"
          />

          <div className="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-white/10 pr-3.5 pl-1.5 text-[13px] text-faixa-texto lg:h-[34px] lg:gap-2.5 lg:pr-3.5 lg:pl-2 lg:text-sm">
            <span className="flex h-5 items-center rounded-full bg-ouro px-1.5 text-[11px] font-bold text-ouro-texto lg:h-[22px] lg:px-2 lg:text-xs">
              {numero(totalAbertos)}
            </span>
            <span className="lg:hidden">abertos hoje</span>
            <span className="hidden lg:inline">concursos com inscrição aberta hoje</span>
          </div>

          <h1 className="font-titulo text-[40px] leading-[1.04] font-bold tracking-[-0.035em] md:text-[52px] lg:text-[68px] lg:leading-[1.02]">
            Encontre seu concurso.
            <br className="hidden lg:block" />
            <span className="lg:hidden"> </span>
            <span className="text-ouro">Direto do edital.</span>
          </h1>

          <p className="text-base leading-[1.5] text-faixa-texto lg:max-w-[580px] lg:text-[19px] lg:leading-[1.55]">
            <span className="lg:hidden">
              Cargo, vagas, salário e prazo, com o link para o documento original.
            </span>
            <span className="hidden lg:inline">
              Lemos todo dia os editais das bancas e dos diários oficiais e mostramos cargo,
              vagas, salário e prazo, com o link para o documento original.
            </span>
          </p>

          <BuscaDoHero />

          {/*
            A ordem muda por breakpoint (`order-*`), e não só o que aparece:
            no celular é prazo, perto de mim, salário (`Mobile.dc.html`); no
            desktop é prazo, salário, escolaridade, perto de mim
            (`Main.dc.html:72-77`). O prazo não leva `order` porque o padrão
            (0) já o deixa na frente dos outros três, que levam 2, 3 e 4.
          */}
          <div className="flex flex-wrap gap-2">
            <Link href="/concursos?situacao=abertas" className={CLASSE_CHIP_DO_HERO}>
              <Icone nome="prazo" tamanho={16} />
              <span className="lg:hidden">Encerram na semana</span>
              <span className="hidden lg:inline">Encerram esta semana</span>
            </Link>
            <EmbrulhoDoChip ordem="order-3 lg:order-2">
              <Link
                href="/concursos?situacao=abertas&salarioMin=10000"
                className={CLASSE_CHIP_DO_HERO}
              >
                <Icone nome="salario" tamanho={16} />
                <span className="lg:hidden">+ R$ 10 mil</span>
                <span className="hidden lg:inline">Acima de R$ 10 mil</span>
              </Link>
            </EmbrulhoDoChip>
            <EmbrulhoDoChip ordem="order-3" soDesktop>
              <Link
                href="/concursos?situacao=abertas&escolaridade=medio"
                className={CLASSE_CHIP_DO_HERO}
              >
                <Icone nome="educacao" tamanho={16} />
                Nível médio
              </Link>
            </EmbrulhoDoChip>
            <EmbrulhoDoChip ordem="order-2 lg:order-4">
              <PertoDeMim />
            </EmbrulhoDoChip>
          </div>
        </div>

        <Mosaico destaque={destaque} novoAto={novoAto} />
      </div>
    </section>
  );
}
