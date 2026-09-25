/**
 * Avaliação do concurso: "gostei" e "não gostei" da página inteira.
 *
 * Este arquivo é a parte testável: o que o clique vira, o que vai no corpo da
 * requisição, o que voltar da rota significa e o que fazer quando a API não
 * responde. Ele não tem diretiva nenhuma (`"use server"`, `"use client"`) de
 * propósito: os dois lados o importam, e é o que permite testá-lo em Node, sem
 * servidor e sem navegador. O Route Handler (`app/api/avaliacao/route.ts`) só
 * junta isto com o cookie; o componente
 * (`components/concurso/Avaliacao.tsx`) só desenha e faz o `fetch`.
 *
 * **O pedido é o slug e o voto, e mais nada.** Ele já levou `bloco`,
 * `pergunta` e `ato`: o recorte por item, que a granularidade nova reverteu.
 * Quem diz onde está o erro agora é o comentário.
 *
 * **`registrarAvaliacao` só roda no servidor**: é a única função daqui que lê
 * `BC_API_URL`. Ela é importada pela rota, nunca pelo componente: o endereço
 * da API do engine não pode aparecer em bundle de navegador (ver o comentário
 * da rota).
 *
 * **Por que o clique vai para o engine e não para um arquivo aqui**: o valor
 * da avaliação é poder cruzá-la com o acervo: qual ato, qual extração o
 * modelo leu para produzir o que alguém reclamou. Isso só existe do lado do
 * banco, e é lá que a procedência é resolvida, no momento do clique.
 */
import { unstable_rethrow } from "next/navigation";

export interface Pedido {
  slug: string;
  gostei: boolean;
  /**
   * `null` é "não comentou", e é dado: quem clica em "não gostei" e fecha o
   * modal sem escrever já disse a coisa mais importante. Nunca string vazia,
   * que no banco significaria "comentou e não disse nada".
   */
  comentario: string | null;
}

/**
 * Teto do comentário. Não é hostilidade com quem escreve muito: é que o
 * caminho de escrita é público, sem autenticação, e um campo de texto sem
 * limite é um convite. Dois mil caracteres são umas quinze linhas: o engine
 * recusa acima disso, e o corte aqui evita que a pessoa escreva um texto
 * longo para descobrir depois que ele não coube.
 */
export const LIMITE_DO_COMENTARIO = 2000;

/**
 * O formulário virando pedido, ou `null` quando ele não faz sentido.
 *
 * Sobrou pouco a validar desde que o pedido é o slug e o voto: o recorte por
 * item trazia um `bloco` e uma `pergunta` que tinham de combinar entre si, e
 * essa regra era o grosso daqui. O que resta é o mínimo que impede o clique
 * de virar requisição inútil, e continua não substituindo o 422 do serviço
 * nem o `check` do banco.
 *
 * Campo a mais no corpo é ignorado, não recusado: um `bloco` de uma aba que
 * ficou aberta desde antes da mudança vira um voto de concurso, que é o que
 * ele quer dizer agora.
 */
export function lerPedido(dados: FormData): Pedido | null {
  const texto = (campo: string): string | null => {
    const valor = dados.get(campo);
    return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
  };

  const slug = texto("slug");
  const gostei = dados.get("gostei");

  if (!slug) return null;
  if (gostei !== "sim" && gostei !== "nao") return null;

  const comentario = texto("comentario");
  return {
    slug,
    gostei: gostei === "sim",
    comentario:
      comentario === null ? null : comentario.slice(0, LIMITE_DO_COMENTARIO),
  };
}

/**
 * O caminho inverso de `lerPedido`: o concurso e o clique virando o corpo do
 * `POST /api/avaliacao`.
 *
 * Mora aqui, e não dentro do componente, por dois motivos. O primeiro é que
 * ele e `lerPedido` são as duas metades da mesma regra, e uma metade que muda
 * sem a outra é um campo que some sem ninguém perceber: `avaliacao.test.ts`
 * fecha o círculo mandando uma pela outra. O segundo é que o componente não
 * precisa saber nomes de campo para desenhar dois botões.
 *
 * Continua sendo `FormData` mesmo agora que quem envia é `fetch`, e não um
 * `<form>`: é o que `lerPedido` já lê e o que já tem teste. Trocar por JSON
 * seria reescrever a validação inteira para não ganhar nada.
 */
export function formularioDoPedido(
  slug: string,
  gostei: boolean,
  comentario?: string | null,
): FormData {
  const dados = new FormData();
  dados.set("slug", slug);
  dados.set("gostei", gostei ? "sim" : "nao");
  // Vazio é ausência de comentário, não comentário vazio: ver `Pedido`.
  if (comentario && comentario.trim() !== "") dados.set("comentario", comentario);
  return dados;
}

