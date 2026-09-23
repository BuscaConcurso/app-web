# buscaconcurso app-web

Front do buscador de concursos públicos. Next.js 16 com App Router, React 19,
TypeScript e Tailwind v4.

Toda leitura passa por `src/lib/concursos.ts`. Com `BC_API_URL` definida, ele
lê o acervo da API Nest (`../api`); sem ela, ou quando a API não responde, lê o
mock tipado com a forma das tabelas do `engine` e avisa no log. Nenhum
componente importa mock direto, e a entrada da API mudou um arquivo só.

Filtro, ordenação, paginação e contagem de faceta continuam rodando aqui,
sobre o array que `acervo()` devolve, servido por `GET /v1/acervo`.

## Como rodar

```bash
pnpm install
pnpm dev          # http://localhost:3000, com o mock
```

Com o acervo de verdade, suba a API Nest seguindo o [README da API](../api/README.md)
e configure a raiz com o prefixo `/v1`:

```bash
BC_API_URL=http://127.0.0.1:8788/v1 pnpm dev
```

O navegador chama a mesma API diretamente para autenticação. Configure também
o endereço público, sem o prefixo `/v1`:

```bash
NEXT_PUBLIC_BC_API_URL=http://127.0.0.1:8788
```

Para persistir a configuração local, copie `.env.example` para `.env.local`.
A API Nest usa o acervo compartilhado com o engine. A leitura de detalhe passa
por `GET /v1/concursos/:slug`, e a avaliação por
`POST /v1/concursos/:slug/avaliacao`, com `gostei`, `comentario` e `avaliador`
no JSON. O navegador continua enviando FormData para `/api/avaliacao`; o
Route Handler mantém o cookie do avaliador e chama a API pelo servidor.
O diagnóstico do acervo está em `http://127.0.0.1:8788/v1/diagnostico`.

`sigla`, `esfera` e `poder` do órgão são anuláveis em `dominio.ts` porque o
acervo não os tem: o selo do cartão fica sem letra e a linha de contexto mostra
só o que existe. É o tipo descrevendo o dado, não a tela.

`BC_API_URL` definida torna as rotas dinâmicas (`fetch` com `no-store`, para
o acervo não congelar no build). Sem ela, o build segue estático como antes.

## Como verificar

```bash
pnpm verificar    # typecheck, lint e testes
pnpm build        # build de produção
```

Além disso, `/estilo` renderiza o design system inteiro em código, para
conferir no navegador que ele bate com o canvas. A rota leva `noindex` e fica
fora do sitemap.

## Imagem

`docker build --build-arg NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br -t bc-web .`
gera a imagem de produção (`output: "standalone"`). `BC_API_URL` chega em
runtime; `NEXT_PUBLIC_BC_API_URL` fica gravada no bundle, então trocar o
domínio da API exige novo build.

## O que existe

| Rota | O que é |
| --- | --- |
| `/` | Landing de busca: hero, faixa de urgência, abertos, previstos, alerta e links internos |
| `/concursos` | Busca reduzida. A query string é a fonte da verdade |
| `/concursos/[slug]` | Resumo do concurso |
| `/entrar` | Login com senha, Google ou LinkedIn |
| `/cadastrar` | Criação de conta |
| `/verificar-email` | Confirmação do e-mail pelo token do link |
| `/esqueci-a-senha` | Pedido de recuperação de senha |
| `/redefinir-senha` | Redefinição pelo token do link |
| `/conta` | Perfil, senha, e-mail, provedores e sessões |
| `/estilo` | Vitrine do design system |

Quase tudo é Server Component. A barra de busca é um `<form method="get">`
nativo, os filtros e a ordenação são âncoras, e o menu do celular e o painel
de filtros do celular são `<details>`. Isso é bom para SEO e faz a página
funcionar antes de qualquer hidratação.

A única ilha de cliente é a barra de busca, por causa da pré-seleção de
estado. Ela acrescenta comportamento e não sustenta nada: sem JavaScript, o
formulário continua submetendo e a busca continua inteira.

### Pré-seleção de estado

A barra tenta descobrir em que estado a pessoa está e deixar o seletor já
preenchido. Três regras:

