# Concursos por área: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar.

**Objetivo:** trocar o "em breve" de áreas por `/areas` e `/areas/[slug]`, com cada área definida por uma regra explícita (órgão, cargo, título, exceção) conferida contra o acervo real.

**Arquitetura:** a regra de cada área mora em `src/lib/areas.ts`, como função pura sobre `ConcursoResumo` (casar por palavra inteira sobre o texto normalizado). `src/lib/concursos.ts` ganha duas portas que leem o acervo já em memória: os concursos de uma área e o resumo das 12 (abertos e total). As páginas seguem a página de órgão (`src/app/orgaos/[slug]/page.tsx`): servidor, `ListaDeConcursos`, `Paginacao`, `Trilha`, e o trilho de situação de `Abas`.

**Tecnologia:** Next 16.3 (App Router, `params` e `searchParams` assíncronos), React 19, Tailwind 4, vitest, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-28-concursos-por-area-design.md`

## Restrições globais

- Tudo em português do Brasil: UI, comentários, commits.
- Nenhum travessão (U+2014) em texto nenhum; `semTravessao.test.ts` varre `src/`.
- Casar é por palavra inteira sobre o texto normalizado com `normalizar` de `src/lib/consulta.ts` (a mesma da busca local).
- Um concurso pode estar em mais de uma área.
- Todos os concursos do acervo, não só abertos; ordem `ordenar(..., "encerrando")` (abertos, depois previstos, depois o resto).
- Só mexer nas linhas de área em `itensDaNav.ts`, `Rodape.tsx` e `emBreve.ts` (outros agentes mexem nas vizinhas).
- Commits terminam com as linhas `Co-Authored-By` e `Claude-Session` da sessão.
- `pnpm verificar` (typecheck, lint, test) passa ao fim de cada tarefa.

## Foco de revisão

1. Palavra dentro de palavra: "banco" não pode casar "bancada", "TI" não pode casar "tipo"; o casamento é por palavra inteira, com pontuação e hífen virando espaço ("Técnico-Administrativo" casa "tecnico administrativo"). Teste em `areas.test.ts`.
2. Concurso sem cargo (`nomesDeCargo` vazio, 720 no acervo) ou sem sigla: a regra não pode lançar e só casa pelo que existe. Teste em `areas.test.ts`.
3. `?pagina=` e `?situacao=` de estranho (`pagina=-3`, `pagina=abc`, `pagina=999`, `situacao=banana`): página 1 ou a última, situação ignorada, nunca 500. Teste em `paginaDaArea.test.ts`.
4. Slug desconhecido e slug com maiúscula (`/areas/Saude`): 404, não uma área vazia. Teste de `areaDoSlug`.
5. Troca de situação volta à página 1 e troca de página mantém a situação. Teste de `hrefDaListaDaArea`.

---

### Tarefa 1: regra da área e classificador

**Arquivos:**
- Modificar: `src/lib/areas.ts`
- Modificar: `src/lib/areas.test.ts`

**Interfaces:**
- Produz:
  - `interface RegraDaArea { orgao?: string[]; cargo?: string[]; titulo?: string[]; exceto?: string[] }`
  - `interface Area { slug: string; nome: string; apoio: string; icone: NomeDoIcone; tom: ...; regra: RegraDaArea }` (sai `termo`)
  - `AREAS: Area[]` (12, mesma ordem)
  - `casaComArea(concurso: ConcursoResumo, area: Area): boolean`
  - `areaDoSlug(slug: string): Area | null`
  - `hrefDaArea(area: Area): string` devolvendo `/areas/{slug}`

- [ ] **Passo 1: testes que falham**

```ts
function concurso(parcial: { titulo?: string; orgao?: string; sigla?: string | null; cargos?: string[] }): ConcursoResumo {
  // monta um ConcursoResumo mínimo a partir de CONCURSOS[0] do mock
}

