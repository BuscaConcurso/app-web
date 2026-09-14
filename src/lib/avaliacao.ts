/**
 * Avaliação de item: "gostei" e "não gostei" no ponto do dado.
 *
 * Este arquivo é a parte testável — o que o formulário virou, o que vai no
 * corpo da requisição e o que fazer quando a API não responde. A Server Action
 * (`acoes/avaliar.ts`) só junta isso com o cookie e com o `revalidate`; o
 * componente (`components/concurso/Avaliacao.tsx`) só desenha.
 *
 * **Por que o clique vai para o engine e não para um arquivo aqui**: o valor
 * da avaliação é poder cruzá-la com o acervo — qual ato, qual extração, qual
 * resposta do FAQ produziu o que alguém reclamou. Isso só existe do lado do
 * banco, e é lá que a procedência é resolvida, no momento do clique.
 */
import { unstable_rethrow } from "next/navigation";
import type { FaqPergunta } from "./dominio";

/** `create type avaliacao_bloco` no engine. Os blocos que a página mostra. */
export const BLOCOS = ["faq", "cargos", "cronograma", "orgao", "ato"] as const;
export type Bloco = (typeof BLOCOS)[number];

/** As seis perguntas, como o engine as escreve. Cópia de `FaqPergunta`. */
const PERGUNTAS: readonly string[] = [
  "ate_quando",
  "onde_inscrever",
  "etapas_prova",
  "como_inscrever",
  "quem_pode",
  "quanto_custa",
];

/**
 * O que foi avaliado. `pergunta` só no FAQ; `ato` é a chave da origem, e é
 * o que permite ao engine amarrar a avaliação ao documento e à extração — sem
 * ela, um concurso com dois atos fica sem procedência, que é honesto e pior.
 */
export interface Alvo {
  slug: string;
  bloco: Bloco;
  pergunta?: FaqPergunta;
  ato?: string | null;
}

export interface Pedido extends Alvo {
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
 * limite é um convite. Dois mil caracteres são umas quinze linhas — o engine
 * recusa acima disso, e o corte aqui evita que a pessoa escreva um texto
 * longo para descobrir depois que ele não coube.
 */
export const LIMITE_DO_COMENTARIO = 2000;

/**
 * O formulário virando pedido, ou `null` quando ele não faz sentido.
 *
 * As mesmas regras do engine, de propósito repetidas: o serviço recusa
 * "cronograma / quanto_custa" com 422 e o banco recusa com `check`. Aqui a
 * checagem serve para o clique não virar requisição inútil — não para
 * substituir nenhuma das duas.
 */
export function lerPedido(dados: FormData): Pedido | null {
  const texto = (campo: string): string | null => {
    const valor = dados.get(campo);
    return typeof valor === "string" && valor.trim() !== "" ? valor.trim() : null;
  };

  const slug = texto("slug");
  const bloco = texto("bloco");
  const pergunta = texto("pergunta");
  const gostei = dados.get("gostei");

  if (!slug || !bloco || !BLOCOS.includes(bloco as Bloco)) return null;
  if (gostei !== "sim" && gostei !== "nao") return null;
  if (pergunta !== null && !PERGUNTAS.includes(pergunta)) return null;
  if ((bloco === "faq") !== (pergunta !== null)) return null;

  const comentario = texto("comentario");
  return {
    slug,
    bloco: bloco as Bloco,
    pergunta: (pergunta as FaqPergunta) ?? undefined,
    ato: texto("ato"),
    gostei: gostei === "sim",
    comentario:
      comentario === null ? null : comentario.slice(0, LIMITE_DO_COMENTARIO),
  };
}

/**
 * O token anônimo de navegador. Não é usuário e não vira um: o serviço não
 * tem autenticação, e inventar login para receber um "não gostei" seria
 * cobrar caro por uma opinião.
 *
 * Ele existe por um motivo só — impedir que dez cliques da mesma pessoa
 * virem dez linhas, o que transformaria a contagem de reclamações em contagem
 * de cliques. Quem limpar os cookies vira outra pessoa para esta base, e isso
 * está assumido: é o preço de não pedir identidade.
 */
export function novoAvaliador(): string {
  return crypto.randomUUID();
}

/** O que aconteceu com o clique, para a tela poder dizer. */
export type ResultadoDaAvaliacao = "gravada" | "sem-api" | "falhou";


/** O que aconteceu com o último clique, do jeito que a tela precisa saber. */
export interface EstadoDaAvaliacao {
  resultado: ResultadoDaAvaliacao | "pedido-invalido" | null;
  /** O que foi clicado, para a tela saber se abre o modal de comentário. */
  gostei: boolean | null;
  /** Se este envio trazia comentário — o modal fecha quando ele chegou. */
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
 * Onde a API do engine está ouvindo. Lida a cada chamada, e não uma vez no
 * carregamento do módulo como em `concursos.ts`: é o que permite ao teste
 * exercitar os dois lados — instância sem serviço de avaliação e instância
 * com ele — sem subir servidor nenhum.
 *
 * Variável ausente é "esta instância não tem onde gravar", e a tela diz
 * isso. Não é o mesmo que falhar, e não pode virar um "obrigado" mentiroso.
 */
function urlDaApi(): string | undefined {
  const url = process.env.BC_API_URL?.replace(/\/+$/, "");
  return url === "" ? undefined : url;
}

/**
 * Manda o clique para o engine.
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
  try {
    const resposta = await fetch(`${api}/avaliacao`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        slug: pedido.slug,
        bloco: pedido.bloco,
        pergunta: pedido.pergunta ?? null,
        ato: pedido.ato ?? null,
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
      `[avaliacao] ${api}/avaliacao falhou (${
        erro instanceof Error ? erro.message : erro
      }).`,
    );
    return "falhou";
  }
}
