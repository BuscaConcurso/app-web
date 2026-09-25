import Link from "next/link";
import { Rotulo } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import type { LinkDeFaceta } from "@/lib/concursos";
import { UFS, type Uf } from "@/lib/dominio";
import { ESTILO_DO_NIVEL, POSICAO_UF, nivelDoMapa } from "@/lib/mapaUf";
import { numero } from "@/lib/formato";
import { NOME_UF } from "@/lib/rotulos";
import { PertoDeMim } from "./PertoDeMim";

/** `NOME_UF` invertido, para achar de volta a sigla a partir do rótulo por extenso de `LinkDeFaceta`. */
const UF_DO_NOME = new Map<string, Uf>(UFS.map((uf): [string, Uf] => [NOME_UF[uf], uf]));

function Celula({ uf, total, maximo }: { uf: Uf; total: number; maximo: number }) {
  const posicao = POSICAO_UF[uf];
  const nivel = nivelDoMapa(total, maximo);
  const estilo = nivel !== 0 ? ESTILO_DO_NIVEL[nivel] : null;

  return (
    <Link
      href={`/concursos?uf=${uf}`}
      data-uf={uf}
      aria-label={`${NOME_UF[uf]}: ${numero(total)} abertos`}
      style={{
        gridColumn: posicao.coluna,
        gridRow: posicao.linha,
        ...(estilo ? { background: estilo.fundo, color: estilo.texto } : {}),
      }}
      className={[
        "flex size-11 flex-col items-center justify-center rounded-[10px] text-xs font-bold xl:size-[52px]",
        estilo ? "" : "bg-rebaixada text-tinta-500",
        nivel === 7 ? "shadow-[0_0_0_3px_var(--color-ouro)]" : "",
      ].join(" ")}
    >
      {uf}
      {total > 0 && <span className="text-[11px] font-medium">{numero(total)}</span>}
    </Link>
  );
}

function LinhaDeRanking({
  link,
  classeDoNumero,
}: {
  link: LinkDeFaceta;
  classeDoNumero: string;
}) {
  return (
    <Link
      href={link.href}
      className="flex items-center justify-between gap-3 border-b border-linha-fraca py-2.5 text-[15px] last:border-0"
    >
      <span className="min-w-0 truncate">{link.rotulo}</span>
      <span
        className={`flex h-[26px] min-w-[26px] shrink-0 items-center justify-center rounded-full px-2 text-[13px] font-bold ${classeDoNumero}`}
      >
        {numero(link.total)}
      </span>
    </Link>
  );
}

/**
 * "Onde tem concurso aberto" (`Main.dc.html:271-334`): o mapa de abertos por
 * UF, com a legenda e "Usar minha localização" ao lado, e os dois rankings
 * (órgãos e bancas) à direita.
 *
 * As 27 UFs desenham sempre, mesmo as com zero abertos (e é por isso que
 * `ufs` vem de `facetas(hoje, { ufs: 27 })`): a grade é fixa, só a cor muda,
 * e um acervo vazio não pode dividir por zero nem sumir com o mapa.
 *
 * `id="estados"` e `scroll-mt-24` são o destino de `#estados`, se algum link
 * do site vier a apontar para cá; hoje nenhum aponta, mas a seção já nasce
 * com o alvo pronto e sem custo.
 *
 * **A partir de `md`**: até `xl` numa versão empilhada (o mapa de 620px e
 * as duas colunas ao lado só cabem juntos de 1280px para cima); no celular
 * some, como em `Mobile.dc.html`, que não repete este bloco. Ali os links
 * de UF continuam acessíveis pela linha "Por estado" do rodapé
 * (`layout/Rodape.tsx`).
 */
export function PorEstado({
  ufs,
  orgaos,
  bancas,
}: {
  ufs: LinkDeFaceta[];
  orgaos: LinkDeFaceta[];
  bancas: LinkDeFaceta[];
}) {
  const totalPorUf = new Map<Uf, number>();
  for (const link of ufs) {
    const uf = UF_DO_NOME.get(link.rotulo);
    if (uf) totalPorUf.set(uf, link.total);
  }
  const maximo = Math.max(0, ...[...totalPorUf.values()]);

  return (
    <section id="estados" className="conteudo mt-24 hidden scroll-mt-24 md:flex md:flex-col md:gap-7">
      <div>
        <Rotulo icone="estados" tom="anil" className="mb-2.5">
          POR ESTADO
        </Rotulo>
        <h2 className="font-titulo text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
          Onde tem concurso aberto
        </h2>
      </div>

      {/* De `md` a `xl` o cartão do mapa ocupa a largura inteira, com
          células de 44px, e os dois rankings ficam lado a lado embaixo; a
          partir de `xl`, o desenho do artboard (`Main.dc.html:273-311`). */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex gap-8 rounded-[20px] bg-cartao p-8 shadow-cartao xl:w-[620px] xl:shrink-0">
          <div className="grid shrink-0 grid-cols-[repeat(7,44px)] grid-rows-[repeat(8,44px)] gap-1.5 xl:grid-cols-[repeat(7,52px)] xl:grid-rows-[repeat(8,52px)]">
            {UFS.map((uf) => (
              <Celula key={uf} uf={uf} total={totalPorUf.get(uf) ?? 0} maximo={maximo} />
            ))}
          </div>

          <div className="flex flex-col justify-between">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold tracking-[0.05em] text-tinta-500 uppercase">
                Abertos por estado
              </div>
              <div className="flex gap-[3px]">
                <span className="h-2.5 w-[22px] rounded-[3px] bg-rebaixada" />
                <span
                  className="h-2.5 w-[22px] rounded-[3px]"
                  style={{ background: ESTILO_DO_NIVEL[2].fundo }}
                />
                <span
                  className="h-2.5 w-[22px] rounded-[3px]"
                  style={{ background: ESTILO_DO_NIVEL[3].fundo }}
                />
                <span
                  className="h-2.5 w-[22px] rounded-[3px]"
                  style={{ background: ESTILO_DO_NIVEL[5].fundo }}
                />
                <span
                  className="h-2.5 w-[22px] rounded-[3px]"
                  style={{ background: ESTILO_DO_NIVEL[7].fundo }}
                />
              </div>
              <div className="flex w-[122px] justify-between text-xs text-tinta-500">
                <span>0</span>
                <span>{numero(maximo)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-sm leading-[1.45] text-tinta-600">
              Toque num estado para ver só o que dá para prestar perto de casa.
              <PertoDeMim
                id="localizacao"
                sempreDetectar
                className="mt-1.5 flex items-center gap-1.5 font-semibold text-tinta-900 hover:text-verde-texto"
              >
                Usar minha localização
              </PertoDeMim>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:flex-grow">
          <div className="rounded-[20px] bg-cartao p-6 shadow-cartao">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.05em] text-tinta-500 uppercase">
              <Icone nome="estatais" tamanho={16} />
              Órgãos com mais vagas abertas
            </div>
            {orgaos.slice(0, 6).map((link) => (
              <LinhaDeRanking key={link.href} link={link} classeDoNumero="bg-verde-fundo text-verde-texto" />
            ))}
          </div>
          <div className="rounded-[20px] bg-cartao p-6 shadow-cartao">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.05em] text-tinta-500 uppercase">
              <Icone nome="banca" tamanho={16} />
              Por banca
            </div>
            {bancas.slice(0, 4).map((link) => (
              <LinhaDeRanking key={link.href} link={link} classeDoNumero="bg-anil-fundo text-anil-texto" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
