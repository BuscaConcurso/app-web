"use client";

/**
 * As áreas e vagas do concurso: `Concurso.dc.html:134-156`.
 *
 * Virou cliente com a Task 13, por duas coisas que só existem depois de
 * montar: o campo "Filtrar áreas" (sem acento, com `normalizar`) e o botão
 * "Mostrar as N áreas", que esconde tudo além da 8ª até alguém pedir o
 * resto. As duas cabem no mesmo componente porque as duas mexem em quem
 * aparece na mesma lista.
 *
 * **Todas as áreas nascem no HTML do servidor.** O que o filtro e o limite
 * de 8 escondem é o atributo `hidden`, não a linha: um motor de busca sem
 * script vê as N áreas inteiras, e é por isso que o teste de "Área 9" confere
 * o `hidden` em vez de a ausência do texto.
 *
 * "De onde foi lido" deixou de ser um link para uma página: `Cargo` não
 * carrega a chave de um ato como `EventoDoCronograma` carrega (`ato`), então
 * não há endereço de verdade para apontar. O que existe é `cargo.evidencia`
 * — o trecho do ato por trás de cada campo —, e é isso que o botão revela,
 * em linha, exatamente como o `<details>` que ele substitui (ver a exceção
 * registrada em `ui/Revelador.tsx`). A diferença é que agora é `useState`, e
 * não `<details>` nativo: o componente inteiro já depende de script para o
 * filtro e o "mostrar mais", então não há mais sem-script a preservar aqui
 * dentro.
 */
import { useId, useState } from "react";
import { Icone } from "@/components/ui/Icone";
import type { Cargo } from "@/lib/dominio";
import { normalizar } from "@/lib/consulta";
import { notaComum, vagasDoCargo } from "@/lib/fatos";
import { numero } from "@/lib/formato";

/** As primeiras N áreas que chegam visíveis, antes de "Mostrar as N áreas". */
const LIMITE_VISIVEL = 8;
/** Os pontos verdes da coluna de vagas não passam disto, mesmo com 90 vagas. */
const MAX_PONTOS = 5;

/**
 * O título do bloco. Singular sem número — "Cargo e vagas" — porque um
 * cargo só não tem o que contar; plural leva a contagem entre parênteses,
 * que é parte do rótulo e não um dado que a página compõe por fora.
 */
export function tituloDosCargos(cargos: Cargo[]): string {
  return cargos.length === 1 ? "Cargo e vagas" : `Áreas e vagas (${numero(cargos.length)})`;
}

/** "3 vagas", "1 vaga", ou a verdade quando o ato não somou nenhuma. */
function rotuloDeVagas(total: number | null): string {
  if (total === null) return "vagas não informadas no ato";
  if (total === 0) return "a definir";
  return `${numero(total)} ${total === 1 ? "vaga" : "vagas"}`;
}

