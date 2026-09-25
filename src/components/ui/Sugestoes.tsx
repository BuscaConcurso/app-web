"use client";

/**
 * A lista de sugestões: um combobox de verdade, com o contrato de teclado que
 * a ARIA pede.
 *
 * ## Por que isto não é o `Menu` do `Revelador`
 *
 * A regra do parceiro humano é permanente e vale aqui: **componente de
 * revelar e esconder mora em `components/ui/`**, nunca dentro da tela que o
 * usa. Este arquivo obedece à regra; o que ele não faz é reaproveitar o
 * `Menu`, e o motivo tem de estar escrito.
 *
 * Os três caminhos eram: usar o `Menu` como está, ajustar o `Menu` para
 * caber, ou escrever uma forma nova ao lado dele. **O escolhido foi o
 * terceiro**, e a medida que decidiu foi o gatilho.
 *
 * O `Menu` é um `<details>` cujo gatilho é o `<summary>`: quem abre é o
 * elemento que recebe o foco, e o foco fica nele enquanto o painel está
 * aberto. Um combobox é o contrário: **quem abre é o campo de texto, e o
 * foco não sai dele em momento nenhum**. A pessoa continua digitando com a
 * lista aberta, as setas andam pela lista sem mover o cursor de texto, e a
 * opção ativa é anunciada por `aria-activedescendant`, que é justamente o
 * mecanismo que existe para mover a seleção sem mover o foco. Pôr um
 * `<summary>` entre o campo e a lista significaria ou um segundo elemento
 * focável dentro da cápsula, ou um `<summary>` que o campo abre por baixo do
 * pano, e os dois quebram a coisa que o `<details>` compra, que é abrir e
 * fechar sem JavaScript.
 *
 * E não há sem-script a preservar aqui: a lista vem do `localStorage`, que
 * só existe com script. Sem JavaScript a barra continua sendo o mesmo
 * `<form method="get">` de sempre, sem nada a mais e sem nada a menos: a
 * sugestão é aprimoramento, não requisito, e é por isso que ela não pode
 * emprestar o esqueleto que o resto da página usa para funcionar sem script.
 *
 * O próprio `Revelador` já registra a metade disto: *"nenhum dos dois declara
 * `role="menu"`, porque `role="menu"` obrigaria a navegação por setas e
 * tabindex rotativo que não temos"*. Um `role="listbox"` obriga ao mesmo, e
 * um pouco mais. Ajustar o `Menu` para ter as duas naturezas seria dar a ele
 * um segundo contrato de foco e de teclado para um consumidor só: que é
 * exatamente o teste que aquele arquivo usa para recusar formas novas:
 * *"acrescentar uma forma nova ao revelador para um consumidor só não é
 * compartilhar, é mudar de lugar"*.
 *
 * O que fica compartilhado com o `Revelador`, porque é o mesmo
 * comportamento: Escape fecha, apontar fora fecha, e o foco nunca é roubado
 * de quem o tinha. O que não se compartilha é o esqueleto.
 *
 * ## O contrato de teclado
 *
 * | tecla | com a lista aberta | com a lista fechada |
 * |---|---|---|
 * | ↓ | desce uma opção, dando a volta | abre na primeira |
 * | ↑ | sobe uma opção, dando a volta | abre na última |
 * | Home / End | primeira / última | n/d |
 * | Enter | busca a opção ativa | submete o que está escrito |
 * | Esc | fecha, sem submeter e sem limpar | n/d |
 * | Tab | fecha e segue | n/d |
 *
 * **Enter sem opção ativa submete o formulário**, que é o que a barra sempre
 * fez. Abrir a lista ao focar não pode custar nada a quem chegou para digitar
 * e apertar Enter: por isso a lista nasce sem opção ativa, e a primeira só
 * fica ativa se a pessoa pedir com a seta.
 *
 * **Esc precisa de `preventDefault`**: num `<input type="search">` o Escape
 * limpa o campo, e fechar a lista não pode apagar o que a pessoa escreveu.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

/** O que a barra espalha no `<input>`. Vazio quando não há o que sugerir. */
export type CampoDeSugestoes =
  | Record<string, never>
  | {
      role: "combobox";
      "aria-expanded": boolean;
      "aria-controls": string;
      "aria-activedescendant": string | undefined;
      onFocus: () => void;
      onKeyDown: (evento: KeyboardEvent<HTMLInputElement>) => void;
      onInput: (evento: FormEvent<HTMLInputElement>) => void;
      onBlur: (evento: FocusEvent<HTMLInputElement>) => void;
    };

