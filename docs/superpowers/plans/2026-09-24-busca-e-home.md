# Plano: busca com URL amigável, cabeçalho de busca, home e correções

**Goal:** buscas viram `/busca/<slug>` pré-renderizadas por ISR e navegadas como SPA a partir de uma barra de busca que mora no cabeçalho; a home é redesenhada sem a caixa central; e cinco defeitos saem junto (travessão em texto visível, gaveta que não fecha ao navegar, cadastro sem Google/LinkedIn, contraste abaixo de AA, rolagem lateral no celular).

**Architecture:** `src/lib/enderecoDaBusca.ts` concentra a forma do endereço (slug, volta, forma canônica, título, metadados) em funções puras, e `src/proxy.ts` aplica a forma canônica com 308 antes de qualquer render. `/busca/[termo]` é ISR (`generateStaticParams` vazio, `dynamicParams`, `revalidate = 300`): o servidor entrega só a lista do termo e um componente cliente aplica filtro, ordenação, paginação e contagem de faceta a partir de `useSearchParams`, reusando as funções puras de `consulta.ts`. O layout deixa de chamar `connection()`, o acervo passa a ser lido com `next: { revalidate: 300 }` atrás de uma memória de processo, e o build do CI lê a API pública por build-arg.

**Tech Stack:** Next.js 16.3.4 (App Router, sem `cacheComponents`), React 19.2, Tailwind 4, TypeScript 5, Vitest 5 (ambiente node, só `src/**/*.test.ts`), pnpm 11, Chrome 152 headless por CDP com o `WebSocket` global do Node.

**Spec:** `docs/superpowers/specs/2026-09-24-busca-e-home-design.md`

## Global Constraints

- Nenhum travessão (U+2014) em texto visível do site, em documentação nova ou em mensagem de commit; comentários de código já existentes podem manter os seus, comentário novo não usa.
- Sem `cacheComponents` em `next.config.ts`.
- Slug: `normalizar(q)` (sem acento, minúsculas), toda sequência fora de `[a-z0-9]` vira um `-`, sem `-` nas pontas. Volta: `-` vira espaço.
- Rota `/busca/[termo]`; filtros e página continuam na query (`/busca/assistente-em-administracao?uf=SP&pagina=2`).
- Slug vazio: 404. Slug fora da forma canônica: redirect permanente (308) para a canônica. `/concursos?q=<texto>&...`: 308 para `/busca/<slug>?<demais parâmetros>`.
- `/concursos` sem `q` continua sendo a listagem geral, renderizada na requisição.
- Canônico de `/busca/<slug>` é ele mesmo, sem query. Sem resultado: 200, texto "Nenhum concurso", `robots: { index: false, follow: true }`.
- Título: `Concursos de <Termo>`; rótulo acentuado do cargo quando o slug é de um cargo medido por `medirCargos`, senão cada palavra do slug com inicial maiúscula.
- `/busca/[termo]`: `generateStaticParams` devolve `[]`, `dynamicParams = true`, `revalidate = 300`, e o servidor não lê `searchParams`.
- Layout raiz sem `connection()`; acervo com `fetch(..., { next: { revalidate: 300 } })`.
- `BC_API_URL` de build: `https://api.buscaconcurso.com.br/v1`, vinda da Variable `BC_API_URL_BUILD` (job `test` e build-arg da imagem). Em runtime continua `http://api:8788/v1` do ambiente do container.
- Busca pelo cabeçalho: `router.push("/busca/<slug>")`, sem recarregar; resultados usam `<Link>`.
- Sitemap: `revalidate = 3600`; uma entrada `/busca/<slug>` para **todos** os cargos de `medirCargos(...).escolhidos`, `changeFrequency: "daily"`, `priority: 0.7`. `urlDoCargo` gera `/busca/<slug>`.
- Contraste WCAG AA nos dois temas: 4,5:1 texto normal; 3:1 texto grande (≥ 24px, ou ≥ 18,66px em negrito) e ícone/componente.
- Nenhuma de `/`, `/busca/<termo>`, `/concursos`, `/concursos/<slug>`, `/orgaos/<slug>`, `/entrar`, `/cadastrar` com `document.documentElement.scrollWidth > clientWidth` a 360, 375 e 390px.
- A gaveta fecha quando `usePathname()` muda; não fecha quando só a query ou o hash mudam.
- `/cadastrar` ganha "Criar conta com Google" e "Criar conta com LinkedIn" pelo mesmo `authorize` do login.

## Review Focus

1. **Slug que não volta igual.** Acento, símbolo entre palavras, texto só de símbolo, segmento percent-encoded e símbolo dentro da palavra ("11/2026" procura o pedaço inteiro; o slug procura "11" e "2026" separados, então alarga e nunca estreita). Pinado por `src/lib/enderecoDaBusca.test.ts` (Task 4).
2. **Redirect que perde parâmetro ou cria laço.** `/concursos?q=` precisa levar `uf`, facetas e página e soltar `q` (e o `_rsc` interno do Next); `q` sem letra nem número só sai da URL; slug canônico nunca redireciona. Pinado por `destinoCanonico` em `enderecoDaBusca.test.ts` (Task 4) e pelas conferências HTTP de `scripts/verificar-navegador.mjs` (Task 7).
3. **Build que congela o mock ou rota estática com `no-store`.** Foi o 500 `DYNAMIC_SERVER_USAGE` de produção (commit c31d46c). Pinado por `acervo.test.ts` "no build, API fora do ar derruba o build" (Task 5), pela tabela de rotas do `pnpm build` (Task 5) e pelas conferências "detalhe responde 200" e `x-nextjs-cache` do script (Task 7).
4. **Lista do navegador diferente da do servidor.** A busca filtra, ordena e pagina no cliente; um desvio mostra outra lista para a mesma URL. Pinado por `src/lib/buscaLocal.test.ts`, que compara `aplicarConsulta` com `listarConcursos` e `contagensDeFaceta` em 18 combinações (Task 5).
5. **Gaveta aberta por cima da página nova.** O cabeçalho sobrevive à navegação do cliente, e a gaveta ficava aberta com o resto `inert`. Corrigido na Task 2, pinado pela conferência "a gaveta fecha e a página volta a ser interativa" do script (Task 7).

**Riscos aceitos, para quem revisa:** o corpo de `/acervo` tem 4,2 MB e o Data Cache do Next recusa entrada acima de 2 MB (`node_modules/next/dist/server/lib/incremental-cache/index.js`, linha 517), por isso a memória de processo da Task 5; cada termo novo visitado grava uma entrada ISR em disco até o container reiniciar, e buscas aleatórias de robô fazem esse volume crescer; "professor" devolve 2.631 concursos (2,3 MB de JSON cru antes de tirar `localidades` e `ultimoAto`), medido comprimido na Task 7.

---

## Task 1: travessão fora do texto visível

Roda primeiro para que nenhuma tarefa seguinte reintroduza o caractere sem o teste acusar.

**Files**
- Create: `src/lib/semTravessao.test.ts`
- Modify: `src/app/concursos/[slug]/page.tsx`, `src/app/estilo/page.tsx`, `src/app/orgaos/[slug]/page.tsx`, `src/components/concurso/AtosPublicados.tsx`, `src/components/concurso/Avaliacao.tsx`, `src/components/concurso/Cargos.tsx`, `src/components/home/BlocoAlerta.tsx`, `src/components/layout/AvisoDeOrigem.tsx`, `src/lib/rotulos.ts`

**Interfaces**
- Consumes: `typescript` (devDependency já instalada) para ler a árvore sintática.
- Produces: o teste `nenhum texto de src/ usa o travessão fora de comentário`, que as tarefas seguintes herdam.

**Por que a árvore sintática e não tirar comentário por expressão regular:** medido nesta base, um removedor ingênuo de `//` e `/* */` confunde expressão regular e URL com comentário e acusa um comentário de `src/lib/enderecos.ts` (linha 121) como texto. Pela árvore, comentário simplesmente não é nó, e as duas expressões regulares que casam o travessão do Diário (`src/lib/cargos.ts:85`, `src/lib/leitura.ts:98`) ficam de fora por serem `RegularExpressionLiteral`: elas leem o acervo, não escrevem na tela.

- [ ] **Passo 1: escrever o teste.** `src/lib/semTravessao.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Nenhum texto do site usa o travessão, a pedido do parceiro humano.
 *
 * O que conta como texto: literal de string, template, JSX. O que não conta:
 * comentário (não chega à tela) e expressão regular (as duas que existem
 * casam o travessão que vem do Diário, para separar cargo e inciso; elas
 * leem o acervo, não escrevem nele).
 *
 * A varredura é pela árvore sintática do TypeScript, e não removendo `//` e
 * `/* *\/` por expressão regular: medido nesta base, o removedor ingênuo
 * tomava URL e expressão regular por comentário e acusava um comentário de
 * `enderecos.ts` como texto. Na árvore, comentário não é nó.
 *
 * O caractere vai escapado para este arquivo não precisar se excluir.
 */
const TRAVESSAO = "\u2014";
const RAIZ = join(process.cwd(), "src");

const TEXTO = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.tsx?$/.test(nome) && !nome.endsWith(".test.ts") ? [caminho] : [];
  });
}

