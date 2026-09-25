/**
 * O órgão como nível acima do concurso: quem agrupa, e o que o agrupamento
 * consegue afirmar.
 *
 * Funções puras sobre a lista que `acervo()` (src/lib/concursos.ts) devolve,
 * pelo mesmo motivo de `consulta.ts`: o que dá para errar aqui é a
 * agregação, e agregação sem teste é número inventado com cara de fato.
 *
 * **Não há rota de órgão na API, e não foi por esquecimento.** O `/acervo`
 * já traz o órgão dentro de cada concurso, e o app já lê o acervo inteiro em
 * toda página que lista alguma coisa. Medido na carga de 2026-09-14, contra
 * `bc api` em 127.0.0.1:
 *
 * | | |
 * |---|---|
 * | `GET /acervo` | 3.662.839 bytes, 0,33 s (cinco medições: 0,319 a 0,344) |
 * | agrupar os 4.649 em 466 órgãos | 0,18 ms |
 * | achar os concursos de um órgão | 0,066 ms |
 *
 * Uma rota `/orgao/{slug}` trocaria 0,066 ms de CPU por uma segunda ida à
 * API, por SQL novo com junção e agregação (as duas coisas que a revisão da
 * API pegou errando esta semana) e por uma segunda expressão de `TEM_DADO`,
 * que é a cláusula que decide quem entra no acervo. É essa última que decide:
 * **a página do órgão precisa listar exatamente o que a busca lista**, e
 * lendo a mesma lista ela não tem como divergir. Duas consultas com a mesma
 * intenção divergem no dia em que uma das duas é editada.
 *
 * O que a reutilização custa é honesto dizer: a página do órgão paga os 3,66
 * MB do acervo inteiro para mostrar entre 1 e 209 concursos. É o mesmo preço
 * que a home e a busca já pagam (uma requisição e uma análise por render,
 * pelo `cache` de `carregar()` em `concursos.ts`) e é o preço da arquitetura
 * de uma rota só, não um preço novo que esta página inventou.
 */
import type { ConcursoResumo, Orgao } from "./dominio";

/** Um órgão e os concursos dele que estão no acervo. */
export interface OrgaoDoAcervo {
  orgao: Orgao;
  /** Nunca vazia: um órgão só existe aqui porque um concurso o nomeou. */
  concursos: ConcursoResumo[];
}

/**
 * O nome curto do órgão: a sigla quando existe, o nome por extenso quando
 * não.
 *
 * É o que vai no nível de cima da hierarquia (a trilha da página do
 * concurso), onde o espaço é de uma linha. A sigla chega em 3.034 dos 4.649
 * concursos; nos outros 1.615 o nome inteiro é o que há, e cortá-lo em
 * iniciais inventadas afirmaria uma sigla que ninguém publicou: a mesma
 * regra do `Selo`.
 */
export function nomeCurtoDoOrgao(orgao: Pick<Orgao, "sigla" | "nome">): string {
  return orgao.sigla?.trim() || orgao.nome;
}

/**
 * Os concursos de um órgão, e o órgão.
 *
 * O registro de órgão sai do primeiro concurso encontrado e não de uma
 * junção: no acervo de 2026-09-14 os 4.649 concursos carregam **zero**
 * registros de órgão divergentes para o mesmo slug: é a mesma linha da
 * tabela `orgao`, repetida pela junção do `SQL_RESUMO`. Se um dia divergirem,
 * o primeiro é o do concurso mais antigo (`order by c.id` na API), que é uma
 * escolha estável, e não a fusão de dois registros numa terceira coisa que
 * não existe em lugar nenhum.
 *
 * Devolve `null` quando nenhum concurso do acervo nomeia este slug. Quem
 * chama trata como 404, e é a resposta certa: o órgão pode existir na tabela
 * (são 1.946 com slug, contra 466 com concurso na lista) mas uma página
 * dele seria uma lista vazia com título, que afirma "este órgão não tem
 * concurso" quando o que há é "nenhum concurso dele foi lido até aqui".
 */
export function acharOrgao(
  concursos: ConcursoResumo[],
  slug: string,
): OrgaoDoAcervo | null {
  const dele = concursos.filter((concurso) => concurso.orgao.slug === slug);
  if (dele.length === 0) return null;
  return { orgao: dele[0].orgao, concursos: dele };
}

/**
 * Todos os órgãos do acervo, do que tem mais concursos para o que tem menos.
 *
 * O empate desempata por nome, e não fica na ordem em que apareceram: a lista
 * alimenta o `sitemap.ts`, e um sitemap que muda de ordem a cada geração sem
 * nada ter mudado é ruído para quem o lê.
 */
export function agruparPorOrgao(
  concursos: ConcursoResumo[],
): OrgaoDoAcervo[] {
  const porSlug = new Map<string, OrgaoDoAcervo>();
  for (const concurso of concursos) {
    const slug = concurso.orgao?.slug;
    // Um acervo servido por um engine mais velho, ou um mock incompleto,
    // pode trazer concurso sem órgão. Ele fica de fora do agrupamento em vez
    // de virar um órgão de slug vazio com nome `undefined`.
    if (!slug) continue;
    const grupo = porSlug.get(slug);
    if (grupo) grupo.concursos.push(concurso);
    else porSlug.set(slug, { orgao: concurso.orgao, concursos: [concurso] });
  }

  return [...porSlug.values()].sort(
    (a, b) =>
      b.concursos.length - a.concursos.length ||
      a.orgao.nome.localeCompare(b.orgao.nome, "pt-BR"),
  );
}

/**
 * A frase que diz o que esta página é, antes de listar.
 *
 * Ela existe por causa dos **195 órgãos de um concurso só**: 42% dos 466.
 * Uma página que diz "1 concurso" e desenha um cartão é, para quem chegou
 * pela trilha do próprio concurso, uma parada a mais no caminho; a frase é o
 * que a faz dizer o que sabe em vez de fingir um índice.
 *
 * **Ela não redireciona, e a medição é o motivo.** Dos 122 órgãos que tinham
 * exatamente um concurso há 30 dias, **36 (30%) têm dois ou mais hoje**; em
 * 365 dias são 57%. Ter um concurso é estado de hoje, não propriedade do
 * órgão: um redirecionamento faria a mesma URL levar a lugares diferentes
 * conforme o dia, e faria a trilha da página do concurso apontar para uma URL
 * que volta para ela mesma.
 */
export function resumoDoOrgao(quantos: number): string {
  return quantos === 1
    ? "Um concurso deste órgão foi lido do diário oficial até agora."
    : `${quantos} concursos deste órgão foram lidos do diário oficial até agora.`;
}
