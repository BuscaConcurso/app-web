"use client";

/**
 * As áreas e vagas do concurso: `Concurso.dc.html:134-156`.
 *
 * É componente cliente por duas coisas que só existem depois de
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
 * (o trecho do ato por trás de cada campo), e é isso que o botão revela,
 * em linha, exatamente como o `<details>` que ele substitui (ver a exceção
 * registrada em `ui/Revelador.tsx`). A diferença é que agora é `useState`, e
 * não `<details>` nativo: o componente inteiro já depende de script para o
 * filtro e o "mostrar mais", então não há mais sem-script a preservar aqui
 * dentro.
 */
import { useId, useState } from "react";
import { Icone } from "@/components/ui/Icone";
import type { Cargo, Vaga } from "@/lib/dominio";
import { normalizar } from "@/lib/consulta";
import { notaComum, vagasDoCargo } from "@/lib/fatos";
import { moeda, moedaExata, numero } from "@/lib/formato";
import { ROTULO_ESCOLARIDADE } from "@/lib/rotulos";

/** As primeiras N áreas que chegam visíveis, antes de "Mostrar as N áreas". */
const LIMITE_VISIVEL = 8;
/** Os pontos verdes da coluna de vagas não passam disto, mesmo com 90 vagas. */
const MAX_PONTOS = 5;

/**
 * O título do bloco. Singular sem número ("Cargo e vagas") porque um
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

/**
 * "R$ 9.000 a R$ 13.995" quando o cargo tem mais de uma remuneração com
 * valores diferentes, ou o único valor que o ato informou. `null` quando o
 * ato não informou nenhuma remuneração positiva. Sem ela, áreas com
 * salários diferentes perderiam a diferença na tabela.
 */
function faixaDeRemuneracao(cargo: Cargo): string | null {
  const valores = cargo.remuneracoes
    .map((remuneracao) => remuneracao.total ?? remuneracao.base)
    .filter((valor): valor is number => valor !== null && valor > 0);
  if (valores.length === 0) return null;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  return min === max ? moeda(min) : `${moeda(min)} a ${moeda(max)}`;
}

/**
 * A linha de 13px sob o nome da área, com o que É desta área e não das
 * outras: só existe quando `notaComum` volta `null`, porque as áreas
 * discordam em algo (ou há uma só) e a nota comum, que cobriria isto de uma
 * vez para todas, não existe. Sem esta linha, um concurso com cargos de
 * escolaridade e salário diferentes perderia essa diferença inteira: ela
 * não aparecia em lugar nenhum da tabela.
 */
function detalheDoCargo(cargo: Cargo): string | null {
  const partes: string[] = [];
  if (cargo.escolaridade) partes.push(ROTULO_ESCOLARIDADE[cargo.escolaridade]);
  if (cargo.jornadaHoras) partes.push(`${cargo.jornadaHoras} h semanais`);
  if (cargo.taxaInscricao) partes.push(`taxa ${moedaExata(cargo.taxaInscricao)}`);
  const remuneracao = faixaDeRemuneracao(cargo);
  if (remuneracao) partes.push(`remuneração ${remuneracao}`);
  return partes.length > 0 ? partes.join(" · ") : null;
}

/**
 * "São Paulo: 10 vagas (8 ampla, 1 PCD, 1 negros)". A tabela resume a vaga
 * a um total com pontos, e sem esta descrição por localidade ela ficaria sem
 * lugar nenhum na tela. Mora na revelação de "De onde foi lido", ao lado
 * dos requisitos.
 */
