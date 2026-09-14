"use client";

/**
 * Os dois botões de avaliação do concurso. Um par por página.
 *
 * **A granularidade é do concurso, e isso é decisão do parceiro humano** —
 * "gostei/não gostei é só pro concurso". Ela reverte a anterior, dele
 * também: até aqui havia um par de botões por item (cada resposta do FAQ, os
 * cargos, o cronograma, o órgão), para a reclamação chegar dizendo onde
 * estava o erro. Passou a valer um voto por concurso por pessoa, e quem diz
 * onde é o comentário — por isso ele deixou de perguntar "o que está errado?"
 * e passou a pedir a parte e o conserto (ver o texto do modal, abaixo).
 *
 * O que se perde está dito e não descoberto depois: sem o `bloco`, contar
 * "quantos reclamaram do cronograma" exige alguém ler os comentários. O que
 * se ganha é um voto por página — um denominador comparável entre concursos,
 * que por item não existia, porque a página sem FAQ tinha menos botões que a
 * com FAQ.
 *
 * **Onde ele fica foi medido, não escolhido por gosto** (400 concursos
 * sorteados do acervo real, altura estimada dos blocos): no fim da página, o
 * controle fica abaixo da dobra em **100%** dos concursos, e a mais de duas
 * telas em 18%; no fim da LEITURA — depois dos cargos e do FAQ, antes do
 * bloco dos atos publicados —, cai para 49% e 12,5%. São os mesmos ~330px de
 * diferença em quase toda página, e eles são de apêndice: o bloco dos atos é
 * o documento como saiu no diário, a evidência atrás da leitura, e o texto
 * dele nem abre sem clique. A avaliação fecha o que o modelo produziu; o que
 * vem depois é a fonte para conferir.
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
import { useEffect, useId, useRef, useState } from "react";
import { Botao } from "@/components/ui/Botao";
import {
  ESTADO_INICIAL,
  LIMITE_DO_COMENTARIO,
  formularioDoPedido,
  resultadoDaResposta,
  type EstadoDaAvaliacao,
} from "@/lib/avaliacao";

/**
 * Os dois polegares, a pedido do parceiro humano.
 *
 * Traço e não preenchimento, como todo ícone deste projeto, e desenhados um
 * como o espelho vertical do outro para que o par leia como par.
 *
 * **O rótulo continua visível ao lado.** Polegar sozinho é ambíguo, e estes
 * dois botões gravam um voto que alimenta a correção do acervo: quem clica
 * por engano polui a única medida de qualidade que o produto tem. O ícone
 * entra na frente do texto, não no lugar dele.
 */