function travessoes(nome: string, codigo: string): string[] {
  const fonte = ts.createSourceFile(
    nome,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    nome.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const achados: string[] = [];
  const visitar = (no: ts.Node) => {
    if (TEXTO.has(no.kind) && no.getText(fonte).includes(TRAVESSAO)) {
      const { line } = fonte.getLineAndCharacterOfPosition(no.getStart(fonte));
      achados.push(`${nome}:${line + 1}`);
    }
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
  return achados;
}

describe("sem travessão", () => {
  it("o detector acha texto e JSX, e deixa comentário e expressão regular", () => {
    const exemplo = [
      `// comentário ${TRAVESSAO} fica`,
      `/* bloco ${TRAVESSAO} fica */`,
      `const a = "texto ${TRAVESSAO} sai";`,
      `const b = /\\s${TRAVESSAO}\\s/;`,
      `const c = <p>frase ${TRAVESSAO} sai</p>;`,
      "const d = `modelo " + TRAVESSAO + " ${a}`;",
    ].join("\n");
    expect(travessoes("x.tsx", exemplo)).toEqual(["x.tsx:3", "x.tsx:5", "x.tsx:6"]);
  });

  it("nenhum texto de src/ usa o travessão fora de comentário", () => {
    const achados = arquivosDe(RAIZ).flatMap((arquivo) =>
      travessoes(relative(RAIZ, arquivo), readFileSync(arquivo, "utf8")),
    );
    expect(achados).toEqual([]);
  });
});
```

- [ ] **Passo 2: ver falhar.** `pnpm vitest run src/lib/semTravessao.test.ts`. Esperado: o primeiro teste passa; o segundo falha com cerca de 19 achados em `app/concursos/[slug]/page.tsx`, `app/estilo/page.tsx` (7), `app/orgaos/[slug]/page.tsx`, `components/concurso/AtosPublicados.tsx`, `components/concurso/Avaliacao.tsx` (3), `components/concurso/Cargos.tsx`, `components/home/BlocoAlerta.tsx`, `components/layout/AvisoDeOrigem.tsx` e `lib/rotulos.ts` (3). Nenhum em `lib/cargos.ts`, `lib/leitura.ts` ou `lib/enderecos.ts`.

- [ ] **Passo 3: reescrever cada ocorrência.** Texto novo de cada uma (o trecho antigo é o que o teste aponta):
  - `app/concursos/[slug]/page.tsx`, `apoio` da seção dos atos: `"O ato como saiu no diário oficial, na íntegra. Pode ser o extrato, não o edital completo: o edital com anexos e programa de provas fica no site da banca."`
  - `app/estilo/page.tsx`, o título longo de exemplo: `"Ministério da Justiça e Segurança Pública - CNCP/SENACON/MJSP: "` (o hífen com espaços que já existe no meio fica, é dado do acervo).
  - `app/estilo/page.tsx`, parágrafo do tema: `Sem escolha (e portanto também sem JavaScript), o CSS segue a preferência do sistema sozinho.`
  - `app/estilo/page.tsx`, parágrafo da gaveta: `22,5px de página à mostra, o bastante para se ver que há algo atrás`.
  - `app/estilo/page.tsx`, `apoio` da seção dos atos: `"O ato como saiu no diário oficial, na íntegra. Pode ser o extrato, não o edital completo."`
  - `app/estilo/page.tsx`, parágrafo da escala: `A escala é a do canvas: <span>1 2 3 4 5 6 8 10 12 16</span> de degrau, sobre uma unidade de <span>3,52px</span>, o que na tela dá ...` (os `<span>` continuam os mesmos).
  - `app/estilo/page.tsx`, parágrafo do vão: `(21px), que é o vão que cabe um rótulo de seção`.
  - `app/orgaos/[slug]/page.tsx`, `description`: `` `Concursos públicos ${sigla ? `do ${sigla}, ` : "do "}${orgao.nome}. ` ``.
  - `components/concurso/AtosPublicados.tsx`: `{" "}(endereço informado pelo ato, que não conferimos).`
  - `components/concurso/Avaliacao.tsx`: `O que você avalia é essa leitura, e é o “não gostei” que faz alguém conferir.`; `Escrever é opcional, e é o que permite consertar em vez de só contar.`; `placeholder="Ex.: no cronograma, a data de fim das inscrições é de outro concurso; no ato ela é 12/03."`
  - `components/concurso/Cargos.tsx`, `descreverVaga`: `.join(", ")` ("Pelotas, RS").
  - `components/home/BlocoAlerta.tsx`: `Nem todos vão entrar: parte dos atos é retificação ou anexo, que não abre concurso.`
  - `components/layout/AvisoDeOrigem.tsx`: `"O que está na tela é o acervo de demonstração, não o acervo real: os concursos abaixo são inventados. Suba a API com `bc api` no repositório engine."`
  - `lib/rotulos.ts` (`textoDeRodape`): `" retificações, sai no site da banca; confira sempre lá antes de se"`.
  - `lib/rotulos.ts` (`acervoIncompletoEmPartes`, parte "não abre"): `" (uma retificação de prazo atualiza um concurso que já está aqui)."`
  - `lib/rotulos.ts` (parte "lacuna nossa"): `" achou cargo nem cronograma no ato, e" + ` ${nossa === 1 ? "só entra" : "só entram"} se for refeita.``

- [ ] **Passo 4: rodar a suíte inteira.** `pnpm verificar`. Esperado: typecheck e lint limpos, todos os testes passam. Se algum teste de `rotulos.test.ts` comparar a frase inteira de `acervoIncompletoEmPartes` ou de `textoDeRodape`, atualizar a frase esperada para o texto novo acima (os títulos de ato com travessão nos testes são dado do acervo e ficam).

- [ ] **Passo 5: commit.**

```bash
git add src/lib/semTravessao.test.ts src/app src/components src/lib/rotulos.ts
git commit -m "$(cat <<'EOF'
fix: texto visível do site sem travessão, com teste que varre src/

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

**Fora do alcance, e decidido:** o travessão que chega no dado do acervo (títulos de ato lidos do Diário, como "CRA-RJ, Edital nº 1" escrito com travessão pelo órgão) não é texto nosso e fica como está. A citação do FAQ precisa ser idêntica ao documento (`src/lib/enderecos.ts`), então trocar caractere no dado quebraria o grifo.

---

## Task 2: gaveta fecha ao navegar e cadastro com Google/LinkedIn

**Files**
- Modify: `src/components/ui/Revelador.tsx`, `src/components/auth/PublicAuthScreens.tsx`

**Interfaces**
- Consumes: `usePathname` de `next/navigation`.
- Produces: `useRevelador` fecha em mudança de caminho (vale para `Gaveta` e `Menu`); `OAuthButtons({ mode: "login" | "signup" | "link"; returnTo?: string })`.

- [ ] **Passo 1: fechar sem animar, e ao mudar o caminho.** Em `useRevelador`, logo depois de `fechar`:

```ts
  /**
   * Fecha na hora, sem a animação de saída.
   *
   * É o fechamento de quem já saiu da página: a navegação trocou o conteúdo
   * por baixo, e segurar o `open` 180ms para animar só manteria o `inert` e a
   * rolagem travada sobre a página nova por mais tempo. Se uma saída animada
   * estava em curso, o `animationend` dela chega depois e não acha nada a
   * fazer, porque `open` já é falso.
   */
  const fecharJa = useCallback(() => {
    const elemento = raiz.current;
    if (!elemento?.open) return;
    elemento.removeAttribute("data-fechando");
    elemento.open = false;
  }, []);

  /**
   * Fecha quando o caminho muda.
   *
   * O cabeçalho mora no layout, e o layout sobrevive à navegação do cliente.
   * Clicar em "Entrar" dentro da gaveta do menu trocava a página e deixava a
   * gaveta aberta por cima, com o resto `inert` e a rolagem travada:
   * reproduzido em produção a 375px. O `pointerdown` de dentro do painel não
   * fecha nada, de propósito (é o que deixa selecionar o texto do ato).
   *
   * Só o caminho, e não a URL inteira: os filtros do celular mudam a query e
   * as âncoras do ato mudam o hash, e nos dois casos a pessoa continua na
   * mesma página e a gaveta precisa continuar aberta.
   *
   * `caminhoVisto` guarda o caminho em que a gaveta montou para o efeito não
   * fechar nada na hidratação: sem script o `<details>` pode ter sido aberto
   * antes de o React chegar, e fechá-lo ao hidratar desfaria o gesto.
   */
  const caminho = usePathname();
  const caminhoVisto = useRef(caminho);
  useEffect(() => {
    if (caminhoVisto.current === caminho) return;
    caminhoVisto.current = caminho;
    fecharJa();
  }, [caminho, fecharJa]);
```

Importar `usePathname` de `next/navigation`. O `toggle` que `open = false` dispara leva a `setAberto(false)`, e é a limpeza do efeito de `aberto` que tira o `inert` e destrava a rolagem: nada mais precisa mudar.

- [ ] **Passo 2: o terceiro modo do OAuth.** Em `PublicAuthScreens.tsx`:

```ts
/**
 * O verbo de cada botão. Entrar e criar conta são o mesmo `authorize`: a API
 * cria a conta no primeiro login social, então o que muda entre as duas
 * telas é só a palavra. Vincular é outro fluxo, com sessão.
 */
const VERBO_DO_OAUTH = {
  login: "Entrar",
  signup: "Criar conta",
  link: "Vincular",
} as const;

export function OAuthButtons({
  mode,
  returnTo = "/",
}: {
  mode: keyof typeof VERBO_DO_OAUTH;
  returnTo?: string;
}) {
```

Dentro de `start`, trocar `if (mode === "login")` por `if (mode !== "link")`. No rótulo: `` `${VERBO_DO_OAUTH[mode]} com ${provider === "google" ? "Google" : "LinkedIn"}` ``.

- [ ] **Passo 3: os botões em `/cadastrar`.** Em `RegisterScreen`, depois do `</form>` e antes de "Já tenho uma conta", o mesmo separador "ou" de `LoginScreen` e `<OAuthButtons mode="signup" />`.

- [ ] **Passo 4: verificar.** `pnpm verificar` (esperado: limpo). Depois `pnpm dev` e, no Chrome a 375px: abrir o menu, tocar "Entrar"; a URL vira `/entrar`, a gaveta some, a página rola e `document.querySelectorAll("[inert]").length` dá `0` no console. Abrir `/cadastrar` e ver "Criar conta com Google" e "Criar conta com LinkedIn". A conferência automática disto entra no script da Task 7.

- [ ] **Passo 5: commit.**

```bash
git add src/components/ui/Revelador.tsx src/components/auth/PublicAuthScreens.tsx
git commit -m "$(cat <<'EOF'
fix: gaveta fecha ao mudar de página e cadastro ganha Google e LinkedIn

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

---

## Task 3: contraste AA medido nos tokens

**Files**
- Create: `src/lib/contraste.ts`, `src/lib/contraste.test.ts`
- Modify: `src/app/globals.css` (os dois blocos escuros), `src/components/busca/BarraBusca.tsx`, `src/components/home/BlocoAlerta.tsx`, `src/components/concurso/Faq.tsx`, `src/components/layout/SeletorDeTema.tsx`, `src/app/estilo/page.tsx` (comentário do seletor de tema)

**Interfaces**
- Produces: `lerCor(valor: string): Cor`, `sobre(cor: Cor, fundo: Rgb): Rgb`, `luminancia(rgb: Rgb): number`, `razaoDeContraste(a: Rgb, b: Rgb): number`, `temasDoCss(css: string): { claro: Tokens; escuro: Tokens; escuroDoSistema: Tokens }`, com `type Rgb = readonly [number, number, number]`, `interface Cor { rgb: Rgb; alfa: number }`, `type Tokens = Record<string, string>`.

- [ ] **Passo 1: a medida.** `src/lib/contraste.ts`:

```ts
/**
 * Contraste WCAG entre os tokens de cor de `globals.css`.
 *
 * Existe para o teste ler as cores do próprio CSS, e não de uma cópia: uma
 * tabela de valores escrita no teste envelheceria no primeiro ajuste de tom
 * e continuaria passando. A fórmula é a do WCAG 2.2 (luminância relativa
 * sRGB e razão (L1 + 0,05) / (L2 + 0,05)).
 */
export type Rgb = readonly [number, number, number];
export interface Cor {
  rgb: Rgb;
  alfa: number;
}
export type Tokens = Record<string, string>;

/** `#rrggbb` e `rgb(r g b / a)`, as duas formas que `globals.css` usa. */
export function lerCor(valor: string): Cor {
  const texto = valor.trim();
  const hex = texto.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [n >> 16, (n >> 8) & 255, n & 255], alfa: 1 };
  }
  const rgb = texto.match(
    /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+)\s*)?\)$/,
  );
  if (rgb) {
    return {
      rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])],
      alfa: rgb[4] === undefined ? 1 : Number(rgb[4]),
    };
  }
  throw new Error(`cor que o teste não sabe ler: ${valor}`);
}

/**
 * A cor que o olho vê: a translúcida composta sobre o fundo. O rodapé claro
 * escreve em branco a 75% e 48%, e medir o branco puro diria 18:1 onde a tela
 * mostra 4,9:1.
 */
export function sobre(cor: Cor, fundo: Rgb): Rgb {
  const [r, g, b] = cor.rgb.map(
    (canal, i) => canal * cor.alfa + fundo[i] * (1 - cor.alfa),
  );
  return [r, g, b];
}

