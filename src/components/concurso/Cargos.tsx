import type { ReactNode } from "react";
import { Etiqueta, Rotulo } from "@/components/ui/Etiqueta";
import type { Cargo, Vaga } from "@/lib/dominio";
import { moeda, moedaExata, numero } from "@/lib/formato";
import { ROTULO_ESCOLARIDADE } from "@/lib/rotulos";

/**
 * Os cargos do concurso, com o que o ato informou e nada além.
 *
 * Três estados são todos comuns no acervo, e nenhum deles pode ficar feio:
 * cargo com vaga detalhada e remuneração; cargo com vaga e sem remuneração,
 * que é a maioria; e cargo com nome e área e mais nada. Por isso campo
 * ausente diz "não informado no ato" em vez de sumir — some, e a página
 * afirma por omissão que o concurso não tem salário, quando o que houve é
 * que o ato não disse.
 */
export function Cargos({ cargos }: { cargos: Cargo[] }) {
  return (
    <section>
      <Rotulo>
        {cargos.length === 1 ? "Cargo" : `Cargos (${numero(cargos.length)})`}
      </Rotulo>

      <ul className="mt-3 flex flex-col gap-3">
        {cargos.map((cargo, indice) => (
          <li
            key={`${cargo.nome}-${cargo.codigo ?? indice}`}
            className="rounded-caixa bg-bloco px-4 py-3.5"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold text-tinta-900">
                {cargo.nome}
              </h3>
              {cargo.codigo && (
                <span className="numero text-[12px] text-tinta-600">
                  código {cargo.codigo}
                </span>
              )}
            </div>

            {cargo.area && (
              <p className="mt-0.5 text-[13px] text-tinta-600">{cargo.area}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {cargo.escolaridade && (
                <Etiqueta>{ROTULO_ESCOLARIDADE[cargo.escolaridade]}</Etiqueta>
              )}
              {cargo.jornadaHoras !== null && (
                <Etiqueta>{cargo.jornadaHoras}h semanais</Etiqueta>
              )}
              {cargo.taxaInscricao !== null && (
                <Etiqueta>Taxa {moedaExata(cargo.taxaInscricao)}</Etiqueta>
              )}
            </div>

            <dl className="mt-3 flex flex-col gap-1.5 text-[13px]">
              <Linha rotulo="Remuneração">
                {cargo.remuneracoes.length === 0 ? (
                  <span className="text-tinta-600">não informada no ato</span>
                ) : (
                  cargo.remuneracoes.map((remuneracao, i) => (
                    <span key={i} className="numero">
                      {faixa(remuneracao.base, remuneracao.total)}
                      <span className="text-tinta-600"> / {remuneracao.tipo}</span>
                      {remuneracao.observacao && (
                        <span className="text-tinta-600">
                          {" "}
                          ({remuneracao.observacao})
                        </span>
                      )}
                    </span>
                  ))
                )}
              </Linha>

              <Linha rotulo="Vagas">
                {cargo.vagas.length === 0 ? (
                  <span className="text-tinta-600">
                    não detalhadas por localidade no ato
                  </span>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {cargo.vagas.map((vaga, i) => (
                      <li key={i}>{descreverVaga(vaga)}</li>
                    ))}
                  </ul>
                )}
              </Linha>

              {cargo.requisitos.length > 0 && (
                <Linha rotulo="Requisitos">
                  <ul className="flex flex-col gap-1">
                    {cargo.requisitos.map((requisito, i) => (
                      <li key={i}>
                        {requisito.descricao}
                        {requisito.formacoes.length > 0 && (
                          <span className="text-tinta-600">
                            {" "}
                            ({requisito.formacoes.join("; ")})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Linha>
              )}
            </dl>

            {cargo.evidencia.length > 0 && (
              // `<details>` nativo, como o resto do site faz com o menu e os
              // filtros do celular: a citação fica à mão de quem quiser
              // conferir sem empurrar o cargo seguinte para fora da tela.
              <details className="mt-2.5">
                <summary className="cursor-pointer text-[12px] text-tinta-600 underline underline-offset-4 hover:text-tinta-900">
                  De onde isto foi lido
                </summary>
                <dl className="mt-1.5 flex flex-col gap-1 text-[12px] leading-5 text-tinta-600">
                  {cargo.evidencia.map((trecho) => (
                    <div key={trecho.campo} className="flex gap-2">
                      <dt className="w-28 shrink-0">{trecho.campo}</dt>
                      <dd className="min-w-0">“{trecho.trecho}”</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Linha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="w-28 shrink-0 text-tinta-600">{rotulo}</dt>
      <dd className="min-w-0 text-tinta-900">{children}</dd>
    </div>
  );
}

/** "R$ 9.000 a R$ 13.995", ou o único valor que o ato informou. */
function faixa(base: number | null, total: number | null): string {
  if (base !== null && total !== null && total !== base) {
    return `${moeda(base)} a ${moeda(total)}`;
  }
  const valor = total ?? base;
  return valor === null ? "valor não informado" : moeda(valor);
}

/**
 * "São Paulo: 10 vagas (8 ampla, 1 PCD, 1 negros)" — a reparticao só aparece
 * quando existe, e o cadastro de reserva é dito por extenso porque "0 vagas"
 * com cadastro de reserva não é o mesmo que nenhuma vaga.
 */
function descreverVaga(vaga: Vaga): string {
  const onde = [vaga.localidade, vaga.uf].filter(Boolean).join(" — ");
  const reparticao = [
    vaga.ampla > 0 ? `${numero(vaga.ampla)} ampla concorrência` : null,
    vaga.pcd > 0 ? `${numero(vaga.pcd)} PCD` : null,
    vaga.negros > 0 ? `${numero(vaga.negros)} negros` : null,
    vaga.outras > 0 ? `${numero(vaga.outras)} outras reservas` : null,
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

  const detalhe = [
    reparticao.length > 1 ? reparticao.join(", ") : null,
    reserva,
  ].filter(Boolean);

  return [
    onde ? `${onde}: ${quantas}` : quantas,
    detalhe.length > 0 ? ` (${detalhe.join("; ")})` : "",
  ].join("");
}
