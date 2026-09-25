import type { EventoDoCronograma } from "@/lib/dominio";
import {
  faseDoEvento,
  indiceDaMarcaDeHoje,
  ordenarEventos,
  type FaseDoEvento,
} from "@/lib/cronograma";
import { dataLonga } from "@/lib/formato";
import { ROTULO_EVENTO } from "@/lib/rotulos";

/**
 * A linha do tempo do concurso, com a procedência de cada data embaixo dela.
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
 * A distribuição também é o que dispensa rolagem horizontal e eixo deitado:
 * p90 = 4 eventos, p99 = 8, máximo 25. Vertical, uma linha por evento, cresce
 * sem estourar nada — e a 375px não há coluna fixa nenhuma para estourar.
 *
 * ## O que o ponto diz
 *
 * Cheio e cinza é passado; vazado é futuro; verde e maior é o que está
 * acontecendo hoje. O trilho entre um ponto e o próximo herda a cor do de
 * cima, então a parte percorrida do concurso fica mais escura que a que
 * falta. Quando há passado e futuro e nada acontecendo hoje — 200 dos 4.479
 * concursos com cronograma —, entra uma marca de "hoje" no degrau entre os
 * dois; quando algum evento é hoje (39 concursos), o próprio ponto já diz, e
 * a marca cala para não repetir.
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

  // Os eventos e, quando ela tem o que separar, a marca de hoje entre dois
  // deles. Uma lista só, para que o trilho saiba quem é o último e pare ali.
  const linhas: (
    | { chave: string; evento: EventoDoCronograma; fase: FaseDoEvento }
    | { chave: string; marcaDeHoje: true }
  )[] = ordenados.map((evento, indice) => ({
    chave: `${evento.tipo}-${evento.inicio ?? evento.fim ?? indice}-${indice}`,
    evento,
    fase: faseDoEvento(evento, hoje),
  }));
  if (marca !== null) {
    linhas.splice(marca, 0, { chave: "marca-de-hoje", marcaDeHoje: true });
  }

  return (
    <ol className="flex flex-col">
      {linhas.map((linha, indice) => {
        const ultima = indice === linhas.length - 1;
        // O trilho é desenhado **abaixo** de cada ponto, até a borda de baixo
        // do item: assim o trecho que liga dois eventos pertence ao de cima e
        // herda a cor dele, e o último item simplesmente não desenha trecho
        // nenhum. A alternativa (um trilho só, atrás da lista) não saberia
        // onde trocar de cor nem onde parar.
        const trilho =
          "evento" in linha && linha.fase === "passado"
            ? "bg-linha"
            : "bg-linha";

        return (
          <li
            key={linha.chave}
            // `pl-5` abre a calha do trilho; o ponto e o trecho de trilho são
            // absolutos dentro dela. Nada aqui é item de flex com largura
            // mínima, que é o que já deu rolagem lateral neste projeto três
            // vezes.
            className="relative pb-4 pl-5 last:pb-0"
            {...("marcaDeHoje" in linha ? { "aria-hidden": true } : {})}
          >
            {!ultima && (
              <span
                aria-hidden="true"
                className={`absolute top-[18px] bottom-0 left-[6px] w-px -translate-x-1/2 ${trilho}`}
              />
            )}

            {"marcaDeHoje" in linha ? (
              <>
                <span
                  aria-hidden="true"
                  className="absolute top-[5px] left-[6px] size-1.5 -translate-x-1/2 rounded-full bg-acao"
                />
                <p className="text-[11px] leading-4 font-semibold tracking-[0.06em] text-acao uppercase">
                  hoje, {dataLonga(hoje)}
                </p>
              </>
            ) : (
              <>
                <span
                  aria-hidden="true"
                  className={`absolute left-[6px] -translate-x-1/2 rounded-full ${PONTO[linha.fase]}`}
                />
                <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <p
                    className={[
                      "numero w-[13.5rem] shrink-0 text-sm",
                      linha.fase === "hoje"
                        ? "font-medium text-acao"
                        : linha.fase === "passado"
                          ? "text-tinta-600"
                          : "text-tinta-900",
                    ].join(" ")}
                  >
                    {quando(linha.evento)}
                  </p>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tinta-900">
                      {ROTULO_EVENTO[linha.evento.tipo]}
                      {linha.evento.localidades.length > 0 && (
                        <span className="font-normal text-tinta-600">
                          {" · "}
                          {linha.evento.localidades.join(", ")}
                        </span>
                      )}
                    </p>
                    {linha.evento.evidencia && (
                      <p className="mt-0.5 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
                        <span className="text-tinta-500">Lido de: </span>
                        {linha.evento.evidencia}
                        {linha.evento.ato && (
                          <>
                            {" "}
                            {/* A âncora para o ato que produziu esta data. É o
                                diferencial do produto e não muda de alvo com o
                                trilho: o `id` continua no item do ato, dentro
                                do bloco "Os atos publicados". */}
                            <a
                              href={`#ato-${linha.evento.ato}`}
                              className="whitespace-nowrap underline underline-offset-4 hover:text-tinta-900"
                            >
                              ver o ato
                            </a>
                          </>
                        )}
                      </p>
                    )}
                    {linha.evento.observacao && (
                      <p className="mt-0.5 text-[12px] leading-5 text-tinta-600">
                        {linha.evento.observacao}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * O ponto, por fase. O `top` acompanha o tamanho para que todos os centros
 * caiam na mesma altura da primeira linha de texto (20px de caixa, centro em
 * 10px), e não o topo.
 *
 * O vazado do futuro é `bg-cartao` e não transparente: o trilho passa por
 * trás, e um ponto transparente viraria um anel com uma linha no meio.
 */
const PONTO: Record<FaseDoEvento, string> = {
  passado: "top-[5px] size-2.5 bg-linha",
  hoje: "top-1 size-3 bg-acao ring-[3px] ring-cartao",
  futuro: "top-[5px] size-2.5 bg-cartao ring-[1.5px] ring-linha",
  "sem-data": "top-[7px] size-1.5 bg-linha",
};

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
  if (!data) return "sem data no ato";
  return evento.hora ? `${dataLonga(data)}, ${evento.hora}` : dataLonga(data);
}