function linear(canal: number): number {
  const c = canal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminancia([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function razaoDeContraste(a: Rgb, b: Rgb): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (maior + 0.05) / (menor + 0.05);
}

function tokensDe(bloco: string): Tokens {
  const tokens: Tokens = {};
  for (const [, nome, valor] of bloco.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[nome] = valor.trim();
  }
  return tokens;
}

/** O miolo entre a chave que abre depois de `abertura` e a que a fecha. */
function blocoApos(css: string, abertura: RegExp): string {
  const inicio = css.search(abertura);
  if (inicio < 0) throw new Error(`bloco não encontrado: ${abertura}`);
  const chave = css.indexOf("{", inicio);
  let profundidade = 0;
  for (let i = chave; i < css.length; i += 1) {
    if (css[i] === "{") profundidade += 1;
    else if (css[i] === "}") {
      profundidade -= 1;
      if (profundidade === 0) return css.slice(chave + 1, i);
    }
  }
  throw new Error(`bloco sem fim: ${abertura}`);
}

/**
 * Os dois temas como o navegador os resolve: o escuro só sobrescreve, então
 * o que ele não declara (o amarelo, por exemplo) é o do claro. O escuro
 * aparece duas vezes em `globals.css`, na escolha explícita e dentro da
 * media query do "sistema", e é por isso que os dois são devolvidos.
 */
export function temasDoCss(css: string): {
  claro: Tokens;
  escuro: Tokens;
  escuroDoSistema: Tokens;
} {
  const claro = tokensDe(blocoApos(css, /@theme\s*\{/));
  const escuro = tokensDe(blocoApos(css, /:root\[data-tema="escuro"\]/));
  const escuroDoSistema = tokensDe(blocoApos(css, /:root\[data-tema="sistema"\]/));
  return {
    claro,
    escuro: { ...claro, ...escuro },
    escuroDoSistema: { ...claro, ...escuroDoSistema },
  };
}
```

- [ ] **Passo 2: o teste, com os pares que os componentes usam.** `src/lib/contraste.test.ts`. A lista saiu de `grep` das classes `text-*`/`bg-*` em `src/`: `tinta-500` aparece como rótulo de bloco sobre `bloco` e sobre os três chips de tom (`CartaoConcurso`, `Cartao.tsx`), como placeholder sobre `rebaixada`; `tinta-400` é ponto de etiqueta dentro do chip e ícone.

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lerCor, razaoDeContraste, sobre, temasDoCss, type Tokens } from "./contraste";

const { claro, escuro, escuroDoSistema } = temasDoCss(
  readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"),
);

/** WCAG AA. Texto grande (3:1) não aparece: nenhum par abaixo depende dele. */
const TEXTO = 4.5;
const NAO_TEXTO = 3;

/** Toda superfície onde texto de tinta aparece: página, cartões e os chips de tom. */
const SUPERFICIES = [
  "pagina", "cartao", "rebaixada", "bloco",
  "encerrado", "urgente", "previsto",
  "encerrado-chip", "urgente-chip", "previsto-chip", "tinta-100",
];

interface Par {
  texto: string;
  fundo: string;
  minimo: number;
}

const PARES: Par[] = [
  ...["tinta-900", "tinta-800", "tinta-600", "tinta-500"].flatMap((texto) =>
    SUPERFICIES.map((fundo) => ({ texto, fundo, minimo: TEXTO })),
  ),
  ...["link", "link-hover"].flatMap((texto) =>
    ["pagina", "cartao", "rebaixada", "bloco"].map((fundo) => ({ texto, fundo, minimo: TEXTO })),
  ),
  { texto: "acao-texto", fundo: "acao", minimo: TEXTO },
  { texto: "acao-texto", fundo: "acao-hover", minimo: TEXTO },
  { texto: "inverso-texto", fundo: "inverso", minimo: TEXTO },
  { texto: "inverso-texto", fundo: "inverso-hover", minimo: TEXTO },
  { texto: "amarelo-texto", fundo: "amarelo", minimo: TEXTO },
  { texto: "amarelo-texto", fundo: "amarelo-hover", minimo: TEXTO },
  { texto: "vermelho-800", fundo: "cartao", minimo: TEXTO },
  { texto: "vermelho-800", fundo: "urgente", minimo: TEXTO },
  { texto: "vermelho-800", fundo: "urgente-chip", minimo: TEXTO },
  { texto: "urgente-apoio", fundo: "urgente", minimo: TEXTO },
  { texto: "previsto-texto", fundo: "previsto", minimo: TEXTO },
  { texto: "previsto-texto", fundo: "previsto-chip", minimo: TEXTO },
  { texto: "previsto-apoio", fundo: "previsto", minimo: TEXTO },
  { texto: "rodape-texto", fundo: "rodape", minimo: TEXTO },
  { texto: "rodape-suave", fundo: "rodape", minimo: TEXTO },
  { texto: "rodape-tenue", fundo: "rodape", minimo: TEXTO },
  // Não texto: pontos de situação dentro do chip, ícones, a superfície do
  // botão primário contra o cartão e o anel de foco contra a página.
  { texto: "verde-500", fundo: "tinta-100", minimo: NAO_TEXTO },
  { texto: "verde-500", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "ocre", fundo: "previsto-chip", minimo: NAO_TEXTO },
  { texto: "vermelho", fundo: "urgente-chip", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "encerrado-chip", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "tinta-100", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "tinta-400", fundo: "rebaixada", minimo: NAO_TEXTO },
  // O seletor de tema: o ícone inativo contra o ativo é o que diz o estado.
  { texto: "tinta-400", fundo: "tinta-900", minimo: NAO_TEXTO },
  { texto: "acao", fundo: "cartao", minimo: NAO_TEXTO },
  { texto: "acao", fundo: "pagina", minimo: NAO_TEXTO },
];

function razao(tokens: Tokens, { texto, fundo }: Par): number {
  const base = lerCor(tokens[fundo]).rgb;
  return razaoDeContraste(sobre(lerCor(tokens[texto]), base), base);
}

describe("razaoDeContraste", () => {
  it("preto no branco é 21:1, e a cor com ela mesma é 1:1", () => {
    expect(razaoDeContraste([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(razaoDeContraste([80, 80, 80], [80, 80, 80])).toBe(1);
  });

  it("bate com a referência conhecida: #767676 no branco é 4,54:1", () => {
    expect(razaoDeContraste(lerCor("#767676").rgb, [255, 255, 255])).toBeCloseTo(4.54, 2);
  });

  it("compõe a transparência sobre o fundo antes de medir", () => {
    expect(sobre(lerCor("rgb(255 255 255 / 0.5)"), [0, 0, 0])).toEqual([127.5, 127.5, 127.5]);
  });
});

describe("tokens de globals.css", () => {
  it("o escuro do sistema é o mesmo escuro da escolha explícita", () => {
    expect(escuroDoSistema).toEqual(escuro);
  });

  it("todo token dos pares existe nos dois temas", () => {
    const nomes = new Set(PARES.flatMap(({ texto, fundo }) => [texto, fundo]));
    for (const nome of nomes) {
      expect(claro[nome], nome).toBeDefined();
      expect(escuro[nome], nome).toBeDefined();
    }
  });

  for (const [tema, tokens] of [["claro", claro], ["escuro", escuro]] as const) {
    it(`no tema ${tema}, todo par usado passa do mínimo AA`, () => {
      const falhas = PARES.filter((par) => razao(tokens, par) < par.minimo).map(
        (par) => `${par.texto} sobre ${par.fundo}: ${razao(tokens, par).toFixed(2)} < ${par.minimo}`,
      );
      expect(falhas).toEqual([]);
    });
  }
});
```

- [ ] **Passo 3: ver falhar.** `pnpm vitest run src/lib/contraste.test.ts`. Esperado, medido antes de escrever este plano:
  - claro: `tinta-500` sobre `rebaixada` 4,23; `encerrado` 4,35; `encerrado-chip` 3,92; `urgente-chip` 4,15; `previsto-chip` 4,33; `tinta-100` 4,49; `tinta-400` sobre `encerrado-chip` 2,29, `rebaixada` 2,47 e `tinta-100` 2,62.
  - escuro: `tinta-500` sobre `rebaixada` 4,36; `encerrado-chip` 4,23; `urgente-chip` 4,27; `previsto-chip` 4,04; `tinta-100` 4,30; `acao-texto` sobre `acao-hover` 4,00; `tinta-400` sobre `encerrado-chip` 2,92 e `tinta-100` 2,97.
  - os três primeiros testes e o do "sistema" passam.

- [ ] **Passo 4: os tokens.** Em `globals.css`, só valores, sem nome novo:
  - `@theme` (claro): `--color-tinta-500: #5a605c;` (pior caso passa a 4,69 sobre `encerrado-chip`) e `--color-tinta-400: #767c78;` (3,11 sobre `encerrado-chip`, 4,23 contra `tinta-900`).
  - Os **dois** blocos escuros (`:root[data-tema="escuro"], ...` e o `:root[data-tema="sistema"]` dentro da media query), com os mesmos valores: `--color-tinta-500: #9a9f9c;` (pior caso 4,89 sobre `previsto-chip`), `--color-tinta-400: #80867f;` (3,70 sobre `encerrado-chip`, 3,23 contra `tinta-900`) e `--color-acao-hover: #136b41;` (branco a 6,55). O hover do botão escurece no escuro em vez de clarear: clarear era o que levava o branco a 4,00.
  - Atualizar o comentário do bloco escuro ("Todo par de texto e fundo aqui foi medido") para dizer que a medida agora é `src/lib/contraste.test.ts`, sem travessão.

- [ ] **Passo 5: as classes que usavam token de ícone como texto.**
  - `BarraBusca.tsx` (campo de texto) e `BlocoAlerta.tsx` (campo de e-mail): `placeholder:text-tinta-400` vira `placeholder:text-tinta-500`, como `Campo.tsx` e `AuthUi.tsx` já fazem. Placeholder é texto e pede 4,5:1; `tinta-400` fica para ponto e ícone.
  - `Faq.tsx`: `text-tinta-700` vira `text-tinta-800`. `tinta-700` não existe em `globals.css`, então a classe não gerava nada e a citação herdava a cor do pai.
  - `SeletorDeTema.tsx`: o ícone inativo `text-tinta-500 hover:text-tinta-800` vira `text-tinta-400 hover:text-tinta-800`. Com o `tinta-500` novo do escuro (#9a9f9c) a distância entre ativo e inativo cairia para 2,33:1; com `tinta-400` fica 3,23:1 no escuro e 4,23:1 no claro, e o ícone ainda faz 3,81:1 e 3,36:1 contra o trilho `rebaixada`.
  - `estilo/page.tsx`: o comentário JSX sobre o seletor de tema ("A distância entre o ícone ativo e o inativo...") passa a registrar a decisão tomada e os números novos (3,23:1 e 4,23:1), sem travessão.

- [ ] **Passo 6: verificar.** `pnpm verificar`. Esperado: tudo verde, incluindo `semTravessao.test.ts`. Abrir `/estilo` no `pnpm dev` nos dois temas e conferir a olho que a hierarquia entre `tinta-600`, `tinta-500` e `tinta-400` continua legível como degrau.

- [ ] **Passo 7: commit.**

```bash
git add src/lib/contraste.ts src/lib/contraste.test.ts src/app/globals.css src/components src/app/estilo/page.tsx
git commit -m "$(cat <<'EOF'
fix: tokens de tinta e hover de ação passam de AA nos dois temas, medidos em teste

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

---

## Task 4: a camada de endereço (slug, URLs, redirect, título, sitemap)

Tudo aqui é função pura com teste. A rota `/busca/[termo]` e o `proxy.ts` que aplica o redirect entram na Task 5: entre os dois commits os links com texto já apontam para `/busca/...` e ainda dão 404, então Task 4 e Task 5 vão juntas no mesmo PR.

**Files**
- Create: `src/lib/enderecoDaBusca.ts`, `src/lib/enderecoDaBusca.test.ts`, `src/app/sitemap.test.ts`
- Modify: `src/lib/parametros.ts`, `src/lib/parametros.test.ts`, `src/lib/cargos.ts`, `src/lib/cargos.test.ts`, `src/lib/concursos.ts`, `src/app/sitemap.ts`, `src/components/busca/ColunaFiltros.tsx`, `src/components/home/Hero.tsx`

**Interfaces**
- Consumes: `normalizar` (`consulta.ts`), `medirCargos`, `CargoMedido` (`cargos.ts`).
- Produces (`enderecoDaBusca.ts`): `slugDaBusca(q: string): string`, `termoDoSlug(slug: string): string`, `urlDoTermo(q: string): string | null`, `decodificarSegmento(segmento: string): string`, `termoDaPagina(caminho: string): string | undefined`, `destinoCanonico(caminho: string, busca: URLSearchParams): string | null`, `interface CargoComRotulo { termo: string; rotulo: string }`, `tituloDoTermo(slug: string, cargos: readonly CargoComRotulo[]): string`, `metadadosDaBusca(slug: string, total: number, cargos: readonly CargoComRotulo[]): Metadata`.
- Produces (`parametros.ts`): `CONSULTA_VAZIA: ConsultaDaUrl`, `caminhoDaBusca(q?: string): string`, `urlSemFiltros(consulta: ConsultaDaUrl): string`, `destinoDoFormulario(q: string, uf: string): string`, `filtroDaConsulta(consulta: ConsultaDaUrl): Filtro`, `parametrosDaUrl(busca: URLSearchParams): Parametros`; `urlDaBusca` passa a escrever o termo no caminho.
- Produces (`concursos.ts`): `cargosEscolhidos(): Promise<CargoMedido[]>`.
- Produces (`cargos.ts`): `urlDoCargo(cargo)` devolve `/busca/<slug>`.

- [ ] **Passo 1: os testes do endereço.** `src/lib/enderecoDaBusca.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filtrar } from "./consulta";
import {
  destinoCanonico,
  metadadosDaBusca,
  slugDaBusca,
  termoDaPagina,
  termoDoSlug,
  tituloDoTermo,
  urlDoTermo,
} from "./enderecoDaBusca";
import { CONCURSOS } from "@/mocks/concursos";

describe("slugDaBusca", () => {
  it("tira acento, põe em minúscula e troca o que não é letra ou número por hífen", () => {
    expect(slugDaBusca("Assistente em Administração")).toBe("assistente-em-administracao");
    expect(slugDaBusca("  Técnico   Judiciário ")).toBe("tecnico-judiciario");
    expect(slugDaBusca("Soldado de 1ª classe")).toBe("soldado-de-1-classe");
    expect(slugDaBusca("11/2026/SEGAP")).toBe("11-2026-segap");
    expect(slugDaBusca("--Médico!!")).toBe("medico");
  });

  it("texto sem letra nem número vira slug vazio", () => {
    for (const q of ["", "   ", "!!!", "ª", "\u2014"]) expect(slugDaBusca(q)).toBe("");
  });
});

describe("termoDoSlug", () => {
  it("troca hífen por espaço e não deixa espaço sobrando", () => {
    expect(termoDoSlug("assistente-em-administracao")).toBe("assistente em administracao");
    expect(termoDoSlug("a--b-")).toBe("a b");
  });

  it("ida e volta é estável: o slug do termo do slug é o próprio slug", () => {
    for (const q of ["Assistente em Administração", "Analista (TI)", "São Paulo", "11/2026"]) {
      const slug = slugDaBusca(q);
      expect(slugDaBusca(termoDoSlug(slug))).toBe(slug);
    }
  });

  it("com símbolo só entre palavras, o slug devolve a mesma lista que o texto", () => {
    for (const q of ["Auxiliar", "professor de docência", "Pedagogo  ", "ESCREVENTE"]) {
      expect(filtrar(CONCURSOS, { q: termoDoSlug(slugDaBusca(q)) })).toEqual(
        filtrar(CONCURSOS, { q }),
      );
    }
  });

  // "11/2026" procura o pedaço "11/2026"; o slug procura "11" e "2026"
  // separados. É a única diferença entre texto e slug, e ela só alarga.
  it("símbolo dentro da palavra alarga a busca, nunca estreita", () => {
    for (const q of ["1ª classe", "11/2026", "docência-1"]) {
      const porSlug = new Set(
        filtrar(CONCURSOS, { q: termoDoSlug(slugDaBusca(q)) }).map((c) => c.slug),
      );
      for (const concurso of filtrar(CONCURSOS, { q })) {
        expect(porSlug.has(concurso.slug)).toBe(true);
      }
    }
  });
});

describe("urlDoTermo e termoDaPagina", () => {
  it("monta o caminho, ou nada quando não há o que buscar", () => {
    expect(urlDoTermo("Tribunal")).toBe("/busca/tribunal");
    expect(urlDoTermo("!!")).toBeNull();
  });

  it("lê o termo do caminho da página, para a barra do cabeçalho", () => {
    expect(termoDaPagina("/busca/analista-judiciario")).toBe("analista judiciario");
    expect(termoDaPagina("/busca/Analista%20Judici%C3%A1rio")).toBe("analista judiciario");
    expect(termoDaPagina("/busca/---")).toBeUndefined();
    expect(termoDaPagina("/concursos")).toBeUndefined();
    expect(termoDaPagina("/")).toBeUndefined();
  });
});

describe("destinoCanonico", () => {
  const em = (caminho: string, busca = "") =>
    destinoCanonico(caminho, new URLSearchParams(busca));

  it("manda /concursos?q= para /busca/<slug> e leva o resto da query na ordem", () => {
    expect(em("/concursos", "q=Analista%20Judici%C3%A1rio&uf=SP&escolaridade=superior&pagina=2")).toBe(
      "/busca/analista-judiciario?uf=SP&escolaridade=superior&pagina=2",
    );
  });

  it("q sem letra nem número só sai da URL", () => {
    expect(em("/concursos", "q=%21%21&uf=SP")).toBe("/concursos?uf=SP");
    expect(em("/concursos", "q=%21%21")).toBe("/concursos");
  });

  it("não mexe na listagem sem texto", () => {
    expect(em("/concursos")).toBeNull();
    expect(em("/concursos", "uf=SP")).toBeNull();
    expect(em("/concursos", "q=%20%20")).toBeNull();
  });

  it("leva o slug fora da forma para a canônica, com a query", () => {
    expect(em("/busca/Analista%20Judici%C3%A1rio")).toBe("/busca/analista-judiciario");
    expect(em("/busca/ANALISTA-judiciario", "uf=SP")).toBe("/busca/analista-judiciario?uf=SP");
    expect(em("/busca/analista--judiciario-")).toBe("/busca/analista-judiciario");
    expect(em("/busca/%E0%A4%A")).toBe("/busca/e0-a4-a");
  });

  it("não leva o parâmetro interno do Next para o destino", () => {
    expect(em("/concursos", "q=tribunal&_rsc=abc")).toBe("/busca/tribunal");
    expect(em("/busca/Tribunal", "_rsc=abc&uf=RJ")).toBe("/busca/tribunal?uf=RJ");
  });

  it("slug canônico e slug vazio não redirecionam (o vazio vira 404 na página)", () => {
    expect(em("/busca/analista-judiciario", "uf=SP")).toBeNull();
    expect(em("/busca/---")).toBeNull();
    expect(em("/busca/%E2%80%94")).toBeNull();
  });

  it("ignora o que não é das duas rotas", () => {
    expect(em("/", "q=x")).toBeNull();
    expect(em("/busca/a/b")).toBeNull();
    expect(em("/concursos/algum-slug", "q=x")).toBeNull();
  });
});

describe("título e metadados", () => {
  const CARGOS = [{ termo: "soldado de 1 classe", rotulo: "Soldado de 1ª classe" }];

  it("usa o rótulo acentuado quando o slug é de um cargo medido", () => {
    expect(tituloDoTermo("soldado-de-1-classe", CARGOS)).toBe("Concursos de Soldado de 1ª classe");
  });

  it("senão, põe inicial maiúscula em cada palavra do slug", () => {
    expect(tituloDoTermo("analista-judiciario", CARGOS)).toBe("Concursos de Analista Judiciario");
    expect(tituloDoTermo("tribunal", [])).toBe("Concursos de Tribunal");
  });

  it("o canônico é o próprio caminho, sem query, e só busca com resultado é indexável", () => {
    expect(metadadosDaBusca("tribunal", 12, [])).toMatchObject({
      title: "Concursos de Tribunal",
      alternates: { canonical: "/busca/tribunal" },
      robots: { index: true, follow: true },
    });
    expect(metadadosDaBusca("tribunal", 0, []).robots).toEqual({ index: false, follow: true });
  });
});
```

- [ ] **Passo 2: ver falhar.** `pnpm vitest run src/lib/enderecoDaBusca.test.ts`. Esperado: falha de import (`./enderecoDaBusca` não existe).

- [ ] **Passo 3: o módulo.** `src/lib/enderecoDaBusca.ts`:

```ts
/**
 * O endereço de uma busca: `/busca/<slug>`.
 *
 * O slug é o texto como a busca já o compara (`normalizar`: sem acento, em
 * minúscula), com toda sequência que não é letra nem número trocada por um
 * hífen. A volta troca hífen por espaço. Como a busca separa os termos por
 * espaço e ignora acento, o slug devolve a mesma lista que o texto: a única
 * diferença é símbolo dentro de uma palavra ("11/2026" procura o pedaço, o
 * slug procura "11" e "2026"), e ela só alarga. `enderecoDaBusca.test.ts`
 * cobra as duas coisas.
 *
 * Nada aqui importa `parametros.ts` nem `cargos.ts`: os dois importam este
 * arquivo, e o ciclo viria na primeira linha.
 */
import type { Metadata } from "next";
import { normalizar } from "./consulta";

const PREFIXO = "/busca/";

/** Parâmetro que o próprio Next põe na URL das requisições de RSC. */
const PARAMETRO_INTERNO = "_rsc";

export function slugDaBusca(q: string): string {
  return normalizar(q)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function termoDoSlug(slug: string): string {
  return slug.split("-").filter(Boolean).join(" ");
}

/** O caminho da busca por `q`, ou `null` quando `q` não tem o que buscar. */
export function urlDoTermo(q: string): string | null {
  const slug = slugDaBusca(q);
  return slug ? `${PREFIXO}${slug}` : null;
}

/**
 * O segmento chega percent-encoded quando alguém digitou acento ou espaço na
 * barra de endereço, e um escape torto (`%E0%A4%A`) não pode derrubar a rota.
 */
export function decodificarSegmento(segmento: string): string {
  try {
    return decodeURIComponent(segmento);
  } catch {
    return segmento;
  }
}

/** O termo que a barra do cabeçalho mostra quando a página é uma busca. */
export function termoDaPagina(caminho: string): string | undefined {
  if (!caminho.startsWith(PREFIXO)) return undefined;
  const slug = slugDaBusca(decodificarSegmento(caminho.slice(PREFIXO.length)));
  return slug ? termoDoSlug(slug) : undefined;
}

function comQuery(caminho: string, busca: URLSearchParams): string {
  const texto = busca.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

/**
 * Para onde o `proxy.ts` manda um endereço, ou `null` quando ele já é o
 * certo.
 *
 * - `/concursos?q=<texto>&...` vira `/busca/<slug>?...`: o texto sai da query
 *   e o resto fica, na mesma ordem. Texto sem letra nem número só sai.
 * - `/busca/<qualquer coisa>` vira a forma canônica do slug, com a query.
 * - Slug vazio não redireciona: a página responde 404.
 *
 * Mora aqui, e não no `proxy.ts`, para ser testável sem servidor.
 */
export function destinoCanonico(
  caminho: string,
  busca: URLSearchParams,
): string | null {
  const resto = new URLSearchParams(busca);
  resto.delete(PARAMETRO_INTERNO);

  if (caminho === "/concursos") {
    const q = resto.get("q")?.trim();
    if (!q) return null;
    resto.delete("q");
    return comQuery(urlDoTermo(q) ?? "/concursos", resto);
  }

  const trecho = caminho.match(/^\/busca\/([^/]+)$/);
  if (!trecho) return null;
  const canonico = slugDaBusca(decodificarSegmento(trecho[1]));
  if (!canonico || canonico === trecho[1]) return null;
  return comQuery(`${PREFIXO}${canonico}`, resto);
}

/** O que o título precisa de um cargo medido. Estrutural, para não importar `cargos.ts`. */
export interface CargoComRotulo {
  termo: string;
  rotulo: string;
}

/**
 * "Concursos de <Termo>". Quando o slug é o de um cargo que `medirCargos`
 * escolheu, o termo é o rótulo como o ato escreveu, com acento ("Soldado de
 * 1ª classe"); senão é o slug com inicial maiúscula em cada palavra, que é o
 * melhor que dá para fazer sem saber onde iam os acentos.
 */
export function tituloDoTermo(
  slug: string,
  cargos: readonly CargoComRotulo[],
): string {
  const cargo = cargos.find((candidato) => slugDaBusca(candidato.termo) === slug);
  const nome =
    cargo?.rotulo ??
    termoDoSlug(slug)
      .split(" ")
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  return `Concursos de ${nome}`;
}

/**
 * Metadados de `/busca/<slug>`. O canônico não leva query: filtro e página
 * são recortes da mesma busca. Busca sem resultado responde 200 (é resposta
 * verdadeira) e fica fora do índice, que é o que separa um cargo que existe
 * de um texto qualquer digitado na barra.
 */
export function metadadosDaBusca(
  slug: string,
  total: number,
  cargos: readonly CargoComRotulo[],
): Metadata {
  const titulo = tituloDoTermo(slug, cargos);
  return {
    title: titulo,
    description:
      `Vagas, salário, taxa e prazo de inscrição de ${titulo.toLowerCase()}. ` +
      "Dados extraídos do edital original, com link para o documento.",
    alternates: { canonical: `${PREFIXO}${slug}` },
    robots: total === 0 ? { index: false, follow: true } : { index: true, follow: true },
  };
}
```

- [ ] **Passo 4: ver passar.** `pnpm vitest run src/lib/enderecoDaBusca.test.ts`. Esperado: todos passam.

- [ ] **Passo 5: os testes de `parametros`.** Em `src/lib/parametros.test.ts`, trocar a constante local `VAZIA` por `CONSULTA_VAZIA` importada de `./parametros` (e `termoDoSlug` de `./enderecoDaBusca`), substituir o teste "sobrevive à ida e à volta" e acrescentar:

```ts
  it("sobrevive à ida e à volta, com o termo no caminho", () => {
    const original: ConsultaDaUrl = {
      ...CONSULTA_VAZIA,
      // Já normalizado: o caminho guarda o termo como a busca o compara.
      q: "analista judiciario",
      uf: "SP",
      escolaridades: ["superior", "medio"],
      bancas: ["vunesp"],
      salarioMin: 3000,
      ordem: "vagas",
      pagina: 3,
    };
    const url = new URL(urlDaBusca(original), "http://x");
    const [, rota, slug] = url.pathname.split("/");
    expect(rota).toBe("busca");
    const parametros = {
      ...Object.fromEntries(
        [...new Set(url.searchParams.keys())].map((chave) => [chave, url.searchParams.getAll(chave)]),
      ),
      q: termoDoSlug(slug),
    };
    expect(lerConsulta(parametros)).toEqual(original);
  });

  it("com texto, o termo vai no caminho e sai da query", () => {
    expect(
      urlDaBusca(CONSULTA_VAZIA, { q: "Assistente em Administração", uf: "SP", pagina: 2 }),
    ).toBe("/busca/assistente-em-administracao?uf=SP&pagina=2");
  });

  it("texto sem letra nem número cai na listagem geral", () => {
    expect(urlDaBusca(CONSULTA_VAZIA, { q: "!!!" })).toBe("/concursos");
  });
```

E, em blocos próprios:

```ts
describe("urlAlternando na busca", () => {
  it("marca o filtro sem sair do caminho do termo", () => {
    expect(urlAlternando({ ...CONSULTA_VAZIA, q: "tribunal" }, "situacoes", "abertas")).toBe(
      "/busca/tribunal?situacao=abertas",
    );
  });
});

describe("caminhoDaBusca", () => {
  it("é o caminho do termo, ou a listagem", () => {
    expect(caminhoDaBusca("tribunal")).toBe("/busca/tribunal");
    expect(caminhoDaBusca(undefined)).toBe("/concursos");
    expect(caminhoDaBusca("!!")).toBe("/concursos");
  });
});

describe("urlSemFiltros", () => {
  it("tira estado, facetas e salário e mantém termo e ordenação", () => {
    expect(
      urlSemFiltros({
        ...CONSULTA_VAZIA,
        q: "tribunal",
        uf: "SP",
        escolaridades: ["medio"],
        salarioMin: 3000,
        ordem: "vagas",
        pagina: 3,
      }),
    ).toBe("/busca/tribunal?ordem=vagas");
  });
});

describe("destinoDoFormulario", () => {
  it("leva o texto para o caminho e o estado para a query", () => {
    expect(destinoDoFormulario("Analista Judiciário", "SP")).toBe("/busca/analista-judiciario?uf=SP");
  });

  it("sem texto, é a listagem com o estado", () => {
    expect(destinoDoFormulario("   ", "RJ")).toBe("/concursos?uf=RJ");
    expect(destinoDoFormulario("", "")).toBe("/concursos");
  });

  it("estado que não existe não entra", () => {
    expect(destinoDoFormulario("x", "banana")).toBe("/busca/x");
  });
});

describe("filtroDaConsulta e parametrosDaUrl", () => {
  it("o filtro é a consulta sem ordem nem página", () => {
    expect(
      filtroDaConsulta({ ...CONSULTA_VAZIA, q: "a", uf: "SP", ordem: "vagas", pagina: 2 }),
    ).toEqual({
      q: "a",
      uf: "SP",
      escolaridades: [],
      situacoes: [],
      bancas: [],
      esferas: [],
      salarioMin: undefined,
      salarioMax: undefined,
    });
  });

  it("parâmetro repetido vira lista, e o único continua texto", () => {
    expect(
      parametrosDaUrl(new URLSearchParams("escolaridade=superior&escolaridade=medio&uf=SP")),
    ).toEqual({ escolaridade: ["superior", "medio"], uf: "SP" });
  });
});
```

- [ ] **Passo 6: ver falhar.** `pnpm vitest run src/lib/parametros.test.ts`. Esperado: falha de import dos nomes novos.

- [ ] **Passo 7: `parametros.ts`.** Importar `slugDaBusca` de `./enderecoDaBusca`, `type Filtro` de `./consulta` e `UFS` (já importado). Acrescentar:

```ts
/** A consulta sem nada: listagem geral, ordenação padrão, primeira página. */
export const CONSULTA_VAZIA: ConsultaDaUrl = {
  escolaridades: [],
  situacoes: [],
  bancas: [],
  esferas: [],
  ordem: "encerrando",
  pagina: 1,
};

/**
 * Onde a busca mora: `/busca/<slug>` quando há o que buscar, `/concursos`
 * quando não há. É também o `action` dos formulários que editam só uma parte
 * da consulta (a faixa de salário): o termo viaja no caminho, não num campo.
 */
export function caminhoDaBusca(q?: string): string {
  const slug = q ? slugDaBusca(q) : "";
  return slug ? `/busca/${slug}` : "/concursos";
}
```

Em `urlDaBusca`, remover `if (final.q) busca.set("q", final.q);` e trocar o retorno por:

```ts
  // O termo vai no caminho, e não na query: `/busca/<slug>` é o endereço
  // que o buscador indexa, e a query fica só para os recortes dele.
  const caminho = caminhoDaBusca(final.q);
  const texto = busca.toString();
  return texto ? `${caminho}?${texto}` : caminho;
```

E as quatro funções novas:

```ts
/** "Limpar filtros": fica o termo e a ordenação, sai todo recorte. */
export function urlSemFiltros(consulta: ConsultaDaUrl): string {
  return urlDaBusca(consulta, {
    uf: undefined,
    escolaridades: [],
    situacoes: [],
    bancas: [],
    esferas: [],
    salarioMin: undefined,
    salarioMax: undefined,
    pagina: 1,
  });
}

/**
 * Para onde a barra do cabeçalho navega. `uf` chega do `<select>` como texto
 * de formulário, e o que não é estado não entra.
 */
export function destinoDoFormulario(q: string, uf: string): string {
  return urlDaBusca(CONSULTA_VAZIA, {
    q: q.trim() || undefined,
    uf: (UFS as readonly string[]).includes(uf) ? (uf as Uf) : undefined,
  });
}

/** O que `filtrar` recebe: a consulta sem ordenação nem página. */
export function filtroDaConsulta(consulta: ConsultaDaUrl): Filtro {
  const { q, uf, escolaridades, situacoes, bancas, esferas, salarioMin, salarioMax } = consulta;
  return { q, uf, escolaridades, situacoes, bancas, esferas, salarioMin, salarioMax };
}

/**
 * `useSearchParams` na forma que `lerConsulta` lê. Repetido vira lista,
 * único continua texto, que é o que o `searchParams` do servidor entrega.
 */
export function parametrosDaUrl(busca: URLSearchParams): Parametros {
  const parametros: Parametros = {};
  for (const chave of new Set(busca.keys())) {
    const valores = busca.getAll(chave);
    parametros[chave] = valores.length === 1 ? valores[0] : valores;
  }
  return parametros;
}
```

- [ ] **Passo 8: ver passar.** `pnpm vitest run src/lib/parametros.test.ts`. Esperado: todos passam.

- [ ] **Passo 9: `urlDoCargo` e os cargos para o resto do app.** Em `cargos.test.ts`, no teste que confere `urlDoCargo` (linha ~192), trocar as duas expectativas por:

```ts
      expect(filtrar(acervo, { q: termoDoSlug(slugDaBusca(cargo.termo)) })).toHaveLength(cargo.alcance);
      expect(urlDoCargo(cargo)).toBe(`/busca/${slugDaBusca(cargo.termo)}`);
```

(importando `slugDaBusca` e `termoDoSlug` de `./enderecoDaBusca`). Rodar `pnpm vitest run src/lib/cargos.test.ts`: falha. Em `cargos.ts`, importar `slugDaBusca` e:

```ts
/**
 * O endereço do cargo é a busca pelo termo, no caminho. O termo já sai
 * normalizado da medição e nunca é vazio (é feito de palavras `[a-z0-9]+`),
 * então todo cargo tem slug.
 */
export function urlDoCargo(cargo: CargoMedido): string {
  return `/busca/${slugDaBusca(cargo.termo)}`;
}
```

e atualizar os comentários de `CargoMedido.termo` e `alcance` (`?q=` passa a ser `/busca/<slug>`). Rodar de novo: passa.

Em `concursos.ts`, importar `type CargoMedido` e:

```ts
/**
 * Os cargos que a medição escolheu, todos. Uma medição por render: o rodapé,
 * o título da busca e o sitemap perguntam a mesma coisa, e `medirCargos`
 * varre o acervo inteiro.
 */
const medirCargosDoAcervo = cache(
  async (): Promise<CargoMedido[]> => medirCargos(await acervo()).escolhidos,
);

export async function cargosEscolhidos(): Promise<CargoMedido[]> {
  return medirCargosDoAcervo();
}
```

e fazer `cargosEmDestaque` usar `(await cargosEscolhidos()).slice(0, limite)`.

- [ ] **Passo 10: o sitemap.** `src/app/sitemap.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { medirCargos } from "@/lib/cargos";
import { slugDaBusca } from "@/lib/enderecoDaBusca";
import { urlAbsoluta } from "@/lib/site";
import { CONCURSOS } from "@/mocks/concursos";

describe("sitemap", () => {
  it("tem /busca/<slug> para cada cargo medido, diário e com prioridade 0,7", async () => {
    // O mock rende 7 cargos escolhidos; sem nenhum, o teste não provaria nada.
    const { escolhidos } = medirCargos(CONCURSOS);
    expect(escolhidos.length).toBeGreaterThan(0);

    const buscas = (await sitemap()).filter((entrada) =>
      entrada.url.startsWith(urlAbsoluta("/busca/")),
    );
    expect(buscas.map((entrada) => entrada.url).sort()).toEqual(
      escolhidos.map((cargo) => urlAbsoluta(`/busca/${slugDaBusca(cargo.termo)}`)).sort(),
    );
    for (const entrada of buscas) {
      expect(entrada.changeFrequency).toBe("daily");
      expect(entrada.priority).toBe(0.7);
    }
  });

  it("não lista busca por texto livre", async () => {
    expect((await sitemap()).some((entrada) => entrada.url.includes("?q="))).toBe(false);
  });
});
```

Rodar: o primeiro falha (nenhuma entrada `/busca/`). Em `sitemap.ts`, importar `cargosEscolhidos` e `urlDoCargo`, ler `const cargos = await cargosEscolhidos();` e acrescentar, entre as escolaridades e os órgãos:

```ts
    // Todos os cargos que a medição escolheu, e não só os dez do rodapé: a
    // medição já recusa o que devolveria lista pequena ou de outro cargo, e
    // é essa mesma regra que decide o que vale uma URL indexável.
    ...cargos.map((cargo) => ({
      url: urlAbsoluta(urlDoCargo(cargo)),
      lastModified: agora,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
```

Atualizar o comentário do topo ("Não entram as buscas por texto livre": continua valendo; acrescentar que as buscas por cargo entram). Rodar: passa.

- [ ] **Passo 11: os dois formulários e atalhos que escreviam `?q=`.**
  - `ColunaFiltros.tsx`: `FaixaDeSalario` usa `<form action={caminhoDaBusca(consulta.q)} method="get">`; `CamposOcultos` perde a linha de `q`, com o comentário: "O termo não viaja como campo: ele está no caminho (`caminhoDaBusca`), e um `q` aqui faria o `proxy.ts` redirecionar o envio."
  - `Hero.tsx`: `ATALHOS` de "Tribunais" e "Polícia" passam a `/busca/tribunal` e `/busca/policia`.

- [ ] **Passo 12: verificar.** `pnpm verificar`. Esperado: tudo verde.

- [ ] **Passo 13: commit.**

```bash
git add src/lib/enderecoDaBusca.ts src/lib/enderecoDaBusca.test.ts src/lib/parametros.ts src/lib/parametros.test.ts src/lib/cargos.ts src/lib/cargos.test.ts src/lib/concursos.ts src/app/sitemap.ts src/app/sitemap.test.ts src/components/busca/ColunaFiltros.tsx src/components/home/Hero.tsx
git commit -m "$(cat <<'EOF'
feat: endereço de busca em /busca/<slug>, com forma canônica, título e sitemap por cargo

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

---

## Task 5: ISR, a rota `/busca/[termo]` e o build com a API pública

Guias lidos para esta tarefa, em `node_modules/next/dist/docs/01-app/`: `02-guides/incremental-static-regeneration.md` (seção Caveats: um `fetch` com `no-store` torna a rota dinâmica; o menor `revalidate` vence), `02-guides/caching-without-cache-components.md` (`revalidate` de segmento precisa ser literal; o menor entre layout e página vale para a rota), `03-api-reference/04-functions/generate-static-params.md` ("All paths at runtime": `[]` é obrigatório para ISR sob demanda), `03-api-reference/03-file-conventions/02-route-segment-config/dynamicParams.md`, `03-api-reference/04-functions/use-search-params.md` (seção Prerendering: o componente com `useSearchParams` é renderizado no cliente até o `Suspense` mais próximo, e o HTML leva o `fallback`), `03-api-reference/04-functions/connection.md`, `03-api-reference/04-functions/permanentRedirect.md`, `03-api-reference/03-file-conventions/proxy.md` (`src/proxy.ts`, função `proxy`, runtime Node por padrão).

**Files**
- Create: `src/lib/memoria.ts`, `src/lib/memoria.test.ts`, `src/lib/buscaLocal.ts`, `src/lib/buscaLocal.test.ts`, `src/lib/filtrosAtivos.ts`, `src/lib/filtrosAtivos.test.ts`, `src/proxy.ts`, `src/app/busca/[termo]/page.tsx`, `src/components/busca/ListaDeResultados.tsx`, `src/components/busca/ResultadosDaBusca.tsx`
- Modify: `src/lib/consulta.ts`, `src/lib/concursos.ts`, `src/lib/concursos.test.ts`, `src/lib/acervo.test.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/sitemap.ts`, `src/app/concursos/page.tsx`, `src/app/concursos/[slug]/page.tsx`, `src/components/busca/ColunaFiltros.tsx` (só o import de tipo), `Dockerfile`, `.github/workflows/deploy.yml`, `README.md`

**Interfaces**
- Consumes: tudo que a Task 4 produz.
- Produces: `lembrarPor<T>(validadeMs: number, buscar: () => Promise<T>, agora?: () => number): () => Promise<T>`; em `consulta.ts`: `POR_PAGINA = 20`, `interface Pagina`, `paginar(itens: ConcursoResumo[], pagina: number, porPagina?: number): Pagina`, `interface OpcaoDeFaceta`, `interface ContagensDeFaceta`, `contarFacetas(todos: ConcursoResumo[], filtro: Filtro, hoje: Date): ContagensDeFaceta`; `aplicarConsulta(itensDoTermo: ConcursoResumo[], consulta: ConsultaDaUrl, hoje: Date): { resultado: Pagina; contagens: ContagensDeFaceta }`; `interface Chip { chave: string; rotulo: string; href: string }`, `chipsAtivos(consulta: ConsultaDaUrl): Chip[]`; em `concursos.ts`: `concursosDoTermo(termo: string): Promise<ConcursoResumo[]>`, `paraALista(itens: ConcursoResumo[]): ConcursoResumo[]` (e reexporta `Pagina`, `OpcaoDeFaceta`, `ContagensDeFaceta`); componentes `ListaDeResultados`, `ResultadosDaBusca`, `ResultadosDaBuscaNaUrl`; `proxy`.

- [ ] **Passo 1: memória de processo, teste primeiro.** `src/lib/memoria.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { lembrarPor } from "./memoria";

describe("lembrarPor", () => {
  it("dentro da validade não busca de novo", async () => {
    let agora = 0;
    const buscar = vi.fn(async () => "acervo");
    const obter = lembrarPor(300_000, buscar, () => agora);
    await obter();
    agora = 299_999;
    await obter();
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it("vencida a validade, busca de novo", async () => {
    let agora = 0;
    const buscar = vi.fn(async () => "acervo");
    const obter = lembrarPor(300_000, buscar, () => agora);
    await obter();
    agora = 300_000;
    await obter();
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  it("chamadas simultâneas dividem a mesma busca", async () => {
    const buscar = vi.fn(() => new Promise<string>((resolver) => setTimeout(() => resolver("x"), 5)));
    const obter = lembrarPor(1000, buscar, () => 0);
    const [a, b] = await Promise.all([obter(), obter()]);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("falha não fica guardada", async () => {
    let vezes = 0;
    const buscar = vi.fn(async () => {
      vezes += 1;
      if (vezes === 1) throw new Error("fora do ar");
      return "ok";
    });
    const obter = lembrarPor(300_000, buscar, () => 0);
    await expect(obter()).rejects.toThrow("fora do ar");
    await expect(obter()).resolves.toBe("ok");
    expect(buscar).toHaveBeenCalledTimes(2);
  });
});
```

Rodar (falha de import) e escrever `src/lib/memoria.ts`:

```ts
/**
 * Guarda o resultado de uma busca assíncrona por um tempo, no processo.
 *
 * Existe por causa de um limite do Next: o Data Cache recusa entrada acima de
 * 2 MB (`node_modules/next/dist/server/lib/incremental-cache/index.js`), e o
 * corpo de `/acervo` tem 4,2 MB. Com `next: { revalidate }` sozinho, cada
 * regeneração de cada página ISR baixava e analisava o acervo inteiro de
 * novo, e o log ganhava um "items over 2MB can not be cached" por vez.
 *
 * A promessa é guardada, e não o valor: duas páginas regenerando juntas
 * dividem uma requisição. Falha não é guardada, para a próxima chamada
 * tentar de novo em vez de repetir o erro por cinco minutos.
 */
export function lembrarPor<T>(
  validadeMs: number,
  buscar: () => Promise<T>,
  agora: () => number = Date.now,
): () => Promise<T> {
  let guardado: { valor: Promise<T>; ate: number } | null = null;
  return () => {
    const instante = agora();
    if (guardado && instante < guardado.ate) return guardado.valor;
    const este = { valor: buscar(), ate: instante + validadeMs };
    guardado = este;
    este.valor.catch(() => {
      if (guardado === este) guardado = null;
    });
    return este.valor;
  };
}
```

Rodar: passa.

- [ ] **Passo 2: o acervo com revalidação, e o build que não congela o mock.** Em `acervo.test.ts`, trocar as duas expectativas `{ cache: "no-store" }` de `/acervo` (linhas ~110 e ~124) por `{ next: { revalidate: 300 } }` (a do detalhe, linha ~406, continua `no-store`) e acrescentar:

```ts
  it("no build, API fora do ar derruba o build em vez de congelar o mock", async () => {
    vi.stubEnv("BC_API_URL", API);
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }));

    const { listarConcursos } = await carregar();

    await expect(listarConcursos()).rejects.toThrow("ECONNREFUSED");
    expect(avisos).toEqual([]);
  });

  it("dentro dos cinco minutos, leituras seguidas fazem uma requisição só", async () => {
    vi.stubEnv("BC_API_URL", API);
    const rede = vi.fn(async () => respostaCom({ concursos: [UM_CONCURSO], semDado: 0 }));
    vi.stubGlobal("fetch", rede);

    const { listarConcursos, dimensoesDoAcervo } = await carregar();
    await listarConcursos();
    await dimensoesDoAcervo();

    expect(rede).toHaveBeenCalledTimes(1);
  });
```

Rodar `pnpm vitest run src/lib/acervo.test.ts`: falham os três. Em `concursos.ts`, importar `PHASE_PRODUCTION_BUILD` de `next/constants` e `lembrarPor` de `./memoria`, e trocar `carregar` por:

```ts
/**
 * Cinco minutos, o mesmo `revalidate` das páginas ISR: o acervo que a página
 * regenerada mostra nunca é mais velho do que a própria página.
 */
const VALIDADE_DO_ACERVO_S = 300;

/**
 * A leitura da API, guardada no processo por `lembrarPor` (ver lá o porquê:
 * o corpo passa de 2 MB e o Data Cache do Next não o guarda). O `fetch`
 * continua com `revalidate` e não com `no-store`: `no-store` dentro de rota
 * estática é o 500 `DYNAMIC_SERVER_USAGE` que o commit c31d46c contornou
 * tornando o site inteiro dinâmico.
 */
const lerAcervoDaApi = lembrarPor(
  VALIDADE_DO_ACERVO_S * 1000,
  async (): Promise<RespostaDeAcervo> => {
    const resposta = await fetch(`${URL_DA_API}/acervo`, {
      next: { revalidate: VALIDADE_DO_ACERVO_S },
    });
    if (!resposta.ok) throw new Error(`a API respondeu ${resposta.status}`);
    const corpo: RespostaDeAcervo = await resposta.json();
    if (!Array.isArray(corpo?.concursos)) {
      throw new Error("a resposta não tem a lista `concursos`");
    }
    return { ...corpo, origem: "api" };
  },
);

const carregar = cache(async (): Promise<RespostaDeAcervo> => {
  if (!URL_DA_API) return ACERVO_DE_MOCK;
  try {
    return await lerAcervoDaApi();
  } catch (erro) {
    unstable_rethrow(erro);
    // No build, cair no mock seria pré-renderizar o mock: a home e cada
    // página ISR sairiam do deploy com concursos inventados até a primeira
    // revalidação. O build falha alto e ninguém publica isso.
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) throw erro;
    console.warn(
      `[concursos] ${URL_DA_API}/acervo falhou (${
        erro instanceof Error ? erro.message : erro
      }); usando o mock. Suba a API com \`bc api\` no repositório engine.`,
    );
    return { ...ACERVO_DE_MOCK, origem: "falha" };
  }
});
```

Manter o comentário longo sobre `cache` do React (ele continua valendo dentro de um render) e o de `unstable_rethrow`, ajustando a frase que citava `no-store`. Rodar: passa.

- [ ] **Passo 3: paginação e contagem viram funções puras.** Em `consulta.ts`, importar `ROTULO_ESCOLARIDADE` de `./rotulos` (sem ciclo: `rotulos.ts` importa só `dominio` e `formato`) e mover para cá, sem mudar comportamento: `POR_PAGINA`, `Pagina`, `OpcaoDeFaceta`, `ContagensDeFaceta`, `ORDEM_DE_ESCOLARIDADE` e o corpo de `contagensDeFaceta` como `contarFacetas(todos, filtro, hoje)`. E:

```ts
/**
 * Uma página da lista. Página pedida abaixo de 1 vira 1; além do fim vem
 * vazia com o total certo, e não quebra.
 */
export function paginar(
  itens: ConcursoResumo[],
  pagina: number,
  porPagina: number = POR_PAGINA,
): Pagina {
  const atual = Math.max(pagina, 1);
  const inicio = (atual - 1) * porPagina;
  return {
    itens: itens.slice(inicio, inicio + porPagina),
    total: itens.length,
    pagina: atual,
    porPagina,
    paginas: Math.max(Math.ceil(itens.length / porPagina), 1),
  };
}
```

Em `concursos.ts`: `export type { ContagensDeFaceta, OpcaoDeFaceta, Pagina } from "./consulta";`, `listarConcursos` termina em `return paginar(encontrados, pagina, porPagina);`, `contagensDeFaceta` vira `return contarFacetas(await acervo(), filtro, hoje);`. `ColunaFiltros.tsx` continua importando os tipos de `@/lib/concursos`, que os reexporta. Rodar `pnpm vitest run src/lib/concursos.test.ts`: os testes de `contagensDeFaceta` e `listarConcursos` passam sem mudança, que é a prova do movimento.

- [ ] **Passo 4: a lista do termo e o que vai para o navegador.** Em `concursos.ts`:

```ts
/**
 * Os concursos de um termo, sem nenhum outro recorte. É o que a página
 * `/busca/<slug>` entrega pronta: filtro, ordenação e página são do
 * navegador (ver `buscaLocal.ts`), e é isso que deixa a página estática.
 */
export async function concursosDoTermo(termo: string): Promise<ConcursoResumo[]> {
  return filtrar(await acervo(), { q: termo });
}

/**
 * O que a lista do navegador não desenha sai antes de viajar. `localidades`
 * só serve à busca por texto, que o servidor já fez; `ultimoAto` só aparece
 * na faixa "Últimas atualizações" da home. Medido em 2026-09-24: "professor"
 * devolve 2.631 concursos e 2,3 MB de JSON.
 */
export function paraALista(itens: ConcursoResumo[]): ConcursoResumo[] {
  return itens.map((concurso) => ({ ...concurso, localidades: [], ultimoAto: null }));
}
```

Em `concursos.test.ts`:

```ts
describe("paraALista", () => {
  it("tira só o que a lista não desenha", () => {
    const [original] = CONCURSOS;
    const [enxuto] = paraALista([original]);
    expect(enxuto).toEqual({ ...original, localidades: [], ultimoAto: null });
  });
});
```

- [ ] **Passo 5: a busca no navegador igual à do servidor.** `src/lib/buscaLocal.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { aplicarConsulta } from "./buscaLocal";
import { contagensDeFaceta, listarConcursos } from "./concursos";
import { filtrar } from "./consulta";
import { CONSULTA_VAZIA, filtroDaConsulta, type ConsultaDaUrl } from "./parametros";
import { CONCURSOS } from "@/mocks/concursos";

const HOJE = new Date("2026-09-24T12:00:00");
const TERMOS = ["a", "auxiliar", "professor"];
const RECORTES: Partial<ConsultaDaUrl>[] = [
  {},
  { situacoes: ["abertas"] },
  { ordem: "salario", pagina: 2 },
  { uf: "SP" },
  { escolaridades: ["superior"], salarioMin: 3000 },
  { situacoes: ["previstos", "encerrados"], ordem: "vagas" },
];

function combinacoes() {
  return TERMOS.flatMap((termo) =>
    RECORTES.map((recorte) => ({
      termo,
      consulta: { ...CONSULTA_VAZIA, ...recorte, q: termo } as ConsultaDaUrl,
    })),
  );
}

describe("aplicarConsulta", () => {
  it("dá a mesma página que o servidor dá para a mesma consulta", async () => {
    for (const { termo, consulta } of combinacoes()) {
      const { resultado } = aplicarConsulta(filtrar(CONCURSOS, { q: termo }), consulta, HOJE);
      const servidor = await listarConcursos(
        { ...filtroDaConsulta(consulta), ordem: consulta.ordem, pagina: consulta.pagina },
        HOJE,
      );
      expect(resultado, JSON.stringify(consulta)).toEqual(servidor);
    }
  });

  // O servidor lista toda banca e escolaridade do acervo; o navegador só as
  // do termo, porque as outras dariam zero sempre. O número de cada opção que
  // aparece nas duas é o mesmo.
  it("a contagem de cada opção é a do servidor", async () => {
    for (const { termo, consulta } of combinacoes()) {
      const { contagens } = aplicarConsulta(filtrar(CONCURSOS, { q: termo }), consulta, HOJE);
      const servidor = await contagensDeFaceta(filtroDaConsulta(consulta), HOJE);
      for (const dimensao of ["situacoes", "escolaridades", "bancas"] as const) {
        for (const opcao of contagens[dimensao]) {
          const la = servidor[dimensao].find((outra) => outra.valor === opcao.valor);
          expect(la?.total, `${dimensao}=${opcao.valor} em ${JSON.stringify(consulta)}`).toBe(opcao.total);
        }
      }
    }
  });

  it("o termo da consulta não filtra de novo: a lista já é a do termo", () => {
    const consulta = { ...CONSULTA_VAZIA, q: "texto que não existe em lugar nenhum" };
    expect(aplicarConsulta(CONCURSOS.slice(0, 3), consulta, HOJE).resultado.total).toBe(3);
  });
});
```

Rodar (falha de import) e escrever `src/lib/buscaLocal.ts`:

```ts
/**
 * A busca que roda no navegador, em `/busca/<slug>`.
 *
 * A página é estática (ISR), então o servidor não lê a query: ele entrega os
 * concursos do termo e este arquivo aplica o resto (estado, facetas,
 * salário, ordenação, página) com as mesmas funções puras que o servidor usa
 * em `/concursos`. `buscaLocal.test.ts` compara as duas saídas.
 */
import type { ConcursoResumo } from "./dominio";
import {
  contarFacetas,
  filtrar,
  ordenar,
  paginar,
  type ContagensDeFaceta,
  type Pagina,
} from "./consulta";
import { filtroDaConsulta, type ConsultaDaUrl } from "./parametros";

export function aplicarConsulta(
  itensDoTermo: ConcursoResumo[],
  consulta: ConsultaDaUrl,
  hoje: Date,
): { resultado: Pagina; contagens: ContagensDeFaceta } {
  // Sem o termo: a lista já é a dele, e refazer a busca por texto seria
  // normalizar milhares de títulos a cada clique de filtro.
  const filtro = { ...filtroDaConsulta(consulta), q: undefined };
  return {
    resultado: paginar(ordenar(filtrar(itensDoTermo, filtro, hoje), consulta.ordem, hoje), consulta.pagina),
    contagens: contarFacetas(itensDoTermo, filtro, hoje),
  };
}
```

Rodar: passa.

- [ ] **Passo 6: os chips saem da página.** Mover `Chip` e `chipsAtivos` de `src/app/concursos/page.tsx` para `src/lib/filtrosAtivos.ts` sem mudar o corpo (exportados). Teste `src/lib/filtrosAtivos.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { chipsAtivos } from "./filtrosAtivos";
import { CONSULTA_VAZIA } from "./parametros";

describe("chipsAtivos", () => {
  const consulta = {
    ...CONSULTA_VAZIA,
    q: "tribunal",
    uf: "SP" as const,
    escolaridades: ["medio" as const],
  };

  it("tirar um filtro mantém o termo no caminho", () => {
    expect(chipsAtivos(consulta).find((chip) => chip.chave === "uf")?.href).toBe(
      "/busca/tribunal?escolaridade=medio",
    );
  });

  it("tirar o termo leva à listagem com os mesmos filtros", () => {
    expect(chipsAtivos(consulta).find((chip) => chip.chave === "q")?.href).toBe(
      "/concursos?uf=SP&escolaridade=medio",
    );
  });
});
```

Rodar: passa (o corpo já usa `urlDaBusca`, que a Task 4 mudou).

- [ ] **Passo 7: a lista vira componente compartilhado.** Criar `src/components/busca/ListaDeResultados.tsx`, **sem** `"use client"` (é usada pelo servidor em `/concursos` e pelo cliente em `/busca`, então não usa hook nem é `async`):

```tsx
export function ListaDeResultados({
  consulta,
  titulo,
  resultado,
  contagens,
  aviso,
  dimensoes,
  hoje,
}: {
  consulta: ConsultaDaUrl;
  titulo: string;
  resultado: Pagina;
  contagens: ContagensDeFaceta;
  aviso: AvisoDoAcervo | null;
  dimensoes: DimensoesDoAcervo;
  hoje: Date;
}) {
  const chips = chipsAtivos(consulta);
  const semDado = avisoDeFiltroSemDado(consulta, dimensoes);
  // ...
}
```

O corpo é o JSX de `src/app/concursos/page.tsx` a partir de `<RegistroDaBusca ...>` até o fim do `<div className="mt-6 flex ...">`, movido com os comentários, com estas trocas: o `h1` mostra `titulo`; "Limpar filtros" usa `href={urlSemFiltros(consulta)}`; o estado vazio, quando `consulta.q` existe e `chips.length === 0`, diz "Nenhum concurso encontrado para esta busca" e o apoio "Tente outra palavra, ou crie um alerta e avisamos quando sair um edital que casa com ela."; nos outros casos, o texto de hoje ("Nenhum concurso com esses filtros"). Os imports de tipo de `@/lib/concursos` são `import type`.

- [ ] **Passo 8: os componentes da busca.** `src/components/busca/ResultadosDaBusca.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ListaDeResultados } from "./ListaDeResultados";
import { aplicarConsulta } from "@/lib/buscaLocal";
import type { AvisoDoAcervo, DimensoesDoAcervo } from "@/lib/concursos";
import type { ConcursoResumo } from "@/lib/dominio";
import { termoDoSlug } from "@/lib/enderecoDaBusca";
import { lerConsulta, parametrosDaUrl, type Parametros } from "@/lib/parametros";

export interface DadosDaBusca {
  slug: string;
  titulo: string;
  itens: ConcursoResumo[];
  aviso: AvisoDoAcervo | null;
  dimensoes: DimensoesDoAcervo;
}

/**
 * A lista de `/busca/<slug>` para uma query já lida.
 *
 * Existe separada de `ResultadosDaBuscaNaUrl` porque é também o `fallback`
 * do `Suspense`: no HTML pré-renderizado vai a primeira página sem filtro,
 * que é exatamente o canônico, e é isso que o buscador lê. No navegador a
 * versão que lê a URL toma o lugar dela.
 *
 * `hoje` num `useState` com inicializador, e não `new Date()` solto no
 * render: a regra de pureza do React trata relógio no corpo do componente
 * como efeito colateral.
 */
export function ResultadosDaBusca({
  parametros,
  ...dados
}: DadosDaBusca & { parametros: Parametros }) {
  const [hoje] = useState(() => new Date());
  const consulta = lerConsulta({ ...parametros, q: termoDoSlug(dados.slug) });
  const { resultado, contagens } = aplicarConsulta(dados.itens, consulta, hoje);
  return (
    <ListaDeResultados
      consulta={consulta}
      titulo={dados.titulo}
      resultado={resultado}
      contagens={contagens}
      aviso={dados.aviso}
      dimensoes={dados.dimensoes}
      hoje={hoje}
    />
  );
}

/** A mesma lista, com a query da barra de endereço. Mora dentro de `Suspense`. */
export function ResultadosDaBuscaNaUrl(dados: DadosDaBusca) {
  const busca = useSearchParams();
  return <ResultadosDaBusca {...dados} parametros={parametrosDaUrl(busca)} />;
}
```

- [ ] **Passo 9: a rota.** `src/app/busca/[termo]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ResultadosDaBusca,
  ResultadosDaBuscaNaUrl,
  type DadosDaBusca,
} from "@/components/busca/ResultadosDaBusca";
import {
  avisoDoAcervo,
  cargosEscolhidos,
  concursosDoTermo,
  dimensoesDoAcervo,
  paraALista,
} from "@/lib/concursos";
import {
  decodificarSegmento,
  metadadosDaBusca,
  slugDaBusca,
  termoDoSlug,
  tituloDoTermo,
} from "@/lib/enderecoDaBusca";

/**
 * A busca por termo, pré-renderizada.
 *
 * Nada no build (`generateStaticParams` vazio): cada termo é renderizado na
 * primeira visita e servido do cache por cinco minutos. Para continuar
 * estática, a página **não lê `searchParams`**: ela entrega os concursos do
 * termo, e filtro, ordenação e página são do navegador
 * (`ResultadosDaBuscaNaUrl`). A forma canônica do slug já foi imposta pelo
 * `proxy.ts`; aqui o slug é recalculado só para o vazio virar 404.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ termo: string }[]> {
  return [];
}

async function slugDaRota(props: PageProps<"/busca/[termo]">): Promise<string> {
  const { termo } = await props.params;
  const slug = slugDaBusca(decodificarSegmento(termo));
  if (!slug) notFound();
  return slug;
}

export async function generateMetadata(
  props: PageProps<"/busca/[termo]">,
): Promise<Metadata> {
  const slug = await slugDaRota(props);
  const [itens, cargos] = await Promise.all([
    concursosDoTermo(termoDoSlug(slug)),
    cargosEscolhidos(),
  ]);
  return metadadosDaBusca(slug, itens.length, cargos);
}

export default async function BuscaPorTermo(props: PageProps<"/busca/[termo]">) {
  const slug = await slugDaRota(props);
  const [itens, cargos, aviso, dimensoes] = await Promise.all([
    concursosDoTermo(termoDoSlug(slug)),
    cargosEscolhidos(),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
  ]);
  // O mesmo objeto nas duas pontas do `Suspense`: o RSC do React 19 escreve
  // um objeto repetido uma vez só e referencia a segunda. Uma cópia aqui
  // mandaria a lista duas vezes.
  const dados: DadosDaBusca = {
    slug,
    titulo: tituloDoTermo(slug, cargos),
    itens: paraALista(itens),
    aviso,
    dimensoes,
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <Suspense fallback={<ResultadosDaBusca {...dados} parametros={{}} />}>
        <ResultadosDaBuscaNaUrl {...dados} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Passo 10: o proxy.** `src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { destinoCanonico } from "@/lib/enderecoDaBusca";

/**
 * A forma canônica da busca, antes de qualquer render.
 *
 * Aqui, e não na página, por dois motivos: `/busca/<slug>` é estática e não
 * pode ler a query (redirecionar dali perderia `?uf=SP`), e `/concursos?q=`
 * precisa sair antes de a listagem gastar um render inteiro. A regra está em
 * `destinoCanonico`, com teste; este arquivo só a aplica com 308.
 */
export function proxy(request: NextRequest) {
  const destino = destinoCanonico(request.nextUrl.pathname, request.nextUrl.searchParams);
  return destino
    ? NextResponse.redirect(new URL(destino, request.url), 308)
    : NextResponse.next();
}

export const config = {
  matcher: ["/concursos", "/busca/:termo"],
};
```

- [ ] **Passo 11: as rotas que deixam de ser dinâmicas por tabela, e as que continuam.**
  - `layout.tsx`: remover `import { connection }` e `await connection();` com o comentário dele. Acrescentar, acima de `RootLayout`:

```ts
/**
 * Cinco minutos para toda página sem dado por requisição: a home, as de
 * conta e a busca por termo. O layout lê o acervo (a faixa de origem e o
 * rodapé), e sem este valor a rota ficaria só com o `revalidate` dos
 * `fetch`, que a memória de processo de `concursos.ts` pode pular. Página que
 * lê `searchParams` continua dinâmica por conta própria.
 */
export const revalidate = 300;
```

    Atualizar o comentário do `SearchAction` (o `urlTemplate` continua `/concursos?q=`, e o `proxy.ts` leva a `/busca/<slug>`) e o comentário sobre `async` do layout, sem travessão.
  - `src/app/page.tsx`: `export const revalidate = 300;`.
  - `sitemap.ts`: remover `connection()` e o comentário dele; `export const revalidate = 3600;` com o comentário: "Uma hora. Se a leitura do acervo acontecer dentro da geração do mapa, o `revalidate: 300` do `fetch` puxa o valor efetivo para cinco minutos, que é inofensivo."
  - `src/app/concursos/[slug]/page.tsx`: remover `generateStaticParams` e o import de `listarSlugs`; chamar `await connection();` (de `next/server`) na primeira linha de `generateMetadata` e de `PaginaDoConcurso`, com o comentário: "Na requisição, sempre: o detalhe vem de `obterDetalhe` com `no-store`, e `no-store` dentro de rota que o Next julgou estática é o 500 `DYNAMIC_SERVER_USAGE` de produção. Com `generateStaticParams` o build tentaria pré-renderizar os 4.700 concursos para descobrir isso."
  - `src/app/concursos/page.tsx`: trocar o miolo por `ListaDeResultados` (o `h1` recebe `tituloDaBusca(consulta)`) e importar `chipsAtivos` de `@/lib/filtrosAtivos`. A `BarraBusca` desta página sai só na Task 6, quando o cabeçalho a recebe.

- [ ] **Passo 12: o build lê a API pública.**
  - `Dockerfile`, estágio `build`:

```dockerfile
# O Next grava NEXT_PUBLIC_* no bundle do navegador durante o build.
ARG NEXT_PUBLIC_BC_API_URL
ARG NEXT_PUBLIC_GTM_ID=""
# O acervo que o build pré-renderiza (home, sitemap). O CI não alcança a API
# interna, então o build lê a pública; em runtime o container define
# BC_API_URL=http://api:8788/v1, e este ENV não passa para o estágio abaixo.
ARG BC_API_URL
ENV NEXT_PUBLIC_BC_API_URL=$NEXT_PUBLIC_BC_API_URL NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID BC_API_URL=$BC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_BC_API_URL" && test -n "$BC_API_URL" && pnpm build
```

    O estágio `runtime` não muda (o healthcheck continua em `/robots.txt`, que não lê o acervo).
  - `.github/workflows/deploy.yml`: no job `test`, o passo `pnpm build` ganha `BC_API_URL: ${{ vars.BC_API_URL_BUILD }}` ao lado de `NEXT_PUBLIC_BC_API_URL`; no job `image`, `build-args` ganha a linha `BC_API_URL=${{ vars.BC_API_URL_BUILD }}`.
  - `README.md`: trocar o parágrafo "`BC_API_URL` definida torna as rotas dinâmicas" por: a home e `/busca/<termo>` são ISR de 5 minutos; o build precisa de `BC_API_URL` alcançável e falha se ela estiver definida e fora do ar; no CI ela vem de `BC_API_URL_BUILD`. Sem travessão.

- [ ] **Passo 13: verificar.** Em ordem:
  1. `pnpm verificar`. Esperado: verde.
  2. `curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://api.buscaconcurso.com.br/v1/acervo`. Esperado: `200` e cerca de 4.200.000 bytes.
  3. `BC_API_URL=https://api.buscaconcurso.com.br/v1 NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm build 2>&1 | tee /tmp/build.log`. Esperado na tabela de rotas: `/` com `○` e revalidação `5m`; `/busca/[termo]` com `●` e `5m` (nunca `ƒ`); `/sitemap.xml` com `1h`; `/concursos`, `/concursos/[slug]` e `/orgaos/[slug]` com `ƒ`; e a linha do proxy. `grep -c "usando o mock" /tmp/build.log` dá `0`. Um aviso "items over 2MB can not be cached" por processo de build é esperado (ver `memoria.ts`).
  4. `BC_API_URL=http://127.0.0.1:9/v1 NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm build`. Esperado: falha, com `ECONNREFUSED` na saída.
  5. Refazer o build do item 3, `BC_API_URL=https://api.buscaconcurso.com.br/v1 NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm start` e: `curl -sI "localhost:3000/concursos?q=Analista%20Judici%C3%A1rio&uf=SP"` dá `308` e `location: /busca/analista-judiciario?uf=SP`; `curl -s localhost:3000/busca/analista-judiciario | grep -o "<h1[^<]*<"` mostra "Concursos de Analista Judiciario"; um segundo `curl -sI localhost:3000/busca/analista-judiciario` mostra `x-nextjs-cache: HIT`; abrir `http://localhost:3000/busca/analista-judiciario?uf=SP` no navegador e ver a lista filtrada e o chip "São Paulo".

- [ ] **Passo 14: commit.**

```bash
git add src Dockerfile .github/workflows/deploy.yml README.md
git commit -m "$(cat <<'EOF'
feat: /busca/[termo] por ISR com filtros no navegador, layout sem connection e build com a API pública

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

---

## Task 6: barra de busca no cabeçalho e home sem a caixa central

Abordagem de desenho (frontend-design, aplicada à identidade que já existe): Literata nos títulos, Archivo no resto, só tokens de `globals.css`, nenhuma cor nova, nenhuma borda nem sombra em caixa (regra 2 do canvas), degrau entre `pagina` e `cartao` como separação. A hierarquia nova é: o que o site é (título e número), acesso rápido (estado, cargo, atalho), e depois as faixas de concursos que já existem.

**Files**
- Modify: `src/components/busca/BarraBusca.tsx`, `src/components/layout/Cabecalho.tsx`, `src/app/layout.tsx`, `src/lib/localizacaoManual.ts`, `src/lib/localizacaoManual.test.ts`, `src/app/concursos/page.tsx`, `src/components/home/Hero.tsx`, `src/app/page.tsx`, `src/components/home/BlocosSeo.tsx`

**Interfaces**
- Consumes: `termoDaPagina`, `destinoDoFormulario` (Task 4); `dimensoesDoAcervo`, `cargosEmDestaque`, `facetas` (`concursos.ts`).
- Produces: `paginaPedeLocalizacao(caminho: string): boolean`; `BarraBusca({ uf?: Uf; dimensoes?: { total: number; comUf: number } })`; `BarraBuscaDoCabecalho({ dimensoes })`; `Cabecalho({ dimensoes }: { dimensoes: DimensoesDoAcervo })`; `Hero({ totalAbertos, atualizadoEm, dimensoes, ufs, cargos })`; `BlocosSeo({ bancas, orgaos })`.

- [ ] **Passo 1: onde a barra pede a localização.** Em `localizacaoManual.test.ts`:

```ts
describe("paginaPedeLocalizacao", () => {
  it("pede só onde a barra pedia antes de morar no cabeçalho", () => {
    expect(paginaPedeLocalizacao("/")).toBe(true);
    expect(paginaPedeLocalizacao("/concursos")).toBe(true);
    expect(paginaPedeLocalizacao("/busca/tribunal")).toBe(true);
    expect(paginaPedeLocalizacao("/entrar")).toBe(false);
    expect(paginaPedeLocalizacao("/concursos/algum-edital")).toBe(false);
    expect(paginaPedeLocalizacao("/conta")).toBe(false);
  });
});
```

Rodar (falha), e em `localizacaoManual.ts`:

```ts
/**
 * As páginas onde a barra pede a localização ao carregar.
 *
 * A barra mudou-se para o cabeçalho e agora está em toda página, mas o
 * pedido automático não foi junto: prompt de permissão em `/entrar` ou no
 * meio de um edital é pedido sem contexto, e a recusa vale para a origem
 * inteira. Ficam as três onde ele já existia: a home e as duas listas.
 */
export function paginaPedeLocalizacao(caminho: string): boolean {
  return caminho === "/" || caminho === "/concursos" || caminho.startsWith("/busca/");
}
```

Rodar: passa.

- [ ] **Passo 2: a barra vira a do cabeçalho.** Em `BarraBusca.tsx` (a única instância passa a ser a do cabeçalho; `/estilo` só a cita em comentário):
  - Props: `{ uf?: Uf; dimensoes?: { total: number; comUf: number } }`. Saem `q` e `compacta`.
  - Imports novos: `Suspense` e `type FormEvent` de `react`; `usePathname`, `useRouter` e `useSearchParams` de `next/navigation`; `termoDaPagina` de `@/lib/enderecoDaBusca`; `destinoDoFormulario` de `@/lib/parametros`; `paginaPedeLocalizacao` de `@/lib/localizacaoManual`.
  - `const caminho = usePathname();`, `const router = useRouter();`, `const q = termoDaPagina(caminho);`.
  - ids por `useId()` (`${base}-q`, `${base}-uf`, `${base}-uf-motivo`) no lugar de `busca-q`/`busca-uf`.
  - O `<form>` mantém `action="/concursos" method="get"` (sem JavaScript, o `proxy.ts` leva a `/busca/<slug>`) e ganha:

```tsx
  /**
   * Com JavaScript a busca é navegação do cliente: a URL muda e a página
   * troca sem recarregar. Sem ele, o `action` nativo leva a `/concursos?q=`,
   * e o `proxy.ts` redireciona para o mesmo endereço.
   */
  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    router.push(destinoDoFormulario(String(dados.get("q") ?? ""), String(dados.get("uf") ?? "")));
  };
```

    `aoEscolher` da lista de sugestões continua chamando `requestSubmit()`, que agora passa por `aoEnviar`.
  - O `<input>` ganha `key={caminho}` e `defaultValue={q}`: ao navegar para outra busca o campo nasce com o termo novo.
  - No efeito do pedido automático, antes de `jaPediu.current = true`: `if (!paginaPedeLocalizacao(caminho)) return;`, com `caminho` nas dependências.
  - Forma: uma linha só em qualquer largura (`flex items-center`, sem o `flex-col sm:flex-row`); altura `h-9` nos três controles; `rounded-full`; `aurora` só quando `caminho === "/"` (fora da home a cápsula é `bg-rebaixada`, sem movimento competindo com o conteúdo); o ícone de lupa à esquerda do campo `hidden sm:block`; o seletor `w-[7.5rem] sm:w-[11rem]` com `pl-3 pr-7`; o botão mostra a lupa abaixo de `sm` e a palavra "Buscar" a partir de `sm`, com `aria-label="Buscar"`; placeholder "Cargo, órgão ou banca".
  - A linha de estado (`aria-live`) usa `empty:hidden` no lugar de `min-h-5`, para o cabeçalho não reservar 20px vazios.
  - No fim do arquivo:

```tsx
/**
 * A barra do cabeçalho com o estado da URL.
 *
 * "A UF da URL ganha da memória" continua valendo, e a UF da URL só existe
 * via `useSearchParams`. Numa página estática isso obriga um `Suspense`: o
 * HTML leva a barra sem a UF (o `fallback`) e o navegador desenha a que leu
 * a URL. As duas têm a mesma caixa, então a troca não desloca nada.
 */
export function BarraBuscaDoCabecalho({
  dimensoes,
}: {
  dimensoes?: { total: number; comUf: number };
}) {
  return (
    <Suspense fallback={<BarraBusca dimensoes={dimensoes} />}>
      <BarraBuscaComUfDaUrl dimensoes={dimensoes} />
    </Suspense>
  );
}

function BarraBuscaComUfDaUrl({
  dimensoes,
}: {
  dimensoes?: { total: number; comUf: number };
}) {
  const bruta = useSearchParams().get("uf") ?? "";
  const uf = (UFS as readonly string[]).includes(bruta) ? (bruta as Uf) : undefined;
  return <BarraBusca dimensoes={dimensoes} uf={uf} />;
}
```

- [ ] **Passo 3: o cabeçalho.** `Cabecalho.tsx` recebe `dimensoes` e vira uma grade de três colunas; no celular a barra desce para a segunda linha:

```tsx
export function Cabecalho({ dimensoes }: { dimensoes: DimensoesDoAcervo }) {
  return (
    <header className="bg-cartao">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 md:gap-x-8">
        <Link
          href="/"
          aria-label="BuscaConcurso, página inicial"
          className="col-start-1 row-start-1 flex items-center"
        >
          <Logo tamanho={26} />
        </Link>
        <div className="col-span-3 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
          <BarraBuscaDoCabecalho dimensoes={dimensoes} />
        </div>
        <div className="col-start-3 row-start-1 flex items-center justify-self-end">
          <MenuConta />
        </div>
      </div>
    </header>
  );
}
```

`minmax(0,1fr)` e `min-w-0` são o que impede a barra de esticar a página no celular. Atualizar o comentário do componente: a frase "a busca é o corpo da própria home" deixa de ser verdade; a barra mora aqui, inline a partir de `md` e numa linha própria abaixo disso. Em `layout.tsx`: `const [origem, dimensoes] = await Promise.all([origemDoAcervo(), dimensoesDoAcervo()]);` e `<Cabecalho dimensoes={dimensoes} />`.

- [ ] **Passo 4: `/concursos` sem a barra própria.** Remover `<BarraBusca ... />` e o import de `src/app/concursos/page.tsx`; o comentário que explicava por que `RegistroDaBusca` não mora na barra (hoje em `ListaDeResultados`) passa a dizer que a barra está no cabeçalho.

- [ ] **Passo 5: a home.** Em `page.tsx`, buscar tudo junto e passar para os blocos:

```tsx
  const [destaques, { ufs, bancas, orgaos }, aviso, dimensoes, cargos] = await Promise.all([
    obterDestaques(hoje),
    facetas(hoje),
    avisoDoAcervo(),
    dimensoesDoAcervo(),
    cargosEmDestaque(8),
  ]);
```

  Estrutura, de cima para baixo:
  1. `Hero` sem `BarraBusca`: à esquerda o `h1` de hoje, o parágrafo com o total aberto e "Acervo atualizado em ..."; à direita a `Ilustracao` só a partir de `lg`. Abaixo, um cartão "Acesso rápido" (`rounded-caixa bg-cartao p-4 sm:p-5`) com três fileiras, cada uma um `<nav aria-label>` com `Rotulo` à esquerda (acima no celular) e chips em `flex flex-wrap gap-2`:
     - "Por estado": os `ufs` de `facetas` (até 12), chip com o nome e o total (`numero text-tinta-600`), para `/concursos?uf=XX`.
     - "Por cargo": os `cargos` (8), chip com rótulo e alcance, para `/busca/<slug>` (`href` já vem de `urlDoCargo`).
     - "Atalhos": Nível superior, Nível médio, Nível médio técnico, Nível fundamental (`/concursos?escolaridade=...`), Tribunais (`/busca/tribunal`), Polícia (`/busca/policia`) e, só com `dimensoes.comEsfera > 0`, Federais e Prefeituras.
     Chip: `inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-controle bg-rebaixada px-3 text-[12px] font-medium text-tinta-800 transition-colors hover:bg-tinta-200`, rótulo com `min-w-0 break-words`.
  2. "Encerra esta semana", "Inscrições abertas agora", "Últimas atualizações", "Previstos", aviso do acervo e `BlocoAlerta`, como hoje.
  3. `BlocosSeo` com duas colunas (Por órgão, Por banca; `md:grid-cols-2`), porque o estado subiu para o acesso rápido; os dois cartões explicativos ficam, e o de "Como usar a busca" diz que a barra está no topo de toda página.

  Critérios de aceite: um só `h1`; nenhuma `BarraBusca` em `page.tsx` nem em `Hero.tsx`; toda navegação por `<Link>`; nenhuma classe de cor fora dos tokens; a 375×800 o `h2` da primeira faixa de concursos começa antes de `y = 1600` (duas telas); a página continua sem ler `searchParams` (o build mostra `/` como `○`).

- [ ] **Passo 6: verificar.** `pnpm verificar` (verde). `pnpm dev` e, a 375px e a 1280px: a barra aparece em `/`, `/concursos`, `/entrar` e num detalhe; buscar "analista judiciário" pelo cabeçalho troca a URL para `/busca/analista-judiciario` sem piscar a página inteira (a aba não mostra carregamento); em `/busca/analista-judiciario?uf=SP` o seletor mostra São Paulo; em `/entrar`, com a memória limpa (`localStorage.clear()`), o navegador não pede localização.

- [ ] **Passo 7: commit.**

```bash
git add src
git commit -m "$(cat <<'EOF'
feat: busca no cabeçalho em toda página e home com acesso rápido no lugar da caixa central

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

---

## Task 7: rolagem lateral no celular e a verificação no Chrome headless

**Files**
- Create: `scripts/verificar-navegador.mjs`
- Modify: `package.json` (script `verificar:navegador`), `src/components/concurso/LinhaConcurso.tsx`, `src/app/page.tsx`, e cada componente que o script acusar

**Interfaces**
- Consumes: servidor de produção local (`pnpm build && pnpm start`), Chrome em `/usr/bin/google-chrome` (152), Node com `WebSocket` global (22 ou mais; a máquina tem 24.20).
- Produces: `node scripts/verificar-navegador.mjs [base]`, que sai com código 1 se qualquer conferência falhar.

- [ ] **Passo 1: o script.** `scripts/verificar-navegador.mjs`:

```js
#!/usr/bin/env node
/**
 * Verificação no navegador de verdade: Chrome headless por CDP.
 *
 * Confere o que teste de unidade não alcança: a gaveta que fecha e devolve a
 * página depois de navegar, a busca do cabeçalho que muda a URL sem
 * recarregar, nenhuma rolagem lateral a 360, 375 e 390px nas sete páginas
 * principais, e os redirects e o cache da busca pelo HTTP.
 *
 * Sem dependência: o `WebSocket` é o global do Node, e o Chrome sobe com
 * perfil próprio numa pasta temporária, apagada no fim.
 *
 * Uso, contra o build de produção:
 *   BC_API_URL=https://api.buscaconcurso.com.br/v1 \
 *   NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm build
 *   (mesmas variáveis) pnpm start
 *   node scripts/verificar-navegador.mjs http://localhost:3000
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
const PORTA = 9333;
const LARGURAS = [360, 375, 390];

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const falhas = [];
function conferir(ok, descricao, detalhe = "") {
  console.log(`${ok ? "ok   " : "FALHA"} ${descricao}${detalhe ? `: ${detalhe}` : ""}`);
  if (!ok) falhas.push(descricao);
}

async function abrirChrome() {
  const perfil = mkdtempSync(join(tmpdir(), "bc-chrome-"));
  const processo = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORTA}`,
      `--user-data-dir=${perfil}`,
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  for (let tentativa = 0; tentativa < 100; tentativa += 1) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORTA}/json/version`)).ok) break;
    } catch {
      // O Chrome ainda está subindo.
    }
    await esperar(100);
  }
  // `/json/new` só aceita PUT desde o Chrome 111.
  const alvo = await (
    await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: "PUT" })
  ).json();
  return { processo, perfil, endereco: alvo.webSocketDebuggerUrl };
}

function conectar(endereco) {
  const socket = new WebSocket(endereco);
  let proximo = 0;
  const pendentes = new Map();
  const ouvintes = new Map();
  socket.addEventListener("message", (evento) => {
    const mensagem = JSON.parse(evento.data);
    if (mensagem.id !== undefined) {
      const pendente = pendentes.get(mensagem.id);
      pendentes.delete(mensagem.id);
      if (mensagem.error) pendente.rejeitar(new Error(mensagem.error.message));
      else pendente.resolver(mensagem.result);
      return;
    }
    for (const ouvinte of ouvintes.get(mensagem.method) ?? []) ouvinte(mensagem.params);
  });
  return {
    pronto: new Promise((resolver, rejeitar) => {
      socket.addEventListener("open", resolver);
      socket.addEventListener("error", rejeitar);
    }),
    enviar(method, params = {}) {
      const id = ++proximo;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolver, rejeitar) => pendentes.set(id, { resolver, rejeitar }));
    },
    uma(method, limite = 30000) {
      return new Promise((resolver, rejeitar) => {
        if (!ouvintes.has(method)) ouvintes.set(method, new Set());
        const lista = ouvintes.get(method);
        const relogio = setTimeout(() => {
          lista.delete(ouvinte);
          rejeitar(new Error(`${method} não chegou em ${limite}ms`));
        }, limite);
        const ouvinte = (params) => {
          clearTimeout(relogio);
          lista.delete(ouvinte);
          resolver(params);
        };
        lista.add(ouvinte);
      });
    },
    fechar() {
      socket.close();
    },
  };
}

async function avaliar(cdp, expressao) {
  const { result, exceptionDetails } = await cdp.enviar("Runtime.evaluate", {
    expression: expressao,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return result.value;
}

async function ate(cdp, expressao, limite = 5000) {
  const fim = Date.now() + limite;
  while (Date.now() < fim) {
    if (await avaliar(cdp, expressao)) return true;
    await esperar(100);
  }
  return false;
}

async function largura(cdp, px) {
  await cdp.enviar("Emulation.setDeviceMetricsOverride", {
    width: px,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });
}

async function navegar(cdp, caminho) {
  const carga = cdp.uma("Page.loadEventFired");
  await cdp.enviar("Page.navigate", { url: BASE + caminho });
  await carga;
  await avaliar(cdp, "document.fonts.ready.then(() => true)");
  await esperar(400);
}

/** Clique de verdade, com `pointerdown`, no centro do elemento. */
async function clicar(cdp, seletor) {
  const ponto = await avaliar(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(seletor)});
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
  );
  if (!ponto) throw new Error(`nada casa com ${seletor}`);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await cdp.enviar("Input.dispatchMouseEvent", {
      type,
      x: ponto.x,
      y: ponto.y,
      button: "left",
      clickCount: 1,
    });
  }
}

/** Roda na página. Os cinco primeiros elementos que passam da borda direita. */
function medirTransbordo() {
  const raiz = document.documentElement;
  const limite = raiz.clientWidth;
  const culpados = [...document.querySelectorAll("body *")]
    .filter((el) => el.getBoundingClientRect().right > limite + 0.5)
    .slice(0, 5)
    .map((el) => {
      const classes = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 4).join(".") : "";
      return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ""} até ${Math.round(el.getBoundingClientRect().right)}px`;
    });
  return { scroll: raiz.scrollWidth, cliente: limite, culpados };
}

