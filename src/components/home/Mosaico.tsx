import Link from "next/link";
import { Azulejos, MOSAICO_HERO } from "@/components/marca/Azulejos";
import { Icone } from "@/components/ui/Icone";
import { Selo } from "@/components/ui/Cartao";
import type { ConcursoResumo } from "@/lib/dominio";
import { dataCurta, moeda } from "@/lib/formato";
import { nomeCurtoDoOrgao } from "@/lib/orgaos";
import { tituloSemOrgao } from "@/lib/rotulos";

/**
 * O mosaico do herói: os azulejos e, flutuando sobre eles, o cartão do
 * concurso em destaque e a pílula do último ato do Diário.
 *
 * `Main.dc.html:81-113`. Só do desktop em diante (`hidden lg:flex`):
 * `Mobile.dc.html` não desenha nada disto, porque no celular o espaço da
 * primeira tela vale mais para a busca e os atalhos do que para o desenho.
 */
export function Mosaico({
  destaque,
  novoAto,
}: {
  /** O concurso a destacar no cartão flutuante. `null` não desenha o cartão. */
  destaque: ConcursoResumo | null;
  /** O concurso do ato mais recente do Diário. `null` não desenha a pílula. */
  novoAto: ConcursoResumo | null;
}) {
  return (
    <div className="relative hidden grow items-center lg:flex">
      <Azulejos
        ladrilhos={MOSAICO_HERO}
        colunas={4}
        className="ml-10 h-[448px] w-[448px] rounded-[28px]"
      />

      {destaque && (
        <Link
          href={`/concursos/${destaque.slug}`}
          className="absolute bottom-16 left-0 flex w-[340px] flex-col gap-3.5 rounded-cartao bg-cartao p-5 text-tinta-900 shadow-flutuante"
        >
          <div className="flex items-center gap-3">
            <Selo sigla={destaque.orgao.sigla} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] leading-[1.3] font-semibold">
                {destaque.nomesDeCargo[0] ?? tituloSemOrgao(destaque.titulo, destaque.orgao)}
              </div>
              <div className="truncate text-[13px] text-tinta-600">
                {[tituloSemOrgao(destaque.titulo, destaque.orgao), destaque.localidades[0]]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[10px] bg-rebaixada p-2.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-tinta-600">
                <Icone nome="salario" tamanho={13} />
                SALÁRIO
              </div>
              <div className="mt-1 text-[15px] font-bold">
                {destaque.salarioAte !== null ? moeda(destaque.salarioAte) : "A definir"}
              </div>
            </div>
            <div className="rounded-[10px] bg-rebaixada p-2.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-tinta-600">
                <Icone nome="vagas" tamanho={13} />
                VAGAS
              </div>
              <div className="mt-1 text-[15px] font-bold">
                {destaque.vagas ?? "A definir"}
              </div>
            </div>
            <div className="rounded-[10px] bg-urucum-fundo p-2.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-urucum-texto">
                <Icone nome="prazo" tamanho={13} />
                ATÉ
              </div>
              <div className="mt-1 text-[15px] font-bold text-urucum-texto">
                {destaque.inscricoesAte ? dataCurta(destaque.inscricoesAte) : "A definir"}
              </div>
            </div>
          </div>

          {/* Ruling R7: texto verde usa `verde-texto`, não `acao`. */}
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-verde-texto">
            <Icone nome="aberto" tamanho={15} />
            Conferido no edital original
          </div>
        </Link>
      )}

      {novoAto && (
        <Link
          href={`/concursos/${novoAto.slug}`}
          className="absolute top-[88px] -right-2 flex h-11 items-center gap-2.5 rounded-[22px] bg-cartao py-0 pr-4 pl-2 text-[14px] font-semibold text-tinta-900 shadow-flutuante"
        >
          <span className="flex size-[30px] items-center justify-center rounded-[15px] bg-ouro-fundo text-ouro-sinal-texto">
            <Icone nome="alerta" tamanho={16} />
          </span>
          Novo ato no DOU · {nomeCurtoDoOrgao(novoAto.orgao)}
        </Link>
      )}
    </div>
  );
}
