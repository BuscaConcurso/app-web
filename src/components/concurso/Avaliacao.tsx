"use client";

/**
 * Os dois botões de avaliação do concurso. Um par por página.
 *
 * **A granularidade é do concurso, e isso é decisão do parceiro humano**:
 * "gostei/não gostei é só pro concurso". Ela reverte a anterior, dele
 * também: até aqui havia um par de botões por item (cada resposta do FAQ, os
 * cargos, o cronograma, o órgão), para a reclamação chegar dizendo onde
 * estava o erro. Passou a valer um voto por concurso por pessoa, e quem diz
 * onde é o comentário: por isso ele deixou de perguntar "o que está errado?"
 * e passou a pedir a parte e o conserto (ver o texto do modal, abaixo).
 *
 * O que se perde está dito e não descoberto depois: sem o `bloco`, contar
 * "quantos reclamaram do cronograma" exige alguém ler os comentários. O que
 * se ganha é um voto por página: um denominador comparável entre concursos,
 * que por item não existia, porque a página sem FAQ tinha menos botões que a
 * com FAQ.
 *
 * **Onde ele fica foi medido, não escolhido por gosto** (400 concursos
 * sorteados do acervo real, altura estimada dos blocos): no fim da página, o
 * controle fica abaixo da dobra em **100%** dos concursos, e a mais de duas
 * telas em 18%; no fim da LEITURA (depois dos cargos e do FAQ, antes do
 * bloco dos atos publicados), cai para 49% e 12,5%. São os mesmos ~330px de
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
 * decisão do parceiro humano** ("gostei/não gostei precisa ser client side")
 * e não uma consequência que apareceu no caminho. Sem script, hoje, os botões
 * não fazem nada.
 *
 * O que se ganhou está medido em `app/api/avaliacao/route.ts`: em `next dev` a
 * Server Action re-renderizava a árvore de servidor da rota a cada clique, o
 * que nesta página significava o `layout` buscar `GET /acervo` de novo: 3,6
 * MB e uns 700 ms para gravar 152 bytes. Agora o clique é um `POST` à rota do
 * próprio app e mais nada. Em produção o tempo de servidor já era curto, e o
 * que muda é o que se vê: o botão marca no clique, não quando a viagem volta.
 *
 * O que **não** mudou é o motivo de existir uma rota no meio em vez de o
 * navegador falar com o engine: `BC_API_URL` continua sem chegar ao cliente.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icone } from "@/components/ui/Icone";
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
/**
 * O polegar de `Concurso.dc.html:202-203`, 24×24, espelhado no eixo vertical
 * para o "Não" ser o mesmo traço virado para baixo: como todo ícone deste
 * projeto, traço e não preenchimento.
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
      viewBox="0 0 24 24"
      width={17}
      height={17}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path
        d={
          paraCima
            ? "M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"
            : "M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"
        }
      />
    </svg>
  );
}

/**
 * O botão escolhido fica marcado. É o que a escolha do parceiro humano
 * compra: a marca aparece no clique, antes da resposta, e sai de novo se a
 * resposta disser que não gravou, porque botão marcado sobre clique perdido
 * é a mesma mentira que um "obrigado" sem registro.
 *
 * Não são `ui/Botao`: o "Não, tem erro" marcado precisa de `bg-urucum`, uma
 * quarta cor que nenhuma das cinco variantes do sistema tem, e uma classe
 * extra por cima de uma variante existente não teria como vencer com
 * segurança: as duas são utilitário puro, do mesmo peso, e quem decide
 * empate é a ordem das regras no CSS gerado, não a ordem das classes na
 * tag. Os dois estados (marcado e normal) de cada botão moram aqui, por
 * extenso.
 */