async function verificarTransbordo(cdp, paginas) {
  for (const px of LARGURAS) {
    await largura(cdp, px);
    for (const caminho of paginas) {
      await navegar(cdp, caminho);
      const medida = await avaliar(cdp, `(${medirTransbordo})()`);
      conferir(
        medida.scroll <= medida.cliente,
        `sem rolagem lateral em ${caminho} a ${px}px`,
        medida.scroll > medida.cliente
          ? `${medida.scroll} > ${medida.cliente}; ${medida.culpados.join(" | ")}`
          : "",
      );
    }
  }
}

async function verificarGaveta(cdp) {
  await largura(cdp, 375);
  await navegar(cdp, "/");
  await avaliar(cdp, "window.__semRecarga = true");
  const gaveta = 'header details[data-revelador="gaveta"]';
  await clicar(cdp, `${gaveta} > summary`);
  conferir(
    await ate(cdp, `!!document.querySelector('${gaveta}[open]') && document.querySelectorAll("[inert]").length > 0`),
    "o menu abre como gaveta modal",
  );
  await esperar(400);
  await clicar(cdp, `${gaveta} a[href="/entrar"]`);
  conferir(await ate(cdp, `location.pathname === "/entrar"`), "o link de dentro da gaveta navega");
  conferir(
    await ate(
      cdp,
      `!document.querySelector("details[data-revelador][open]") &&
       document.querySelectorAll("[inert]").length === 0 &&
       getComputedStyle(document.documentElement).overflow !== "hidden"`,
      2000,
    ),
    "a gaveta fecha e a página volta a ser interativa",
  );
  conferir(await avaliar(cdp, "window.__semRecarga === true"), "a navegação da gaveta não recarregou a página");
}

