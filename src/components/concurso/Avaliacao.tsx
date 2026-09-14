"use client";

/**
 * Os dois botões de avaliação, no ponto do dado.
 *
 * Ficam **por item** — cada resposta do FAQ, os cargos, o cronograma, o órgão
 * — e não um formulário no rodapé, porque a reclamação só vira conserto se
 * chegar dizendo onde está o erro. "A página está errada" não conserta nada;
 * "a resposta de 'até quando' está errada, neste ato" conserta.
 *
 * **O "não gostei" é registrado no clique, não no envio do modal.** Quem
 * clica e fecha o modal sem escrever já deu a informação mais importante, e é
 * o que a maioria vai fazer. O comentário é um segundo envio que completa a
 * mesma linha (a chave única do banco garante isso) e nunca a apaga.
 *
 * **"Gostei" também registra.** Sem o positivo, a base só teria reclamação e
 * ninguém saberia o denominador: dez "não gostei" em dez cliques e dez em mil
 * são o mesmo número e problemas opostos.
 *
 * **Funciona sem JavaScript**, como o resto do site: os botões são um
 * `<form>` de verdade, apontado para uma Server Action. Sem script o voto
 * registra igual; o que não aparece é o modal, que é enfeite por cima de algo
 * que já aconteceu.
 */
import { useActionState, useEffect, useRef } from "react";
import { avaliar } from "@/lib/acoes/avaliar";
import {
  ESTADO_INICIAL,
  LIMITE_DO_COMENTARIO,
  type Alvo,
  type EstadoDaAvaliacao,
} from "@/lib/avaliacao";

const BOTAO =
  "rounded-controle px-2 py-1 text-[12px] font-medium text-tinta-600 " +
  "transition-colors hover:bg-rebaixada hover:text-tinta-900 " +
  "disabled:cursor-not-allowed disabled:text-tinta-400";

export function Avaliacao({
  alvo,
  oQue,
  className,
}: {
  alvo: Alvo;
  /** "esta resposta", "o cronograma" — entra no rótulo de acessibilidade. */
  oQue: string;
  className?: string;
}) {
  const [estado, enviar, enviando] = useActionState(avaliar, ESTADO_INICIAL);
  const modal = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (estado.envio === 0) return;
    // O modal abre DEPOIS do registro, e só para o "não gostei" sem
    // comentário. Quando o comentário chega, ele fecha: a pessoa já disse o
    // que tinha para dizer.
    if (estado.comentou || estado.gostei !== false) modal.current?.close();
    else if (estado.resultado === "gravada") modal.current?.showModal();
  }, [estado.envio, estado.comentou, estado.gostei, estado.resultado]);

  const campos = (
    <>
      <input type="hidden" name="slug" value={alvo.slug} />
      <input type="hidden" name="bloco" value={alvo.bloco} />
      {alvo.pergunta && (
        <input type="hidden" name="pergunta" value={alvo.pergunta} />
      )}
      {alvo.ato && <input type="hidden" name="ato" value={alvo.ato} />}
    </>
  );

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      <form action={enviar} className="flex items-center gap-1">
        {campos}
        <button
          type="submit"
          name="gostei"
          value="sim"
          disabled={enviando}
          aria-label={`Gostei de ${oQue}`}
          className={BOTAO}
        >
          Gostei
        </button>
        <button
          type="submit"
          name="gostei"
          value="nao"
          disabled={enviando}
          aria-label={`Não gostei de ${oQue}`}
          className={BOTAO}
        >
          Não gostei
        </button>
      </form>

      <p aria-live="polite" className="text-[12px] text-tinta-500">
        {recibo(estado.resultado, estado.gostei)}
      </p>

      {/* Sem script, um `<dialog>` sem `open` simplesmente não aparece — e
          não faz falta, porque o que ele coleta é opcional. */}
      <dialog
        ref={modal}
        className="m-auto w-[min(32rem,92vw)] rounded-caixa bg-cartao p-6 text-tinta-900 backdrop:bg-tinta-900/40"
      >
        <form action={enviar} className="flex flex-col gap-3">
          {campos}
          <input type="hidden" name="gostei" value="nao" />
          <h2 className="text-sm font-semibold">O que está errado?</h2>
          <p className="text-[12px] leading-5 text-tinta-600">
            O seu “não gostei” sobre {oQue} já foi registrado. Escrever o que
            está errado é opcional — e é o que permite consertar em vez de só
            contar.
          </p>
          <textarea
            name="comentario"
            rows={4}
            maxLength={LIMITE_DO_COMENTARIO}
            placeholder="Ex.: a data de inscrição é de outro concurso."
            className="w-full rounded-controle bg-bloco px-3 py-2 text-[13px] leading-6 text-tinta-900 outline-none focus:ring-2 focus:ring-acao"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => modal.current?.close()}
              className="rounded-controle px-3 py-1.5 text-[12px] font-medium text-tinta-600 hover:bg-rebaixada"
            >
              Fechar sem escrever
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-controle bg-acao px-3 py-1.5 text-[12px] font-semibold text-acao-texto hover:bg-acao-hover disabled:bg-tinta-100 disabled:text-tinta-400"
            >
              Enviar
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

/**
 * O que dizer depois do clique. As três coisas que podem ter acontecido são
 * ditas com palavras diferentes: falhar em silêncio faria a pessoa achar que
 * reclamou quando ninguém recebeu nada.
 */
function recibo(
  resultado: EstadoDaAvaliacao["resultado"],
  gostei: boolean | null,
): string {
  switch (resultado) {
    case "gravada":
      return gostei ? "Anotado, obrigado." : "Anotado.";
    case "sem-api":
      return "Esta instância está sem o serviço de avaliação: nada foi registrado.";
    case "falhou":
      return "Não deu para registrar agora. Tente de novo.";
    case "pedido-invalido":
      return "Não deu para registrar: o pedido chegou incompleto.";
    default:
      return "";
  }
}
