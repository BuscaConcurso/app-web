# buscaconcurso app-web

Front do buscador de concursos públicos. Next.js 16 com App Router, React 19,
TypeScript e Tailwind v4.

Toda leitura passa por `src/lib/concursos.ts`. Com `BC_API_URL` definida, ele
lê o acervo da API do `engine`; sem ela, ou quando a API não responde, lê o
mock tipado com a forma das tabelas do `engine` e avisa no log. Nenhum
componente importa mock direto, e a entrada da API mudou um arquivo só.

Filtro, ordenação, paginação e contagem de faceta continuam rodando aqui,
sobre o array que `acervo()` devolve — é por isso que a API tem uma rota só.

## Como rodar

```bash
pnpm install
pnpm dev          # http://localhost:3000, com o mock
```

Com o acervo de verdade, no repositório `engine` ao lado:

```bash
cd ../engine && bc api          # sobe em 127.0.0.1:8787, só leitura
cd ../app-web && BC_API_URL=http://127.0.0.1:8787 pnpm dev
```

O acervo do engine ainda está quase todo vazio: dos 9.311 concursos, 2 têm
cargo ou evento e é só isso que a lista mostra. `curl -s
http://127.0.0.1:8787/diagnostico` diz o que falta, campo por campo.

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

## O que existe

| Rota | O que é |
| --- | --- |
| `/` | Landing de busca: hero, faixa de urgência, abertos, previstos, alerta e links internos |
| `/concursos` | Busca reduzida. A query string é a fonte da verdade |
| `/concursos/[slug]` | Resumo do concurso |
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

`BC_API_URL` é a raiz da API de leitura do engine, sem barra no fim (por
exemplo `http://127.0.0.1:8787`). Ausente, o acervo é o mock. A suíte de
testes ignora a variável de propósito (ver `vitest.config.mts`): teste de
filtro precisa de acervo conhecido e de nenhuma rede.

O desenho e as decisões estão em
`docs/superpowers/specs/2026-09-11-home-e-design-system-design.md`.