async function verificarBuscaDoCabecalho(cdp) {
  await largura(cdp, 375);
  await navegar(cdp, "/");
  await avaliar(cdp, "window.__semRecarga = true");
  await clicar(cdp, 'header input[name="q"]');
  await cdp.enviar("Input.insertText", { text: "Analista Judiciário" });
  for (const type of ["keyDown", "keyUp"]) {
    await cdp.enviar("Input.dispatchKeyEvent", {
      type,
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      ...(type === "keyDown" ? { text: "\r" } : {}),
    });
  }
  conferir(
    await ate(cdp, `location.pathname === "/busca/analista-judiciario"`, 8000),
    "a busca do cabeçalho leva a /busca/analista-judiciario",
    await avaliar(cdp, "location.href"),
  );
  conferir(await avaliar(cdp, "window.__semRecarga === true"), "a busca do cabeçalho não recarregou a página");
  conferir(
    await ate(cdp, `(document.querySelector("h1")?.textContent ?? "").includes("Analista")`),
    "o título da busca aparece",
  );
}

async function verificarCadastro(cdp) {
  await navegar(cdp, "/cadastrar");
  const texto = await avaliar(cdp, "document.body.innerText");
  conferir(
    texto.includes("Criar conta com Google") && texto.includes("Criar conta com LinkedIn"),
    "o cadastro oferece Google e LinkedIn",
  );
}

