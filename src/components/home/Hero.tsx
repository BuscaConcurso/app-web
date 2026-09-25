import Link from "next/link";
import { BuscaDoHero } from "./BuscaDoHero";
import { Mosaico } from "./Mosaico";
import { CLASSE_CHIP_DO_HERO, PertoDeMim } from "./PertoDeMim";
import { Icone } from "@/components/ui/Icone";
import type { LinkDeFaceta } from "@/lib/concursos";
import type { ConcursoResumo } from "@/lib/dominio";
import { numero } from "@/lib/formato";

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
 *
 * `ufs` e `cargos` chegam prontos (o acesso rápido por estado e cargo da
 * versão anterior do herói) e ainda não têm lugar no desenho novo: ver
 * `docs/prototipo`, que não repete esses atalhos aqui. Ficam na assinatura
 * para a Task 9 (o resto da home) decidir onde entram, sem `page.tsx`
 * precisar mudar de novo.
 */
export function Hero({
  totalAbertos,
  destaque,
  novoAto,
}: {
  totalAbertos: number;
  ufs: LinkDeFaceta[];
  /**
   * Os cargos mais frequentes do acervo, de `cargosEmDestaque`. `LinkDeFaceta`
   * e não `CargoMedido`: é o mesmo formato pronto (rótulo, href, total) que
   * `ufs` já usa, e que o acesso rápido da versão anterior do herói
   * consumia direto, sem reprocessar `CargoMedido` de novo aqui.
   */
  cargos: LinkDeFaceta[];
  /** O concurso do cartão flutuante. `null` não desenha o cartão. */
  destaque: ConcursoResumo | null;
  /** O concurso do último ato do Diário. `null` não desenha a pílula. */
  novoAto: ConcursoResumo | null;
}) {
  return (
    <section className="flex flex-col gap-4 overflow-hidden bg-faixa px-4 py-7 text-white md:min-h-[620px] md:flex-row md:gap-16 md:px-[112px] md:py-0">
      <div className="relative flex flex-col gap-4 md:w-[700px] md:shrink-0 md:justify-center md:gap-6 md:pb-10">
        {/* O sol dourado que só aparece no celular (`Mobile.dc.html:29`);
            no desktop o mosaico de azulejos já cumpre o papel decorativo. */}
        <span
          aria-hidden="true"
          className="absolute -top-[60px] -right-[60px] size-[120px] rounded-full bg-ouro md:hidden"
        />

        <div className="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-white/10 pr-3.5 pl-1.5 text-[13px] text-faixa-texto md:h-[34px] md:gap-2.5 md:pr-3.5 md:pl-2 md:text-sm">
          <span className="flex h-5 items-center rounded-full bg-ouro px-1.5 text-[11px] font-bold text-ouro-texto md:h-[22px] md:px-2 md:text-xs">
            {numero(totalAbertos)}
          </span>
          <span className="md:hidden">abertos hoje</span>
          <span className="hidden md:inline">concursos com inscrição aberta hoje</span>
        </div>

        <h1 className="font-titulo text-[40px] leading-[1.04] font-bold tracking-[-0.035em] md:text-[68px] md:leading-[1.02]">
          Encontre seu concurso.
          <br className="hidden md:block" />
          <span className="md:hidden"> </span>
          <span className="text-ouro">Direto do edital.</span>
        </h1>

        <p className="text-base leading-[1.5] text-faixa-texto md:max-w-[580px] md:text-[19px] md:leading-[1.55]">
          <span className="md:hidden">
            Cargo, vagas, salário e prazo, com o link para o documento original.
          </span>
          <span className="hidden md:inline">
            Lemos todo dia os editais das bancas e dos diários oficiais e mostramos cargo,
            vagas, salário e prazo, com o link para o documento original.
          </span>
        </p>

        <BuscaDoHero />

        <div className="flex flex-wrap gap-2">
          <Link href="/concursos?situacao=abertas" className={CLASSE_CHIP_DO_HERO}>
            <Icone nome="prazo" tamanho={16} />
            Encerram esta semana
          </Link>
          <Link
            href="/concursos?situacao=abertas&salarioMin=10000"
            className={CLASSE_CHIP_DO_HERO}
          >
            <Icone nome="salario" tamanho={16} />
            Acima de R$ 10 mil
          </Link>
          <Link
            href="/concursos?situacao=abertas&escolaridade=medio"
            className={CLASSE_CHIP_DO_HERO}
          >
            <Icone nome="educacao" tamanho={16} />
            Nível médio
          </Link>
          <PertoDeMim />
        </div>
      </div>

      <Mosaico destaque={destaque} novoAto={novoAto} />
    </section>
  );
}