export interface ListaDeSugestoes {
  id: string;
  itens: readonly string[];
  aberta: boolean;
  ativo: number;
  idDaOpcao: (indice: number) => string;
  aoEscolher: (indice: number) => void;
  aoApontar: (indice: number) => void;
}

export function useSugestoes({
  itens,
  aoEscolher,
}: {
  itens: readonly string[];
  aoEscolher: (item: string) => void;
}): {
  /** Vai no elemento que embrulha o campo **e** a lista. É o "dentro". */
  raiz: RefObject<HTMLDivElement | null>;
  campo: CampoDeSugestoes;
  lista: ListaDeSugestoes;
} {
  const semente = useId();
  const id = `sugestoes-${semente}`;
  const raiz = useRef<HTMLDivElement>(null);

  const [aberta, setAberta] = useState(false);
  /** O índice da opção ativa. `-1` é "nenhuma", e é onde a lista nasce. */
  const [ativo, setAtivo] = useState(-1);

  const ha = itens.length > 0;
  const mostrando = aberta && ha;
  const idDaOpcao = useCallback(
    (indice: number) => `${id}-opcao-${indice}`,
    [id],
  );

  const fechar = useCallback(() => {
    setAberta(false);
    setAtivo(-1);
  }, []);

  /** Apontar fora fecha, como no revelador. */
  useEffect(() => {
    if (!mostrando) return;
    const aoApontarFora = (evento: PointerEvent) => {
      const alvo = evento.target;
      if (alvo instanceof Node && raiz.current?.contains(alvo)) return;
      fechar();
    };
    document.addEventListener("pointerdown", aoApontarFora);
    return () => document.removeEventListener("pointerdown", aoApontarFora);
  }, [mostrando, fechar]);

  const escolher = useCallback(
    (indice: number) => {
      const item = itens[indice];
      if (item === undefined) return;
      fechar();
      aoEscolher(item);
    },
    [itens, fechar, aoEscolher],
  );

  if (!ha) {
    return {
      raiz,
      campo: {},
      lista: {
        id,
        itens,
        aberta: false,
        ativo: -1,
        idDaOpcao,
        aoEscolher: escolher,
        aoApontar: setAtivo,
      },
    };
  }

  const andar = (passo: number) => {
    if (!mostrando) {
      setAberta(true);
      setAtivo(passo > 0 ? 0 : itens.length - 1);
      return;
    }
    // Dá a volta: de baixo sobe para o topo. Numa lista de no máximo dez, ir
    // até o fim e voltar é mais barato do que bater numa parede.
    setAtivo((atual) => {
      const proximo = atual + passo;
      if (proximo < 0) return itens.length - 1;
      if (proximo >= itens.length) return 0;
      return proximo;
    });
  };

  const aoTeclar = (evento: KeyboardEvent<HTMLInputElement>) => {
    switch (evento.key) {
      case "ArrowDown":
        // Sem isto a seta leva o cursor de texto junto.
        evento.preventDefault();
        andar(1);
        return;
      case "ArrowUp":
        evento.preventDefault();
        andar(-1);
        return;
      case "Home":
        if (!mostrando) return;
        evento.preventDefault();
        setAtivo(0);
        return;
      case "End":
        if (!mostrando) return;
        evento.preventDefault();
        setAtivo(itens.length - 1);
        return;
      case "Enter":
        // Sem opção ativa o Enter é do formulário, e continua sendo.
        if (!mostrando || ativo < 0) return;
        evento.preventDefault();
        escolher(ativo);
        return;
      case "Escape":
        if (!mostrando) return;
        // Num `<input type="search">` o Escape limpa o campo.
        evento.preventDefault();
        fechar();
        return;
      case "Tab":
        fechar();
        return;
      default:
    }
  };

  return {
    raiz,
    campo: {
      role: "combobox",
      "aria-expanded": mostrando,
      "aria-controls": id,
      "aria-activedescendant":
        mostrando && ativo >= 0 ? idDaOpcao(ativo) : undefined,
      onFocus: () => setAberta(true),
      onKeyDown: aoTeclar,
      /**
       * Isto é memória de busca, não autocompletar: os dez termos não têm
       * relação com o que está sendo digitado agora, e deixá-los abertos por
       * cima do primeiro resultado enquanto a pessoa escreve é atrapalhar
       * quem só quer digitar e enviar. Some ao primeiro caractere e volta se
       * o campo esvaziar, ou na hora, com a seta para baixo.
       */
      onInput: (evento) => setAberta(evento.currentTarget.value === ""),
      /**
       * `relatedTarget` nulo é "o foco não foi para lugar nenhum", que é o
       * que acontece ao clicar no vão da própria barra, e aí a barra devolve
       * o foco ao campo no clique, então fechar seria um pisca-pisca. Quando
       * o foco vai para algum lugar (o seletor, o botão, outra coisa da
       * página), a lista fecha.
       */
      onBlur: (evento: FocusEvent<HTMLInputElement>) => {
        if (evento.relatedTarget === null) return;
        fechar();
      },
    },
    lista: {
      id,
      itens,
      aberta: mostrando,
      ativo,
      idDaOpcao,
      aoEscolher: escolher,
      aoApontar: setAtivo,
    },
  };
}

