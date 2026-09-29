# Concursos por área: plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [x]`) para acompanhar.

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

- [x] **Passo 1: testes que falham**

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

- [x] **Passo 2:** `pnpm vitest run src/lib/areas.test.ts`, espera FAIL (`areaDoSlug` não existe).
- [x] **Passo 3: implementação**

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

- [x] **Passo 4:** o mesmo comando, PASS.
- [x] **Passo 5:** `Areas.tsx`: "Todas as áreas" leva a `/areas`; comentários trocam "busca pelo termo" por "página da área". Commit `feat: regra por área no lugar do termo de busca`.

### Tarefa 2: conferência de aceite contra o acervo real

**Arquivos:**
- Modificar: `src/lib/areas.ts` (regras)
- Modificar: `src/lib/areas.test.ts` (casos reais)
- Temporário, sem commit: `src/lib/conferenciaDasAreas.local.test.ts`, que lê o `/acervo` salvo em disco e imprime, por área, total, abertos, os 10 primeiros na ordem da página e todos os órgãos distintos que casaram.

- [x] **Passo 1:** baixar `/v1/acervo` da api local (porta 8793) para o scratchpad.
- [x] **Passo 2:** rodar a conferência, ler cada amostra à mão, anotar falsos positivos, ajustar a regra, repetir até a amostra sair limpa.
- [x] **Passo 3:** para cada área, um `it` com casos reais que casam e que não casam (título, órgão e cargos copiados do acervo).
- [x] **Passo 4:** preencher a tabela de aceite abaixo. Commit `feat: regras das áreas conferidas no acervo`.

### Tarefa 3: portas de dados

**Arquivos:**
- Modificar: `src/lib/concursos.ts`
- Modificar: `src/lib/concursos.test.ts`

**Interfaces:**
- Produz:
  - `concursosDaArea(area: Area): Promise<ConcursoResumo[]>` (sem ordem)
  - `interface ResumoDaArea { area: Area; abertos: number; total: number }`
  - `resumoDasAreas(hoje?: Date): Promise<ResumoDaArea[]>` (as 12, na ordem de `AREAS`)

- [x] **Passo 1: teste que falha** sobre o mock: `resumoDasAreas` tem 12 itens na ordem de `AREAS`, `total` é `concursosDaArea(area).length`, e `abertos` é o `filtrar(..., { situacoes: ["abertas"] })` da mesma lista.
- [x] **Passo 2:** FAIL. **Passo 3:** implementar com `acervo()` e `situacaoDoConcurso`. **Passo 4:** PASS. **Passo 5:** commit `feat: concursos e contagem por área`.

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

- [x] **Passo 1: testes que falham** (Foco de revisão 3 e 5):

```ts
expect(lerConsultaDaArea({ pagina: "-3", situacao: "banana" })).toEqual({ situacao: null, pagina: 1 });
expect(lerConsultaDaArea({ pagina: "2", situacao: "abertas" })).toEqual({ situacao: "abertas", pagina: 2 });
expect(hrefDaListaDaArea(saude, { situacao: null, pagina: 1 })).toBe("/areas/saude");
expect(hrefDaListaDaArea(saude, { situacao: "previstos", pagina: 3 })).toBe("/areas/saude?situacao=previstos&pagina=3");
// página 999 com 3 itens vira a 1; contagens somam o total
```

- [x] **Passos 2 a 4:** FAIL, implementar, PASS. **Passo 5:** commit `feat: consulta, endereço e página da lista da área`.

### Tarefa 5: páginas `/areas` e `/areas/[slug]`

**Arquivos:**
- Criar: `src/app/areas/page.tsx` (ISR, `revalidate = 300`)
- Criar: `src/app/areas/[slug]/page.tsx`
- Modificar: `src/components/home/Areas.tsx` (exporta `Azulejo` com contagem opcional, `CLASSE_DO_ICONE`)
- Criar: `src/lib/listaEstruturada.ts` + teste: `listaEstruturada(nome, total, itens: { nome: string; href: string }[])` devolvendo o `ItemList` (a forma do da home, `src/app/page.tsx:48-67`).

