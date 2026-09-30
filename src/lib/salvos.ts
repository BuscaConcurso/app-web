import type { ConcursoResumo } from "./dominio";
import { normalizarResumo } from "./nomeacao";

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

/**
 * A resposta de `/v1/me/salvos` com o título e os nomes sem o travessão que
 * vem do acervo, a mesma regra que `lerAcervoDaApi` aplica à lista.
 */
export function normalizarRespostaDeSalvos(resposta: RespostaDeSalvos): RespostaDeSalvos {
  return {
    ...resposta,
    itens: resposta.itens.map((item) => ({ ...item, concurso: normalizarResumo(item.concurso) })),
  };
}

/** Slug do concurso salvo para o seu `lembrar`. Ausente é não salvo. */
export type MapaDeSalvos = ReadonlyMap<string, boolean>;

export function mapaDe(resposta: RespostaDeSalvos): MapaDeSalvos {
  return new Map([
    ...resposta.itens.map((item) => [item.concurso.slug, item.lembrar] as const),
    ...resposta.semDado.map((slug) => [slug, false] as const),
  ]);
}

/**
 * O caminho da página atual com a query (uma busca filtrada volta filtrada)
 * e o hash (`/conta#avisos` volta à seção). Lido de `window.location` só no
 * clique: `useSearchParams` tiraria da renderização estática as páginas que
 * têm um botão Salvar.
 */
export function caminhoParaVoltar(local: { pathname: string; search: string; hash?: string }): string {
  return `${local.pathname}${local.search}${local.hash ?? ""}`;
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

/** `null` é "não salvo"; um booleano é "salvo", com o `lembrar` dele. */
type Estado = boolean | null;

export interface SincronizadorDeSalvos {
  /** O que a tela mostra: o confirmado pelo banco, com os cliques pendentes por cima. */
  mapa(): MapaDeSalvos;
  observar(ouvinte: (mapa: MapaDeSalvos) => void): () => void;
  /** Marca o momento de um `GET`, para `carregar` não desfazer o que foi confirmado depois. */
  marca(): number;
  carregar(resposta: RespostaDeSalvos, marca: number): void;
  salvar(slug: string): Promise<boolean>;
  remover(slug: string): Promise<boolean>;
  lembrar(slug: string, ligar: boolean): Promise<boolean>;
}

function lembrarDa(resposta: unknown): boolean | null {
  const valor = (resposta as { lembrar?: unknown } | null | undefined)?.lembrar;
  return typeof valor === "boolean" ? valor : null;
}

/**
 * Salvar, remover e lembrar, otimistas e **em fila por slug**: um pedido
 * por concurso de cada vez. O clique muda o estado desejado na hora (a tela
 * responde), e quando o pedido em voo termina, o último estado desejado é
 * enviado se ainda for diferente do confirmado. Sem a fila, um clique duplo
 * mandava PUT e DELETE juntos, que podiam chegar fora de ordem e deixar a
 * tela dizendo uma coisa e o banco outra (ou um lembrete desligado na tela e
 * ligado no banco, mandando e-mail).
 *
 * Uma falha desfaz o slug para o que o banco confirmou e avisa. Cada ação
 * resolve `true` quando o banco terminou no estado pedido.
 */
export function criarSincronizadorDeSalvos(deps: {
  api: ApiDeSalvos;
  avisar(texto: string): void;
}): SincronizadorDeSalvos {
  let confirmado = new Map<string, boolean>();
  const desejado = new Map<string, Estado>();
  const ultimaAcao = new Map<string, Acao>();
  const emVoo = new Map<string, Promise<boolean>>();
  /** Em que mudança cada slug foi confirmado pela última vez. */
  const confirmadoEm = new Map<string, number>();
  let mudancas = 0;
  const ouvintes = new Set<(mapa: MapaDeSalvos) => void>();

  // O mesmo objeto enquanto nada muda: é o que `useSyncExternalStore` exige.
  let instantaneo: MapaDeSalvos = new Map();
  const mapa = (): MapaDeSalvos => instantaneo;

  function emitir() {
    const visivel = new Map(confirmado);
    for (const [slug, estado] of desejado) {
      if (estado === null) visivel.delete(slug);
      else visivel.set(slug, estado);
    }
    instantaneo = visivel;
    for (const ouvinte of ouvintes) ouvinte(instantaneo);
  }

  function confirmar(slug: string, estado: Estado) {
    if (estado === null) confirmado.delete(slug);
    else confirmado.set(slug, estado);
    mudancas += 1;
    confirmadoEm.set(slug, mudancas);
  }

  async function sincronizar(slug: string): Promise<boolean> {
    for (;;) {
      const alvo = desejado.get(slug);
      if (alvo === undefined) return true;
      const atual = confirmado.get(slug) ?? null;
      if (alvo === atual) {
        desejado.delete(slug);
        emitir();
        return true;
      }
      // Salvar o que não estava salvo vai sem `lembrar`: se o banco já o
      // tinha (a lista ainda não carregou), o lembrete dele é mantido.
      const semLembrete = alvo === false && atual === null;
      try {
        if (alvo === null) {
          await deps.api.remover(slug);
          confirmar(slug, null);
        } else {
          const resposta = await deps.api.salvar(slug, semLembrete ? undefined : alvo);
          const doBanco = semLembrete ? (lembrarDa(resposta) ?? false) : alvo;
          confirmar(slug, doBanco);
          if (semLembrete && desejado.get(slug) === false) desejado.set(slug, doBanco);
        }
      } catch (erro) {
        desejado.delete(slug);
        emitir();
        deps.avisar(avisoDeFalha(erro, ultimaAcao.get(slug) ?? "salvar"));
        return false;
      }
    }
  }

  function querer(slug: string, estado: Estado, acao: Acao): Promise<boolean> {
    desejado.set(slug, estado);
    ultimaAcao.set(slug, acao);
    emitir();
    const pendente = emVoo.get(slug);
    if (pendente) return pendente;
    const execucao = sincronizar(slug).finally(() => emVoo.delete(slug));
    emVoo.set(slug, execucao);
    return execucao;
  }

  return {
    mapa,
    observar(ouvinte) {
      ouvintes.add(ouvinte);
      return () => {
        ouvintes.delete(ouvinte);
      };
    },
    marca: () => mudancas,
    carregar(resposta, marca) {
      const lido = new Map(mapaDe(resposta));
      // O que foi confirmado depois do pedido desta lista vale mais que ela.
      for (const [slug, quando] of confirmadoEm) {
        if (quando <= marca) continue;
        const valor = confirmado.get(slug);
        if (valor === undefined) lido.delete(slug);
        else lido.set(slug, valor);
      }
      confirmado = lido;
      emitir();
    },
    salvar: (slug) => querer(slug, mapa().get(slug) ?? false, "salvar"),
    remover: (slug) => querer(slug, null, "remover"),
    lembrar: (slug, ligar) => querer(slug, ligar, "lembrar"),
  };
}
