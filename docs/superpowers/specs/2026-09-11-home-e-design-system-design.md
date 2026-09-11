# app-web: home e design system

Data: 2026-09-11
Estado: aprovado, em implementação

## O que é

Front do buscador BuscaConcurso. Esta rodada entrega o design system em
código, a home como landing de busca e um stub navegável da busca. Sem API:
os dados vêm de mock tipado com a forma do banco do engine.

## Por que assim

O engine já grava concurso, órgão, banca, edital, cargo, vaga e remuneração
em Postgres. A API ainda não existe. Modelar o mock com os mesmos enums e as
mesmas relações evita que a integração vire reescrita, e permite escrever a
formatação e a derivação de estado agora, com teste, em vez de depois.

A home é a landing de busca, não a busca. É a página de cauda curta que
ranqueia por termos genéricos e distribui autoridade para `/concursos`, que
absorve as combinações de filtro.

## Direção visual

Vem do canvas `BuscaConcurso · Identidade`. Três regras mandam:

1. Cinza por padrão, cor só quando informa. Uma lista de trinta editais com
   etiqueta colorida por linha vira ruído. Deixando a lista cinza, os dois
   concursos que fecham esta semana saltam sozinhos.
2. Sem borda em caixa e sem sombra. O que separa é o degrau entre a página
   cinza e o cartão branco.
3. Literata nos títulos, Archivo na interface, Spline Sans Mono nos números.

O fundo do cartão é o sinal de situação: branco aberto, salmão urgente,
palha previsto, cinza encerrado. O amarelo é a chamada única da tela.

## Stack

Next.js 16 com App Router, React 19, TypeScript estrito, Tailwind v4,
Vitest com Testing Library, pnpm.

Tudo Server Component. A busca é um `<form method="get">` nativo e os
filtros são âncoras de verdade, então a home e o stub funcionam sem
JavaScript no cliente. Isso é bom para SEO e é o motivo de não haver
biblioteca de componentes.

## Estrutura

```
src/app/
  layout.tsx            fontes, metadata base, JSON-LD de Organization
  page.tsx              home
  concursos/page.tsx    stub de busca, lê a query string
  estilo/page.tsx       vitrine do design system, noindex
  sitemap.ts robots.ts opengraph-image.tsx icon.tsx
  globals.css           @theme com os tokens do canvas
src/components/ui/        Botao Campo Selecao Etiqueta Selo Cartao Paginacao
src/components/marca/     Logo
src/components/layout/    Cabecalho Rodape
src/components/concurso/  CartaoConcurso CartaoLinha ListaConcursos
src/components/home/      Hero SecaoEncerrando SecaoAbertos SecaoPrevistos
                          BlocoAlerta BlocosSeo
src/lib/                  dominio.ts consulta.ts concursos.ts formato.ts
                          rotulos.ts site.ts
src/mocks/                concursos.ts bancas.ts orgaos.ts
```

## Tokens

Bloco `@theme` em `globals.css`, nomes em português alinhados ao canvas.

| Grupo | Tokens |
| --- | --- |
| Superfície | pagina `#ECEEED`, cartao `#FFFFFF`, rebaixada `#E2E5E3`, bloco `#F4F6F5`, escura `#141715` |
| Tinta | 900 `#141715`, 800 `#2A2E2B`, 600 `#4E534F`, 500 `#666C68`, 400 `#8D938F`, 300 `#C3C7C5`, 200 `#D9DDDB`, 100 `#E9EBEA` |
| Ação | verde-700 `#0C5434`, verde-600 `#116B42`, verde-500 `#1A8C55`, verde-300 `#5FBE8C`, verde-900 `#06361F` |
| Sinal | amarelo `#F2B705`, ocre `#8A6407`, vermelho `#B3261E`, vermelho-800 `#8E1C16` |
| Situação | urgente `#FDF0EE`/`#F8DCD8`, previsto `#FAF4E4`/`#F3E6C6`, encerrado `#E5E8E6`/`#D9DDDB` |
| Fonte | titulo Literata, interface Archivo, numero Spline Sans Mono |
| Raio | caixa 10px, controle 6px |

Espaçamento fica na escala padrão do Tailwind, que já é múltiplo de 4.
Controles têm 40px de altura, 48px na chamada e 32px no compacto.

## Modelo de dados

`src/lib/dominio.ts` espelha o schema do engine: `Esfera` com quatro
valores, `ConcursoStatus` com onze, `Escolaridade` com oito, `Uf` com 27.