- [x] **Passo 1:** teste de `listaEstruturada` (posição começa em 1, URL absoluta, `numberOfItems`), FAIL, implementar, PASS.
- [x] **Passo 2:** `/areas`: trilha Início > Áreas, `h1` "Concursos por área", grade dos 12 azulejos com "N abertos · M concursos", `ItemList` das 12.
- [x] **Passo 3:** `/areas/[slug]`: `areaDoSlug` ou `notFound()`; `generateMetadata` com título "Concursos de {área}", descrição com a contagem, `canonical` `/areas/{slug}`, `noindex` quando há situação ou página na query; trilha Início > Áreas > {área}; cabeçalho com ícone, nome, apoio e os três fatos (abertos, previstos, total); trilho de situação (`Abas` com `href`), `ListaDeConcursos`, `Paginacao`, `ItemList` da página, `AcervoIncompleto`.
- [x] **Passo 4:** `pnpm verificar`. Commit `feat: páginas de concursos por área`.

### Tarefa 6: links, em breve, sitemap

**Arquivos:**
- Modificar: `src/components/layout/itensDaNav.ts` (item "Áreas": `href: "/areas"`, acende em `/areas` e `/areas/*`)
- Modificar: `src/components/layout/NavPrincipal.test.ts`
- Modificar: `src/components/layout/Rodape.tsx` (linha "Por área")
- Modificar: `src/lib/emBreve.ts` (sai `areas`)
- Criar: `src/app/em-breve/areas/page.tsx` (`permanentRedirect("/areas")`; segmento estático vence `[recurso]` e não toca o arquivo que os outros agentes editam)
- Modificar: `src/app/sitemap.ts` + `src/app/sitemap.test.ts` (`/areas` e os 12 `/areas/{slug}`)

- [x] **Passo 1:** testes que falham: nav acende em `/areas/saude`; sitemap tem as 13 URLs; `recursoEmBreve("areas")` é `null`.
- [x] **Passos 2 a 4:** FAIL, implementar, PASS. **Passo 5:** commit `feat: links de área levam a /areas`.

### Tarefa 7: verificação no navegador

- [x] `pnpm verificar`.
- [x] App em `:3103` com `BC_API_URL=http://127.0.0.1:8793/v1`: `/areas`, três `/areas/[slug]`, paginação, filtro de situação, azulejos da home, `/em-breve/areas` (308 para `/areas`), `/areas/banana` (404).
- [x] Parar os servidores.

---

## Aceite (seção 4 do spec)

Conferência de 28/09/2026 sobre o `/v1/acervo` da api local (4.724 concursos
com dado, de 4.918 no engine), com `src/lib/conferenciaDasAreas.local.test.ts`
(não versionado): por área, os 10 primeiros na ordem da página, todos os
órgãos que casaram e todo cargo que casou fora deles. Abertos contados em
28/09/2026.

| Área | Total | Abertos | Falsos positivos encontrados | Ajuste |
|---|---:|---:|---|---|
| Tribunais | 85 | 3 | 6 da Funpresp-Jud (fundo de pensão, casava por "Poder Judiciário") | `exceto: previdencia complementar` |
| Polícia e segurança | 33 | 0 | 5 do MJSP que são chamada de conselheiro (CNPD, CNCP) e consultor PNUD, casando por "Segurança Pública"; faltava a polícia penal (SENAPPEN/DEPEN) | sai `seguranca publica` do órgão; entram `execucao penal`, `policia judicial` no cargo e `politicas penais`, `senappen`, `depen` no título |
| Educação | 3.596 | 76 | nenhum (tudo é universidade, IF, CEFET, Colégio Pedro II ou cargo de professor) | nenhum |
| Saúde | 151 | 8 | "Médico Veterinário" casava "médico" (UFV, UFLA, UFU, CRMV, auditor agropecuário) | `exceto: medico veterinario`, só no cargo (ver Desvios); entram Hemobrás, Rede Sarah, Inca, INC, Into, Funasa, ANS e mais cargos de saúde |
| Fiscal e controle | 48 | 2 | nenhum (auditor de universidade é controle interno) | nenhum |
| Bancos e estatais | 39 | 0 | nenhum; faltavam ABGF, Dataprev e Emgepron | três órgãos a mais |
| Forças Armadas | 77 | 0 | nenhum; faltavam Comando de Operações Navais e Fuzileiros Navais | `operacoes navais`, `fuzileiros navais`, `distrito naval` |
| Prefeituras | 40 | 1 | nenhum de área (ver Pendências: um "AVISO DE LICITAÇÃO") | nenhum |
| Conselhos | 216 | 4 | nenhum (CNJ, CNPq, Conarq, conselhos gestores de fundo ficam fora pela regra) | nenhum |
| Tecnologia | 107 | 3 | 33 por "Informática" sozinha, que nos editais de IF é a área do professor ("Informática", "Professor Substituto - Informática", "Informática Educativa") | sai `informatica`; entram frases de cargo de TI (`tecnico em informatica`, `agente censitario de informatica`, `tecnico de laboratorio area informatica`...) |
| Administrativo | 200 | 4 | "PAS - Analista de TI - Administrador de Redes" casava "administrador" | `exceto: administrador de redes`, só no cargo |
| Ambiente e agro | 78 | 2 | nenhum; faltavam veterinário, pesca, IBAMA pela sigla, ANA | entram `medico veterinario`, `pesca`, `ibama`, `aguas e saneamento` e outros |

