import { Icone } from "@/components/ui/Icone";
import type { EventoDoCronograma } from "@/lib/dominio";
import {
  faseDoEvento,
  indiceDaMarcaDeHoje,
  ordenarEventos,
  type FaseDoEvento,
} from "@/lib/cronograma";
import { dataLonga, diasAte, paraDataLocal } from "@/lib/formato";
import { ROTULO_EVENTO } from "@/lib/rotulos";

/**
 * A linha do tempo do concurso, com a procedência de cada data embaixo dela:
 * `Concurso.dc.html:106-131`.
 *
 * A procedência é o ponto. Qualquer site copia uma data de edital; o que este
 * mostra é de onde ela saiu, e o ato inteiro fica na mesma página, a um clique
 * do link "ver o ato".
 *
 * **Sem aspas, de propósito.** O campo `evidencia` às vezes é o trecho
 * literal do ato e às vezes é a descrição que o modelo fez de onde leu —
 * medido no acervo: 279 de 813 evidências (34%) aparecem palavra por palavra
 * no texto do ato, o resto é paráfrase. Aspas afirmariam citação literal em
 * dois terços dos casos em que não há. "Lido de" cobre os dois, e quem quiser
 * conferir abre o ato.
 *
 * ## Por que trilho e ponto, e não um eixo proporcional
 *
 * A linha é **ordinal**: os pontos ficam igualmente espaçados e o que a
 * descida diz é "depois", não "quanto depois". Medido no acervo, um eixo em
 * escala de tempo seria inutilizável: a mediana é de **2 eventos** por
 * concurso, 27% têm um só, e as datas vão de 2016 a 2027 — um edital
 * publicado em abril e homologado em outubro viraria dois pontos com meio
 * metro de vazio entre eles, e o concurso de 25 eventos (3 no acervo inteiro)
 * viraria um cacho ilegível de pontos grudados. O que a pessoa precisa saber
 * é a ordem e onde ela está nela; o intervalo está escrito na data, que fica
 * ao lado de cada ponto.
 *
 * ## O que o marcador diz
 *
 * Passado é um círculo cheio, verde, com um visto branco. Hoje, quando um
 * evento acontece agora, herda a cor de "passado" e o texto vira verde
 * (`text-verde-texto`). O primeiro evento futuro com data — o "próximo
 * marco" — ganha um anel em urucum, cor de prazo curto; os futuros depois
 * dele e os sem data são um anel pontilhado neutro. Quando hoje cai **entre**
 * dois eventos, sem nenhum acontecendo agora (200 dos 4.479 concursos com
 * cronograma), entra uma pílula "HOJE" no meio da linha; quando algum evento
 * é hoje (39 concursos), o próprio ponto já diz, e a pílula cala para não
 * repetir.
 *
 * "Hoje" aqui é data civil brasileira, de `hojeEmSaoPaulo`, e não o relógio
 * de quem renderiza: ver o comentário lá para o defeito de três horas que
 * isso evita.
 *
 * A ordem é a de `ordenarEventos`, não a que a API mandou — ver lá o porquê.
 */
