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
 * **O clique é `fetch` do navegador, e a página não funciona mais sem
 * JavaScript.** Isto era um `<form>` de verdade apontado para uma Server
 * Action, e o voto registrava com script desligado; **abrir mão disso é
 * decisão do parceiro humano** — "gostei/não gostei precisa ser client side" —
 * e não uma consequência que apareceu no caminho. Sem script, hoje, os botões
 * não fazem nada.
 *
 * O que se ganhou está medido em `app/api/avaliacao/route.ts`: em `next dev` a
 * Server Action re-renderizava a árvore de servidor da rota a cada clique, o
 * que nesta página significava o `layout` buscar `GET /acervo` de novo — 3,6
 * MB e uns 700 ms para gravar 152 bytes. Agora o clique é um `POST` à rota do
 * próprio app e mais nada. Em produção o tempo de servidor já era curto, e o
 * que muda é o que se vê: o botão marca no clique, não quando a viagem volta.
 *
 * O que **não** mudou é o motivo de existir uma rota no meio em vez de o
 * navegador falar com o engine: `BC_API_URL` continua sem chegar ao cliente.
 */
import { useEffect, useRef, useState } from "react";
import {
  ESTADO_INICIAL,
  LIMITE_DO_COMENTARIO,
  formularioDoPedido,
  resultadoDaResposta,
  type Alvo,
  type EstadoDaAvaliacao,
} from "@/lib/avaliacao";

const BOTAO =
  "rounded-controle px-2 py-1 text-[12px] font-medium " +
  "transition-colors hover:bg-rebaixada hover:text-tinta-900 " +
  "disabled:cursor-not-allowed disabled:text-tinta-400";
/**
 * O botão escolhido fica marcado. É o que a escolha do parceiro humano
 * compra: a marca aparece no clique, antes da resposta — e sai de novo se a
 * resposta disser que não gravou, porque botão marcado sobre clique perdido
 * é a mesma mentira que um "obrigado" sem registro.
 */
const MARCADO = "bg-rebaixada text-tinta-900";
const NORMAL = "text-tinta-600";

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
  const [estado, setEstado] = useState<EstadoDaAvaliacao>(ESTADO_INICIAL);
  /** O que a pessoa escolheu, para o botão mudar no clique e não no fim. */
  const [escolha, setEscolha] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const comentario = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (estado.envio === 0) return;
    // O modal abre DEPOIS do registro, e só para o "não gostei" sem
    // comentário. Quando o comentário chega, ele fecha: a pessoa já disse o
    // que tinha para dizer. Comentário que não gravou mantém o modal aberto,
    // com o texto na caixa, para a pessoa tentar de novo.
    if (estado.comentou) {
      if (estado.resultado === "gravada") modal.current?.close();
    } else if (estado.gostei !== false) modal.current?.close();
    else if (estado.resultado === "gravada") modal.current?.showModal();
  }, [estado.envio, estado.comentou, estado.gostei, estado.resultado]);

  /**
   * Manda o clique para a rota do próprio app.
   *
   * Nunca levanta. Um "não gostei" que derruba a página do concurso seria a
   * pior resposta possível a alguém dizendo que a página está errada — e do
   * lado do cliente isso é ainda mais literal do que era: uma exceção aqui
   * sobe para o limite de erro do React e leva a rota junto.
   */
  async function avaliar(gostei: boolean, texto?: string | null) {
    setEnviando(true);
    setEscolha(gostei);
    let resultado: EstadoDaAvaliacao["resultado"];
    try {
      const resposta = await fetch("/api/avaliacao", {
        method: "POST",
        body: formularioDoPedido(alvo, gostei, texto),
      });
      // A rota diz o que aconteceu no corpo, inclusive quando o status não é
      // 2xx. Corpo que não é JSON — um proxy no caminho, a rota fora do ar —
      // cai no `catch` do `json()` e vira `"falhou"`, não "obrigado".
      resultado = resultadoDaResposta(await resposta.json().catch(() => null));
    } catch {
      // Rede caída, navegador offline, pedido cancelado.
      resultado = "falhou";
    }
    if (resultado !== "gravada") setEscolha(null);
    setEstado({
      resultado,
      gostei,
      comentou: texto !== undefined && texto !== null,
      envio: Date.now(),
    });
    setEnviando(false);
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => avaliar(true)}
          disabled={enviando}
          aria-pressed={escolha === true}
          aria-label={`Gostei de ${oQue}`}
          className={`${BOTAO} ${escolha === true ? MARCADO : NORMAL}`}
        >
          Gostei
        </button>
        <button
          type="button"
          onClick={() => avaliar(false)}
          disabled={enviando}
          aria-pressed={escolha === false}
          aria-label={`Não gostei de ${oQue}`}
          className={`${BOTAO} ${escolha === false ? MARCADO : NORMAL}`}
        >
          Não gostei
        </button>
      </div>

      <p aria-live="polite" className="text-[12px] text-tinta-500">
        {recibo(estado.resultado, estado.gostei)}
      </p>

      <dialog
        ref={modal}
        className="m-auto w-[min(32rem,92vw)] rounded-caixa bg-cartao p-6 text-tinta-900 backdrop:bg-tinta-900/40"
      >
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            // O texto fica na caixa: se este envio falhar, a pessoa tenta de
            // novo sem reescrever.
            void avaliar(false, comentario.current?.value ?? "");
          }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-sm font-semibold">O que está errado?</h2>
          <p className="text-[12px] leading-5 text-tinta-600">
            O seu “não gostei” sobre {oQue} já foi registrado. Escrever o que
            está errado é opcional — e é o que permite consertar em vez de só
            contar.
          </p>
          <textarea
            ref={comentario}
            name="comentario"
            rows={4}
            maxLength={LIMITE_DO_COMENTARIO}
            placeholder="Ex.: a data de inscrição é de outro concurso."
            className="w-full rounded-controle bg-bloco px-3 py-2 text-[13px] leading-6 text-tinta-900 outline-none focus:ring-2 focus:ring-acao"
          />
          {/* O recibo de fora fica atrás do modal, então o comentário que não
              gravou precisa dizer isso aqui dentro — senão a janela fica
              aberta sem explicar por quê. */}
          {estado.comentou && estado.resultado !== "gravada" && (
            <p role="alert" className="text-[12px] text-vermelho-800">
              {recibo(estado.resultado, estado.gostei)}
            </p>
          )}
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
