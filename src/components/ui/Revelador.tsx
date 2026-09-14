"use client";

/**
 * O revelador: gaveta e menu, escritos uma vez.
 *
 * **A regra, e ela é do parceiro humano: nenhum revelador é escrito no lugar
 * onde ele é usado.** Gaveta, menu, modal — todos moram aqui, em
 * `components/ui/`, com o comportamento resolvido, e a tela só consome. Se
 * você veio escrever um painel que abre e fecha em `busca/`, `concurso/` ou
 * `layout/`, pare: estenda este arquivo.
 *
 * O motivo está no que existia antes desta linha: quatro `<details>` e um
 * `<dialog>`, um em cada tela, nenhum compartilhado. Nenhum dos cinco fechava
 * com Escape, nenhum fechava com clique fora, nenhum travava a rolagem do
 * fundo, nenhum devolvia o foco ao gatilho e nenhum animava. Não porque
 * alguém decidiu abrir mão disso: porque resolver essas cinco coisas custa
 * caro uma vez e caríssimo cinco, e quem estava escrevendo a tela estava
 * escrevendo a tela.
 *
 * Três deles tinham forma de sobreposição e vieram para cá: o painel do ato
 * publicado, o menu do cabeçalho e os filtros do celular.
 *
 * ## Por que `<details>` e não `<dialog>`
 *
 * O `<details>` nativo abre e fecha **sem JavaScript**, e isso era decisão
 * registrada no bloco dos atos publicados: a âncora "ver o ato" do cronograma
 * precisa levar ao texto mesmo com script desligado, e quem chega por link
 * direto não pode encontrar um botão morto. Trocar por `<dialog>` +
 * `showModal()` reverteria essa decisão.
 *
 * A pergunta era se dá para ter as duas coisas. Medido no Chrome 152:
 *
 * | | `<details>` | `<dialog>` modal |
 * |---|---|---|
 * | abre sem script | **sim** | não |
 * | anima ao entrar | sim | sim |
 * | anima ao sair | só com script | sim |
 * | foco preso | não: Tab vaza para o fundo | sim |
 * | foco preso com `inert` no resto | **sim**: Tab morre no `body` | — |
 * | Escape fecha | não | sim |
 * | trava a rolagem do fundo | não | **não** |
 * | camada de topo do navegador | não | sim |
 *
 * Duas medições decidiram. A primeira: `showModal()` **não** trava a rolagem
 * do fundo — com o modal aberto, uma roda de mouse de 240px rolou a página de
 * trás os mesmos 240px que rolaria sem ele. O travamento é JavaScript nos dois
 * caminhos, então não é argumento para nenhum. A segunda: `inert` no resto da
 * página dá ao `<details>` o mesmo foco preso do `<dialog>` — com ele, Tab a
 * partir do último focável do painel morre no `body` em vez de cair no botão
 * de trás.
 *
 * Então `<details>`, e o sem-script sobrevive.
 *
 * **O que se perde, e é honesto dizer**, do mesmo jeito que foi dito quando os
 * botões de avaliação viraram client-side:
 *
 * 1. **A camada de topo.** O `<dialog>` modal desenha acima de qualquer
 *    `z-index` e não se importa com `transform`, `filter` ou `contain` em
 *    ancestral — que transformam `fixed` num posicionamento relativo ao
 *    ancestral e jogariam a gaveta para dentro da página. Aqui o painel é
 *    `fixed` com `z-index` nosso. Hoje nenhum ancestral cria bloco de
 *    contenção; esta é a nota para quem for pôr um `transform` no `<main>`.
 * 2. **O `::backdrop` de graça.** O fundo escuro aqui é uma `<div>` nossa.
 * 3. **`aria-modal` passa a ser afirmação nossa**, não do navegador. Por isso
 *    ele só é escrito depois da hidratação, quando o `inert` que o sustenta já
 *    está de pé — antes disso seria mentira (ver `aprimorado`).
 * 4. **Sem script a saída não anima.** O navegador para de renderizar o
 *    conteúdo de um `<details>` fechado no mesmo quadro; a entrada anima, a
 *    saída some. É o degrau que o sem-script custa, e ele é pequeno.
 *
 * ## Duas formas, um miolo
 *
 * `Gaveta` e `Menu` são dois componentes, e não um com uma propriedade de
 * forma, porque **a modalidade é um contrato diferente com quem usa**: um menu
 * que trava a rolagem e prende o foco está errado, e uma gaveta que não faz
 * nem uma coisa nem outra também. O que eles compartilham — abrir, fechar,
 * Escape, clique fora, foco que entra e volta ao gatilho, movimento
 * respeitado — é `useRevelador`, e está escrito uma vez só. O movimento está
 * em `globals.css`, em `@keyframes` que as duas formas dividem.
 *
 * **Nenhum dos dois declara `role="menu"`.** O conteúdo é link e botão, e
 * `role="menu"` obrigaria a navegação por setas e tabindex rotativo que não
 * temos. `<details>`/`<summary>` já anuncia um revelador com estado, que é o
 * que isto é.
 *
 * ## As duas exceções, declaradas
 *
 * A regra é "sempre", então cada coisa que ficou de fora precisa de argumento
 * escrito. São duas, e as duas têm o mesmo teste: **acrescentar uma forma nova
 * ao revelador para um consumidor só não é compartilhar, é mudar de lugar.**
 *
 * 1. **O `<dialog>` de `concurso/Avaliacao.tsx`.** Só é alcançável depois de
 *    um `fetch` que já exige JavaScript, então não há sem-script a preservar;
 *    `showModal()` já lhe dá foco preso e camada de topo; e ele é um modal
 *    centrado, que não é nem gaveta nem menu. Quando aparecer o segundo modal
 *    centrado, ele vem para cá.
 *
 * 2. **O `<details>` de "De onde isto foi lido", em `concurso/Cargos.tsx`.**
 *    Este é o que quase passou despercebido, e vale dizer por que ele fica:
 *    ele não é sobreposição nenhuma. Abre no fluxo, empurrando o conteúdo de
 *    baixo, e é isso que se quer dele — a citação aparece embaixo do cargo a
 *    que pertence. Nada do que este módulo resolve tem onde se aplicar ali:
 *    não há fundo para travar, não há fora para clicar, não há foco para
 *    prender e não há camada para escapar. Gaveta o cobriria por cima e Menu o
 *    faria flutuar, e as duas coisas seriam piores do que está.
 *
 *    Se um dia dois lugares precisarem da mesma revelação em fluxo — com
 *    altura animada e `prefers-reduced-motion` —, é aqui que ela nasce, como
 *    terceira forma, dividindo `useRevelador` com as outras duas.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react";

/** O que `globals.css` leva para tirar o painel da tela, com folga. */
const SEGURANCA_MS = 400;

function semMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Põe `inert` em tudo que não é o revelador.
 *
 * É o que substitui o foco preso do `<dialog>`: `inert` tira o ramo inteiro da
 * ordem de tabulação e da árvore de acessibilidade, então o leitor de tela
 * também para de encontrar o fundo. Sobe do elemento até o `body` marcando os
 * irmãos de cada degrau, e devolve a função que desfaz — só do que ela marcou,
 * para não apagar um `inert` que já era de outro.
 */
function inerteAoRedor(elemento: Element): () => void {
  const marcados: Element[] = [];
  let no: Element | null = elemento;
  while (no && no !== document.body && no.parentElement) {
    for (const irmao of no.parentElement.children) {
      if (irmao === no || irmao.hasAttribute("inert")) continue;
      irmao.setAttribute("inert", "");
      marcados.push(irmao);
    }
    no = no.parentElement;
  }
  return () => {
    for (const marcado of marcados) marcado.removeAttribute("inert");
  };
}

/**
 * Trava a rolagem do fundo.
 *
 * Medido: o `<dialog>` modal do navegador não faz isso sozinho, então é
 * JavaScript de qualquer jeito. A compensação de largura é para a barra de
 * rolagem do desktop — sem ela, esconder o `overflow` alarga a página e a tela
 * inteira dá um pulo lateral ao abrir. A 375px a barra mede 0 e nada é somado.
 */