Amostra final (10 primeiros de cada área) sem falso positivo de área. Os
casos reais viraram teste em `src/lib/areas.test.ts` ("casos reais do
acervo"), e 9 dos 12 falham com a regra anterior ao ajuste.

## Desvios

- **`exceto` num cargo tira só aquele cargo.** O spec diz "se casar em
  qualquer campo, fica de fora". No órgão e no título continua assim; no
  cargo, tirar o concurso inteiro tirava de Saúde todo edital de
  universidade que tem "Médico" e "Médico Veterinário" juntos (UFRRJ, UFPE,
  UFFS, Unilab). Então o cargo que casa com `exceto` só deixa de contar.
- **`/areas/[slug]` sem `generateStaticParams`.** A página lê `?situacao=` e
  `?pagina=` no servidor, como a página de órgão, e página que lê
  `searchParams` renderiza por requisição: os 12 parâmetros não seriam
  prerenderizados. Slug desconhecido é 404 por `areaDoSlug` e `notFound()`.
  A alternativa (página estática e filtro no navegador, como `/busca`)
  mandaria a lista inteira da área ao navegador: 3.596 concursos em Educação.
- **`/em-breve/areas` redireciona por uma rota própria**
  (`src/app/em-breve/areas/page.tsx`, `permanentRedirect`), e não por
  `next.config.ts` nem pela página `[recurso]`: segmento estático vence o
  dinâmico e não toca arquivo que outros agentes editam.

## Pendências

- O engine classifica como concurso atos que não são: "AVISO DE LICITAÇÃO"
  da Prefeitura de Rio Verde (primeiro de Prefeituras) e 9 "Aviso de
  Credenciamento" da Operação Carro-Pipa (Comando Militar do Nordeste, em
  Forças Armadas). São do órgão certo e aparecem também na busca e na
  página do órgão; a correção é no engine, não na regra de área.

## Verificação

- `pnpm verificar`: typecheck, lint e 583 testes passando.
- Build de produção (`output: standalone`) contra a api local com o acervo
  real, servido em `:3103`. `/areas` sai estática com ISR de 5 minutos;
  `/areas/[slug]` renderiza por requisição; `/em-breve/areas` responde 308
  para `/areas`.
- HTTP: `/areas`, `/areas/saude`, `/areas/educacao?pagina=3` e
  `/areas/saude?situacao=abertas` 200; `/areas/banana` e `/areas/Saude` 404;
  `?pagina=999&situacao=x` 200 (última página, situação ignorada). Com
  filtro ou página adiante, `noindex, follow` e canônico na área.
- Paginação e abas: em `/areas/educacao?pagina=2&situacao=encerrados` a
  página 2 está marcada, os links de página mantêm a situação e as abas
  voltam à página 1.
- Home: os 12 azulejos levam a `/areas/<slug>` e "Todas as áreas" a `/areas`;
  o sitemap tem as 13 URLs de área.
- Navegador (Chrome headless): capturas de `/areas` (1440 e 390),
  `/areas/saude`, `/areas/tribunais?situacao=abertas`,
  `/areas/tecnologia` (390); `scripts/verificar-navegador.mjs` com as páginas
  de área: sem rolagem lateral a 360, 375, 390 e 1440px e sem erro de
  console.
