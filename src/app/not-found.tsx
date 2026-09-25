import type { Metadata } from "next";
import Link from "next/link";
import { BotaoLink } from "@/components/ui/Botao";
import { Rotulo } from "@/components/ui/Etiqueta";
import { Secao } from "@/components/ui/Secao";
import type { Uf } from "@/lib/dominio";
import { NOME_UF } from "@/lib/rotulos";

/**
 * A 404 do site inteiro: qualquer endereço que não bate com nenhuma rota, e
 * o `notFound()` que `concursos/[slug]`, `busca/[termo]` e `orgaos/[slug]`
 * chamam quando o slug não existe no acervo.
 *
 * Não lê o acervo. As três páginas acima podem chegar aqui justamente porque
 * o slug não existe, e uma 404 que depende de outra leitura de dado teria uma
 * segunda forma de falhar. Os estados abaixo são uma lista fixa, um por
 * região, e não a mesma medição de `facetas()` que a home usa: aquela pede o
 * acervo carregado e esta página precisa responder mesmo quando ele não está.
 *
 * O Next devolve 404 de verdade para quem chega aqui por engano (uma URL que
 * não bate com nenhuma rota) e 200 para quem chega por `notFound()` dentro de
 * uma resposta que já começou a ser transmitida: a distinção é da própria
 * plataforma, não deste arquivo.
 */
export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false },
};

/** Um estado por região, para a lista caber numa fileira sem escolher à toa. */
const ESTADOS: Uf[] = ["SP", "RJ", "MG", "BA", "RS", "PR", "DF", "PA"];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-cartao bg-cartao px-6 py-14 text-center sm:py-16">
        <Rotulo>Erro 404</Rotulo>
        <h1 className="mt-2 font-titulo text-2xl font-semibold text-tinta-900 sm:text-[28px]">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 break-words text-tinta-600">
          O endereço que você tentou abrir não existe ou mudou de lugar. Use a
          busca no topo da página ou escolha um destes caminhos.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <BotaoLink href="/" variante="primario">
            Ir para a home
          </BotaoLink>
          <BotaoLink href="/concursos" variante="secundario">
            Ver todos os concursos
          </BotaoLink>
        </div>
      </div>

      <div className="mt-6">
        <Secao
          titulo="Concursos por estado"
          apoio="Um atalho para os estados com mais concursos, um por região."
        >
          <ul className="flex flex-wrap gap-2">
            {ESTADOS.map((uf) => (
              <li key={uf} className="min-w-0">
                <Link
                  href={`/concursos?uf=${uf}`}
                  className="inline-flex min-h-8 max-w-full items-center rounded-controle bg-rebaixada px-3 text-[12px] font-medium text-tinta-900 transition-colors hover:bg-linha"
                >
                  <span className="min-w-0 break-words">{NOME_UF[uf]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Secao>
      </div>
    </div>
  );
}
