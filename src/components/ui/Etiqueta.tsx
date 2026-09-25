import type { ReactNode } from "react";
import { ESTILO_DO_TOM } from "@/lib/situacao";
import { Icone, type NomeDoIcone } from "./Icone";
import type { Tom } from "@/lib/dominio";

/** A paleta nova da etiqueta, pelo nome da cor e não pela situação. */
export type TomDaEtiqueta = "neutro" | "verde" | "anil" | "ouro" | "urucum";

/**
 * De situação (`Tom`, de `situacao.ts`) para cor (`TomDaEtiqueta`): quem já
 * chama `Etiqueta` com o tom do cartão continua compilando e lendo a cor
 * certa, sem reescrever nada.
 */
const CORRESPONDE_A: Record<Tom, TomDaEtiqueta> = {
  aberto: "verde",
  urgente: "urucum",
  previsto: "ouro",
  encerrado: "neutro",
};

const CORES: Record<TomDaEtiqueta, { chip: string; ponto: string; texto: string }> = {
  neutro: { chip: "bg-rebaixada text-tinta-600", ponto: "bg-tinta-500", texto: "text-tinta-500" },
  verde: {
    chip: ESTILO_DO_TOM.aberto.chip,
    ponto: ESTILO_DO_TOM.aberto.ponto,
    texto: "text-verde-texto",
  },
  ouro: {
    chip: ESTILO_DO_TOM.previsto.chip,
    ponto: ESTILO_DO_TOM.previsto.ponto,
    texto: "text-ouro-sinal-texto",
  },
  urucum: {
    chip: ESTILO_DO_TOM.urgente.chip,
    ponto: ESTILO_DO_TOM.urgente.ponto,
    texto: "text-urucum-texto",
  },
  anil: { chip: "bg-anil-fundo text-anil-texto", ponto: "bg-anil", texto: "text-anil-texto" },
};

function resolverTom(tom: Tom | TomDaEtiqueta | undefined): TomDaEtiqueta {
  if (tom === undefined) return "neutro";
  if (
    tom === "aberto" ||
    tom === "urgente" ||
    tom === "previsto" ||
    tom === "encerrado"
  ) {
    return CORRESPONDE_A[tom];
  }
  return tom;
}

/**
 * Etiqueta.
 *
 * A pílula do desenho novo: `h-[26px]`, `rounded-full`, cor só quando o tom
 * pede (o ponto de 6px de antes, ou o ícone de 12px, ou o fundo inteiro da
 * pílula). Sem tom, é a cinza neutra que serve para escolaridade, banca e
 * qualquer outro metadado.
 */
export function Etiqueta({
  children,
  tom,
  icone,
  comPonto = false,
  className,
}: {
  children: ReactNode;
  /** Sem tom, a etiqueta é neutra. Aceita a cor nova ou a situação de sempre. */
  tom?: Tom | TomDaEtiqueta;
  /** Ícone de 12px antes do texto. */
  icone?: NomeDoIcone;
  comPonto?: boolean;
  className?: string;
}) {
  const cor = CORES[resolverTom(tom)];

  return (
    <span
      className={[
        "inline-flex h-[26px] items-center gap-1.5 rounded-full px-[9px]",
        // `max-w-full` é o que impede uma etiqueta sozinha de esticar a
        // página. Medido a 375px, onde a fileira tem 319px úteis: 2 dos 15
        // nomes de banca do acervo passam disso sozinhos (366px e 325px, com
        // `whitespace-nowrap`), e os 2 cartões correspondentes davam scroll
        // horizontal na busca. Uma fileira `flex-wrap` quebra em linhas, mas
        // não quebra um item que se recusa a encolher.
        "max-w-full text-xs font-semibold whitespace-nowrap",
        cor.chip,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icone && <Icone nome={icone} tamanho={12} />}
      {comPonto && (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${cor.ponto}`}
        />
      )}
      {/*
        O texto num filho próprio, com `min-w-0`: `truncate` sozinho não
        encolhe item de flex, porque `min-width` de item de flex é `auto` e
        vale o min-content. É exatamente a armadilha que já quebrou o mobile
        deste projeto uma vez, e a razão de o corte ficar aqui dentro, e não
        na fileira.
      */}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/**
 * O rótulo de seção e de filtro: 13px, 700, caixa alta, bem espaçado, com um
 * ícone opcional de 16px e a cor do sinal (`tom`) quando há um.
 *
 * `as` existe porque o mesmo desenho faz dois papéis. Dentro de um cartão,
 * rotulando um grupo de controles (a coluna de filtros), ele é um parágrafo.
 * Do lado de fora de um bloco, rotulando o bloco inteiro sozinho (sem título
 * grande ao lado, como em `error.tsx`), ele é o cabeçalho daquele trecho da
 * página e precisa entrar no sumário de quem navega por títulos, um `<p>` em
 * caixa alta não entra.
 *
 * `tom` aceita a situação de sempre (`Tom`) e também a cor pelo nome
 * (`TomDaEtiqueta`), pela mesma razão de `Etiqueta`: alguns rótulos da home
 * nova são anil ("POR ESTADO", "DIÁRIO OFICIAL DA UNIÃO", `Main.dc.html:273,
 * 349`), e nenhuma situação de concurso é anil.
 */
export function Rotulo({
  children,
  className,
  as: Tag = "p",
  icone,
  tom,
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "h2" | "h3";
  icone?: NomeDoIcone;
  tom?: Tom | TomDaEtiqueta;
}) {
  const cor = CORES[resolverTom(tom)].texto;

  return (
    <Tag
      className={[
        "inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.06em] uppercase",
        cor,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icone && <Icone nome={icone} tamanho={16} />}
      {children}
    </Tag>
  );
}