function BotaoDeVoto({
  marcado,
  tom,
  onClick,
  disabled,
  children,
}: {
  marcado: boolean;
  tom: "acao" | "urucum";
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  const corDeMarcado = tom === "acao" ? "bg-acao text-acao-texto" : "bg-urucum text-acao-texto";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={marcado}
      className={[
        "inline-flex h-11 items-center gap-2 rounded-controle px-4 text-[14px] font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:bg-rebaixada disabled:text-tinta-500",
        marcado ? corDeMarcado : "bg-rebaixada text-tinta-900 hover:bg-linha",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

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
   * pior resposta possível a alguém dizendo que a página está errada, e do
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
      // 2xx. Corpo que não é JSON (um proxy no caminho, a rota fora do ar)
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
    // uma seção. `Concurso.dc.html:197-205`.
    <div
      className={`flex flex-wrap items-center gap-6 rounded-[22px] bg-cartao px-8 py-6 shadow-cartao ${className ?? ""}`}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-anil-fundo text-anil-texto">
        <Icone nome="revisao" tamanho={24} />
      </span>

      <div className="min-w-[220px] flex-1">
        <p id={pergunta} className="text-[16px] font-bold text-tinta-900">
          Esta página está certa?
        </p>
        {/* O que se avalia é dito, porque muda o que a pessoa responde: não é
            o concurso que é bom ou ruim, é a leitura que o modelo fez do ato.
            Sem isto, um "não" poderia querer dizer "não gostei do salário",
            que não é conserto de nada. */}
        <p className="mt-0.5 text-[14px] leading-[1.5] text-tinta-600">
          Tudo acima foi lido do ato por um modelo. Um “não” faz alguém
          conferir.
        </p>
      </div>

      <div role="group" aria-labelledby={pergunta} className="flex items-center gap-2">
        <BotaoDeVoto
          marcado={escolha === true}
          tom="acao"
          onClick={() => avaliar(true)}
          disabled={enviando}
        >
          <Polegar paraCima />
          Sim
        </BotaoDeVoto>
        <BotaoDeVoto
          marcado={escolha === false}
          tom="urucum"
          onClick={() => avaliar(false)}
          disabled={enviando}
        >
          <Polegar paraCima={false} />
          Não, tem erro
        </BotaoDeVoto>
      </div>

      {/* `empty:absolute`: vazio, o recibo sai do fluxo do `flex-wrap` (que
          abria uma fileira de 24px embaixo dos botões) sem sair da árvore de
          acessibilidade, onde a região viva precisa estar antes do texto. */}
      <p aria-live="polite" className="w-full text-[12px] text-tinta-500 empty:absolute">
        {recibo(estado.resultado, estado.gostei)}
      </p>

      <dialog
        ref={modal}
        /* `backdrop:bg-veu/40` e não `tinta-900`: os dois são #141715 no
           tema claro, mas `tinta-900` é token de texto e inverte no escuro,
           onde o véu virava um clarão branco sobre a página quase preta.
           `veu` não inverte. É o mesmo tom do fundo da gaveta, para as duas
           camadas concordarem. */
        className="m-auto w-[min(32rem,92vw)] rounded-cartao bg-cartao p-6 text-tinta-900 backdrop:bg-veu/40"
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
              ela não vem: então o texto pede as duas coisas, na ordem em que
              quem for consertar precisa delas: QUAL parte, e o que devia
              estar no lugar. O exemplo no campo é a resposta inteira, com a
              parte nomeada e o valor certo, porque a forma do exemplo é o que
              a maioria vai copiar. */}
          <h2 className="text-sm font-semibold">
            Qual parte está errada, e o que devia estar no lugar?
          </h2>
          <p className="text-[12px] leading-5 text-tinta-600">
            O seu “não” já foi registrado. Escrever é opcional, e é o
            que permite consertar em vez de só contar. Diga de qual parte você
            fala (o cronograma, os cargos, o órgão, uma resposta) e o que o ato
            publicado diz: quem for corrigir precisa achar o erro no documento.
          </p>
          <textarea
            ref={comentario}
            name="comentario"
            rows={4}
            maxLength={LIMITE_DO_COMENTARIO}
            placeholder="Ex.: no cronograma, a data de fim das inscrições é de outro concurso; no ato ela é 12/03."
            className="w-full rounded-controle bg-rebaixada px-3 py-2 text-[13px] leading-6 text-tinta-900 outline-none focus:ring-2 focus:ring-acao"
          />
          {/* O recibo de fora fica atrás do modal, então o comentário que não
              gravou precisa dizer isso aqui dentro: senão a janela fica
              aberta sem explicar por quê. */}
          {estado.comentou && estado.resultado !== "gravada" && (
            <p role="alert" className="text-[12px] text-urucum-texto">
              {recibo(estado.resultado, estado.gostei)}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => modal.current?.close()}
              className="min-h-11 rounded-controle px-4 text-[14px] font-medium text-tinta-600 hover:bg-rebaixada"
            >
              Fechar sem escrever
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="min-h-11 rounded-controle bg-acao px-4 text-[14px] font-semibold text-acao-texto hover:bg-acao-hover disabled:bg-rebaixada disabled:text-tinta-500"
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
