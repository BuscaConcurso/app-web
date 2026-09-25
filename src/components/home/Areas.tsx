import Link from "next/link";
import { Icone } from "@/components/ui/Icone";
import { Rotulo } from "@/components/ui/Etiqueta";
import { AREAS, hrefDaArea, type Area } from "@/lib/areas";
import { hrefEmBreve } from "@/lib/emBreve";

/**
 * A cor do quadrado do ícone, por área: `Main.dc.html:133-144`.
 *
 * As quatro cores repetem exatamente o par fundo/texto que `Etiqueta`
 * (`ui/Etiqueta.tsx`) já usa para o mesmo tom, então o contraste medido lá
 * vale aqui também, nos dois temas.
 */
const CLASSE_DO_ICONE: Record<Area["tom"], string> = {
  verde: "bg-verde-fundo text-verde-texto",
  anil: "bg-anil-fundo text-anil-texto",
  ouro: "bg-ouro-fundo text-ouro-sinal-texto",
  urucum: "bg-urucum-fundo text-urucum-texto",
};

function Azulejo({ area }: { area: Area }) {
  return (
    <Link
      href={hrefDaArea(area)}
      className="flex h-[152px] flex-col justify-between rounded-cartao bg-cartao p-5 shadow-cartao"
    >
      <span
        className={`flex size-12 items-center justify-center rounded-[14px] ${CLASSE_DO_ICONE[area.tom]}`}
      >
        <Icone nome={area.icone} tamanho={26} />
      </span>
      <div className="min-w-0">
        <div className="text-base font-bold">{area.nome}</div>
        <div className="mt-0.5 truncate text-[13px] text-tinta-600">{area.apoio}</div>
      </div>
    </Link>
  );
}

/**
 * "O que você quer prestar?" (`Main.dc.html:126-146`): as 12 áreas em
 * azulejo, cada uma levando à busca pelo termo dela (`hrefDaArea`).
 *
 * **O celular mostra 6, não os 12.** É o que `Mobile.dc.html:54-64` desenha:
 * uma grade fixa de 3 colunas com as 6 primeiras áreas, e "Ver todas" ao lado
 * do título leva para o recurso ainda sem página própria
 * (`hrefEmBreve("areas")`), a mesma origem do link do desktop.
 */
export function Areas() {
  return (
    <section className="mt-12 flex flex-col gap-5 px-4 md:mt-24 md:gap-7 md:px-[112px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-2.5 hidden md:block">
            <Rotulo icone="areas" tom="aberto">POR ÁREA</Rotulo>
          </div>
          <h2 className="font-titulo text-[26px] leading-[1.08] font-bold tracking-[-0.025em] md:text-[40px] md:leading-[1.05] md:tracking-[-0.03em]">
            <span className="md:hidden">Por área</span>
            <span className="hidden md:inline">O que você quer prestar?</span>
          </h2>
        </div>
        <Link
          href={hrefEmBreve("areas")}
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-tinta-900 hover:text-verde-texto"
        >
          <span className="md:hidden">Ver todas</span>
          <span className="hidden md:inline">Todas as áreas</span>
          <Icone nome="seta" tamanho={17} className="hidden md:block" />
        </Link>
      </div>

      {/* Desktop: as 12, em 6 colunas (`Main.dc.html:132`) a partir de `xl`;
          entre 768 e 1279px cada azulejo teria menos de 130px e o nome
          ("Administrativo") vazava, então são 3 colunas. */}
      <div className="hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-6">
        {AREAS.map((area) => (
          <Azulejo key={area.nome} area={area} />
        ))}
      </div>

      {/* Celular: as 6 primeiras, em 3 colunas fixas (`Mobile.dc.html:56`). */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        {AREAS.slice(0, 6).map((area) => (
          <Link
            key={area.nome}
            href={hrefDaArea(area)}
            className="flex h-[104px] flex-col items-center justify-center gap-2.5 rounded-[16px] bg-cartao px-2.5 py-3.5 text-center shadow-cartao"
          >
            <span
              className={`flex size-[42px] items-center justify-center rounded-[12px] ${CLASSE_DO_ICONE[area.tom]}`}
            >
              <Icone nome={area.icone} tamanho={23} />
            </span>
            <span className="text-[13px] leading-tight font-semibold text-tinta-900">
              {area.nome}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