async function verificarRespostas(concurso) {
  const semSeguir = (caminho) => fetch(BASE + caminho, { redirect: "manual" });
  const destino = (resposta) => {
    const local = resposta.headers.get("location");
    if (!local) return null;
    const url = new URL(local, BASE);
    return url.pathname + url.search;
  };

  let resposta = await semSeguir("/concursos?q=Analista%20Judici%C3%A1rio&uf=SP");
  conferir(
    resposta.status === 308 && destino(resposta) === "/busca/analista-judiciario?uf=SP",
    "/concursos?q= redireciona permanente para /busca",
    `${resposta.status} ${destino(resposta)}`,
  );
  resposta = await semSeguir("/busca/Analista%20Judici%C3%A1rio");
  conferir(
    resposta.status === 308 && destino(resposta) === "/busca/analista-judiciario",
    "slug fora da forma canônica redireciona",
    `${resposta.status} ${destino(resposta)}`,
  );
  resposta = await semSeguir("/busca/---");
  conferir(resposta.status === 404, "slug vazio é 404", String(resposta.status));

  resposta = await fetch(`${BASE}/busca/zzqxw-nada-casa`);
  const html = await resposta.text();
  conferir(
    resposta.status === 200 && html.includes("Nenhum concurso") && /noindex/.test(html),
    "busca sem resultado responde 200, diz que não há e fica fora do índice",
    String(resposta.status),
  );

  await fetch(`${BASE}/busca/analista-judiciario`);
  resposta = await fetch(`${BASE}/busca/analista-judiciario`);
  conferir(
    ["HIT", "STALE"].includes(resposta.headers.get("x-nextjs-cache")),
    "/busca/<termo> sai do cache (ISR)",
    String(resposta.headers.get("x-nextjs-cache")),
  );

  resposta = await fetch(BASE + concurso);
  conferir(resposta.status === 200, "o detalhe do concurso responde 200", `${concurso} ${resposta.status}`);

  const mapa = await (await fetch(`${BASE}/sitemap.xml`)).text();
  conferir(mapa.includes("/busca/"), "o sitemap lista buscas por cargo");
}

