import type { EventoDoCronograma } from "@/lib/dominio";
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
 * A ordem é a que a API mandou: por data, com o que não tem data no fim.
 */
export function Cronograma({ eventos }: { eventos: EventoDoCronograma[] }) {
  return (
    <ol className="flex flex-col gap-3.5">
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
                <span className="text-tinta-500">Lido de: </span>
                {evento.evidencia}
                {evento.ato && (
                  <>
                    {" "}
                    <a
                      href={`#ato-${evento.ato}`}
                      className="whitespace-nowrap underline underline-offset-4 hover:text-tinta-900"
                    >
                      ver o ato
                    </a>
                  </>
                )}
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
