"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type MouseEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sugestoes, useSugestoes } from "@/components/ui/Sugestoes";
import { UFS, type Uf } from "@/lib/dominio";
import { termoDaPagina } from "@/lib/enderecoDaBusca";
import { ufDeCoordenada, type Contornos } from "@/lib/localizacao";
import { numero } from "@/lib/formato";
import {
  escolheuManualmente,
  liberarDeteccao,
  marcarEscolhaManual,
  paginaPedeLocalizacao,
} from "@/lib/localizacaoManual";
import { destinoDoFormulario } from "@/lib/parametros";
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
 * A barra de busca, que mora no cabeçalho de toda página.
 *
 * O esqueleto continua sendo um `<form method="get">` nativo: sem JavaScript,
 * submeter leva a `/concursos?q=...&uf=...`, e o `proxy.ts` leva esse
 * endereço a `/busca/<slug>`. Com JavaScript a busca é navegação do cliente
 * (`router.push`), sem recarregar a página. O resto do JavaScript daqui só
 * acrescenta a pré-seleção do estado e a lista de sugestões.
 *
 * O termo mostrado no campo sai do caminho (`termoDaPagina`), e não de uma
 * propriedade: a barra está no layout, que não recebe `searchParams`, e o
 * termo mora em `/busca/<slug>`. A UF sai de `useSearchParams`, ver
 * `BarraBuscaDoCabecalho` no fim do arquivo.
 *
 * Três regras governam a detecção:
 *
 *   1. Nunca dispara busca sozinha. Preenche o seletor e avisa, e a pessoa
 *      decide. Localização que submete busca por conta própria tira o usuário
 *      de onde ele estava.
 *   2. Pede a localização ao carregar, mas só enquanto a pessoa não decidiu,
 *      e só na home e nas listas (`paginaPedeLocalizacao`). Decisão do
 *      parceiro humano: a busca começa pedindo. Não pede quando o estado já
 *      veio pela URL ou pela memória, quando a permissão já foi negada, em
 *      contexto inseguro, ou **quando a pessoa já escolheu o estado à mão**
 *      (inclusive "Todo o Brasil") e ainda não voltou a usar o botão de
 *      localização (ver `localizacaoManual`).
 *   3. A coordenada não sai da máquina. Os contornos dos estados vêm do nosso
 *      próprio servidor e a conta acontece no navegador. O arquivo só é
 *      baixado depois da permissão, então quem recusa não paga por ele.
 *
 * ## A forma: uma linha só, em qualquer largura
 *
 * No cabeçalho a barra não pode empilhar: campo, seletor e botão ficam na
 * mesma linha também no celular, com 36px de altura. Abaixo de `sm` a lupa
 * da esquerda sai e o botão vira só a lupa, que é o que deixa o campo com
 * espaço para o texto. Na home a cápsula leva o `.aurora`, o anel verde que
 * gira; fora dela é `bg-rebaixada` e parada, para não competir com o
 * conteúdo da página.
 *
 * ## O foco: o campo perde o anel, a cápsula ganha
 *
 * O campo de texto não tem anel de foco: em `<input>` o `:focus-visible` do
 * navegador dispara também no clique do mouse, então o anel aparecia sempre
 * que alguém clicava para digitar. Medido: `outline-none` sozinho **não**
 * bastava, porque a regra `:focus-visible` de `globals.css` não está em
 * camada e ganha do utilitário, que está; o anel continuava lá.
 *
 * Tirar o anel e não pôr nada no lugar deixaria quem navega por teclado cego
 * ao próprio cursor. Então **o sinal de foco mudou de dono**: quem acende é a
 * cápsula inteira, com `has-[input:focus]`, nos 2px de `acao` do anel global.
 *
 * A folga é 4px e não os 2px do anel global: o `.aurora` já ocupa os 2px logo
 * fora da cápsula, e com 2px de folga o anel de foco encostava nele e os dois
 * liam como uma borda verde grossa só. Com 4px são dois anéis separados.
 *
 * `has-[input:focus]` e não `focus-within`: o seletor e o botão mantêm o
 * contorno nativo deles, e com `focus-within` a cápsula acenderia junto, dois
 * anéis concêntricos para um foco só.
 *
 * ## Clicar em qualquer lugar da barra foca o campo
 *
 * O clique que não achou dono vai para o campo. Quem responde "isto já tem
 * dono?" é o navegador: o tratador roda no `click`, quando o foco já foi
 * decidido; se ele está dentro da barra, o clique acertou alguém focável e
 * não há nada a fazer. Arrastar para selecionar texto no campo continua
 * intacto, e a sugestão, que segura o foco no campo, nunca tem o clique
 * sequestrado.
 *
 * ## A lista de sugestões
 *
 * Ao focar, o campo abre a lista dos últimos termos que deram resultado. Ela
 * é **aprimoramento pendurado**: sem JavaScript não há `localStorage`, não há
 * lista, e a barra é o mesmo `<form method="get">` de sempre. Por isso o
 * `role="combobox"` e o `aria-expanded` só aparecem quando existe lista para
 * controlar.
 *
 * Quem **escreve** na memória não é a barra: é a página de resultados, que é
 * a única que sabe quantos resultados a busca deu (ver `RegistroDaBusca`). A
 * barra só lê.
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

