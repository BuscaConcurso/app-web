# Concursos por área

Data: 28 de setembro de 2026. Só `app-web`.

## 1. O que resolve

A home mostra 12 azulejos de área (`src/lib/areas.ts`), e o menu e o rodapé têm
"Por área", que leva a `/em-breve/areas`. Cada azulejo hoje é uma busca por um
termo só (`tribunal`, `policia`...), que erra para os dois lados: "polícia"
pega "Técnico em Polícia Científica" mas perde "Agente Penitenciário"; "banco"
pega "Banco de Talentos" de prefeitura.

## 2. Decisões

- **Tudo no app, sem engine.** O app já tem o acervo inteiro em memória
  (`listarConcursos`, cache de 5 minutos) e a busca local. Classificar no
  engine seria mais certo a longo prazo, mas é um projeto de dados próprio.
  Aqui a regra é explícita, testada e fácil de trocar.
- **Regra por área, não termo.** Cada área ganha `slug` e uma regra:

  ```ts
  interface RegraDaArea {
    orgao?: string[];     // casa no nome ou na sigla do órgão
    cargo?: string[];     // casa em nomesDeCargo
    titulo?: string[];    // casa no título
    exceto?: string[];    // se casar em qualquer campo, fica de fora
  }
  ```

  Casar é por palavra inteira sobre o texto normalizado (minúsculo, sem
  acento), com a normalização que `buscaLocal` já usa. Um concurso pode estar
  em mais de uma área (um tribunal com cargo de TI está em Tribunais e em
  Tecnologia).
- **Todos os concursos do acervo, não só abertos.** A ordem é a mesma da
  busca (abertos primeiro, depois previstos, depois o resto), e a página tem os
  mesmos chips de situação da busca para filtrar.

## 3. Páginas

- `/areas`: os 12 azulejos (o componente `Areas` da home, em versão de página),
  cada um com a contagem de concursos abertos e o total. Servidor, ISR.
- `/areas/[slug]`: título e apoio da área, contagem, `ListaDeConcursos`
  paginada com `Paginacao`, filtro de situação. `generateStaticParams` com os
  12 slugs; slug desconhecido é 404.
- Trilha, metadados (título "Concursos de {área}"), `sitemap` e dados
  estruturados `ItemList`, como a página de órgão.
- Links trocados: azulejos da home (`hrefDaArea` passa a devolver
  `/areas/{slug}`), `itensDaNav`, `Rodape`. `RECURSOS_EM_BREVE` perde `areas`;
  `/em-breve/areas` redireciona para `/areas`.

## 4. Aceite

- Cada área devolve mais de zero concursos no acervo local.
- Para cada área, confiro à mão uma amostra de 10 concursos (ou todos, se
  forem menos) e anoto no plano os falsos positivos encontrados e a regra
  ajustada. Meta: nenhum falso positivo na amostra final.
- Teste de unidade por área com casos reais que devem e que não devem casar,
  tirados dessa conferência.

## 5. Fora de escopo

Classificação no engine, área por cargo dentro do concurso (só o concurso
inteiro entra ou não), áreas escolhidas pela pessoa.
