"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { Sugestoes, useSugestoes } from "@/components/ui/Sugestoes";
import { UFS, type Uf } from "@/lib/dominio";
import { ufDeCoordenada, type Contornos } from "@/lib/localizacao";
import { numero } from "@/lib/formato";
import {
  escolheuManualmente,
  liberarDeteccao,
  marcarEscolhaManual,
} from "@/lib/localizacaoManual";
import { NOME_UF } from "@/lib/rotulos";
import {
  assinarTermosBuscados,
  termosBuscados,
  termosBuscadosNoServidor,
} from "@/lib/termosBuscados";
import {
  assinarUfLembrada,
  lembrarUf,
  ufLembrada,
  ufLembradaNoServidor,
} from "@/lib/ufLembrada";

/**
 * A barra de busca.
 *
 * O esqueleto continua sendo um `<form method="get">` nativo: submeter leva a
 * `/concursos?q=...&uf=...`, uma URL que o buscador rastreia e que funciona
 * antes de qualquer hidratação. O JavaScript daqui só acrescenta a
 * pré-seleção do estado, e a barra inteira segue funcionando sem ele.
 *
 * Três regras governam a detecção:
 *
 *   1. Nunca dispara busca sozinha. Preenche o seletor e avisa, e a pessoa
 *      decide. Localização que submete busca por conta própria tira o usuário
 *      de onde ele estava.
 *   2. Pede a localização ao carregar, mas só enquanto a pessoa não decidiu.
 *      Decisão do parceiro humano: a busca começa pedindo. Não pede quando o
 *      estado já veio pela URL ou pela memória, quando a permissão já foi
 *      negada, em contexto inseguro, ou **quando a pessoa já escolheu o estado
 *      à mão** — inclusive "Todo o Brasil" — e ainda não voltou a usar o botão
 *      de localização (ver `localizacaoManual`). Esta regra dizia "nunca pede
 *      permissão sem gesto", e deixou de ser verdade quando o pedido
 *      automático entrou.
 *   3. A coordenada não sai da máquina. Os contornos dos estados vêm do nosso
 *      próprio servidor e a conta acontece no navegador. O arquivo só é
 *      baixado depois da permissão, então quem recusa não paga por ele.
 *
 * ## O foco: o campo perde o anel, a cápsula ganha
 *
 * O campo de texto não tem anel de foco: em `<input>` o `:focus-visible` do
 * navegador dispara também no clique do mouse, então o anel aparecia sempre
 * que alguém clicava para digitar. Medido: `outline-none` sozinho **não**
 * bastava, porque a regra `:focus-visible` de `globals.css` não está em
 * camada e ganha do utilitário, que está — o anel continuava lá.
 *
 * Tirar o anel e não pôr nada no lugar deixaria quem navega por teclado cego
 * ao próprio cursor, e esta é a barra que recebe o primeiro Tab da página.
 * Então **o sinal de foco mudou de dono**: quem acende é a cápsula inteira,
 * com `has-[input:focus]`, nos 2px de `acao` do anel global. É o campo que
 * perde o contorno, e não a barra.
 *
 * A folga é 4px e não os 2px do anel global, e isto foi medido na tela: o
 * `.aurora` já ocupa os 2px logo fora da cápsula, então com 2px de folga o
 * anel de foco encostava nele e os dois liam como uma borda verde grossa só —
 * que é a borda que a barra tem o tempo todo, focada ou não, e portanto não
 * sinaliza nada. Com 4px são dois anéis separados: a aurora colada na cápsula
 * e o foco por fora dela. A 375px a cápsula vai de x=14 a x=361, então o anel
 * vai de 10 a 365 e não encosta na borda da tela.
 *
 * `has-[input:focus]` e não `focus-within`: o seletor e o botão mantêm o
 * contorno nativo deles, que só aparece na navegação por teclado, e com
 * `focus-within` a cápsula acenderia junto — dois anéis concêntricos para um
 * foco só.
 *
 * ## Clicar em qualquer lugar da barra foca o campo
 *
 * A "barra" é a cápsula inteira, e o vão entre as peças dela não fazia nada
 * ao ser clicado. Agora faz: o clique que não achou dono vai para o campo.
 *
 * Quem responde "isto já tem dono?" é o navegador, e não uma lista de tags
 * nossa — lista fechada envelhece e ninguém percebe. O tratador roda no
 * `click`, quando o navegador **já** decidiu o foco: se o foco está dentro da
 * barra, o clique acertou alguém focável (o próprio campo, o seletor, o
 * botão, ou o que vier depois) e não há nada a fazer. Duas consequências
 * caem de graça: arrastar para selecionar texto dentro do campo continua
 * intacto, porque o campo já está com o foco e não chamamos `focus()` de
 * novo; e a sugestão, que por contrato de combobox segura o foco no campo,
 * nunca tem o clique sequestrado.
 *
 * ## A lista de sugestões
 *
 * Ao focar, o campo abre a lista dos últimos termos que deram resultado. Ela
 * é **aprimoramento pendurado**: sem JavaScript não há `localStorage`, não há
 * lista, e a barra é o mesmo `<form method="get">` de sempre. Por isso o
 * `role="combobox"` e o `aria-expanded` só aparecem quando existe lista para
 * controlar — afirmar um combobox sem popup seria mentir para o leitor de
 * tela, pelo mesmo motivo que o revelador só escreve `aria-modal` depois da
 * hidratação.
 *
 * Quem **escreve** na memória não é a barra: é a página, que é a única que
 * sabe quantos resultados a busca deu (ver `RegistroDaBusca`). A barra só lê.
 */