function Lupa({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m13.6 13.6 3.2 3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BarraBusca({
  uf,
  dimensoes,
}: {
  /** A UF da URL. Vem de `BarraBuscaDoCabecalho`, que lê a query. */
  uf?: Uf;
  /**
   * O que a lista consegue filtrar hoje. `undefined` quando quem renderiza
   * não perguntou, e aí o seletor funciona como sempre.
   *
   * `comUf: 0` desabilita o seletor e diz por quê. Oferecer os 27 estados
   * quando nenhum deles devolve nada é a tela afirmando uma capacidade que o
   * dado não tem, e quem clica conclui que não há concurso no estado dele,
   * que é falso. Desabilitado e explicado, a pessoa sabe que a falta é nossa,
   * e o controle volta sozinho quando o dado chegar.
   */
  dimensoes?: { total: number; comUf: number };
}) {
  const caminho = usePathname();
  const router = useRouter();
  const q = termoDaPagina(caminho);
  const naHome = caminho === "/";

  const base = useId();
  const idCampo = `${base}-q`;
  const idUf = `${base}-uf`;
  const idMotivo = `${base}-uf-motivo`;

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
     * formulário submete pelo mesmo caminho do botão (`aoEnviar`). O estado
     * que estiver no seletor vai junto; ele tem memória própria, e é por isso
     * que não é guardado em cada termo.
     */
    aoEscolher: (termo) => {
      const campoDeBusca = campoDeTexto.current;
      if (!campoDeBusca) return;
      campoDeBusca.value = termo;
      formulario.current?.requestSubmit();
    },
  });

  /**
   * Com JavaScript a busca é navegação do cliente: a URL muda e a página
   * troca sem recarregar. Sem ele, o `action` nativo leva a `/concursos?q=`,
   * e o `proxy.ts` redireciona para o mesmo endereço.
   */
  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    router.push(
      destinoDoFormulario(String(dados.get("q") ?? ""), String(dados.get("uf") ?? "")),
    );
  };

  /** O clique que não achou dono vai para o campo. Ver a docstring. */
  const aoClicarNaBarra = (evento: MouseEvent<HTMLFormElement>) => {
    const dentro = evento.currentTarget;
    const focado = document.activeElement;
    if (focado && focado !== document.body && dentro.contains(focado)) return;
    campoDeTexto.current?.focus();
  };

  /** `null` significa que a pessoa não mexeu no seletor desde a última UF da URL. */
  const [manual, setManual] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>("ocioso");
  const [detectada, setDetectada] = useState(false);

  /**
   * A barra não remonta entre páginas (mora no layout), então a escolha à mão
   * sobreviveria a uma navegação para outra UF da URL e ganharia dela. Quando
   * a UF da URL muda, a URL volta a mandar: é o padrão do React de ajustar o
   * estado durante a renderização quando uma propriedade muda.
   */
  const [ufAnterior, setUfAnterior] = useState(uf);
  if (uf !== ufAnterior) {
    setUfAnterior(uf);
    setManual(null);
  }

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
   * O custo, registrado para quem vier mexer: prompt de permissão sem
   * contexto é recusado com mais frequência, e **a recusa vale para a origem
   * inteira**; depois dela nem o botão consegue perguntar de novo. Por isso o
   * pedido não sai quando não adiantaria ou não caberia:
   *
   * - a página não é a home nem uma lista (`paginaPedeLocalizacao`);
   * - o estado já veio pela URL ou pela memória;
   * - a permissão já foi negada (o navegador não mostraria prompt);
   * - o contexto é inseguro (`http://192.168...`): a API recusa sem prompt;
   * - o acervo não sabe o estado de concurso nenhum, e o filtro não filtra.
   *
   * `jaPediu` segura um pedido por montagem, e a barra monta uma vez por
   * carga, porque mora no cabeçalho. Quem chega por `/entrar` e depois vai à
   * home recebe o pedido na home. Em desenvolvimento o React roda o efeito
   * duas vezes de propósito, e a ref sobrevive a essa repetição.
   */
  const jaPediu = useRef(false);
  useEffect(() => {
    if (jaPediu.current) return;
    if (uf || lembrada) return;
    // A pessoa já escolheu o estado à mão (inclusive "Todo o Brasil", que
    // deixa `lembrada` vazia) e ainda não voltou a pedir a localização.
    if (escolheuManualmente()) return;
    if (!window.isSecureContext || !("geolocation" in navigator)) return;
    if (dimensoes !== undefined && dimensoes.comUf === 0) return;
    if (!paginaPedeLocalizacao(caminho)) return;

    jaPediu.current = true;
    // Sempre por promessa, inclusive sem Permissions API: `detectar` muda o
    // estado logo no início, e chamá-lo direto no corpo do efeito dispara
    // renderização em cascata (`react-hooks/set-state-in-effect`).
    const consulta: Promise<PermissionStatus | null> =
      navigator.permissions?.query({ name: "geolocation" }) ??
      Promise.resolve(null);
    consulta
      .then((permissao) => {
        if (permissao?.state !== "denied") void detectar();
      })
      .catch(() => void detectar());
  }, [uf, lembrada, detectar, dimensoes, caminho]);

  const trocar = (valor: string) => {
    // Qualquer escolha à mão desliga o pedido automático ao carregar, até o
    // botão de localização ser usado de novo. Ver `localizacaoManual`.
    marcarEscolhaManual();
    setManual(valor);
    setDetectada(false);
    setEstado("ocioso");
    lembrarUf((valor as Uf) || null);
  };

  // `navigator.geolocation` EXISTE em contexto inseguro; o que não existe é
  // a permissão. O navegador só libera a API em HTTPS ou em `localhost`, e
  // por `http://192.168.x.x` a recusa chega no mesmo `PERMISSION_DENIED` de
  // quem clicou em "bloquear". Sem esta linha o botão aparecia, o clique
  // falhava e a tela culpava a pessoa por uma regra do endereço.
  //
  // **E o botão some calado, sem explicar.** Decisão do parceiro humano: quem
  // abre pelo IP da rede local é quem está desenvolvendo, e para essa pessoa
  // a explicação está aqui, no código.
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
          onSubmit={aoEnviar}
          onClick={aoClicarNaBarra}
          className={`flex items-center gap-1 rounded-full p-1 outline-acao outline-offset-4 has-[input:focus]:outline-2 ${
            naHome ? "aurora bg-cartao" : "bg-rebaixada"
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-1 pl-3">
            <Lupa className="hidden size-4 shrink-0 text-tinta-500 sm:block" />
            <label htmlFor={idCampo} className="sr-only">
              Cargo, órgão ou banca
            </label>
            {/*
              `autoComplete="off"` nos dois controles: o navegador restaura o
              valor dos campos no recarregamento, ANTES de o React hidratar, e
              o que ele restaura diverge do que o servidor renderizou. A URL já
              é a fonte do que a pessoa buscou, e a memória do estado é lida do
              `localStorage` depois da hidratação, de propósito.

              `key={caminho}`: a barra não remonta entre páginas, e
              `defaultValue` só vale na montagem. Com a chave, ao navegar para
              outra busca o campo nasce de novo com o termo novo.
            */}
            <input
              key={caminho}
              ref={campoDeTexto}
              id={idCampo}
              name="q"
              type="search"
              defaultValue={q}
              autoComplete="off"
              placeholder="Cargo, órgão ou banca"
              /* Quem desenha o foco deste campo é a cápsula, logo acima. */
              data-sem-anel=""
              className="h-9 w-full min-w-0 bg-transparent text-sm text-tinta-900 placeholder:text-tinta-500"
              {...campo}
            />
          </div>

          <label htmlFor={idUf} className="sr-only">
            Estado
          </label>
          <div className="relative shrink-0">
            <select
              id={idUf}
              name="uf"
              value={escolhida}
              autoComplete="off"
              onChange={(evento) => trocar(evento.target.value)}
              disabled={semEstado}
              aria-describedby={semEstado ? idMotivo : undefined}
              className={`h-9 w-[7.5rem] appearance-none truncate rounded-full pr-7 pl-3 text-[13px] font-medium sm:w-[11rem] ${
                naHome ? "bg-rebaixada" : "bg-cartao"
              } ${
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
              className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-tinta-600"
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
            aria-label="Buscar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-acao text-sm font-semibold text-acao-texto transition-colors hover:bg-acao-hover sm:w-auto sm:px-5"
          >
            <Lupa className="size-4 sm:hidden" />
            <span aria-hidden="true" className="hidden sm:inline">
              Buscar
            </span>
          </button>
        </form>

        <Sugestoes rotulo="Buscas recentes que deram resultado" lista={lista} />
      </div>

      {semEstado && (
        <p id={idMotivo} className="mt-2 px-1 text-[12px] text-tinta-600">
          Ainda não sabemos o estado de nenhum dos{" "}
          <strong className="numero font-medium">{numero(dimensoes!.total)}</strong>{" "}
          concursos do acervo, então o filtro por estado está desligado.
          Procure pelo nome da cidade ou do órgão enquanto isso.
        </p>
      )}

      {/* `empty:hidden` e não `min-h-5`: no cabeçalho, 20px reservados para
          uma linha vazia seriam 20px de cabeçalho em toda página. */}
      <div
        aria-live="polite"
        className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-3 text-xs text-tinta-500 empty:hidden"
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

/**
 * A barra do cabeçalho com o estado da URL.
 *
 * "A UF da URL ganha da memória" continua valendo, e a UF da URL só existe
 * via `useSearchParams`. Numa página estática isso obriga um `Suspense`: o
 * HTML leva a barra sem a UF (o `fallback`) e o navegador desenha a que leu
 * a URL. As duas têm a mesma caixa, então a troca não desloca nada.
 */
export function BarraBuscaDoCabecalho({
  dimensoes,
}: {
  dimensoes?: { total: number; comUf: number };
}) {
  return (
    <Suspense fallback={<BarraBusca dimensoes={dimensoes} />}>
      <BarraBuscaComUfDaUrl dimensoes={dimensoes} />
    </Suspense>
  );
}

function BarraBuscaComUfDaUrl({
  dimensoes,
}: {
  dimensoes?: { total: number; comUf: number };
}) {
  const bruta = useSearchParams().get("uf") ?? "";
  const uf = (UFS as readonly string[]).includes(bruta) ? (bruta as Uf) : undefined;
  return <BarraBusca dimensoes={dimensoes} uf={uf} />;
}
