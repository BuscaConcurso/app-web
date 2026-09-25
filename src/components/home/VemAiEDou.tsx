import { Fragment } from "react";
import Link from "next/link";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Rotulo } from "@/components/ui/Etiqueta";
import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import type { ConcursoResumo, ConcursoStatus } from "@/lib/dominio";
import { hrefEmBreve } from "@/lib/emBreve";
import { dataCurta, numero, quantidade, vagasTexto } from "@/lib/formato";
import { ROTULO_ESCOLARIDADE, tituloDoAto, tituloSemOrgao } from "@/lib/rotulos";
import { rotuloDeSituacao } from "@/lib/situacao";

/** "{sigla} · {edital}", a mesma composição do cartão de "Encerram esta semana". */
function siglaEEdital(concurso: ConcursoResumo): string {
  const edital = tituloDoAto(tituloSemOrgao(concurso.titulo, concurso.orgao));
  return concurso.orgao.sigla ? `${concurso.orgao.sigla} · ${edital}` : edital;
}

/** O título de cada linha leva à página do concurso, como na home anterior. */
function TituloDoConcurso({ concurso }: { concurso: ConcursoResumo }) {
  return (
    <Link
      href={`/concursos/${concurso.slug}`}
      className="block truncate text-[15px] font-bold text-tinta-900 hover:underline hover:underline-offset-4"
    >
      {siglaEEdital(concurso)}
    </Link>
  );
}

function Linha({
  numero: valorGrande,
  rotulo,
  concurso,
  apoio,
}: {
  numero: string;
  rotulo: string | null;
  concurso: ConcursoResumo;
  apoio: string;
}) {
  return (
    <Fragment>
      <div className="w-[72px] shrink-0 md:w-[92px]">
        <div className="font-titulo text-[22px] leading-none font-bold md:text-[28px]">{valorGrande}</div>
        {rotulo && <div className="text-xs text-tinta-500">{rotulo}</div>}
      </div>
      <div className="min-w-0 flex-grow">
        <TituloDoConcurso concurso={concurso} />
        <div className="truncate text-[13px] text-tinta-600">{apoio}</div>
      </div>
    </Fragment>
  );
}

/** Ícone e cor pelo status do ato: `Main.dc.html:351-354`. */
function estiloDoAto(status: ConcursoStatus): { icone: NomeDoIcone; classe: string } {
  if (status === "homologado") return { icone: "homologado", classe: "bg-verde-fundo text-verde-texto" };
  if (status === "inscricoes_abertas") return { icone: "aberto", classe: "bg-verde-fundo text-verde-texto" };
  return { icone: "previsto", classe: "bg-ouro-fundo text-ouro-sinal-texto" };
}

/** O que a segunda linha do feed do DOU mostra depois do status: o que o ato informou. */
function contextoDoAto(concurso: ConcursoResumo): string {
  const vagas = quantidade(concurso.vagas);
  const escolaridade = concurso.escolaridades[0];
  if (vagas !== null || concurso.cadastroReserva) {
    const partes = [vagasTexto(vagas, concurso.cadastroReserva).toLowerCase()];
    if (escolaridade) partes.push(ROTULO_ESCOLARIDADE[escolaridade].toLowerCase());
    return partes.join(" · ");
  }
  const edital = tituloDoAto(tituloSemOrgao(concurso.titulo, concurso.orgao));
  return edital || concurso.orgao.nome;
}

/**
 * "Previstos" e "Saiu no DOU" lado a lado (`Main.dc.html:336-357`): quem está
 * a caminho, sem edital ainda, e o que o Diário publicou por último.
 *
 * Lado a lado a partir de `lg`; abaixo disso as duas listas empilham, numa
 * versão mais compacta no celular. `Mobile.dc.html` não tem estes blocos, mas
 * sem eles o celular perdia os previstos e o que acabou de sair no Diário.
 */
export function VemAiEDou({
  previstos,
  atualizados,
  hoje,
}: {
  previstos: ConcursoResumo[];
  atualizados: ConcursoResumo[];
  /** O dia civil de São Paulo, para a situação de cada ato. */
  hoje: Date;
}) {
  return (
    <section className="conteudo mt-12 grid gap-4 md:mt-24 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-cartao p-5 shadow-cartao md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Rotulo icone="previsto" tom="previsto">PREVISTOS</Rotulo>
            <h2 className="mt-2 font-titulo text-[26px] leading-[1.1] font-bold tracking-[-0.025em] md:text-[30px]">
              Vem aí
            </h2>
            <p className="mt-1 text-sm text-tinta-600">
              Autorizados ou com banca definida, sem edital ainda.
            </p>
          </div>
          <Link
            href="/concursos?situacao=previstos"
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-tinta-900 hover:text-verde-texto"
          >
            Ver todos
            <Icone nome="seta" tamanho={15} />
          </Link>
        </div>
        <div className="flex flex-col">
          {previstos.map((concurso) => {
            const vagas = quantidade(concurso.vagas);
            return (
              <div key={concurso.slug} className="flex items-center gap-3 border-t border-linha-fraca py-3.5 md:gap-4">
                <Linha
                  numero={vagas === null ? "A definir" : numero(vagas)}
                  rotulo={vagas === null ? null : concurso.cadastroReserva ? "vagas + CR" : "vagas"}
                  concurso={concurso}
                  apoio={
                    concurso.escolaridades[0]
                      ? `${concurso.orgao.nome} · ${ROTULO_ESCOLARIDADE[concurso.escolaridades[0]].toLowerCase()}`
                      : concurso.orgao.nome
                  }
                />
                {/* No celular só o sino (com o nome no `aria-label`), para o
                    título caber ao lado do número. */}
                <BotaoEmBreve
                  recurso="alertas"
                  aria-label="Avisar quando abrir"
                  className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-controle bg-ouro-fundo px-3 text-sm font-semibold text-ouro-sinal-texto sm:px-3.5"
                >
                  <Icone nome="alerta" tamanho={16} />
                  <span className="hidden sm:inline">Avisar</span>
                </BotaoEmBreve>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 rounded-[20px] bg-cartao p-5 shadow-cartao md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Rotulo icone="diario" tom="anil">DIÁRIO OFICIAL DA UNIÃO</Rotulo>
            <h2 className="mt-2 font-titulo text-[26px] leading-[1.1] font-bold tracking-[-0.025em] md:text-[30px]">
              Saiu no DOU
            </h2>
            <p className="mt-1 text-sm text-tinta-600">
              Atos novos, do mais recente para o mais antigo.
            </p>
          </div>
          <Link
            href={hrefEmBreve("diario-oficial")}
            className="flex shrink-0 items-center gap-1 text-sm font-semibold text-tinta-900 hover:text-verde-texto"
          >
            Ver feed
            <Icone nome="seta" tamanho={15} />
          </Link>
        </div>
        <div className="flex flex-col">
          {atualizados.slice(0, 4).map((concurso) => {
            const estilo = estiloDoAto(concurso.status);
            return (
              <div key={concurso.slug} className="flex items-center gap-3.5 border-t border-linha-fraca py-3.5">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${estilo.classe}`}>
                  <Icone nome={estilo.icone} tamanho={18} />
                </span>
                <div className="min-w-0 flex-grow">
                  <TituloDoConcurso concurso={concurso} />
                  <div className="truncate text-[13px] text-tinta-600">
                    {rotuloDeSituacao(concurso, hoje)} · {contextoDoAto(concurso)}
                  </div>
                </div>
                {concurso.ultimoAto?.data && (
                  <span className="shrink-0 text-[13px] text-tinta-500">{dataCurta(concurso.ultimoAto.data)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
