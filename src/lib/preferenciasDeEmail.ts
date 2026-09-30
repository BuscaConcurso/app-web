/**
 * Preferências de e-mail: tipos da api e a lógica que não depende de React.
 *
 * Como `lib/salvos.ts`, não importa `lib/auth/api.ts` (que lança na carga
 * sem `NEXT_PUBLIC_BC_API_URL`): quem chama a rede entrega a api pronta.
 */

import { AREAS } from "./areas";
import type { Uf } from "./dominio";

/** Os e-mails opcionais. Lista fechada, a mesma da api. */
const TIPOS = ["lembretes", "resumo"] as const;
export type TipoDeEmail = (typeof TIPOS)[number];

export interface PreferenciasDeEmail {
  lembretes: boolean;
  /** Começa desligado: a adesão é explícita. */
  resumoSemanal: boolean;
  /** Slugs de `AREAS`; vazia é "todas as áreas". */
  areas: string[];
  /** `null` é "Todo o Brasil". */
  uf: Uf | null;
}

/** O corpo do `PATCH`: só os campos que mudam. */
export type MudancaDePreferencias = Partial<PreferenciasDeEmail>;

/** "Parar todos os e-mails opcionais": os e-mails da conta continuam. */
export const PARAR_TODOS: MudancaDePreferencias = { lembretes: false, resumoSemanal: false };

/** Marca ou desmarca a área, mantendo a ordem de `AREAS` (a dos botões). */
export function alternarArea(areas: string[], slug: string): string[] {
  const marcadas = new Set(areas);
  if (marcadas.has(slug)) marcadas.delete(slug);
  else marcadas.add(slug);
  return AREAS.map((area) => area.slug).filter((area) => marcadas.has(area));
}

/** O que muda, por tipo, na página de descadastro. */
export interface TextosDoDescadastro {
  /** O título da aba. */
  titulo: string;
  pergunta: string;
  explicacao: string;
  botao: string;
  enviando: string;
  falhou: string;
  pronto: string;
  prontoApoio: string;
  reativado: string;
  reativadoApoio: string;
}

export const TEXTOS_DO_DESCADASTRO: Record<TipoDeEmail, TextosDoDescadastro> = {
  lembretes: {
    titulo: "Parar lembretes por e-mail",
    pergunta: "Parar os lembretes por e-mail?",
    explicacao:
      "Você deixa de receber os avisos de abertura e de véspera dos concursos salvos. Os e-mails da conta continuam.",
    botao: "Parar os lembretes",
    enviando: "Parando…",
    falhou: "Não deu para parar agora. Tente de novo.",
    pronto: "Pronto: os lembretes por e-mail não chegam mais.",
    prontoApoio: "Os e-mails da conta continuam.",
    reativado: "Lembretes de volta.",
    reativadoApoio: "Os avisos dos concursos salvos voltam a chegar, como antes.",
  },
  resumo: {
    titulo: "Cancelar o resumo semanal",
    pergunta: "Cancelar o resumo semanal?",
    explicacao:
      "Você deixa de receber o e-mail das segundas com os concursos da semana. Os outros e-mails continuam como estão.",
    botao: "Cancelar o resumo",
    enviando: "Cancelando…",
    falhou: "Não deu para cancelar agora. Tente de novo.",
    pronto: "Pronto: o resumo semanal não chega mais.",
    prontoApoio: "Os outros e-mails continuam como estão.",
    reativado: "Resumo de volta.",
    reativadoApoio: "O resumo volta a chegar às segundas, como antes.",
  },
};

export function tipoDoLink(valor: string | undefined): TipoDeEmail | null {
  return TIPOS.find((tipo) => tipo === valor) ?? null;
}

/** Lê o erro pela forma (`code`, `status`), a mesma do `ApiError`, sem importar a classe. */
function formaDoErro(erro: unknown): { code?: unknown; status?: unknown } {
  return (erro ?? {}) as { code?: unknown; status?: unknown };
}

/** O aviso depois do clique no interruptor: `null` é "deu certo". */
export function avisoDePreferencia(erro: unknown): string {
  if (erro === null) return "Preferência salva.";
  const { code, status } = formaDoErro(erro);
  if (status === 401 || (typeof code === "string" && code.startsWith("AUTH_"))) {
    return "Entre de novo para mudar a preferência.";
  }
  return "Não deu para salvar agora. Tente de novo.";
}

/**
 * A página de descadastro (spec de preferências de e-mail, §4). Abrir a
 * página **não** chama a api: leitores de e-mail corporativos e antivírus
 * abrem os links sozinhos, e desligar no carregamento tiraria os lembretes
 * de quem não pediu. Só o clique em "Parar" faz o `POST`.
 */
export type EstadoDoDescadastro =
  | "pergunta"
  | "enviando"
  | "falhou"
  | "pronto"
  | "desfazendo"
  | "falhouAoDesfazer"
  | "reativado"
  | "invalido";

export interface ApiDoDescadastro {
  descadastrar(token: string, tipo: TipoDeEmail): Promise<unknown>;
  religar(token: string, tipo: TipoDeEmail): Promise<unknown>;
}

export interface Descadastro {
  estado(): EstadoDoDescadastro;
  confirmar(): Promise<void>;
  desfazer(): Promise<void>;
}

/** 404 (token que não existe) e 400 (tipo desconhecido): o link não vale. */
function linkRecusado(erro: unknown): boolean {
  const { status } = formaDoErro(erro);
  return status === 404 || status === 400;
}

export function criarDescadastro(deps: {
  api: ApiDoDescadastro;
  token: string | null;
  tipo: TipoDeEmail | null;
  mudou(estado: EstadoDoDescadastro): void;
}): Descadastro {
  const { token, tipo } = deps;
  let estado: EstadoDoDescadastro = token && tipo ? "pergunta" : "invalido";

  function ir(novo: EstadoDoDescadastro) {
    estado = novo;
    deps.mudou(novo);
  }

  return {
    estado: () => estado,
    async confirmar() {
      if (!token || !tipo || (estado !== "pergunta" && estado !== "falhou")) return;
      ir("enviando");
      try {
        await deps.api.descadastrar(token, tipo);
        ir("pronto");
      } catch (erro) {
        ir(linkRecusado(erro) ? "invalido" : "falhou");
      }
    },
    async desfazer() {
      if (!token || !tipo || (estado !== "pronto" && estado !== "falhouAoDesfazer")) return;
      ir("desfazendo");
      try {
        await deps.api.religar(token, tipo);
        ir("reativado");
      } catch (erro) {
        ir(linkRecusado(erro) ? "invalido" : "falhouAoDesfazer");
      }
    },
  };
}