/** O relógio da sugestão. Traço e não preenchimento, como todo ícone daqui. */
function Relogio() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0 text-tinta-500"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.6V8l2.2 1.6" />
    </svg>
  );
}

/**
 * A lista, por cima da barra.
 *
 * Ela é renderizada **sempre** que há o que sugerir, e só some com o atributo
 * `hidden`: o `aria-controls` do campo aponta para este `id`, e um
 * `aria-controls` que aponta para elemento inexistente é uma promessa falsa
 * para o leitor de tela.
 *
 * O termo é texto que a pessoa digitou e está voltando para a tela: ele entra
 * como filho de texto, nunca como marcação.
 */
export function Sugestoes({
  rotulo,
  lista,
}: {
  /** O nome da lista para quem não a vê. */
  rotulo: string;
  lista: ListaDeSugestoes;
}) {
  const { id, itens, aberta, ativo, idDaOpcao, aoEscolher, aoApontar } = lista;
  if (itens.length === 0) return null;

  return (
    <ul
      id={id}
      role="listbox"
      aria-label={rotulo}
      hidden={!aberta}
      /**
       * `absolute` a partir da cápsula. O `max-h` tem duas metades medidas: as
       * `22rem` são as dez linhas de 32px mais a folga de 6px da caixa, que a
       * 375px dão 332px e cabem inteiras sem rolagem interna (com `20rem` a
       * décima ficava 12px cortada); os `60vh` são o teto de quem está num
       * aparelho baixo, em paisagem, onde dez linhas não caberiam de jeito
       * nenhum: aí ela rola por dentro.
       */
      className={[
        "absolute top-full right-0 left-0 z-30 mt-2",
        "max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain",
        "rounded-cartao bg-cartao p-1.5",
      ].join(" ")}
    >
      {itens.map((item, indice) => (
        <li
          key={item}
          id={idDaOpcao(indice)}
          role="option"
          aria-selected={indice === ativo}
          /**
           * O foco não sai do campo: num combobox a opção não é focável, e o
           * `mousedown` que não é impedido tira o foco de onde ele tem de
           * ficar, e, de quebra, fecharia a lista antes do clique chegar.
           */
          onMouseDown={(evento) => evento.preventDefault()}
          onMouseMove={() => aoApontar(indice)}
          onClick={() => aoEscolher(indice)}
          className={[
            "flex cursor-pointer items-center gap-2 rounded-controle px-2.5 py-2",
            "text-sm text-tinta-900",
            indice === ativo ? "bg-rebaixada" : "",
          ].join(" ")}
        >
          <Relogio />
          {/* `truncate` corta o termo colado de 120 caracteres na largura da
              caixa; o texto inteiro continua no DOM, que é o que o leitor de
              tela lê. */}
          <span className="min-w-0 truncate">{item}</span>
        </li>
      ))}
    </ul>
  );
}