function descreverVaga(vaga: Vaga): string {
  const onde = [vaga.localidade, vaga.uf].filter(Boolean).join(", ");
  // "ampla concorrência: 8", e não "8 ampla concorrência": com uma vaga só,
  // a segunda forma vira "1 outras reservas". O dois-pontos atravessa
  // singular e plural sem precisar concordar com nada.
  const reparticao = [
    vaga.ampla > 0 ? `ampla concorrência: ${numero(vaga.ampla)}` : null,
    vaga.pcd > 0 ? `PCD: ${numero(vaga.pcd)}` : null,
    vaga.negros > 0 ? `negros: ${numero(vaga.negros)}` : null,
    vaga.outras > 0 ? `outras reservas: ${numero(vaga.outras)}` : null,
  ].filter(Boolean);

  const quantas =
    vaga.total > 0
      ? `${numero(vaga.total)} ${vaga.total === 1 ? "vaga" : "vagas"}`
      : vaga.cadastroReserva
        ? "sem vaga imediata"
        : "quantidade não informada";

  const reserva = vaga.cadastroReserva
    ? vaga.crQuantidade
      ? `cadastro reserva de ${numero(vaga.crQuantidade)}`
      : "cadastro reserva"
    : null;

  // A repartição aparece sempre que as vagas NÃO forem todas de ampla
  // concorrência, e não só quando houver duas ou mais categorias. Visto na
  // tela com dado real: uma vaga com `outras: 1` e `ampla: 0` saía como
  // "Pelotas: 1 vaga", escondendo que a única vaga é reservada: que é
  // justamente o que faz alguém decidir se vale concorrer.
  const soAmplaConcorrencia = vaga.ampla === vaga.total;
  const detalhe = [
    soAmplaConcorrencia ? null : reparticao.join(", ") || null,
    reserva,
  ].filter(Boolean);

  return [
    onde ? `${onde}: ${quantas}` : quantas,
    detalhe.length > 0 ? ` (${detalhe.join("; ")})` : "",
  ].join("");
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
          // O anel de foco é da caixa arredondada, não do campo: o do campo
          // era um retângulo dentro da pílula (o mesmo arranjo da busca do
          // cabeçalho, `BarraBusca.tsx`).
          className="flex h-11 w-full items-center gap-2 rounded-controle bg-rebaixada px-3 outline-acao outline-offset-2 has-[input:focus]:outline-2 sm:w-[280px]"
        >
          <Icone nome="busca" tamanho={17} className="shrink-0 text-tinta-600" />
          <span className="sr-only">Filtrar áreas</span>
          <input
            id={idDoFiltro}
            type="text"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            placeholder="Filtrar áreas"
            data-sem-anel=""
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
            // A linha de detalhe só existe quando a nota comum não cobre
            // esta área: as duas nunca aparecem juntas, e uma delas sempre
            // aparece quando há algo a dizer.
            const detalhe = comum ? null : detalheDoCargo(cargo);
            // O que a revelação tem para mostrar além do resumo da linha:
            // evidência, requisitos e a vaga por localidade que o total com
            // pontos não diz. Sem nenhum dos três, o botão nem aparece.
            const temRevelacao =
              cargo.evidencia.length > 0 || cargo.requisitos.length > 0 || cargo.vagas.length > 0;

            return (
              <li key={`${cargo.nome}-${cargo.codigo ?? indice}`} hidden={oculta}>
                <div className="flex flex-col gap-1.5 border-b border-linha-fraca py-3 text-[15px] sm:grid sm:grid-cols-[1fr_120px_150px] sm:items-center sm:gap-4 sm:py-[15px]">
                  <div className="min-w-0">
                    {/* `sm:truncate`: só a partir de onde a linha vira grade
                        de uma linha só, com a largura fixa de VAGAS e do link
                        ao lado. Empilhado (abaixo de `sm`), a área é o único
                        conteúdo da linha e o nome quebra inteiro: truncar um
                        nome de 90 caracteres ali esconderia informação que o
                        layout não precisa mais economizar. */}
                    <span className="block font-semibold break-words text-tinta-900 sm:truncate">
                      {cargo.nome}
                    </span>
                    {detalhe && <p className="mt-0.5 text-[13px] text-tinta-600">{detalhe}</p>}
                  </div>
                  <span className="flex items-center gap-1.5 text-tinta-900">
                    {total !== null && total > 0 && (
                      <span aria-hidden="true" className="text-[9px] tracking-[2px] text-acao">
                        {"●".repeat(Math.min(total, MAX_PONTOS))}
                      </span>
                    )}
                    {rotuloDeVagas(total)}
                  </span>
                  {temRevelacao ? (
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
                {aberta && temRevelacao && (
                  <dl className="flex flex-col gap-3 border-b border-linha-fraca px-1 pt-1 pb-3 text-[12px] leading-5 text-tinta-600">
                    {/* A vaga por localidade e a reserva legal, que o total
                        com pontos da linha resume num número só. Sem isto,
                        "São Paulo: 8 ampla, 1 PCD, 1 negros" não aparecia em
                        lugar nenhum da página. */}
                    {cargo.vagas.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="w-28 shrink-0">Vagas</dt>
                        <dd className="min-w-0">
                          <ul className="flex flex-col gap-0.5">
                            {cargo.vagas.map((vaga, indiceDaVaga) => (
                              <li key={indiceDaVaga}>{descreverVaga(vaga)}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                    {cargo.requisitos.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="w-28 shrink-0">Requisitos</dt>
                        <dd className="min-w-0">
                          <ul className="flex flex-col gap-1">
                            {cargo.requisitos.map((requisito, indiceDoRequisito) => (
                              <li key={indiceDoRequisito}>
                                {requisito.descricao}
                                {requisito.formacoes.length > 0 &&
                                  ` (${requisito.formacoes.join("; ")})`}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
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
