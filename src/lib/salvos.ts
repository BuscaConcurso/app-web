import type { ConcursoResumo } from "./dominio";

/**
 * Concursos salvos: tipos da api e a lógica que não depende de React.
 *
 * Não importa `lib/auth/api.ts` de propósito: aquele módulo lança na carga
 * quando `NEXT_PUBLIC_BC_API_URL` falta, e aqui mora o que os testes (em
 * Node, sem essa variável) precisam exercitar. A chamada de rede fica no
 * `SalvosProvider`, que entrega a `ApiDeSalvos` pronta para `acoesDeSalvos`.
 */

export interface ItemSalvo {
  concurso: ConcursoResumo;
  lembrar: boolean;
  salvoEm: string;
}

export interface RespostaDeSalvos {
  itens: ItemSalvo[];
  /** Salvos cujo concurso saiu do acervo. */
  semDado: string[];
}

/** Slug do concurso salvo para o seu `lembrar`. Ausente é não salvo. */
export type MapaDeSalvos = ReadonlyMap<string, boolean>;

export function mapaDe(resposta: RespostaDeSalvos): MapaDeSalvos {
  return new Map([
    ...resposta.itens.map((item) => [item.concurso.slug, item.lembrar] as const),
    ...resposta.semDado.map((slug) => [slug, false] as const),
  ]);
}

/** O `/entrar` que volta para onde a pessoa estava (`?retorno=`, ver `app/entrar`). */
export function hrefParaEntrar(caminho: string | null): string {
  return caminho ? `/entrar?retorno=${encodeURIComponent(caminho)}` : "/entrar";
}

type Acao = "salvar" | "remover" | "lembrar";

const VERBO: Record<Acao, string> = {
  salvar: "salvar",
  remover: "remover",
  lembrar: "mudar o lembrete",
};

/**
 * O aviso quando a api recusa. Lê o erro pela forma (`code`, `status`), a
 * mesma do `ApiError`, sem importar a classe (ver o cabeçalho do arquivo).
 */
export function avisoDeFalha(erro: unknown, acao: Acao): string {
  const { code, status } = (erro ?? {}) as { code?: unknown; status?: unknown };
  if (code === "SALVOS_LIMITE") return "Você chegou a 500 salvos.";
  if (code === "CONCURSO_NAO_ENCONTRADO") return "Este concurso não está mais na lista.";
  if (status === 401 || (typeof code === "string" && code.startsWith("AUTH_"))) {
    return `Entre de novo para ${VERBO[acao]}.`;
  }
  return `Não deu para ${VERBO[acao]} agora. Tente de novo.`;
}

/**
 * O aviso depois de ligar um lembrete. Hoje o login recusa conta sem e-mail
 * confirmado, então o segundo caso é raro, mas os lembretes saem só para
 * endereço confirmado e a pessoa precisa saber.
 */
export function avisoAoLigarLembrete(emailConfirmado: boolean): string {
  return emailConfirmado
    ? "Lembrete ligado. Avisamos por e-mail."
    : "Lembrete ligado. Os e-mails só saem depois que você confirmar seu endereço.";
}

export interface ApiDeSalvos {
  salvar(slug: string, lembrar?: boolean): Promise<unknown>;
  remover(slug: string): Promise<unknown>;
}

/**
 * Salvar, remover e lembrar, todos otimistas: o mapa muda na hora, a api é
 * chamada depois, e uma falha devolve só aquele slug ao que era antes (não o
 * mapa inteiro, que outro clique pode ter mudado enquanto isso) e avisa.
 * Cada ação resolve `true` quando a api aceitou.
 */
export function acoesDeSalvos(deps: {
  ler(): MapaDeSalvos;
  escrever(mapa: MapaDeSalvos): void;
  api: ApiDeSalvos;
  avisar(texto: string): void;
}) {
  function trocar(slug: string, valor: boolean | undefined) {
    const mapa = new Map(deps.ler());
    if (valor === undefined) mapa.delete(slug);
    else mapa.set(slug, valor);
    deps.escrever(mapa);
  }

  async function otimista(
    slug: string,
    novo: boolean | undefined,
    acao: Acao,
    chamar: () => Promise<unknown>,
  ): Promise<boolean> {
    const anterior = deps.ler().get(slug);
    trocar(slug, novo);
    try {
      await chamar();
      return true;
    } catch (erro) {
      trocar(slug, anterior);
      deps.avisar(avisoDeFalha(erro, acao));
      return false;
    }
  }

  return {
    salvar: (slug: string) =>
      otimista(slug, deps.ler().get(slug) ?? false, "salvar", () => deps.api.salvar(slug)),
    remover: (slug: string) =>
      otimista(slug, undefined, "remover", () => deps.api.remover(slug)),
    lembrar: (slug: string, ligar: boolean) =>
      otimista(slug, ligar, "lembrar", () => deps.api.salvar(slug, ligar)),
  };
}
