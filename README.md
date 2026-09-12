# buscaconcurso app-web

Front do buscador de concursos públicos. Next.js 16 com App Router, React 19,
TypeScript e Tailwind v4.

Ainda não há API: os dados vêm de um mock tipado com a forma das tabelas do
`engine`. Toda leitura passa por `src/lib/concursos.ts`, que hoje devolve o
mock e amanhã fará `fetch`. Nenhum componente importa mock direto, então a
entrada da API muda um arquivo só.

## Como rodar

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

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

O desenho e as decisões estão em
`docs/superpowers/specs/2026-09-11-home-e-design-system-design.md`.
