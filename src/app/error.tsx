"use client";

import { useEffect } from "react";
import { Azulejos, MOSAICO_HERO } from "@/components/marca/Azulejos";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Secao } from "@/components/ui/Secao";

/**
 * A tela de erro do site inteiro: o limite de erro que o Next chama quando
 * algo quebra ao renderizar uma rota.
 *
 * **Por que "acervo fora do ar" é o caso realista, e não um erro genérico de
 * programação.** A leitura do acervo (`src/lib/concursos.ts`) guarda o
 * último valor bom por processo; quando a API está fora do ar e não há
 * nenhum valor guardado ainda, ela lança em vez de devolver dado fingido, e
 * uma rota dinâmica que depende dela lança durante o render. É o caminho mais
 * provável até este componente, então o texto fala dele e não de "algo deu
 * errado" sem contexto, sem entrar em detalhe técnico nenhum: a pessoa não
 * sabe, e não precisa saber, qual chamada falhou.
 *
 * **Sem a mensagem técnica.** `error.message` de um componente de servidor já
 * chega genérico em produção (a própria plataforma esconde o texto original
 * para não vazar detalhe sensível), mas o de um componente de cliente chega
 * inteiro, e por isso o texto na tela nunca usa `error.message` nem
 * `error.digest`; os dois só vão para `console.error`, que é o lugar de quem
 * depura, não de quem só queria ver a página.
 *
 * **Client Component.** Limite de erro só existe como Client Component: é o
 * que dá acesso a `retry`, que tenta de novo sem recarregar a página inteira.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="conteudo py-10 sm:py-14">
      <Secao rotulo="ALGO DEU ERRADO" titulo="Algo deu errado ao carregar esta página" nivel="h1">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div className="flex flex-col items-start gap-5">
            <p className="max-w-[46ch] text-sm leading-6 break-words text-tinta-600">
              O acervo pode estar fora do ar por um instante. Tente de novo em
              alguns segundos, ou volte para a home enquanto isso.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Botao variante="primario" onClick={() => retry()}>
                Tentar de novo
              </Botao>
              <BotaoLink href="/" variante="secundario">
                Ir para a home
              </BotaoLink>
            </div>
          </div>
          <Azulejos
            ladrilhos={MOSAICO_HERO.slice(0, 8)}
            colunas={4}
            className="hidden overflow-hidden rounded-[16px] sm:grid"
          />
        </div>
      </Secao>
    </div>
  );
}