/**
 * O token anônimo de navegador. Não é usuário e não vira um: o serviço não
 * tem autenticação, e inventar login para receber um "não gostei" seria
 * cobrar caro por uma opinião.
 *
 * Ele existe por um motivo só: impedir que dez cliques da mesma pessoa
 * virem dez linhas, o que transformaria a contagem de reclamações em contagem
 * de cliques. Quem limpar os cookies vira outra pessoa para esta base, e isso
 * está assumido: é o preço de não pedir identidade.
 */
export function novoAvaliador(): string {
  return crypto.randomUUID();
}

/** O que aconteceu com o clique, para a tela poder dizer. */
export type ResultadoDaAvaliacao = "gravada" | "sem-api" | "falhou";

/** Tudo o que a rota pode responder, incluindo o pedido que nem foi mandado. */
const RESULTADOS: readonly string[] = [
  "gravada",
  "sem-api",
  "falhou",
  "pedido-invalido",
];

/**
 * O que a resposta de `POST /api/avaliacao` diz que aconteceu.
 *
 * Qualquer coisa que não seja um dos quatro resultados conhecidos é
 * `"falhou"`: corpo vazio, HTML de erro de um proxy no caminho, JSON de outro
 * formato. **Nunca `"gravada"` por omissão**: o modo de errar que importa aqui
 * é dizer "obrigado" para quem não teve o clique registrado, e o jeito de não
 * errar assim é exigir que a rota afirme.
 */
export function resultadoDaResposta(
  corpo: unknown,
): EstadoDaAvaliacao["resultado"] {
  const resultado = (corpo as { resultado?: unknown } | null)?.resultado;
  return typeof resultado === "string" && RESULTADOS.includes(resultado)
    ? (resultado as EstadoDaAvaliacao["resultado"])
    : "falhou";
}


/** O que aconteceu com o último clique, do jeito que a tela precisa saber. */
export interface EstadoDaAvaliacao {
  resultado: ResultadoDaAvaliacao | "pedido-invalido" | null;
  /** O que foi clicado, para a tela saber se abre o modal de comentário. */
  gostei: boolean | null;
  /** Se este envio trazia comentário: o modal fecha quando ele chegou. */
  comentou: boolean;
  /**
   * Muda a cada envio. Sem isso, dois cliques iguais seguidos produzem o
   * mesmo estado e o efeito que abre o modal não roda na segunda vez.
   */
  envio: number;
}

export const ESTADO_INICIAL: EstadoDaAvaliacao = {
  resultado: null,
  gostei: null,
  comentou: false,
  envio: 0,
};

/**
 * Onde a API Nest está ouvindo, incluindo o prefixo `/v1`. Lida a cada
 * chamada, e não uma vez no carregamento do módulo como em `concursos.ts`: é o que permite ao teste
 * exercitar os dois lados (instância sem serviço de avaliação e instância
 * com ele) sem subir servidor nenhum.
 *
 * Variável ausente é "esta instância não tem onde gravar", e a tela diz
 * isso. Não é o mesmo que falhar, e não pode virar um "obrigado" mentiroso.
 */
function urlDaApi(): string | undefined {
  const url = process.env.BC_API_URL?.replace(/\/+$/, "");
  return url === "" ? undefined : url;
}

/**
 * Manda o clique para a API Nest.
 *
 * Nunca levanta: um "não gostei" que derruba a página do concurso seria a
 * pior resposta possível a alguém dizendo que a página está errada. Falha
 * vira `"falhou"`, a tela diz que não deu, e o texto da pessoa continua na
 * caixa para ela tentar de novo.
 */
export async function registrarAvaliacao(
  pedido: Pedido,
  avaliador: string,
): Promise<ResultadoDaAvaliacao> {
  const api = urlDaApi();
  if (!api) return "sem-api";
  const endpoint = `${api}/concursos/${encodeURIComponent(pedido.slug)}/avaliacao`;
  try {
    const resposta = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        gostei: pedido.gostei,
        comentario: pedido.comentario,
        avaliador,
      }),
    });
    if (!resposta.ok) {
      throw new Error(`a API respondeu ${resposta.status}`);
    }
    return "gravada";
  } catch (erro) {
    // Pelo mesmo motivo de `carregar()` em `concursos.ts`: `fetch` com
    // `no-store` levanta erro do próprio framework para sair do caminho
    // estático, e engoli-lo aqui faria o Next renderizar coisa errada.
    unstable_rethrow(erro);
    console.warn(
      `[avaliacao] ${endpoint} falhou (${
        erro instanceof Error ? erro.message : erro
      }).`,
    );
    return "falhou";
  }
}
