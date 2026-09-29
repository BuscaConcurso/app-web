# Páginas institucionais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar os três `/em-breve/...` de "Como lemos os editais", "Acessibilidade" e "Contato" por páginas de texto de verdade, com os links, o mapa do site e os endereços antigos acertados.

**Architecture:** Três rotas estáticas de servidor (`/como-lemos-os-editais` com ISR de 5 minutos, porque lê números do acervo) sobre um componente de texto longo compartilhado (`PaginaDeTexto`). Um módulo sem alias (`src/lib/institucionais.ts`) guarda título e endereço de cada página e a lista de redirecionamentos, lida pelo `next.config.ts`. Os números saem de uma função nova em `concursos.ts`, sobre o mesmo acervo da busca.

**Tech Stack:** Next.js 16.3 (App Router, `redirects` no `next.config.ts`), React 19, Tailwind 4, vitest.

**Spec:** `docs/superpowers/specs/2026-09-28-paginas-institucionais-design.md`

## Global Constraints

- Tudo em português do Brasil; nunca o travessão (`semTravessao.test.ts` reprova).
- Linguagem simples, frases curtas, sem jargão ("pipeline", "LLM", "extração").
- O texto de método não promete o que o motor não faz; fonte: specs e código do engine.
- Números (concursos, órgãos, bancas) vêm do acervo em build/ISR, nunca escritos à mão.
- E-mail `contato@buscaconcurso.com.br` numa constante de `src/lib/site.ts`.
- Mexer só nas linhas dos três recursos em `emBreve.ts`, `Rodape.tsx`, `BarraUtilitaria.tsx` (outros agentes mexem nos demais).
- `pnpm verificar` passa; commits pequenos com as linhas de coautoria.

## Review Focus

1. Link antigo guardado (`/em-breve/contato`): deve dar 308 para `/contato`, não 404. Teste: `REDIRECIONAMENTOS_DO_EM_BREVE` (Task 2) e conferência por HTTP (Task 5).
2. Algum lugar ainda escrevendo `/em-breve/como-lemos` por extenso: teste de varredura de `src/` (Task 2); `hrefEmBreve("como-lemos")` já não compila.
3. Acervo sem banca informada em parte dos concursos: não contar "banca vazia". Teste em `concursos.test.ts` (Task 1).
4. Fonte em 137,5% e alto contraste nas páginas novas: a coluna em `ch` e tudo em `rem` (Task 3); conferência no navegador (Task 5).
5. API fora do ar no build: `/como-lemos-os-editais` lê o acervo e segue a regra de `carregar` (lança; ISR mantém a página velha). Sem teste novo: é a regra já testada do acervo.

---

### Task 1: Números do acervo

**Files:**
- Modify: `src/lib/concursos.ts` (nova `numerosDoAcervo`, logo acima de `acervo()`)
- Test: `src/lib/concursos.test.ts`

**Interfaces:**
- Produces: `numerosDoAcervo(): Promise<NumerosDoAcervo>`, `interface NumerosDoAcervo { concursos: number; orgaos: number; bancas: number }`

- [x] **Step 1: teste que falha**

```ts
describe("numerosDoAcervo", () => {
  it("conta concursos, órgãos e bancas distintos do acervo, sem banca vazia", async () => {
    const numeros = await numerosDoAcervo();
    expect(numeros.concursos).toBe(CONCURSOS.length);
    expect(numeros.orgaos).toBe(new Set(CONCURSOS.map((c) => c.orgao.slug)).size);
    expect(numeros.bancas).toBe(
      new Set(CONCURSOS.flatMap((c) => (c.banca ? [c.banca.slug] : []))).size,
    );
    expect(CONCURSOS.some((c) => !c.banca)).toBe(true);
    expect(numeros.bancas).toBeGreaterThan(1);
  });
});
```

- [x] **Step 2:** `pnpm vitest run src/lib/concursos.test.ts`: FAIL (`numerosDoAcervo` não existe).
- [x] **Step 3: implementação**

