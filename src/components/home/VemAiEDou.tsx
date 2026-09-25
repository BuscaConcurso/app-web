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

function Linha({
  numero: valorGrande,
  rotulo,
  titulo,
  apoio,
}: {
  numero: string;
  rotulo: string | null;
  titulo: string;
  apoio: string;
}) {
  return (
    <Fragment>
      <div className="w-[92px] shrink-0">
        <div className="font-titulo text-[28px] leading-none font-bold">{valorGrande}</div>
        {rotulo && <div className="text-xs text-tinta-500">{rotulo}</div>}
      </div>
      <div className="min-w-0 flex-grow">
        <div className="truncate text-[15px] font-bold">{titulo}</div>
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
 * Some por completo no celular: nenhuma das duas listas está em
 * `Mobile.dc.html`, e os quatro previstos e as seis atualizações continuam
 * alcançáveis pela busca (`?situacao=previstos`) e pelas páginas de cada
 * concurso.
 */
export function VemAiEDou({
  previstos,
  atualizados,
}: {
  previstos: ConcursoResumo[];
  atualizados: ConcursoResumo[];
}) {
  return (
    <section className="conteudo mt-24 hidden gap-4 lg:grid lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-[20px] bg-cartao p-7 shadow-cartao">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Rotulo icone="previsto" tom="previsto">PREVISTOS</Rotulo>
            <h2 className="mt-2 font-titulo text-[30px] leading-[1.1] font-bold tracking-[-0.025em]">
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
              <div key={concurso.slug} className="flex items-center gap-4 border-t border-linha-fraca py-3.5">
                <Linha
                  numero={vagas === null ? "A definir" : numero(vagas)}
                  rotulo={vagas === null ? null : concurso.cadastroReserva ? "vagas + CR" : "vagas"}
                  titulo={siglaEEdital(concurso)}
                  apoio={
                    concurso.escolaridades[0]
                      ? `${concurso.orgao.nome} · ${ROTULO_ESCOLARIDADE[concurso.escolaridades[0]].toLowerCase()}`
                      : concurso.orgao.nome
                  }
                />
                <BotaoEmBreve
                  recurso="alertas"
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-controle bg-ouro-fundo px-3.5 text-sm font-semibold text-ouro-sinal-texto"
                >
                  <Icone nome="alerta" tamanho={16} />
                  Avisar
                </BotaoEmBreve>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[20px] bg-cartao p-7 shadow-cartao">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Rotulo icone="diario" tom="anil">DIÁRIO OFICIAL DA UNIÃO</Rotulo>
            <h2 className="mt-2 font-titulo text-[30px] leading-[1.1] font-bold tracking-[-0.025em]">
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
                  <div className="truncate text-[15px] font-bold">{siglaEEdital(concurso)}</div>
                  <div className="truncate text-[13px] text-tinta-600">
                    {rotuloDeSituacao(concurso)} · {contextoDoAto(concurso)}
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