async function principal() {
  const { processo, perfil, endereco } = await abrirChrome();
  const cdp = conectar(endereco);
  let concurso = null;
  try {
    await cdp.pronto;
    await cdp.enviar("Page.enable");
    await cdp.enviar("Runtime.enable");
    // Sem localização: o pedido automático da barra não pode mexer no seletor.
    await cdp.enviar("Browser.setPermission", {
      permission: { name: "geolocation" },
      setting: "denied",
      origin: BASE,
    });

    await largura(cdp, 375);
    await navegar(cdp, "/");
    const alvos = await avaliar(
      cdp,
      `(() => {
        const href = (seletor) => document.querySelector(seletor)?.getAttribute("href") ?? null;
        return {
          concurso: href('a[href^="/concursos/"]'),
          orgao: href('a[href^="/orgaos/"]'),
          termo: href('a[href^="/busca/"]'),
        };
      })()`,
    );
    conferir(
      Boolean(alvos.concurso && alvos.orgao && alvos.termo),
      "a home tem links de concurso, órgão e busca",
      JSON.stringify(alvos),
    );
    concurso = alvos.concurso;

    const paginas = ["/", alvos.termo, "/concursos", alvos.concurso, alvos.orgao, "/entrar", "/cadastrar"]
      .filter(Boolean)
      .map((href) => href.split("#")[0]);
    await verificarTransbordo(cdp, paginas);
    await verificarGaveta(cdp);
    await verificarBuscaDoCabecalho(cdp);
    await verificarCadastro(cdp);

    await navegar(cdp, "/concursos?q=Analista%20Judici%C3%A1rio");
    conferir(
      await avaliar(cdp, `location.pathname === "/busca/analista-judiciario"`),
      "o navegador que abre /concursos?q= termina em /busca",
    );
  } finally {
    cdp.fechar();
    processo.kill();
    await esperar(300);
    rmSync(perfil, { recursive: true, force: true });
  }

  if (concurso) await verificarRespostas(concurso);

  if (falhas.length > 0) {
    console.error(`\n${falhas.length} conferência(s) falharam.`);
    process.exit(1);
  }
  console.log("\nTudo conferido.");
}