it("casa por palavra inteira, não por pedaço", () => {
  const tecnologia = areaDoSlug("tecnologia")!;
  expect(casaComArea(concurso({ cargos: ["Analista de Tecnologia da Informação"] }), tecnologia)).toBe(true);
  expect(casaComArea(concurso({ cargos: ["Tipógrafo"] }), tecnologia)).toBe(false);
});
it("hífen e pontuação viram espaço", ...); // "Técnico-Administrativo em Educação" casa administrativo
it("exceto tira o concurso de qualquer campo", ...); // TCU fora de Tribunais
it("concurso sem cargo e sem sigla não lança", ...);
it("areaDoSlug: desconhecido e maiúscula são null", ...);
it("hrefDaArea leva a /areas/<slug>", ...);
it("slugs únicos, minúsculos, sem acento", ...);
```

- [ ] **Passo 2:** `pnpm vitest run src/lib/areas.test.ts`, espera FAIL (`areaDoSlug` não existe).
- [ ] **Passo 3: implementação**

```ts
/** Minúsculo, sem acento, e todo o resto que não é letra ou número vira espaço. */
function textoDaRegra(texto: string): string {
  return ` ${normalizar(texto).replace(/[^a-z0-9]+/g, " ").trim()} `;
}
function contem(texto: string, termos: string[] | undefined): boolean {
  return (termos ?? []).some((termo) => texto.includes(textoDaRegra(termo)));
}
// Os textos de cada concurso guardados num WeakMap: /areas conta as 12
// áreas sobre o acervo inteiro, e normalizar 12 vezes o mesmo título é
// trabalho repetido.
export function casaComArea(concurso, area) {
  const { orgao, cargos, titulo } = textosDoConcurso(concurso);
  const { regra } = area;
  if (contem(orgao, regra.exceto) || contem(titulo, regra.exceto) || cargos.some((c) => contem(c, regra.exceto))) return false;
  return contem(orgao, regra.orgao) || cargos.some((c) => contem(c, regra.cargo)) || contem(titulo, regra.titulo);
}
```

Regras iniciais (a Tarefa 2 as confere e ajusta): Tribunais por órgão (`tribunal`, `justica federal`, siglas), Polícia por órgão e cargo (`delegado`, `escrivao`, `agente de policia`...), Educação por órgão (`universidade`, `instituto federal`, `cefet`...) e cargo (`professor`, `docente`), e assim por diante.

- [ ] **Passo 4:** o mesmo comando, PASS.
- [ ] **Passo 5:** `Areas.tsx`: "Todas as áreas" leva a `/areas`; comentários trocam "busca pelo termo" por "página da área". Commit `feat: regra por área no lugar do termo de busca`.

### Tarefa 2: conferência de aceite contra o acervo real

**Arquivos:**
- Modificar: `src/lib/areas.ts` (regras)
- Modificar: `src/lib/areas.test.ts` (casos reais)
- Temporário, sem commit: `src/lib/conferenciaDasAreas.local.test.ts`, que lê o `/acervo` salvo em disco e imprime, por área, total, abertos, os 10 primeiros na ordem da página e todos os órgãos distintos que casaram.

- [ ] **Passo 1:** baixar `/v1/acervo` da api local (porta 8793) para o scratchpad.
- [ ] **Passo 2:** rodar a conferência, ler cada amostra à mão, anotar falsos positivos, ajustar a regra, repetir até a amostra sair limpa.
- [ ] **Passo 3:** para cada área, um `it` com casos reais que casam e que não casam (título, órgão e cargos copiados do acervo).
- [ ] **Passo 4:** preencher a tabela de aceite abaixo. Commit `feat: regras das áreas conferidas no acervo`.

### Tarefa 3: portas de dados

**Arquivos:**
- Modificar: `src/lib/concursos.ts`
- Modificar: `src/lib/concursos.test.ts`

**Interfaces:**
- Produz:
  - `concursosDaArea(area: Area): Promise<ConcursoResumo[]>` (sem ordem)
  - `interface ResumoDaArea { area: Area; abertos: number; total: number }`
  - `resumoDasAreas(hoje?: Date): Promise<ResumoDaArea[]>` (as 12, na ordem de `AREAS`)

- [ ] **Passo 1: teste que falha** sobre o mock: `resumoDasAreas` tem 12 itens na ordem de `AREAS`, `total` é `concursosDaArea(area).length`, e `abertos` é o `filtrar(..., { situacoes: ["abertas"] })` da mesma lista.
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar com `acervo()` e `situacaoDoConcurso`. **Passo 4:** PASS. **Passo 5:** commit `feat: concursos e contagem por área`.

### Tarefa 4: lista paginada da área (lógica pura)

**Arquivos:**
- Criar: `src/lib/paginaDaArea.ts`
- Criar: `src/lib/paginaDaArea.test.ts`

**Interfaces:**
- Produz:
  - `interface ConsultaDaArea { situacao: Situacao | null; pagina: number }`
  - `lerConsultaDaArea(parametros: Parametros): ConsultaDaArea`
  - `hrefDaListaDaArea(area: Area, consulta: ConsultaDaArea): string` (`/areas/saude`, `/areas/saude?situacao=abertas&pagina=2`; página 1 e situação nula ficam fora da URL)
  - `listaDaArea(itens: ConcursoResumo[], consulta: ConsultaDaArea, hoje: Date): { pagina: Pagina; contagens: Record<Situacao, number>; total: number }` (ordena "encerrando", filtra, pagina; página além do fim vira a última)
  - `POR_PAGINA_DA_AREA = 20`

- [ ] **Passo 1: testes que falham** (Foco de revisão 3 e 5):

```ts
expect(lerConsultaDaArea({ pagina: "-3", situacao: "banana" })).toEqual({ situacao: null, pagina: 1 });
expect(lerConsultaDaArea({ pagina: "2", situacao: "abertas" })).toEqual({ situacao: "abertas", pagina: 2 });
expect(hrefDaListaDaArea(saude, { situacao: null, pagina: 1 })).toBe("/areas/saude");
expect(hrefDaListaDaArea(saude, { situacao: "previstos", pagina: 3 })).toBe("/areas/saude?situacao=previstos&pagina=3");
// página 999 com 3 itens vira a 1; contagens somam o total
```

- [ ] **Passos 2 a 4:** FAIL, implementar, PASS. **Passo 5:** commit `feat: consulta, endereço e página da lista da área`.

### Tarefa 5: páginas `/areas` e `/areas/[slug]`

**Arquivos:**
- Criar: `src/app/areas/page.tsx` (ISR, `revalidate = 300`)
- Criar: `src/app/areas/[slug]/page.tsx`
- Modificar: `src/components/home/Areas.tsx` (exporta `Azulejo` com contagem opcional, `CLASSE_DO_ICONE`)
- Criar: `src/lib/listaEstruturada.ts` + teste: `listaEstruturada(nome, total, itens: { nome: string; href: string }[])` devolvendo o `ItemList` (a forma do da home, `src/app/page.tsx:48-67`).

- [ ] **Passo 1:** teste de `listaEstruturada` (posição começa em 1, URL absoluta, `numberOfItems`), FAIL, implementar, PASS.
- [ ] **Passo 2:** `/areas`: trilha Início > Áreas, `h1` "Concursos por área", grade dos 12 azulejos com "N abertos · M concursos", `ItemList` das 12.
- [ ] **Passo 3:** `/areas/[slug]`: `areaDoSlug` ou `notFound()`; `generateMetadata` com título "Concursos de {área}", descrição com a contagem, `canonical` `/areas/{slug}`, `noindex` quando há situação ou página na query; trilha Início > Áreas > {área}; cabeçalho com ícone, nome, apoio e os três fatos (abertos, previstos, total); trilho de situação (`Abas` com `href`), `ListaDeConcursos`, `Paginacao`, `ItemList` da página, `AcervoIncompleto`.
- [ ] **Passo 4:** `pnpm verificar`. Commit `feat: páginas de concursos por área`.

### Tarefa 6: links, em breve, sitemap

**Arquivos:**
- Modificar: `src/components/layout/itensDaNav.ts` (item "Áreas": `href: "/areas"`, acende em `/areas` e `/areas/*`)
- Modificar: `src/components/layout/NavPrincipal.test.ts`
- Modificar: `src/components/layout/Rodape.tsx` (linha "Por área")
- Modificar: `src/lib/emBreve.ts` (sai `areas`)
- Criar: `src/app/em-breve/areas/page.tsx` (`permanentRedirect("/areas")`; segmento estático vence `[recurso]` e não toca o arquivo que os outros agentes editam)
- Modificar: `src/app/sitemap.ts` + `src/app/sitemap.test.ts` (`/areas` e os 12 `/areas/{slug}`)

- [ ] **Passo 1:** testes que falham: nav acende em `/areas/saude`; sitemap tem as 13 URLs; `recursoEmBreve("areas")` é `null`.
- [ ] **Passos 2 a 4:** FAIL, implementar, PASS. **Passo 5:** commit `feat: links de área levam a /areas`.

### Tarefa 7: verificação no navegador

- [ ] `pnpm verificar`.
- [ ] App em `:3103` com `BC_API_URL=http://127.0.0.1:8793/v1`: `/areas`, três `/areas/[slug]`, paginação, filtro de situação, azulejos da home, `/em-breve/areas` (308 para `/areas`), `/areas/banana` (404).
- [ ] Parar os servidores.

---

## Aceite (seção 4 do spec)

Preenchido na Tarefa 2.

## Desvios

Preenchido durante a execução.