function Polegar({ paraCima }: { paraCima: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 shrink-0 ${paraCima ? "" : "-scale-y-100"}`}
    >
      <path d="M4.6 13.8V7.1m0 0 2.6-4.9a1.6 1.6 0 0 1 2.9 1.3L9.3 6.2h3.1a1.5 1.5 0 0 1 1.5 1.8l-.8 4.3a1.6 1.6 0 0 1-1.6 1.3H6.1a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M4.6 7.1H3.2a1 1 0 0 0-1 1v4.7a1 1 0 0 0 1 1h1.4" />
    </svg>
  );
}

/**
 * O botão escolhido fica marcado. É o que a escolha do parceiro humano
 * compra: a marca aparece no clique, antes da resposta — e sai de novo se a
 * resposta disser que não gravou, porque botão marcado sobre clique perdido
 * é a mesma mentira que um "obrigado" sem registro.
 *
 * As duas variantes vêm de `ui/Botao` desde que o controle virou um por
 * página: por item ele era um par de botõezinhos de 26px, uma anotação ao
 * lado do dado, e um tamanho fora dos três do canvas se justificava. Um
 * controle só, no fim da leitura, é um botão de verdade — e os dois estados
 * já existem no sistema, com o mesmo cinza: `fantasma` sem marca,
 * `secundario` marcado.
 */
const MARCADO = "secundario";
const NORMAL = "fantasma";

export function Avaliacao({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [estado, setEstado] = useState<EstadoDaAvaliacao>(ESTADO_INICIAL);
  /** O que a pessoa escolheu, para o botão mudar no clique e não no fim. */
  const [escolha, setEscolha] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const modal = useRef<HTMLDialogElement>(null);
  const comentario = useRef<HTMLTextAreaElement>(null);
  /** O rótulo do grupo de botões, que é a pergunta escrita ao lado deles. */
  const pergunta = useId();

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
        body: formularioDoPedido(slug, gostei, texto),
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
    // O bloco é próprio, com o mesmo fundo e a mesma sangria dos outros da
    // pilha: por item a avaliação era um rodapezinho de seção, e agora ela é
    // uma seção. A pergunta fica escrita porque dois botões soltos no fim de
    // uma página não dizem sobre o que são.
    <div className={`rounded-caixa bg-cartao px-6 py-5 sm:px-8 ${className ?? ""}`}>
      <div
        role="group"
        aria-labelledby={pergunta}
        className="flex flex-wrap items-center gap-x-3 gap-y-2"
      >
        <p id={pergunta} className="text-sm font-semibold text-tinta-900">
          O que esta página diz sobre o concurso está certo?
        </p>
        <div className="flex items-center gap-1">
          <Botao
            type="button"
            tamanho="sm"
            variante={escolha === true ? MARCADO : NORMAL}
            onClick={() => avaliar(true)}
            disabled={enviando}
            aria-pressed={escolha === true}
          >
            <Polegar paraCima />
            Gostei
          </Botao>
          <Botao
            type="button"
            tamanho="sm"
            variante={escolha === false ? MARCADO : NORMAL}
            onClick={() => avaliar(false)}
            disabled={enviando}
            aria-pressed={escolha === false}
          >
            <Polegar paraCima={false} />
            Não gostei
          </Botao>
        </div>

        <p aria-live="polite" className="text-[12px] text-tinta-500">
          {recibo(estado.resultado, estado.gostei)}
        </p>
      </div>

      {/* O que se avalia é dito, porque muda o que a pessoa responde: não é
          o concurso que é bom ou ruim, é a leitura que o modelo fez do ato.
          Sem esta linha, "não gostei" pode querer dizer "não gostei do
          salário", que não é conserto de nada.
          E nada de "o ato está logo abaixo": há concurso no acervo sem
          nenhuma origem gravada, e nele o bloco dos atos não existe. */}
      <p className="mt-1 max-w-[74ch] text-[12px] leading-5 text-tinta-600">
        Tudo o que está acima foi lido de um ato do diário oficial por um
        modelo. O que você avalia é essa leitura — e é o “não gostei” que faz
        alguém conferir.
      </p>

      <dialog
        ref={modal}
        /* `backdrop:bg-escura/40` e não `tinta-900`: os dois são #141715 no
           tema claro, mas `tinta-900` é token de texto e inverte no escuro —
           lá o véu virava um clarão branco sobre a página quase preta. É o
           mesmo tom do fundo da gaveta, para as duas camadas concordarem. */
        className="m-auto w-[min(32rem,92vw)] rounded-caixa bg-cartao p-6 text-tinta-900 backdrop:bg-escura/40"
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
          {/* A pergunta mudou de forma junto com a granularidade. Ao lado de
              um item, "o que está errado?" já vinha com o onde respondido
              pelo botão em que a pessoa clicou. Ao lado do concurso inteiro
              ela não vem — então o texto pede as duas coisas, na ordem em que
              quem for consertar precisa delas: QUAL parte, e o que devia
              estar no lugar. O exemplo no campo é a resposta inteira, com a
              parte nomeada e o valor certo, porque a forma do exemplo é o que
              a maioria vai copiar. */}
          <h2 className="text-sm font-semibold">
            Qual parte está errada, e o que devia estar no lugar?
          </h2>
          <p className="text-[12px] leading-5 text-tinta-600">
            O seu “não gostei” já foi registrado. Escrever é opcional — e é o
            que permite consertar em vez de só contar. Diga de qual parte você
            fala (o cronograma, os cargos, o órgão, uma resposta) e o que o ato
            publicado diz: quem for corrigir precisa achar o erro no documento.
          </p>
          <textarea
            ref={comentario}
            name="comentario"
            rows={4}
            maxLength={LIMITE_DO_COMENTARIO}
            placeholder="Ex.: no cronograma, a data de fim das inscrições é de outro concurso — no ato ela é 12/03."
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
