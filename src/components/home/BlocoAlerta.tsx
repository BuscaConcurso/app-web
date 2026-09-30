"use client";

import { Fragment } from "react";
import { useSalvos } from "@/components/salvos/contexto";
import type { AvisoDoAcervo } from "@/lib/concursos";
import { numero } from "@/lib/formato";
import { acervoIncompletoEmPartes } from "@/lib/rotulos";
import { ChamadaDoResumo } from "./ChamadaDoResumo";

/**
 * O parágrafo de aviso da lista de resultados e da página de órgão
 * (`components/busca/ListaDeResultados.tsx`, `app/orgaos/[slug]/page.tsx`):
 * o que a lista não está mostrando, dito em voz baixa.
 *
 * **Continua aqui, sem mudar.** A home trocou este parágrafo pela faixa
 * inteira de `ComoFunciona` (que reaproveita a mesma
 * `acervoIncompletoEmPartes` para as três caixas coloridas), mas a lista de
 * resultados e a página de órgão ainda precisam do parágrafo curto, e não
 * têm o desenho de três passos ao redor dele para virar `ComoFunciona`.
 * Apagar este export quebraria as duas, fora do escopo desta task, então
 * ele fica.
 */
export function AcervoIncompleto({ aviso }: { aviso: AvisoDoAcervo }) {
  const partes = acervoIncompletoEmPartes(aviso);
  return (
    <p className="rounded-cartao bg-cartao px-6 py-5 text-sm leading-6 text-tinta-600">
      Outros{" "}
      <strong className="numero font-medium text-tinta-900">
        {numero(aviso.semDado)}
      </strong>{" "}
      dos {numero(aviso.total)} concursos do acervo estão fora desta lista
      {partes.length === 0 ? (
        <>
          : não temos cargo nem cronograma deles. Nem todos vão entrar: parte
          dos atos é retificação ou anexo, que não abre concurso.
        </>
      ) : partes.length === 1 && partes[0].quantos === aviso.semDado ? (
        <>, e {partes[0].texto}</>
      ) : (
        <>
          .
          {partes.map((parte) => (
            <Fragment key={parte.texto}>
              {" "}
              <strong className="numero font-medium text-tinta-900">
                {numero(parte.quantos)}
              </strong>{" "}
              {parte.texto}
            </Fragment>
          ))}
        </>
      )}
    </p>
  );
}

/**
 * O bloco amarelo da home e da lateral do concurso. Era "Receba o edital no
 * dia em que ele sair", com um campo de e-mail que só mostrava "Em breve";
 * virou a chamada do resumo semanal (spec do resumo semanal, §8), cuja
 * adesão é na conta. Este componente só descobre se há sessão: logado, o
 * botão leva às preferências; sem sessão (ou ainda carregando), ao cadastro.
 *
 * A sessão vem pelo contexto dos salvos, e não por `useSession`: o módulo
 * da sessão carrega `lib/auth/api.ts`, que exige a variável da api na carga,
 * e este bloco é importado por telas que os testes renderizam soltas.
 * "pronto" e "falhou" só acontecem com sessão.
 */
export function BlocoAlerta({ compacto = false }: { compacto?: boolean }) {
  const { estado } = useSalvos();
  return <ChamadaDoResumo logado={estado === "pronto" || estado === "falhou"} compacto={compacto} />;
}