```ts
export async function numerosDoAcervo(): Promise<NumerosDoAcervo> {
  const todos = await acervo();
  return {
    concursos: todos.length,
    orgaos: new Set(todos.map((concurso) => concurso.orgao.slug)).size,
    bancas: new Set(todos.flatMap((concurso) => (concurso.banca ? [concurso.banca.slug] : []))).size,
  };
}
```

- [x] **Step 4:** o mesmo comando: PASS.
- [x] **Step 5:** commit `feat: números do acervo para a página de método`.

### Task 2: Contato, acessibilidade e o layout de texto

**Files:**
- Create: `src/components/ui/PaginaDeTexto.tsx` (trilha Início > título, `h1`, abertura, corpo em `max-w-[68ch]`, estilo de `h2`/`p`/`ul`/`a` por seletor de filho, tudo em `rem`)
- Create: `src/app/contato/page.tsx`, `src/app/acessibilidade/page.tsx`
- Modify: `src/lib/site.ts` (`export const EMAIL_CONTATO = "contato@buscaconcurso.com.br"`)

**Interfaces:**
- Produces: `PaginaDeTexto({ titulo, href, abertura, children })`, `EMAIL_CONTATO`.
- Consumes: `PAGINAS_INSTITUCIONAIS` (Task 3; criado junto, ver Desvios).

Conteúdo, conferido no código antes de escrever:
- Contato: e-mail em `mailto:`; para que escrever (erro num concurso, com o link; acessibilidade, com página, navegador e tecnologia assistiva; conta, do e-mail cadastrado); o botão "Esta página está certa?" / "Não, tem erro" de `Avaliacao.tsx`; o que não respondemos (dúvida de edital: banca ou órgão).
- Acessibilidade: alto contraste e fonte (`ControlesDeAcessibilidade.tsx`, degraus de `acessibilidade.ts`: 87,5% a 137,5%), guardados em `localStorage` do navegador; contraste medido (`contraste.test.ts`: 4,5:1 e 7:1); foco visível (`globals.css`); `lang="pt-BR"`, ícones decorativos `aria-hidden`, botões de ícone com `aria-label`; regiões vivas (`AvisoFlutuante`, recibo de `Avaliacao`, `role="alert"` de `AuthUi`); zoom 200% (conferido no navegador, Task 5); `prefers-reduced-motion`. O que falta: atalho "pular para o conteúdo" (a classe `sr-only-foco` existe, nada a usa), tema escuro, controles que dependem de JavaScript, PDFs das bancas. Como avisar: e-mail, página, navegador, tecnologia assistiva.

- [x] Escrever os três arquivos e a constante.
- [x] `pnpm typecheck`.
- [x] Commit `feat: páginas de contato e de acessibilidade`.

### Task 3: Como lemos os editais, links, redirecionamentos e mapa do site

**Files:**
- Create: `src/lib/institucionais.ts`, `src/lib/institucionais.test.ts`
- Create: `src/app/como-lemos-os-editais/page.tsx` (`export const revalidate = 300`)
- Modify: `src/lib/emBreve.ts` (sai `como-lemos`, `acessibilidade`, `contato`)
- Modify: `src/components/layout/Rodape.tsx` (três linhas de `COLUNA_SOBRE` e o import), `src/components/layout/BarraUtilitaria.tsx` (o link e o import)
- Modify: `next.config.ts` (`redirects()`), `src/app/sitemap.ts`, `src/app/sitemap.test.ts`

**Interfaces:**
- Produces:

```ts
export const PAGINAS_INSTITUCIONAIS = {
  "como-lemos": { titulo: "Como lemos os editais", href: "/como-lemos-os-editais" },
  acessibilidade: { titulo: "Acessibilidade", href: "/acessibilidade" },
  contato: { titulo: "Contato", href: "/contato" },
} as const;
export const REDIRECIONAMENTOS_DO_EM_BREVE: { source: string; destination: string; permanent: boolean }[];
```

- Consumes: `numerosDoAcervo` (Task 1), `PaginaDeTexto` e `EMAIL_CONTATO` (Task 2).

