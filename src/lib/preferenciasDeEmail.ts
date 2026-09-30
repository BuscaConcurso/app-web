/**
 * Preferências de e-mail: tipos da api e a lógica que não depende de React.
 *
 * Como `lib/salvos.ts`, não importa `lib/auth/api.ts` (que lança na carga
 * sem `NEXT_PUBLIC_BC_API_URL`): quem chama a rede entrega a api pronta.
 */

/** Os e-mails opcionais. Lista fechada, a mesma da api; a etapa 2 traz `resumo`. */
const TIPOS = ["lembretes"] as const;
export type TipoDeEmail = (typeof TIPOS)[number];

export interface PreferenciasDeEmail {
  lembretes: boolean;
}

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