O tipo de lista é `ConcursoResumo`, denormalizado para o cartão: slug,
título, órgão com sigla e esfera, banca, status, uf, município, vagas,
cadastro reserva, salário máximo, taxa, janela de inscrição, escolaridades,
ano previsto e link do edital.

`poder` (judiciário, executivo, militar) aparece no cartão mas não existe no
banco do engine. Fica como campo de exibição do front até a API decidir de
onde ele vem.

## Derivação do tom do cartão

`tomDoConcurso(concurso, hoje)` devolve `urgente`, `aberto`, `previsto` ou
`encerrado`. É a única regra de negócio real desta rodada.

- `previsto`, `autorizado`, `banca_definida` viram `previsto`.
- `cancelado`, `encerrado`, `homologado`, `suspenso`,
  `inscricoes_encerradas`, `provas`, `resultado` viram `encerrado`.
- `inscricoes_abertas` vira `urgente` quando faltam até 7 dias para o fim
  das inscrições, `encerrado` quando a data já passou, e `aberto` no resto,
  inclusive quando não há data de fim.

## Camada de acesso

`src/lib/consulta.ts` tem as funções puras `filtrar` e `ordenar`.
`src/lib/concursos.ts` é a fachada assíncrona que hoje lê o mock e amanhã
faz fetch da API. Nenhum componente importa mock direto.

Ordenações: encerrando primeiro (padrão, sem data vai para o fim), mais
recentes, mais vagas, maior salário.

As datas do mock são deslocamentos em dias a partir de hoje, para que a
faixa de urgência da home nunca fique vazia. Quem consome recebe `hoje` por
parâmetro, com `new Date()` como padrão, para o teste ser determinístico.

## A home

1. Cabeçalho com logo, quatro itens de navegação, Entrar e Criar conta.
2. Hero: h1 em Literata, subtítulo, barra de busca com campo de cargo ou
   órgão, seletor de estado e botão verde. Abaixo, atalhos como chips.
3. Encerra esta semana: até quatro cartões em linha, fundo salmão.
4. Inscrições abertas agora: grade de seis cartões completos.
5. Previstos: lista compacta em fundo palha.
6. Alerta por e-mail: o único bloco amarelo da tela.
7. Blocos de SEO: três colunas de links internos para estado, banca e órgão,
   mais texto indexável explicando o serviço.
8. Rodapé.

## SEO

`lang="pt-BR"`. Metadata base no layout com `metadataBase`, template de
título, descrição, canônico, Open Graph e Twitter. JSON-LD de `Organization`
e `WebSite` com `SearchAction` na home, e `ItemList` nos destaques. Um h1 por
página, seções em h2. `sitemap.ts` e `robots.ts` gerados. Imagem Open Graph
e ícone gerados com `next/og` a partir da marca. Fontes por `next/font` com
`display: swap`, autohospedadas. Os links de filtro são âncoras para
`/concursos?uf=SP`, não JavaScript.

A rota `/estilo` sai do sitemap e leva `robots: noindex`.

## Testes

Vitest com ambiente jsdom e Testing Library.

- `formato`: moeda, data curta e longa, dias até, prazo relativo com hoje,
  amanhã, plural, e vagas com cadastro reserva.
- `tomDoConcurso`: bordas de 7 e 8 dias, data no passado, data ausente, e um
  caso por família de status.
- `consulta`: filtro combinado de uf com escolaridade e busca textual;
  ordenação por encerrando primeiro com nulos no fim.

Fora disso: `tsc --noEmit`, `eslint` e conferência visual em `/estilo`.

## Desvios do combinado, decididos durante a implementação

**A página do concurso entrou.** Estava listada como fora de escopo, mas sem
ela todo cartão de resultado é um link morto, e a razão de existir do stub de
busca era justamente a home ficar navegável de ponta a ponta. Entrou na
versão mínima: o mesmo resumo do cartão, cronograma, trilha de navegação e
uma nota dizendo o que falta. Cargos, retificações e o PDF do edital
continuam fora.

**A paginação entrou no stub.** Estava adiada, mas com vinte itens por página
a busca mostraria vinte de trinta e cinco resultados sem saída. O componente
já existia no design system.

**Menu no celular.** O canvas mostra um botão de menu no cabeçalho do
celular, e a primeira versão simplesmente escondia a navegação abaixo de
768px. Virou um `<details>`, que abre e fecha sem JavaScript.

## Fora de escopo

Autenticação, alertas de verdade, notícias, planos, coluna de filtros da
busca, lista de cargos e cronograma completo no concurso, modo escuro,
internacionalização.