function travarRolagem(): () => void {
  const html = document.documentElement;
  const barra = window.innerWidth - html.clientWidth;
  const overflowAntes = html.style.overflow;
  const folgaAntes = document.body.style.paddingRight;
  html.style.overflow = "hidden";
  if (barra > 0) document.body.style.paddingRight = `${barra}px`;
  return () => {
    html.style.overflow = overflowAntes;
    document.body.style.paddingRight = folgaAntes;
  };
}

/** O miolo: o que as duas formas penduram no `<details>`. */
function useRevelador({ modal }: { modal: boolean }) {
  const raiz = useRef<HTMLDetailsElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  /**
   * Falso no servidor e no primeiro render do cliente, verdadeiro depois da
   * hidratação. Separa o que o `<details>` faz sozinho do que só existe com
   * script — `aria-modal`, por exemplo, não pode ser afirmado enquanto o
   * `inert` que o sustenta não estiver de pé.
   *
   * É `useSyncExternalStore` e não um `useState` com `useEffect` pelo mesmo
   * motivo de `SeletorDeTema`: o instantâneo do servidor e o do cliente são
   * dois valores declarados, e não um estado que muda logo depois de montar.
   * O assinante não faz nada porque nada disto volta atrás.
   */
  const aprimorado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  /**
   * Fecha segurando o `open` até a animação de saída terminar.
   *
   * Sem isto o navegador para de renderizar o conteúdo no mesmo quadro e não
   * há o que animar — é a diferença medida entre fechar com script e sem.
   * `animationend` é o fim normal; o tempo de segurança cobre a animação que
   * nunca começa (aba em segundo plano), para o painel não ficar preso aberto.
   */
  const fechar = useCallback(() => {
    const elemento = raiz.current;
    if (!elemento?.open || elemento.hasAttribute("data-fechando")) return;
    if (semMovimento()) {
      elemento.open = false;
      return;
    }
    elemento.setAttribute("data-fechando", "");
    let encerrado = false;
    const encerrar = (evento?: Event) => {
      if (evento && evento.target !== elemento) return;
      if (encerrado) return;
      encerrado = true;
      clearTimeout(relogio);
      elemento.removeEventListener("animationend", encerrar);
      elemento.removeAttribute("data-fechando");
      elemento.open = false;
    };
    const relogio = setTimeout(encerrar, SEGURANCA_MS);
    elemento.addEventListener("animationend", encerrar);
  }, []);

  /**
   * O clique no `<summary>` aberto fecharia na hora, sem animação. Sem script
   * é esse o caminho e está tudo certo; com script, ele passa por `fechar`.
   */
  const aoClicarNoGatilho = useCallback(
    (evento: MouseEvent<HTMLElement>) => {
      if (!raiz.current?.open) return;
      evento.preventDefault();
      fechar();
    },
    [fechar],
  );

  useEffect(() => {
    if (!aberto) return;
    const elemento = raiz.current;
    if (!elemento) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      evento.preventDefault();
      fechar();
    };
    /**
     * `pointerdown` e não `click`: fechar no gesto é o que a pessoa espera, e
     * um `click` que nasce dentro do painel e termina fora deixaria de fechar
     * quem arrastou para fora ao selecionar o texto do ato.
     */
    const aoApontar = (evento: PointerEvent) => {
      const alvo = evento.target;
      if (alvo instanceof Node && elemento.contains(alvo)) return;
      fechar();
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("pointerdown", aoApontar);
    const desfazer: Array<() => void> = [
      () => document.removeEventListener("keydown", aoTeclar),
      () => document.removeEventListener("pointerdown", aoApontar),
    ];

    if (modal) {
      desfazer.push(travarRolagem(), inerteAoRedor(elemento));
      /**
       * O foco vai para o painel, que é o conteúdo. Ele leva `tabIndex={-1}`
       * só para poder recebê-lo; com o foco ali, as setas rolam o texto do ato
       * e Shift+Tab volta para a barra de topo, que é o botão de fechar.
       */
      painel.current?.focus({ preventScroll: true });
    }

    return () => {
      for (const passo of desfazer) passo();
      /**
       * O foco volta ao gatilho, e só quando ele estava aqui dentro: quem
       * fechou clicando num link de fora já levou o foco para onde queria.
       */
      const ativo = document.activeElement;
      if (ativo === document.body || (ativo && elemento.contains(ativo))) {
        elemento.querySelector("summary")?.focus({ preventScroll: true });
      }
    };
  }, [aberto, fechar, modal]);

  return {
    raiz,
    painel,
    aberto,
    aprimorado,
    fechar,
    aoClicarNoGatilho,
    aoAlternar: (evento: SyntheticEvent<HTMLDetailsElement>) =>
      setAberto(evento.currentTarget.open),
  };
}

