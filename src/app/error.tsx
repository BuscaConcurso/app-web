"use client";

import { useEffect } from "react";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Rotulo } from "@/components/ui/Etiqueta";

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
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-cartao bg-cartao px-6 py-14 text-center sm:py-16">
        <Rotulo>Erro</Rotulo>
        <h1 className="mt-2 font-titulo text-2xl font-semibold text-tinta-900 sm:text-[28px]">
          Algo deu errado ao carregar esta página
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-6 break-words text-tinta-600">
          O acervo pode estar fora do ar por um instante. Tente de novo em
          alguns segundos, ou volte para a home enquanto isso.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Botao variante="primario" onClick={() => retry()}>
            Tentar de novo
          </Botao>
          <BotaoLink href="/" variante="secundario">
            Ir para a home
          </BotaoLink>
        </div>
      </div>
    </div>
  );
}