await principal();
```

Em `package.json`, `"verificar:navegador": "node scripts/verificar-navegador.mjs"`. Rodar `pnpm lint`: se o ESLint acusar `WebSocket` como global indefinido no `.mjs`, acrescentar `/* global WebSocket */` na segunda linha do script.

- [ ] **Passo 2: rodar contra o build e ver o que falha.** Em dois terminais:

```bash
BC_API_URL=https://api.buscaconcurso.com.br/v1 NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm build
BC_API_URL=https://api.buscaconcurso.com.br/v1 NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm start
```

```bash
node scripts/verificar-navegador.mjs http://localhost:3000
```

Esperado antes das correções deste passo: `FALHA sem rolagem lateral em / a 360px` (e a 375 e 390), com culpado `article.rounded-caixa.bg-previsto...` e `div.min-w-[16rem].flex-1` indo a cerca de 1.000px. Medido em produção em 2026-09-24 antes deste plano: `scrollWidth` 1044 contra 360, vindo de um `LinhaConcurso` da faixa "Previstos" com título de ato sem espaço para quebrar. As outras conferências passam.

- [ ] **Passo 3: corrigir a causa, e não esconder o sintoma.** Proibido `overflow-x: hidden` ou `clip` em `html`, `body`, `main` ou num contêiner de página para passar no teste: isso corta o conteúdo e esconde a próxima regressão. As correções seguem os padrões que o código já documenta (`CartaoConcurso`, `BlocosSeo`, `Etiqueta`, o `h1` da busca):
  - `LinhaConcurso.tsx`: o `h3` do título ganha `wrap-anywhere`, e o `div` do meio troca `min-w-[16rem]` por `min-w-0 basis-[16rem]`. Comentário com a medida: o título de ato sem espaço (do tipo "11/2026/SEGAP/COALEP/...") esticava a linha a 1.044px a 360px de tela; `overflow-wrap: anywhere` é o que reduz a largura mínima intrínseca do bloco (`break-word` não reduz), e `min-w-0` deixa o item de flex encolher abaixo dela.
  - `src/app/page.tsx`: os `<li>` das faixas "Encerra esta semana", "Últimas atualizações" e "Previstos" ganham `className="min-w-0"`, como o de "Inscrições abertas agora" já tem, pelo mesmo motivo do comentário que está lá.
  - Para cada outro culpado que o script listar: item de flex ou grid ganha `min-w-0`; texto de dado (título, nome de órgão, termo da URL) ganha `wrap-anywhere` ou `break-words`; etiqueta `whitespace-nowrap` ganha `max-w-full` e `truncate` com o texto inteiro em `title` ou `aria-label`. Cada correção leva comentário com a página, a largura e os números medidos.
  - Refazer `pnpm build`, reiniciar `pnpm start` e rodar o script até ele terminar em "Tudo conferido." e código de saída 0.

- [ ] **Passo 4: medir o peso da busca mais larga.** Com o servidor no ar:

```bash
curl -s -o /dev/null -w "cru %{size_download}\n" http://localhost:3000/busca/professor
curl -s --compressed -o /dev/null -w "comprimido %{size_download}\n" http://localhost:3000/busca/professor
```

Esperado: comprimido abaixo de 600.000 bytes. Se passar disso, o sintoma provável é a lista indo duas vezes no RSC (as duas pontas do `Suspense` com objetos diferentes): conferir que `page.tsx` passa o mesmo `dados` às duas. Registrar os dois números no comentário de `paraALista`.

- [ ] **Passo 5: verificação final.** `pnpm verificar` (verde) e `node scripts/verificar-navegador.mjs http://localhost:3000` (código 0).

- [ ] **Passo 6: commit.**

```bash
git add scripts/verificar-navegador.mjs package.json src
git commit -m "$(cat <<'EOF'
fix: sem rolagem lateral no celular, com verificação no Chrome headless

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Bm5qnxeZ5JhrwQbVoLX3ps
EOF
)"
```

---

## Conferência do plano contra o spec

| Spec | Onde |
|---|---|
| `/busca/<slug>`, slug e volta, filtros na query | Task 4 (`enderecoDaBusca`, `urlDaBusca`), Task 5 (rota) |
| Slug vazio 404, não canônico 308, `/concursos?q=` 308 com o resto | Task 4 (`destinoCanonico`), Task 5 (`proxy.ts`, `notFound`), Task 7 (HTTP) |
| `/concursos` sem `q` continua dinâmica | Task 5 (lê `searchParams`, build mostra `ƒ`) |
| Canônico sem query, sem resultado 200 + noindex, título | Task 4 (`metadadosDaBusca`, `tituloDoTermo`), Task 5 (`ListaDeResultados`), Task 7 |
| ISR: `[]`, `dynamicParams`, `revalidate = 300`, sem `searchParams` no servidor | Task 5 (página, `ResultadosDaBuscaNaUrl` em `Suspense`) |
| Layout sem `connection()`, acervo com `revalidate: 300` | Task 5 (`layout.tsx`, `concursos.ts`, `memoria.ts`) |
| `BC_API_URL` de build pela Variable `BC_API_URL_BUILD`, runtime interno | Task 5 (Dockerfile, workflow nos dois jobs) |
| Busca do cabeçalho com `router.push`, resultados com `<Link>` | Task 6 (`aoEnviar`), Task 5 (`ListaDeResultados`), Task 7 |
| Sitemap `revalidate = 3600`, todos os cargos, daily, 0,7 | Task 4 (entradas e teste), Task 5 (`revalidate`) |
| Barra no cabeçalho, inline no desktop, linha própria no celular | Task 6 (`Cabecalho`, `BarraBusca`) |
| Home sem caixa central, hierarquia, acesso por estado e cargo | Task 6 (`Hero`, `page.tsx`, `BlocosSeo`) |
| Contraste AA nos dois temas, teste Vitest | Task 3 |
| Sem rolagem lateral a 360/375/390 nas sete páginas | Task 7 |
| Gaveta fecha em mudança de caminho, não de query nem hash | Task 2, conferida na Task 7 |
| Criar conta com Google/LinkedIn | Task 2, conferida na Task 7 |
| Sem travessão em texto visível, teste que varre `src/` | Task 1 |
| Fora do escopo: buscas reais no sitemap, filtros no caminho, novo design system | nenhuma tarefa os toca |