/** O `<summary>` não é um triângulo: o marcador sai nos dois motores. */
const SUMARIO = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/**
 * A largura do painel da gaveta. A 375px ela dá 352,5px e sobram 22,5px de
 * página do lado — o bastante para a pessoa ver que há algo atrás.
 */
const LARGURA = "w-[min(40rem,94vw)]";

/** O gatilho fechado da gaveta, quando quem chama não manda outro. */
const GATILHO_PADRAO =
  "rounded-controle bg-rebaixada px-3 py-1.5 text-[12px] font-semibold " +
  "text-tinta-800 transition-colors hover:bg-tinta-200";

/**
 * A gaveta: um painel que entra pela direita, por cima da página.
 *
 * É modal — trava a rolagem do fundo e põe `inert` no resto —, e o
 * `<summary>` tem duas caras: o botão que abre e, aberta, a barra de topo do
 * painel, que é o que fecha. As duas são o mesmo elemento porque `<summary>` é
 * o único que alterna um `<details>` sem script: um botão de fechar desenhado
 * dentro do painel deixaria quem está sem JavaScript com a gaveta aberta e sem
 * saída, já que o painel cobre o gatilho.
 */
export function Gaveta({
  rotulo,
  titulo,
  apoio,
  gatilho = GATILHO_PADRAO,
  children,
  className,
}: {
  /** A cara fechada: o conteúdo do botão que abre. */
  rotulo: ReactNode;
  /** A cara aberta: o título na barra de topo, e o nome do diálogo. */
  titulo: string;
  /** O que acompanha o rótulo nas duas caras, quando existe. */
  apoio?: ReactNode;
  /** As classes da cara fechada, para quem precisa de outro botão. */
  gatilho?: string;
  children: ReactNode;
  className?: string;
}) {
  const { raiz, painel, aberto, aprimorado, fechar, aoClicarNoGatilho, aoAlternar } =
    useRevelador({ modal: true });
  const modal = aprimorado && aberto;

  return (
    <details
      ref={raiz}
      data-revelador="gaveta"
      onToggle={aoAlternar}
      /**
       * A modalidade é afirmada no `<details>` inteiro e não no painel, porque
       * a barra de topo — que é o `<summary>`, que é o botão de fechar —
       * precisa estar dentro do diálogo.
       */
      role={modal ? "dialog" : undefined}
      aria-modal={modal ? true : undefined}
      aria-label={modal ? titulo : undefined}
      className={["group", className].filter(Boolean).join(" ")}
    >
      <summary
        onClick={aoClicarNoGatilho}
        className={[
          SUMARIO,
          "inline-flex items-center gap-2",
          gatilho,
          // Aberta: a barra de topo do painel. As classes vão por extenso, e
          // não montadas a partir de `LARGURA`: o Tailwind lê o texto do
          // arquivo, e classe que só existe depois de interpolada não é gerada.
          "group-open:fixed group-open:top-0 group-open:right-0 group-open:z-[60]",
          "group-open:w-[min(40rem,94vw)]",
          "group-open:h-auto group-open:justify-between group-open:rounded-none",
          "group-open:border-b group-open:border-tinta-200 group-open:bg-cartao",
          "group-open:px-5 group-open:py-3.5 group-open:text-[12px]",
          "group-open:font-semibold group-open:text-tinta-800",
          "group-open:hover:bg-cartao",
        ].join(" ")}
      >
        <span className="min-w-0">
          <span className="group-open:hidden">{rotulo}</span>
          <span className="hidden group-open:inline">{titulo}</span>
          {apoio && (
            <span className="ml-1 font-normal text-tinta-600">{apoio}</span>
          )}
        </span>
        <span className="hidden font-normal text-tinta-600 group-open:inline">
          fechar
        </span>
      </summary>

      {/*
        O lugar que o gatilho deixou.

        Aberta, a barra sai do fluxo (`fixed`), e sem isto a página atrás subia
        a altura do botão — medido a 375px na busca, 35px, com o primeiro
        resultado saltando de y=390 para y=355 no quadro em que a gaveta abre.
        O salto acontece enquanto o fundo ainda está clareando, então ele é
        visível. Este irmão só existe quando a gaveta está aberta, porque o
        navegador não renderiza o conteúdo de um `<details>` fechado, e ele tem
        o mesmo desenho e o mesmo conteúdo do gatilho para ocupar exatamente a
        mesma caixa. `invisible` e não `hidden`: é a caixa que interessa.
      */}
      <span
        aria-hidden="true"
        className={[SUMARIO, "invisible inline-flex items-center gap-2", gatilho].join(
          " ",
        )}
      >
        <span className="min-w-0">
          {rotulo}
          {apoio && <span className="ml-1 font-normal">{apoio}</span>}
        </span>
      </span>

      {/*
        O fundo. Escurece o que ficou `inert` — deixar a página acesa e
        inalcançável seria dizer com a forma o contrário do que o mecanismo faz.

        O tom é `escura` e não `tinta-900`. Os dois são #141715 no tema claro,
        mas `tinta-900` é um token de TEXTO e ele inverte no escuro: medido,
        `tinta-900` vira #edefee e o véu de 40% ficava com luminosidade oklab
        0,95 sobre uma página #121513 — um clarão branco no lugar de uma
        sombra. `escura` é #141715 no claro e #0c0e0d no escuro, que é o que um
        véu precisa ser nos dois.
      */}
      <div
        aria-hidden="true"
        onPointerDown={fechar}
        className="revelador-fundo fixed inset-0 z-40 bg-escura/40"
      />

      {/* O painel. Sem corte no conteúdo: ele rola por dentro, e é a única
          área rolável enquanto está aberto, porque o fundo está travado. */}
      <div
        ref={painel}
        tabIndex={-1}
        className={[
          "revelador-painel fixed inset-y-0 right-0 z-50",
          LARGURA,
          "overflow-y-auto overscroll-contain border-l border-tinta-200",
          "bg-cartao px-5 pt-16 pb-10 outline-none",
        ].join(" ")}
      >
        {children}
      </div>
    </details>
  );
}