1. **Nunca dispara busca sozinha.** Preenche e avisa; a pessoa decide.
2. **Nunca pede permissão sem gesto.** No primeiro acesso aparece um botão, e
   o prompt do navegador só sobe se a pessoa clicar. Quem já concedeu antes é
   resolvido em silêncio, via Permissions API, sem prompt.
3. **A coordenada não sai da máquina.** Os contornos dos 27 estados vêm de
   `public/geo/uf.json`, servido por nós, e o ponto em polígono roda no
   navegador. O arquivo tem 22 KB comprimidos e só é baixado depois da
   permissão, então quem recusa não paga por ele.

O arquivo de contornos é gerado da malha do IBGE por `pnpm geo`. A conversão
de coordenada para sigla está em `src/lib/localizacao.ts` e é testada contra
as 27 capitais.

## Direção visual

Vem do canvas `BuscaConcurso · Identidade`. Três regras:

1. Cinza por padrão, cor só quando informa alguma coisa.
2. Sem borda em caixa e sem sombra. O que separa é o degrau entre a página
   cinza e o cartão branco.
3. Literata nos títulos e Archivo em todo o resto. Número não tem família
   própria: é o mesmo Archivo com as figuras de largura fixa ligadas, pela
   classe `.numero`.

O fundo do cartão é o sinal de situação: branco aberto, salmão encerrando em
até sete dias, palha previsto, cinza encerrado. O amarelo é a chamada única
da tela.

Os tokens ficam num bloco `@theme` em `src/app/globals.css`, com nomes em
português: `bg-cartao`, `text-tinta-600`, `font-titulo`, `rounded-caixa`.

Ao lado dos nomes de cor existem nomes de papel: `acao`, `link`, `inverso`,
`rodape`, `marca-*`. `verde-700` diz que cor é, `acao` diz para que serve, e a
diferença só aparece no tema escuro, onde o botão primário e o texto de link
precisam de verdes diferentes. Componente novo usa o papel, não a cor.

### Temas

Claro, escuro e sistema, com o seletor no cabeçalho. O escuro só troca o valor
dos tokens; nenhum componente sabe que ele existe.

Cada par de texto e fundo do tema escuro foi medido antes de entrar: os de
leitura passam de 4.5:1 e as superfícies de ação passam de 3:1.

A escolha vai para `localStorage` e é aplicada em `data-tema` no `html` por um
script síncrono no `head`, senão quem escolhe o contrário do sistema vê um
lampejo do tema errado. Sem escolha, e portanto também sem JavaScript, o CSS
segue a preferência do aparelho.

## Onde mexer

```
src/app/           rotas, metadata, sitemap, robots, imagem Open Graph
src/components/ui/       primitivos: Botao, Campo, Cartao, Etiqueta, Paginacao
src/components/concurso/ cartão completo e linha compacta
src/components/home/     hero, seções e blocos de SEO
src/lib/           tipos do domínio, consulta, formatação e situação
src/mocks/         acervo de exemplo
```

A regra de negócio está em `src/lib/situacao.ts`: `tomDoConcurso` decide como
o cartão se pinta a partir do status e dos dias restantes de inscrição. É o
que faz os concursos que fecham nesta semana saltarem de uma lista cinza.

## Ambiente

`NEXT_PUBLIC_URL_SITE` define a origem usada em canônico, sitemap e JSON-LD.
Sem ela, o padrão é o domínio de produção.

`BC_API_URL` é a raiz da API Nest, com o prefixo `/v1` e sem barra no fim
(por exemplo `http://127.0.0.1:8788/v1`). Ela fica apenas no servidor.
Ausente, o acervo é o mock. A suíte de testes ignora a variável de propósito (ver `vitest.config.mts`): teste de
filtro precisa de acervo conhecido e de nenhuma rede.

`NEXT_PUBLIC_BC_API_URL` é a origem da API usada no navegador pelo fluxo de
autenticação. A sessão mantém o access token apenas em memória e recebe o
refresh token em cookie `HttpOnly`; por isso a API precisa permitir a origem
do app em `CORS_ALLOWED_ORIGINS` e aceitar credenciais.

O desenho e as decisões estão em
`docs/superpowers/specs/2026-09-11-home-e-design-system-design.md`.