export function Cargos({ cargos }: { cargos: Cargo[] }) {
  const [filtro, setFiltro] = useState("");
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [abertas, setAbertas] = useState<ReadonlySet<number>>(new Set());
  const idDoFiltro = useId();

  const filtroNormalizado = normalizar(filtro);
  const comum = notaComum(cargos);
  const singular = cargos.length === 1;

  function alternarEvidencia(indice: number) {
    setAbertas((atual) => {
      const novo = new Set(atual);
      if (novo.has(indice)) novo.delete(indice);
      else novo.add(indice);
      return novo;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="flex items-center gap-2.5 font-titulo text-[28px] leading-none font-bold tracking-[-0.025em]">
          <Icone nome="administrativo" tamanho={24} className="text-acao" />
          {singular ? (
            "Cargo e vagas"
          ) : (
            <>
              Áreas e vagas{" "}
              <span className="text-[20px] font-normal text-tinta-600">
                ({numero(cargos.length)})
              </span>
            </>
          )}
        </h2>
        <label
          htmlFor={idDoFiltro}
          className="flex h-11 w-full items-center gap-2 rounded-controle bg-rebaixada px-3 sm:w-[280px]"
        >
          <Icone nome="busca" tamanho={17} className="shrink-0 text-tinta-600" />
          <span className="sr-only">Filtrar áreas</span>
          <input
            id={idDoFiltro}
            type="text"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            placeholder="Filtrar áreas"
            className="min-w-0 grow border-0 bg-transparent text-[15px] text-tinta-900 outline-none placeholder:text-tinta-500"
          />
        </label>
      </div>

      {comum && (
        <div className="flex gap-3.5 rounded-[14px] bg-verde-fundo p-4">
          <Icone nome="aberto" tamanho={20} className="mt-0.5 shrink-0 text-acao" />
          <p className="text-sm leading-[1.55] text-verde-texto">
            <strong>
              Vale para {singular ? "esta área" : `todas as ${numero(cargos.length)} áreas`}:
            </strong>{" "}
            {comum}
          </p>
        </div>
      )}

      <div className="flex flex-col">
        {/* Cabeçalho só a partir de `sm`: abaixo disso a linha empilha (nome
            em cima, vagas e o link embaixo), e um rótulo de coluna em cima de
            uma pilha não rotula nada. `grid-cols-[1fr_120px_150px]` do
            protótipo é para telas largas; a 390px, 120+150=270px já não
            deixa espaço para o nome da área, e era isso que sumia. */}
        <div className="hidden grid-cols-[1fr_120px_150px] items-center gap-4 border-b border-linha-fraca px-1 pb-2.5 text-[12px] font-bold tracking-[0.05em] text-tinta-500 sm:grid">
          <span>ÁREA</span>
          <span>VAGAS</span>
          <span aria-hidden="true" />
        </div>
        <ul>
          {cargos.map((cargo, indice) => {
            const combina =
              filtroNormalizado === "" || normalizar(cargo.nome).includes(filtroNormalizado);
            const alemDoLimite =
              filtroNormalizado === "" && !mostrarTodas && indice >= LIMITE_VISIVEL;
            const oculta = !combina || alemDoLimite;
            const total = vagasDoCargo(cargo);
            const aberta = abertas.has(indice);

            return (
              <li key={`${cargo.nome}-${cargo.codigo ?? indice}`} hidden={oculta}>
                <div className="flex flex-col gap-1.5 border-b border-linha-fraca py-3 text-[15px] sm:grid sm:grid-cols-[1fr_120px_150px] sm:items-center sm:gap-4 sm:py-[15px]">
                  {/* `sm:truncate`: só a partir de onde a linha vira grade de
                      uma linha só, com a largura fixa de VAGAS e do link ao
                      lado. Empilhado (abaixo de `sm`), a área é o único
                      conteúdo da linha e o nome quebra inteiro — truncar um
                      nome de 90 caracteres ali esconderia informação que o
                      layout não precisa mais economizar. */}
                  <span className="min-w-0 font-semibold break-words text-tinta-900 sm:truncate">
                    {cargo.nome}
                  </span>
                  <span className="flex items-center gap-1.5 text-tinta-900">
                    {total !== null && total > 0 && (
                      <span aria-hidden="true" className="text-[9px] tracking-[2px] text-acao">
                        {"●".repeat(Math.min(total, MAX_PONTOS))}
                      </span>
                    )}
                    {rotuloDeVagas(total)}
                  </span>
                  {cargo.evidencia.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => alternarEvidencia(indice)}
                      aria-expanded={aberta}
                      className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:text-link-hover sm:justify-self-end"
                    >
                      <Icone nome="documento" tamanho={14} />
                      De onde foi lido
                    </button>
                  ) : (
                    <span aria-hidden="true" className="hidden sm:block" />
                  )}
                </div>
                {aberta && cargo.evidencia.length > 0 && (
                  <dl className="flex flex-col gap-1 border-b border-linha-fraca px-1 pt-1 pb-3 text-[12px] leading-5 text-tinta-600">
                    {cargo.evidencia.map((trecho) => (
                      <div key={trecho.campo} className="flex gap-2">
                        <dt className="w-28 shrink-0">{trecho.campo}</dt>
                        <dd className="min-w-0">“{trecho.trecho}”</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {cargos.length > LIMITE_VISIVEL && filtroNormalizado === "" && (
        <button
          type="button"
          onClick={() => setMostrarTodas((atual) => !atual)}
          aria-expanded={mostrarTodas}
          className="flex h-[46px] items-center justify-center gap-2 rounded-controle bg-rebaixada text-[15px] font-semibold text-tinta-900 hover:bg-linha"
        >
          {mostrarTodas ? "Mostrar menos" : `Mostrar as ${numero(cargos.length)} áreas`}
          <Icone nome={mostrarTodas ? "acima" : "abaixo"} tamanho={17} />
        </button>
      )}
    </div>
  );
}
