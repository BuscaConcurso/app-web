import { Rotulo } from "@/components/ui/Etiqueta";
import type { EventoDoCronograma } from "@/lib/dominio";
import { dataLonga } from "@/lib/formato";
import { ROTULO_EVENTO } from "@/lib/rotulos";

/**
 * A linha do tempo do concurso, com a citação do ato embaixo de cada data.
 *
 * A citação é o ponto. Qualquer site copia uma data de edital; o que este
 * mostra é a frase do documento de onde ela saiu, para o candidato poder
 * conferir sem acreditar em nós. O engine grava essa evidência em todo evento
 * que extrai, e jogá-la fora na tela seria desperdiçar o que o produto tem de
 * diferente.
 *
 * A ordem é a que a API mandou: por data, com o que não tem data no fim.
 */
export function Cronograma({ eventos }: { eventos: EventoDoCronograma[] }) {
  return (
    <section>
      <Rotulo>Cronograma</Rotulo>
      <p className="mt-1 text-[12px] text-tinta-600">
        Cada data com o trecho do ato publicado de onde ela foi lida.
      </p>

      <ol className="mt-3 flex flex-col gap-3.5">
        {eventos.map((evento, indice) => (
          <li
            key={`${evento.tipo}-${evento.inicio ?? indice}`}
            className="flex flex-col gap-0.5 sm:flex-row sm:gap-4"
          >
            <p className="numero w-[13.5rem] shrink-0 text-sm text-tinta-900">
              {quando(evento)}
            </p>
            <div className="min-w-0">
              <p className="text-sm font-medium text-tinta-900">
                {ROTULO_EVENTO[evento.tipo]}
                {evento.localidades.length > 0 && (
                  <span className="font-normal text-tinta-600">
                    {" · "}
                    {evento.localidades.join(", ")}
                  </span>
                )}
              </p>
              {evento.evidencia && (
                <p className="mt-0.5 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
                  “{evento.evidencia}”
                </p>
              )}
              {evento.observacao && (
                <p className="mt-0.5 text-[12px] leading-5 text-tinta-600">
                  {evento.observacao}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
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
  if (!data) return "sem data no ato";
  return evento.hora ? `${dataLonga(data)}, ${evento.hora}` : dataLonga(data);
}