type Origem = "detectada" | "lembrada";
type Estado = "ocioso" | "detectando" | "negada" | "falhou" | "fora";

/** Só é verdade depois da hidratação, sem `setState` em efeito nem piscar. */
function useHidratado(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function BarraBusca({
  q,
  uf,
  compacta = false,
  dimensoes,
}: {
  q?: string;
  uf?: string;
  /**
   * O que a lista consegue filtrar hoje. `undefined` quando quem renderiza
   * não perguntou (a vitrine do design system), e aí o seletor funciona como
   * sempre.
   *
   * `comUf: 0` desabilita o seletor e diz por quê. Oferecer os 27 estados
   * quando nenhum deles devolve nada é a tela afirmando uma capacidade que o
   * dado não tem — e quem clica conclui que não há concurso no estado dele,
   * que é falso. Desabilitado e explicado, a pessoa sabe que a falta é nossa,
   * e o controle volta sozinho quando o dado chegar.
   */
  dimensoes?: { total: number; comUf: number };
  compacta?: boolean;
}) {
  const hidratado = useHidratado();
  const lembrada = useSyncExternalStore(
    assinarUfLembrada,
    ufLembrada,
    ufLembradaNoServidor,
  );
  const termos = useSyncExternalStore(
    assinarTermosBuscados,
    termosBuscados,
    termosBuscadosNoServidor,
  );

  const formulario = useRef<HTMLFormElement>(null);
  const campoDeTexto = useRef<HTMLInputElement>(null);

  const { raiz, campo, lista } = useSugestoes({
    itens: termos,
    /**
     * Escolher uma sugestão é buscar por ela: o campo recebe o texto e o
     * formulário submete pelo caminho nativo, o mesmo do botão. Os filtros
     * que estiverem na barra vão junto — inclusive o estado, que tem memória
     * própria e é por isso que ele não é guardado em cada termo.
     */
    aoEscolher: (termo) => {
      const campoDeBusca = campoDeTexto.current;
      if (!campoDeBusca) return;
      campoDeBusca.value = termo;
      formulario.current?.requestSubmit();
    },
  });

  /**
   * O clique que não achou dono vai para o campo. Ver a docstring: quem
   * responde se o alvo já era interativo é o navegador, pelo foco que ele
   * acabou de dar.
   */
  const aoClicarNaBarra = (evento: MouseEvent<HTMLFormElement>) => {
    const dentro = evento.currentTarget;
    const focado = document.activeElement;
    if (focado && focado !== document.body && dentro.contains(focado)) return;
    campoDeTexto.current?.focus();
  };

  /** `null` significa que a pessoa não mexeu no seletor nesta navegação. */
  const [manual, setManual] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [detectada, setDetectada] = useState(false);

  // A UF da URL vem de uma escolha explícita e ganha da memória. O que a
  // pessoa mexer agora ganha das duas.
  const escolhida = manual ?? uf ?? lembrada ?? "";

  const origem: Origem | null = (() => {
    if (manual !== null || uf || !escolhida) return null;
    return detectada ? "detectada" : "lembrada";
  })();

  const detectar = useCallback(async () => {
    setEstado("detectando");
    try {
      const posicao = await new Promise<GeolocationPosition>(
        (resolver, rejeitar) =>
          navigator.geolocation.getCurrentPosition(resolver, rejeitar, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 10 * 60 * 1000,
          }),
      );

      const resposta = await fetch("/geo/uf.json");
      if (!resposta.ok) throw new Error("contornos indisponíveis");
      const contornos = (await resposta.json()) as Contornos;

      const encontrada = ufDeCoordenada(
        contornos,
        posicao.coords.longitude,
        posicao.coords.latitude,
      );

      if (!encontrada) {
        setEstado("fora");
        return;
      }
      setManual(null);
      setDetectada(true);
      setEstado("ocioso");
      lembrarUf(encontrada);
    } catch (erro) {
      const negada =
        typeof GeolocationPositionError !== "undefined" &&
        erro instanceof GeolocationPositionError &&
        erro.code === erro.PERMISSION_DENIED;
      setEstado(negada ? "negada" : "falhou");
    }
  }, []);

  /**
   * A busca começa pedindo a localização, por decisão do parceiro humano.
   *
   * Antes só pedia quem já tinha concedido — sem gesto, sem prompt —, e o
   * resto dependia do botão. Agora o pedido sai ao carregar, com o prompt do
   * navegador, sempre que ainda não sabemos o estado.
   *
   * O custo, registrado para quem vier mexer: prompt de permissão sem
   * contexto é recusado com mais frequência, e **a recusa vale para a origem
   * inteira** — depois dela nem o botão consegue perguntar de novo; só a
   * própria pessoa, nas configurações do navegador. Por isso o pedido não
   * sai quando não adiantaria ou não caberia:
   *
   * - o estado já veio pela URL ou pela memória;
   * - a permissão já foi negada (o navegador não mostraria prompt, e
   *   insistir só gravaria "negada" de novo);
   * - o contexto é inseguro (`http://192.168...`): a API recusa sem prompt;
   * - o acervo não sabe o estado de concurso nenhum, e o filtro não filtra.
   *
   * `jaPediu` segura um pedido por montagem. Em desenvolvimento o React roda
   * o efeito duas vezes de propósito, e a ref sobrevive a essa repetição.
   */
  const jaPediu = useRef(false);
  useEffect(() => {
    if (jaPediu.current) return;
    if (uf || lembrada) return;
    // A pessoa já escolheu o estado à mão — inclusive "Todo o Brasil", que
    // deixa `lembrada` vazia — e ainda não voltou a pedir a localização.
    if (escolheuManualmente()) return;
    if (!window.isSecureContext || !("geolocation" in navigator)) return;
    if (dimensoes !== undefined && dimensoes.comUf === 0) return;

    jaPediu.current = true;
    // Sempre por promessa, inclusive sem Permissions API: `detectar` muda o
    // estado logo no início, e chamá-lo direto no corpo do efeito dispara
    // renderização em cascata (`react-hooks/set-state-in-effect`). Sem a API
    // não dá para saber se já foi negada, então pede — o pior caso é o mesmo
    // "negada" que o botão daria.
    const consulta: Promise<PermissionStatus | null> =
      navigator.permissions?.query({ name: "geolocation" }) ??
      Promise.resolve(null);
    consulta
      .then((permissao) => {
        if (permissao?.state !== "denied") void detectar();
      })
      .catch(() => void detectar());
  }, [uf, lembrada, detectar, dimensoes]);

  const trocar = (valor: string) => {
    // Qualquer escolha à mão desliga o pedido automático ao carregar, até o
    // botão de localização ser usado de novo. Ver `localizacaoManual`.
    marcarEscolhaManual();
    setManual(valor);
    setDetectada(false);
    setEstado("ocioso");
    lembrarUf((valor as Uf) || null);
  };

  // `navigator.geolocation` EXISTE em contexto inseguro — o que não existe é
  // a permissão. O navegador só libera a API em HTTPS ou em `localhost`; por
  // `http://192.168.x.x`, que é como se valida do celular na rede local, ele
  // recusa, e a recusa chega no mesmo `PERMISSION_DENIED` de quem clicou em
  // "bloquear".
  //
  // Sem esta linha o botão aparecia, o clique falhava e a tela dizia "sem
  // acesso à localização" — culpando a pessoa por uma regra do endereço.
  //
  // **E o botão some calado, sem explicar.** Decisão do parceiro humano: não
  // exibir o motivo na interface. Quem abre pelo IP da rede local é quem está
  // desenvolvendo, e para essa pessoa a explicação está aqui, no código, que
  // é onde ela resolve. Para quem visita o site publicado em HTTPS a condição
  // nunca é falsa, então uma frase sobre HTTPS seria ruído permanente para
  // explicar um caso que ela nunca vive.
  const contextoSeguro = !hidratado || window.isSecureContext;

  const podeDetectar =
    hidratado &&
    "geolocation" in navigator &&
    contextoSeguro &&
    !escolhida &&
    estado !== "detectando" &&
    // Pedir a localização de alguém para preencher um filtro que não filtra
    // nada seria pedir permissão por nada.
    !(dimensoes !== undefined && dimensoes.comUf === 0);

  const altura = compacta ? "h-9" : "h-11";
  const corpo = compacta ? "text-sm" : "text-base";

  // Quem perguntou e recebeu zero: o acervo não sabe o estado de nenhum
  // concurso, e o seletor não tem como cumprir o que oferece.
  const semEstado = dimensoes !== undefined && dimensoes.comUf === 0;

  return (
    <div>
      {/* O embrulho é o "dentro" da lista: a cápsula mais o painel que cai
          dela. `relative` fica aqui e não no `<form>` porque o `.aurora` já
          usa o `position` do formulário para a moldura girante, e porque a
          lista precisa medir a largura da barra inteira. */}
      <div ref={raiz} className="relative">
        <form
          ref={formulario}
          action="/concursos"
          method="get"
          role="search"
          onClick={aoClicarNaBarra}
          className={`aurora flex flex-col gap-2 rounded-3xl bg-cartao outline-acao outline-offset-4 has-[input:focus]:outline-2 sm:flex-row sm:items-center sm:rounded-full ${
            compacta ? "p-1.5" : "p-2"
          }`}
        >
          <div className="flex flex-1 items-center gap-2.5 rounded-full px-4">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="size-4 shrink-0 text-tinta-500"
            >
              <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="m13.6 13.6 3.2 3.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <label htmlFor="busca-q" className="sr-only">
              Cargo, órgão ou banca
            </label>
            {/*
              `autoComplete="off"` nos dois controles: o navegador restaura o
              valor dos campos no recarregamento, ANTES de o React hidratar. O
              que ele restaura é o que a pessoa digitou da última vez; o que o
              servidor renderizou é o `q` da URL e "Todo o Brasil" no seletor
              (`ufLembradaNoServidor` devolve nulo, porque no servidor não há
              `localStorage`). A divergência aparece como "attributes of the
              server rendered HTML didn't match the client properties", que é a
              redação do React para propriedade de controle de formulário.

              Desligar a restauração devolve a verdade ao servidor, e não custa
              nada aqui: a URL já é a fonte do que a pessoa buscou, e a memória
              do estado é lida do `localStorage` depois da hidratação, de
              propósito.
            */}
            <input
              ref={campoDeTexto}
              id="busca-q"
              name="q"
              type="search"
              defaultValue={q}
              autoComplete="off"
              placeholder="Cargo, órgão ou banca. Ex.: analista judiciário"
              /* Quem desenha o foco deste campo é a cápsula, logo acima. */
              data-sem-anel=""
              className={`w-full bg-transparent text-tinta-900 placeholder:text-tinta-400 ${altura} ${corpo}`}
              {...campo}
            />
          </div>

          <div className="flex gap-2">
            <label htmlFor="busca-uf" className="sr-only">
              Estado
            </label>
            <div className="relative">
              <select
                id="busca-uf"
                name="uf"
                value={escolhida}
                autoComplete="off"
                onChange={(evento) => trocar(evento.target.value)}
                disabled={semEstado}
                aria-describedby={semEstado ? "busca-uf-motivo" : undefined}
                className={`w-full appearance-none rounded-full bg-rebaixada pr-9 pl-4 text-sm font-medium sm:w-[11rem] ${altura} ${
                  semEstado
                    ? "cursor-not-allowed text-tinta-500"
                    : "cursor-pointer text-tinta-900"
                }`}
              >
                <option value="">Todo o Brasil</option>
                {UFS.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {NOME_UF[sigla]}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tinta-600"
              >
                <path
                  d="M4 6.5 8 10.5l4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <button
              type="submit"
              className={`shrink-0 rounded-full bg-acao px-7 font-semibold text-acao-texto transition-colors hover:bg-acao-hover ${altura} ${corpo}`}
            >
              Buscar
            </button>
          </div>
        </form>

        <Sugestoes rotulo="Buscas recentes que deram resultado" lista={lista} />
      </div>

      {semEstado && (
        <p id="busca-uf-motivo" className="mt-2 text-[12px] text-tinta-600">
          Ainda não sabemos o estado de nenhum dos{" "}
          <strong className="numero font-medium">{numero(dimensoes!.total)}</strong>{" "}
          concursos do acervo, então o filtro por estado está desligado.
          Procure pelo nome da cidade ou do órgão enquanto isso.
        </p>
      )}

      <div
        aria-live="polite"
        className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 px-1 text-xs text-tinta-500"
      >
        {podeDetectar && (
          <button
            type="button"
            onClick={() => {
              liberarDeteccao();
              void detectar();
            }}
            className="inline-flex items-center gap-1.5 font-medium text-tinta-600 underline underline-offset-[3px] hover:text-link"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="size-3.5"
            >
              <path
                d="M8 14.5S13 10.4 13 6.7A5 5 0 0 0 3 6.7C3 10.4 8 14.5 8 14.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle
                cx="8"
                cy="6.6"
                r="1.7"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
            Usar minha localização
          </button>
        )}

        {estado === "detectando" && <span>Procurando seu estado…</span>}

        {estado === "ocioso" && origem && (
          <>
            <span>
              {origem === "detectada"
                ? `Mostrando ${NOME_UF[escolhida as Uf]} pela sua localização.`
                : `Guardamos ${NOME_UF[escolhida as Uf]} da sua última visita.`}
            </span>
            <button
              type="button"
              onClick={() => trocar("")}
              className="font-medium text-tinta-600 underline underline-offset-[3px] hover:text-link"
            >
              Ver todo o Brasil
            </button>
          </>
        )}

        {estado === "negada" && (
          <span>Sem acesso à localização. Escolha o estado na lista.</span>
        )}
        {estado === "falhou" && (
          <span>Não deu para descobrir seu estado. Escolha na lista.</span>
        )}
        {estado === "fora" && (
          <span>Você parece estar fora do Brasil. Escolha o estado na lista.</span>
        )}
      </div>
    </div>
  );
}