- [x] **Step 1: testes que falham** (`institucionais.test.ts`): cada `href` tem `src/app/<href>/page.tsx`; a lista de redirecionamentos é exatamente os três pares com `permanent: true`; `recursoEmBreve(chave)` é `null` para as três chaves; nenhum arquivo de `src/` (fora `institucionais.ts` e testes) contém `/em-breve/como-lemos`, `/em-breve/acessibilidade` ou `/em-breve/contato`. E em `sitemap.test.ts`: o mapa contém `urlAbsoluta(href)` das três.
- [x] **Step 2:** `pnpm vitest run src/lib/institucionais.test.ts src/app/sitemap.test.ts`: FAIL.
- [x] **Step 3:** criar o módulo, tirar os três de `RECURSOS_EM_BREVE`, trocar os links, `redirects()` no `next.config.ts` importando `./src/lib/institucionais` (sem `@/`), três entradas mensais no sitemap, e a página de método.
- [x] **Step 4:** os mesmos testes: PASS; `pnpm verificar`.
- [x] **Step 5:** commits `feat: página "Como lemos os editais"` e `feat: links e redirecionamentos das páginas institucionais`.

Texto da página de método, seções do spec, cada frase conferida nos specs e no código do engine (ver as notas no comentário do topo de `src/app/como-lemos-os-editais/page.tsx`):
1. Onde procuramos. 2. O que lemos. 3. Como viramos página (leitura automática e as regras que reprovam leitura errada). 4. O que conferimos (órgão, estado, ligação com o ato do Diário; o selo "Conferido por nós"). 5. O que pode estar errado e como avisar. Os números entram na abertura por `numerosDoAcervo()`.

### Task 4: Verificação

- [x] `pnpm verificar`.
- [x] Subir o app na porta 3104 e conferir: as três páginas, os links do rodapé e da barra utilitária, `curl -I` dos três `/em-breve/...` antigos (308), alto contraste e A+ nas três páginas, e zoom 200% (viewport de 640px) sem rolagem lateral.
- [x] Parar o servidor.

## Desvios

1. **"Salário abaixo do piso" não existe no motor.** A regra de `validacao.py` é salário fora de R$ 100 a R$ 100 mil (pega "R$ 3.000" lido como 3). A página diz isso, e lista as outras regras reais: data fora de 2000 a hoje + 5 anos ou inexistente, fim antes do início, cargo sem nome, cargo sem vaga nem cadastro de reserva (só edital de banca).
2. **O selo "Conferido por nós" não quer dizer órgão, estado e ligação.** No código (`AtosPublicados.tsx`) ele está no cartão do ato do Diário e quer dizer "o texto do ato como saiu, guardado e mostrado inteiro". A página conta o que conferimos (órgão, estado, ligação) numa lista e explica o selo pelo que ele é, dizendo que não é conferência humana de cada dado.
3. **Bancas: sem nome nem número fixo.** O motor visita poucas bancas (o catálogo muda); a página diz "algumas bancas" e o número que aparece é o de bancas citadas no acervo (`numerosDoAcervo`), junto com concursos e órgãos.
4. **"Todo dia útil" vale para o Diário; bancas são "uma vez por dia".** E a página diz o que não é lido: diários estaduais e municipais, edição extra do Diário.
5. **Ordem dos commits.** Contato e acessibilidade foram commitados antes de `src/lib/institucionais.ts`, que eles importam; os dois commits do meio não compilam sozinhos. O último compila e passa em `pnpm verificar`.
6. **Redirecionamento no `next.config.ts`** (308, antes de renderizar), com a lista em `src/lib/institucionais.ts` sem alias `@/`, e não dentro de `/em-breve/[recurso]`.
7. **Zoom 200%** conferido como viewport de 640px (1280 a 200%) nas três páginas, mais 360 e 390px, sem rolagem lateral; as outras páginas já são conferidas a 360px por `scripts/verificar-navegador.mjs`.

Pendência encontrada fora do escopo: `src/components/home/Mosaico.tsx:89` diz "Conferido no edital original" sem condição, e o acervo publicado é de atos do Diário (muitas vezes extrato), não do edital.
