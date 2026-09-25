# Redesign da plataforma: design system novo, home e página do concurso

Data: 2026-09-25

## Pedido

Redesign da plataforma, com design system e páginas fiéis ao protótipo no
canvas "BuscaConcurso · Home Redesign"
(https://claude.ai/artifact/BrUhMCSobNASaWhCDGnbtd). O canvas tem cinco
artboards:

| Artboard | Tamanho | Conteúdo |
|---|---|---|
| `Logo.dc.html` "Marca e sistema" | 1440 × 1660 | logo, paleta, azulejos, ícones, tipografia |
| `Main.dc.html` "Home · desktop" | 1440 × 5520 | home completa |
| `Mobile.dc.html` "Home · celular" | 390 × 2840 | home no celular |
| `Concurso.dc.html` "Concurso · desktop" | 1440 × 3900 | página do concurso, interativa |
| `ConcursoMobile.dc.html` "Concurso · celular" | 390 × 844 | página do concurso no celular |

O protótipo não tem imagem raster. Logo, favicon, azulejos e ícones são SVG ou
CSS inline, e são esses SVGs que viram arquivos do projeto.

## Decisões tomadas com o usuário

1. **Escopo.** O design system novo vale para o app inteiro. Home e página do
   concurso são recriadas fiéis ao protótipo; as outras páginas seguem a mesma
   linguagem sem layout próprio desenhado.
2. **O que não tem função por trás aparece mesmo assim** (pixel-perfect com
   placeholder). Botão sem função abre um aviso "Em breve"; link sem destino
   vai para `/em-breve/[recurso]`.
3. **Tema escuro continua**, derivado da paleta nova, com o seletor claro,
   escuro e sistema que já existe.
4. **Abordagem:** trocar os tokens no lugar mantendo os nomes de papel que o
   código já usa, reestilizar os primitivos e reconstruir home e concurso. Um
   branch (`redesign`), sem sistema paralelo.

### O que esta spec desfaz de specs anteriores

- `2026-09-11-home-e-design-system-design.md`: as regras "nada de sombra",
  "Literata e Archivo" e "cinza por padrão" saem. A sombra de 1 px e a
  sombra projetada do hero fazem parte do sistema novo.
- `2026-09-24-busca-e-home-design.md`, pedido 3 ("a barra de busca fica
  sempre no cabeçalho; a home sem a caixa de busca como peça central"): o
  protótipo põe a busca grande no hero da home e a busca compacta na nav das
  outras páginas. Na home a nav não tem busca, porque o hero já tem. O resto
  daquela spec (URL `/busca/<slug>`, navegação SPA, sitemap, drawer) continua
  valendo.

## 1. Fundação

### Cores (tema claro)

Nomes de papel mantidos em `globals.css` (`acao`, `link`, `inverso`,
`cartao`, `pagina`, `tinta-*`...). Os valores novos:

| Papel | Valor | Uso |
|---|---|---|
| página (Papel) | `#F6F4EE` | fundo |
| cartão | `#FFFFFF` | cartões, nav |
| rebaixada | `#F1EEE6` | botão secundário, trilho das abas, `kbd` |
| linha / linha fraca | `#E3DFD4` / `#EEEBE3` | borda da nav, sombra de 1 px, divisores |
| contorno | `#D4CFC2` | botão de contorno |
| tinta 900 / 600 / 500 | `#0F1F17` / `#4F5D55` / `#66736B` | texto, apoio, rótulo |
| ação (Verde Mata) | `#0B6B3A` | botão primário, marca, aba ativa |
| faixa (Verde Noite) | `#0A4D2E` | hero, logo empilhado |
| barra utilitária | `#06331E` com texto `#CFE3D6` | topo |
| Ouro | `#F2C230` com texto `#2A2000` | a chamada única da tela |
| Anil | `#1D3F8F` | links e informação |
| Urucum | `#B8401F` | prazo curto |

Tons de sinal (fundo claro e texto escuro de cada cor):

| Sinal | Fundo | Texto |
|---|---|---|
| verde | `#E4F1E8` | `#0B6B3A` |
| anil | `#E7ECF8` | `#1D3F8F` |
| ouro | `#FCF1CF` | `#7A5B00` (faixa de calendário `#C99A00`) |
| urucum | `#FBE7E0` | `#8F2F15` |
| neutro | `#F1EEE6` | `#0F1F17` |

Extras vistos nos azulejos e na barra: `#0E5C35` (verde do azulejo), `#2FA35F`
e `#5C7FD6` (as faixinhas da barra utilitária).

`situacao.ts` (`ESTILO_DO_TOM`) passa a usar esses tons: urgente em urucum,
previsto em ouro, aberto em verde, encerrado em neutro.

### Cores (tema escuro)

Mesma estrutura de papéis. Página em verde bem escuro (perto de `#0B1611`),
cartão um degrau acima, rebaixada mais um degrau, tinta clara. Ouro mantido.
Verde, anil e urucum clareados até passar 4.5:1 como texto sobre o cartão
escuro; o botão primário mantém um verde escuro o bastante para texto branco.
Os valores exatos saem do teste de contraste, que é quem decide.

### Tipografia

- Títulos: Bricolage Grotesque 700, `letter-spacing` de -0.03em a -0.035em,
  `line-height` de 1 a 1.08. Tamanhos do protótipo: 68 (hero), 56, 40 (seção),
  32 (números), 30 (título do concurso no celular), 22.
- Texto: Public Sans 400 a 700, com `font-variant-numeric: tabular-nums` no
  corpo.
- Rótulo de seção: 13 px, 700, `letter-spacing` 0.06em, caixa alta, com
  ícone de 16 px na cor do sinal.
- As duas via `next/font/google`, no lugar de Literata e Archivo.

### Forma

- Raios: 10 a 12 (botões, selos), 14 (ícone em caixa), 17 a 19 (pílulas), 18 a
  20 (cartões), 24 a 28 (painéis e mosaico).
- Sombras: cartão `0 1px 0 var(--linha)`; bloco de números
  `0 1px 0 var(--linha), 0 20px 50px rgba(15,31,23,0.08)`; flutuantes do hero
  `0 30px 60px rgba(0,30,15,0.35)`; aba ativa `0 1px 3px rgba(15,31,23,0.12)`.
- Alvos de toque de no mínimo 42 px (44 nos ícones da nav).

### Ícones

Componente `Icone` com os paths Lucide (ISC) copiados do protótipo, traço
1,75, pontas e junções arredondadas, `currentColor`. Sem dependência nova.
Ícone sozinho sempre com `aria-label`.

### Marca

- `Logo` é a lupa sobre o azulejo: quadrado de 40 com raio 10, quarto de
  círculo em ouro no canto superior direito, lupa branca de traço 3,6.
  Variantes: horizontal (padrão), empilhada sobre verde (tile Papel, lupa
  verde, "Concurso" em ouro), só o símbolo, e favicon (traço 4,4 em 32 px e
  5,5 sem o ouro em 16 px).
- Palavra: "Busca" em tinta e "Concurso" em verde (ouro sobre o Verde Noite).
- Arquivos regerados a partir do SVG: `public/icone.svg`, `public/icone-32.png`
  e `src/app/opengraph-image.tsx`.
- `LogoGvTechLab` continua no rodapé.

### Azulejos

Componente `Azulejos` que desenha grades de ladrilhos (fundo + círculo
posicionado) só com CSS, `aria-hidden`, a partir de uma lista de ladrilhos
igual à do protótipo. Usado no hero (4×4, 448 px), no `/estilo`, nas telas de
login, nas páginas de erro e no OpenGraph.

## 2. Casca e primitivos

### Barra utilitária

36 px, fundo `#06331E`, texto `#CFE3D6` 13 px. Esquerda: as três faixinhas e
"Dados públicos, lidos do Diário Oficial e das bancas · Atualizado em
{data do acervo}". Direita: Alto contraste e A−/A+ (placeholders), o seletor
de tema no mesmo estilo discreto, e "Como lemos os editais" (placeholder
`/em-breve/como-lemos`). Some abaixo de `md`.

### Nav

76 px, branca, borda inferior. Logo; abas com ícone (Abertos, Previstos,
Diário Oficial, Áreas, Estados), com a aba atual em pílula `#E4F1E8`/verde;
ícones Salvos e Alertas (44 px, bolinha urucum no de alertas); "Entrar" com
contorno, ou o `MenuConta` quando há sessão.

- Abertos: `/concursos?situacao=abertas`. Estados: `/#estados`. Previstos:
  `/concursos?situacao=previstos`. Diário Oficial, Áreas e Salvos:
  `/em-breve/...`. Alertas: aviso "Em breve".
- Fora da home, a nav ganha a busca compacta com atalho `/`.
- Celular: logo e ações; o drawer de menu que já existe é mantido com o
  visual novo. No concurso, o header de 60 px com voltar, logo, compartilhar
  e salvar.

### Rodapé

Marca, "Concursos públicos abertos no Brasil, lidos direto do edital. Feito no
Brasil.", colunas Buscar (Abertos, Previstos, Diário Oficial, Por área), Sobre
(Como lemos os editais, Design system, Acessibilidade, Contato) e uma coluna
nova "Cargos mais buscados" com os links de cargo medido que hoje ficam nos
`BlocosSeo`. Linha final "© 2026 BuscaConcurso · Acervo atualizado em
{data}". Crédito da GV Tech Lab mantido.

### Primitivos (`components/ui`)

- `Botao`: primário (verde, texto branco), chamada (ouro, texto `#2A2000`, uma
  por tela), secundário (rebaixada), contorno, ícone. Alturas 42, 44, 52, 56.
- `Cartao`: branco, raio 18, sombra de 1 px; variante com tom de sinal.
- `Etiqueta`: pílula de 26 a 38 px, neutra ou em tom de sinal, com ícone
  opcional.
- `Selo`: quadrado de 44 px, raio 12, sigla do órgão em 11 a 12 px 700, fundo
  anil claro.
- `Calendario`: 56 × 60, faixa do mês e dia em Bricolage; urucum para hoje,
  ouro para amanhã.
- `Abas`: trilho rebaixado com aba ativa branca e sombra.
- `Campo` e `BuscaGrande`: a busca do hero (72 px, raio 18) e a compacta.
- `Aviso`: o toast "Em breve: {recurso}" dos placeholders, com `aria-live`.
- `Trilha`, `Paginacao`, `Sugestoes`, `Revelador`, `Secao`: reestilizados.

### `/estilo`

Vira a vitrine do sistema: marca e variantes, paleta com nomes, azulejos,
ícones, tipografia e todos os primitivos, nos dois temas.

## 3. Home

Ordem e medidas do protótipo. Container com 112 px de margem lateral no
desktop e 16 px no celular.

| Bloco | Dado |
|---|---|
| **Hero** (Verde Noite, 620 px): pílula ouro "N concursos com inscrição aberta hoje", título "Encontre seu concurso. / Direto do edital." (segunda linha em ouro), apoio, busca grande (termo, UF, Escolaridade, "Buscar" em ouro, `kbd` `/`), chips | `totalAbertos`; a busca usa `destinoDoFormulario`; chips: encerram esta semana (`/concursos?situacao=abertas&ordem=encerrando`), acima de R$ 10 mil (`salarioMin=10000`), nível médio (`escolaridade=medio`), perto de mim (UF lembrada; sem UF, pede localização como hoje) |
| **Mosaico e flutuantes**: azulejos 4×4, cartão do concurso (selo, cargo, edital e cidade, salário, vagas, até, "Conferido no edital original"), pílula "Novo ato no DOU · órgão" | primeiro de `encerrando` (ou de `abertos`) e primeiro de `atualizados`; some no celular |
| **Números** (sobrepõe o hero em -56 px): abertos, vagas nos 4 maiores previstos, atos lidos, "Todo dia" | `totalAbertos`, soma das vagas de `previstos`, `aviso.total` ou `dimensoes.total` |
| **Por área**: 12 cartões (ícone, nome, subtítulo) | sem classificação por área: cada cartão vai para `/busca/<termo>` (tabela fixa área para termo); "Todas as áreas" vai para `/em-breve/areas` |
| **Encerram esta semana**: 4 cartões com calendário, urgência, órgão e edital, nome longo, banca ou vagas, "Ver edital" e Salvar | `encerrando`; Salvar é placeholder |
| **Abertos**: abas por escolaridade, Ordenar, Filtros, tabela (Órgão e cargo, Local, Vagas, Salário até, Inscrições até, ação), "Mostrando 6 de N · ordenados pelo prazo", "Ver todos os N" | `abertos`; abas e controles são links para `/concursos` com filtro; no celular vira lista de cartões |
| **Por estado** (`#estados`): grade das UFs com intensidade por abertos, legenda 0 a máximo, "Usar minha localização"; ao lado, órgãos com mais vagas abertas e a lista por banca | `facetas`, ampliada para devolver as 27 UFs; UF vai para `?uf=` |
| **Vem aí** (4 previstos com vagas e "Avisar") e **Saiu no DOU** (feed com data) | `previstos` e `atualizados`; "Avisar" é placeholder; "Ver feed" vai para `/em-breve/diario-oficial` |
| **Como funciona**: 01 Coletamos, 02 Lemos, 03 Você confere; faixa "N atos dos M lidos ficaram fora desta lista, e dizemos por quê" com a repartição | texto fixo; a faixa usa `aviso` e `acervoIncompletoEmPartes` (substitui `AcervoIncompleto`) |
| **Alerta grátis**: e-mail, "Criar alerta", três garantias | o comportamento atual do `BlocoAlerta` |

Sai da home: a seção "Últimas atualizações" (vira o feed do DOU) e os
`BlocosSeo` (absorvidos pelo bloco Por estado e pelo rodapé).

Fica: o JSON-LD `ItemList`, o `revalidate = 300` e o comportamento com a API
fora do ar.

## 4. Página do concurso

Desktop: barra utilitária, nav com busca, trilha, cabeçalho, faixa de fatos e
corpo em duas colunas (principal e lateral `sticky`).

| Bloco | Dado |
|---|---|
| **Cabeçalho**: selo, pílula de situação no tom de `tomDoConcurso`, etiquetas (esfera, UF, área), título, "órgão · edital, data", Salvar, Compartilhar, Pôr na agenda | Compartilhar usa `navigator.share` e copia o link quando ele não existe; Pôr na agenda gera um `.ics` no cliente com o fim das inscrições; Salvar é placeholder |
| **Fatos** (6): Vagas "em N áreas", Remuneração, Taxa, Carga horária, Escolaridade, Cadastro reserva | agregado dos `cargos`; ausente vira "Não informada" com "o ato não diz", em cinza |
| **Cronograma**: linha do tempo com check verde no que passou, marcador "HOJE · falta N dias para encerrar", próximo marco em urucum, "Lido de: {trecho} · ver o ato" | `cronograma` (`evidencia`, `ato`); sem data vira "sem data" com a frase "O ato não informa" |
| **Áreas e vagas**: nota "Vale para todas as N áreas" quando os cargos compartilham escolaridade, jornada, taxa, remuneração e requisito; tabela Área, Vagas (pontos e número), "De onde foi lido"; filtro de áreas; 8 visíveis e "Mostrar as N áreas" | `cargos`; a nota só aparece se os campos forem iguais em todos; filtro e expandir no cliente |
| **O que o ato responde**: acordeão com ícone, resposta como citação literal, "Ver no ato publicado", lista "O ato não responde" | `Faq` e `origens` |
| **Fontes**: "Conferido por nós · Ato no Diário Oficial" (caracteres, coleta, ressalva de extrato) e "Informado pelo ato · não conferido · Edital completo no site" | `AtosPublicados` e `editalCitadoUrl` |
| **Avaliação**: "Esta página está certa?", Sim / "Não, tem erro" | `Avaliacao` e `/api/avaliacao` |
| **Lateral**: calendário grande, "Encerra amanhã · sexta, às 23h59 (Brasília)", progresso do período ("31 de 32 dias do período já passaram"), "Ir para a inscrição" em ouro com "Você vai para {host}, endereço lido do ato", "Para se inscrever" com passos marcáveis, Salvar, Lembrar amanhã, "Também abertos em {UF}" (3), alerta | passos derivados: ler o edital; pagar a taxa de R$ X (só se houver taxa); inscrever-se até DD/MM HH:MM. Check guardado em `localStorage` por slug. "Também abertos" é função nova no acervo (mesma UF, abertos, sem o próprio, por prazo). Lembrar e alerta são placeholders |

Celular: header de 60 px, selo e órgão, título de 30 px, etiquetas, cartão de
urgência com barra de progresso, fatos em 2×2, abas (Cronograma, Áreas (N),
Perguntas) e barra fixa no rodapé com a taxa e "Ir para a inscrição". Os
painéis das abas vão todos no HTML do servidor; a aba só troca qual aparece.

Estados: previsto troca o tom para ouro e o CTA para "Avisar quando abrir"
(placeholder); encerrado fica neutro, sem CTA de inscrição; sem link de
inscrição, o CTA vira "Ver o ato publicado".

Fica: `generateMetadata`, os redirects permanentes, o JSON-LD, o
`connection()` e o comportamento com a API fora.

## 5. Páginas herdadas

- `/concursos` e `/busca/[termo]`: `ColunaFiltros` em cartão branco, abas
  segmentadas, resultados com a linha da tabela da home (cartões no
  celular), `Paginacao` e `Sugestoes` novos.
- `/orgaos/[slug]`: cabeçalho como o do concurso (selo, título, fatos) e a
  lista do órgão.
- Entrar, cadastrar, esqueci e redefinir senha, verificar e-mail, trocar
  e-mail, callback OAuth e conta: `AuthShell` com cartão centralizado sobre
  Papel, logo empilhado e painel de azulejos ao lado no desktop.
- `not-found` e `error`: mensagem curta com azulejos. `global-error` mantém
  CSS inline mínimo.
- `/em-breve/[recurso]`: página nova, `noindex`, com o nome do recurso, uma
  frase do que ele vai fazer e o caminho de volta. Recursos: `salvos`,
  `areas`, `diario-oficial`, `como-lemos`, `acessibilidade`, `contato`.
  Recurso desconhecido dá 404.

## 6. Testes e verificação

- `pnpm verificar` (typecheck, lint e vitest) passa.
- `contraste.test.ts` verifica os pares da paleta nova nos dois temas:
  tintas sobre cartão e página, texto sobre ouro, textos dos tons de sinal,
  branco sobre o verde de ação, links sobre cartão.
- Testes unitários novos: agregação dos fatos, nota comum das áreas, passos da
  inscrição, `.ics`, "também abertos na UF", intensidade por UF, tabela de
  áreas para termos, destinos dos placeholders.
- Testes existentes ajustados só onde o texto mudou de propósito.
  `semTravessao.test.ts` cobre todo texto novo.
- `pnpm verificar:navegador` na home, no concurso, na busca e em entrar, a 390
  e 1440 px: sem rolagem lateral e sem erro no console.
- Screenshots da home e do concurso em 1440 e 390, comparados com os
  artboards antes de dar por pronto.

## 7. Entrega

Branch `redesign` no `app-web`, commits por etapa (fundação, casca, home,
concurso, herdadas) e um PR no final. Nada vai para produção sem aprovação.

## Fora do escopo (trabalho futuro)

Salvos, classificação por área, alto contraste e tamanho de fonte, alerta por
e-mail de verdade, páginas de Previstos, Diário Oficial e Áreas, lembrete
("Lembrar amanhã", "Avisar").