/**
 * O menu: um painel que cai do gatilho, ancorado nele.
 *
 * **Não é modal, de propósito.** Um menu que trava a rolagem e apaga o resto
 * da página do leitor de tela cobra o preço de um diálogo por um gesto que
 * não é um: a pessoa abriu para escolher um item ou desistir, e os dois
 * caminhos são curtos. Escape, clique fora e foco de volta ao gatilho valem
 * aqui igual; `inert` e travamento de rolagem, não.
 */
export function Menu({
  rotulo,
  gatilho,
  gatilhoClassName,
  painelClassName,
  children,
  className,
}: {
  /** O nome do gatilho para quem não vê o ícone. */
  rotulo: string;
  /** O que aparece no botão. */
  gatilho: ReactNode;
  gatilhoClassName?: string;
  painelClassName?: string;
  children: ReactNode;
  className?: string;
}) {
  const { raiz, painel, aoClicarNoGatilho, aoAlternar } = useRevelador({
    modal: false,
  });

  return (
    <details
      ref={raiz}
      data-revelador="menu"
      onToggle={aoAlternar}
      className={["group relative", className].filter(Boolean).join(" ")}
    >
      <summary
        aria-label={rotulo}
        onClick={aoClicarNoGatilho}
        className={[SUMARIO, "flex items-center", gatilhoClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {gatilho}
      </summary>
      <div
        ref={painel}
        className={[
          // `origin-top-right` combina com a escala de entrada: o painel cresce
          // a partir do canto em que o gatilho está, e não do meio dele.
          "revelador-painel absolute right-0 z-30 mt-2 origin-top-right",
          "rounded-caixa bg-cartao p-2",
          painelClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </details>
  );
}