export function Cronograma({
  eventos,
  hoje,
}: {
  eventos: EventoDoCronograma[];
  /** `AAAA-MM-DD`, de `hojeEmSaoPaulo()`. */
  hoje: string;
}) {
  const ordenados = ordenarEventos(eventos);
  const marca = indiceDaMarcaDeHoje(ordenados, hoje);
  const fases = ordenados.map((evento) => faseDoEvento(evento, hoje));
  // O "próximo marco": o primeiro evento datado que ainda não chegou. Só ele
  // ganha o anel de urucum; os futuros depois dele são o anel neutro, para
  // não gritar duas coisas ao mesmo tempo.
  const indiceDoProximoMarco = fases.indexOf("futuro");

  // Os eventos e, quando ela tem o que separar, a marca de hoje entre dois
  // deles. Uma lista só, para que o trilho saiba quem é o último e pare ali.
  const linhas: (
    | { chave: string; evento: EventoDoCronograma; fase: FaseDoEvento; proximoMarco: boolean }
    | { chave: string; marcaDeHoje: true }
  )[] = ordenados.map((evento, indice) => ({
    chave: `${evento.tipo}-${evento.inicio ?? evento.fim ?? indice}-${indice}`,
    evento,
    fase: fases[indice],
    proximoMarco: indice === indiceDoProximoMarco,
  }));
  if (marca !== null) {
    linhas.splice(marca, 0, { chave: "marca-de-hoje", marcaDeHoje: true });
  }

  return (
    <ol className="flex flex-col">
      {linhas.map((linha, indice) => {
        const ultima = indice === linhas.length - 1;

        return (
          <li
            key={linha.chave}
            className="flex gap-5"
            {...("marcaDeHoje" in linha ? { "aria-hidden": true } : {})}
          >
            {/* A coluna do marcador: 28px, como o protótipo, com o trilho
                (um traço de 2px em `border-linha`, uniforme do início ao
                fim) descendo por trás dele até o próximo item. */}
            <div className="flex w-7 shrink-0 flex-col items-center">
              {"marcaDeHoje" in linha ? (
                <span className="my-1.5 size-4 shrink-0 rounded-full bg-tinta-900 ring-[5px] ring-rebaixada" />
              ) : (
                <Marcador
                  fase={linha.fase}
                  // "Hoje" no próprio evento é pelo menos tão urgente quanto
                  // o próximo marco — "as inscrições encerram hoje" não é
                  // menos premente que "encerram amanhã" — então herda o
                  // mesmo anel de urucum, e não o visto verde do passado.
                  destaque={linha.proximoMarco || linha.fase === "hoje"}
                />
              )}
              {!ultima && (
                <span aria-hidden="true" className="w-0.5 grow bg-linha" />
              )}
            </div>

            {"marcaDeHoje" in linha ? (
              <MarcaDeHoje eventos={ordenados} fases={fases} hoje={hoje} ultima={ultima} />
            ) : (
              <div className={`flex flex-1 flex-wrap items-start justify-between gap-4 ${ultima ? "" : "pb-6"}`}>
                <div className="min-w-0">
                  <p
                    className={[
                      "text-[16px] font-bold",
                      linha.proximoMarco || linha.fase === "hoje"
                        ? "text-urucum-texto"
                        : "text-tinta-900",
                    ].join(" ")}
                  >
                    {ROTULO_EVENTO[linha.evento.tipo]}
                    {linha.evento.localidades.length > 0 && (
                      <span className="font-normal text-tinta-600">
                        {" · "}
                        {linha.evento.localidades.join(", ")}
                      </span>
                    )}
                  </p>
                  {linha.evento.evidencia ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] leading-5 text-tinta-600">
                      <Icone nome="documento" tamanho={14} className="shrink-0" />
                      <span className="min-w-0">
                        Lido de: {linha.evento.evidencia}
                        {linha.evento.ato && (
                          <>
                            {" "}
                            {/* A âncora para o ato que produziu esta data. É
                                o diferencial do produto e não muda de alvo
                                com o trilho: o `id` continua no item do ato,
                                dentro do bloco "Fontes". */}
                            <a
                              href={`#ato-${linha.evento.ato}`}
                              className="whitespace-nowrap font-medium text-link underline underline-offset-4 hover:text-link-hover"
                            >
                              ver o ato
                            </a>
                          </>
                        )}
                      </span>
                    </p>
                  ) : (
                    linha.evento.observacao && (
                      <p className="mt-1 text-[13px] leading-5 text-tinta-500">
                        {linha.evento.observacao}
                      </p>
                    )
                  )}
                </div>
                <p
                  className={[
                    "numero shrink-0 text-[15px] font-semibold whitespace-nowrap",
                    linha.fase === "sem-data"
                      ? "text-tinta-500 italic"
                      : linha.proximoMarco || linha.fase === "hoje"
                        ? "text-urucum-texto"
                        : "text-tinta-600",
                  ].join(" ")}
                >
                  {quando(linha.evento)}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * O marcador de 24px de cada evento, pela fase.
 *
 * `destaque` é o próximo marco (o primeiro evento futuro datado) OU um
 * evento acontecendo hoje: "as inscrições encerram hoje" não é menos urgente
 * que "encerram amanhã", e os dois levam o mesmo anel de urucum. Só o
 * passado puro leva o visto verde.
 */
function Marcador({
  fase,
  destaque,
}: {
  fase: FaseDoEvento;
  destaque: boolean;
}) {
  if (fase === "passado") {
    return (
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-acao text-acao-texto"
      >
        <Icone nome="check" tamanho={13} traco={2.6} />
      </span>
    );
  }
  if (destaque) {
    return (
      <span
        aria-hidden="true"
        className="size-6 shrink-0 rounded-full border-[2.5px] border-urucum bg-urucum-fundo"
      />
    );
  }
  // Futuro (sem ser o próximo marco nem hoje) e sem-data: o mesmo anel
  // pontilhado neutro, porque nenhum dos dois é o que a pessoa precisa olhar
  // agora.
  return (
    <span
      aria-hidden="true"
      className="size-6 shrink-0 rounded-full border-2 border-dashed border-linha bg-cartao"
    />
  );
}

/**
 * A marca de "hoje" quando ela cai entre dois eventos, sem nenhum
 * acontecendo agora: a pílula "HOJE" e, quando o próximo marco é o fim das
 * inscrições, quantos dias faltam para ele.
 *
 * `bg-ouro-fundo text-ouro-sinal-texto`, o dourado do protótipo
 * (`Concurso.dc.html:121`, `#FCF1CF`/`#5C4500`) pelos tokens mais próximos:
 * é o mesmo par que a etiqueta "previsto" já usa, e passa `contraste.test.ts`
 * nos dois temas (correção da review da Task 13; a primeira versão usava
 * `bg-tinta-900 text-cartao`, sem ouro nenhum).
 */
function MarcaDeHoje({
  eventos,
  fases,
  hoje,
  ultima,
}: {
  eventos: EventoDoCronograma[];
  fases: FaseDoEvento[];
  hoje: string;
  ultima: boolean;
}) {
  const indiceDoProximoMarco = fases.indexOf("futuro");
  const proximoMarco = indiceDoProximoMarco >= 0 ? eventos[indiceDoProximoMarco] : null;
  // Só fala em "faltam N dias para encerrar" quando o próprio próximo marco é
  // o fim das inscrições — para qualquer outro evento (uma prova, um
  // resultado), "encerrar" seria uma afirmação que o ato não fez.
  const dataDoFim =
    proximoMarco?.tipo === "fim_inscricao" ? (proximoMarco.inicio ?? proximoMarco.fim) : null;
  const dias = dataDoFim ? diasAte(dataDoFim, paraDataLocal(hoje)) : null;

  return (
    <div className={`flex flex-1 items-center gap-3 ${ultima ? "" : "pb-6"}`}>
      <span className="flex h-[26px] items-center rounded-full bg-ouro-fundo px-2.5 text-[12px] font-bold text-ouro-sinal-texto">
        HOJE
      </span>
      <span className="numero text-[15px] font-semibold text-tinta-900">
        {dataLonga(hoje)}
        {dias !== null && dias > 0 && (
          <> · falta {dias} {dias === 1 ? "dia" : "dias"} para encerrar</>
        )}
      </span>
    </div>
  );
}

/**
 * "18 de maio de 2026", "10/03/2026 a 15/04/2026", ou a verdade quando o ato
 * não deu data: o evento aconteceu e a data não foi informada, o que é
 * diferente de o evento não existir.
 */
function quando(evento: EventoDoCronograma): string {
  if (evento.inicio && evento.fim && evento.inicio !== evento.fim) {
    return `${dataLonga(evento.inicio)} a ${dataLonga(evento.fim)}`;
  }
  const data = evento.inicio ?? evento.fim;
  if (!data) return "sem data";
  return evento.hora ? `${dataLonga(data)}, ${evento.hora}` : dataLonga(data);
}
