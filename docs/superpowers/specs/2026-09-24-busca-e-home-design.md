# Busca com URL amigável, cabeçalho de busca, home e correções: design

Data: 2026-09-24

## Pedidos do usuário

1. Buscas geram `/busca/<termo-em-slug>` em vez de `/concursos?q=...`, e as
   buscas indexáveis entram no sitemap.
2. A página de busca é pré-renderizada; buscar no site é navegação SPA
   (a URL muda sem recarregar).
3. A barra de busca fica sempre no cabeçalho; a home é repensada sem a caixa
   de busca como peça central.
4. A home tem rolagem horizontal vazando no celular.
5. As cores não geram contraste suficiente.
6. Clicar num botão/link dentro do drawer do menu precisa navegar (hoje a URL
   muda, mas o drawer continua aberto, com o resto da página `inert` e a
   rolagem travada; reproduzido em produção a 375px).
7. Criar conta com Google ou LinkedIn (a API já cria a conta no primeiro login
   social; falta o botão na tela `/cadastrar`).

## Decisões

### URL da busca
- Rota nova `/busca/[termo]`. `termo` é o slug: `normalizar(q)` (sem acento,
  minúsculas, ver `src/lib/consulta.ts`), toda sequência não alfanumérica vira
  um `-`, sem `-` nas pontas. Volta: hífens viram espaços. A busca já ignora
  acento e separa por espaço, então o slug devolve exatamente os mesmos
  resultados que o texto original.
- Filtros e página continuam na query: `/busca/assistente-em-administracao?uf=SP&pagina=2`.
- Slug vazio → 404. Slug fora da forma canônica → redirect permanente para a
  canônica. `/concursos?q=<texto>&...` → redirect permanente para
  `/busca/<slug>?<demais parâmetros>`.
- `/concursos` sem `q` continua sendo a listagem geral com filtros
  (renderizada na requisição, como hoje).
- Canônico de `/busca/<slug>` é ele mesmo, sem query. Busca sem resultado:
  200 com "nenhum concurso" e `robots: noindex`.
- Título: "Concursos de <Termo>". Se o slug for de um cargo medido
  (`medirCargos`), usa o rótulo acentuado do cargo; senão, o texto do slug
  com a primeira letra de cada palavra maiúscula.

### Pré-renderização (ISR) e busca SPA
- `/busca/[termo]`: `generateStaticParams` devolve `[]` (nada no build),
  `dynamicParams = true`, `revalidate = 300`: cada termo é renderizado na
  primeira visita e servido do cache por 5 minutos.
- Para a página continuar estática, ela **não lê `searchParams` no servidor**.
  O servidor entrega a lista de resultados do termo; filtros, ordenação e
  paginação são aplicados no navegador por um componente cliente que lê
  `useSearchParams` (dentro de `<Suspense>`), reutilizando as funções puras
  que já existem (`filtrar`, `ordenar`, paginação).
- O layout raiz deixa de chamar `connection()` (que tornava tudo dinâmico).
  O acervo passa a ser buscado com `next: { revalidate: 300 }` em vez de
  `cache: "no-store"`. A home e as demais páginas sem dados por requisição
  voltam a ser estáticas com revalidação; páginas que leem `searchParams`
  ou sessão continuam dinâmicas pela própria natureza.
- O build no CI não alcança a API interna. O `BC_API_URL` do **build** passa
  a ser a API pública (`https://api.buscaconcurso.com.br/v1`, build-arg vindo
  de Variable do repositório); em runtime continua `http://api:8788/v1`.
  Assim nada é pré-renderizado com o mock.
- Buscar pelo cabeçalho: o formulário faz `router.push("/busca/<slug>")`
  (sem reload); os links de resultado usam `<Link>` com prefetch.
- O sitemap usa `revalidate = 3600`.

### Sitemap
- Entrada `/busca/<slug>` para **todos** os cargos escolhidos por
  `medirCargos` (não só os 10 do rodapé), `changeFrequency: "daily"`,
  `priority: 0.7`. `urlDoCargo` passa a gerar `/busca/<slug>`.

### Cabeçalho e home
- A barra de busca vive no cabeçalho em todas as páginas: inline no desktop;
  no celular, uma linha própria logo abaixo da barra do cabeçalho (sempre
  visível, sem precisar abrir nada).
- A home perde a caixa de busca central e é redesenhada com o conteúdo que
  já existe (destaques, últimas atualizações, estados, escolaridades, cargos,
  órgãos), com hierarquia clara e acesso rápido por estado/cargo. Direção
  visual: manter a identidade atual (Literata + Archivo, tokens de
  `globals.css`), sem reescrever o design system.

### Contraste
- Todo par texto/fundo e ícone/fundo definido pelos tokens de `globals.css`,
  nos temas claro e escuro, atinge WCAG AA: 4,5:1 texto normal, 3:1 texto
  grande (≥ 24px ou ≥ 18,66px bold) e componentes/ícones. Um teste Vitest
  calcula a razão de contraste dos pares usados e falha se algum ficar abaixo.

### Rolagem horizontal no celular
- Nenhuma página principal (`/`, `/busca/<termo>`, `/concursos`,
  `/concursos/<slug>`, `/orgaos/<slug>`, `/entrar`, `/cadastrar`) pode ter
  `document.documentElement.scrollWidth > clientWidth` a 360, 375 e 390px.
  Verificado com Chrome headless.

### Drawer
- `useRevelador` fecha a gaveta quando o caminho (`usePathname`) muda. Vale
  para todas as gavetas; filtros (que mudam só a query) e âncoras do ato
  (que mudam só o hash) não fecham.

### Criar conta com Google/LinkedIn
- `/cadastrar` ganha "Criar conta com Google" e "Criar conta com LinkedIn",
  reutilizando `OAuthButtons` (mesmo fluxo de `authorize`; o rótulo muda).

## Verificação
- Vitest: slug (ida e volta, acentos, símbolos, vazio), redirects, geração de
  URLs em `parametros`, sitemap, filtros do lado cliente, contraste.
- `pnpm verificar` e `pnpm build` (build mostra `/busca/[termo]` como ISR).
- Chrome headless (375px): drawer fecha e página volta a ser interativa após
  navegar; sem rolagem horizontal nas páginas listadas; busca pelo cabeçalho
  muda a URL sem recarregar; `/concursos?q=` redireciona.

## Fora do escopo
- Buscas reais de usuários no sitemap.
- Filtros no caminho da URL.
- Reescrever o design system.

### Sem travessão
- Pedido do usuário: nenhum texto visível do site usa o travessão (U+2014). Todas
  as ocorrências em texto de interface (JSX, metadata, títulos, mensagens,
  mocks exibidos) são reescritas com vírgula, dois-pontos, parênteses ou
  ponto. Um teste Vitest varre `src/` e falha se encontrar o travessão (U+2014) fora de
  comentários.

### Páginas 404 e de erro
- Pedido do usuário: a 404 segue a identidade do projeto. `src/app/not-found.tsx`
  global (usada por `notFound()` em concursos, órgãos e busca, e por qualquer
  URL inexistente) e `src/app/error.tsx` (erro de renderização, com "tentar de
  novo"), ambas com cabeçalho e rodapé do layout, tipografia e tokens do site,
  texto curto em português e caminhos úteis: a busca do cabeçalho, links para
  a home, a lista de concursos e alguns estados. 404 responde com status 404 e
  `robots: noindex`. Contraste AA e sem rolagem horizontal a 360px.
