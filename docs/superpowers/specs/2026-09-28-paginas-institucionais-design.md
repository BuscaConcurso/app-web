# Páginas institucionais

Data: 28 de setembro de 2026. Só `app-web`.

## 1. O que resolve

A barra utilitária e o rodapé levam "Como lemos os editais", "Acessibilidade"
e "Contato" para `/em-breve/...`. São páginas de texto, e cada uma sustenta uma
promessa do site: que o dado é conferido, que o site funciona para todos, e
que dá para apontar erro.

## 2. Páginas

Todas estáticas, servidor, com trilha, metadados, `sitemap` e o mesmo layout
de texto longo (coluna de até 68 caracteres, títulos `h2`).

**`/como-lemos-os-editais`**

1. Onde procuramos: sites das bancas organizadoras e o Diário Oficial da União,
   todo dia útil.
2. O que lemos: o edital e os atos que o alteram; o que um edital costuma ter e
   o que o Diário publica sem anexo.
3. Como transformamos em página: a leitura automática do texto e as regras que
   reprovam leitura errada (data impossível, salário abaixo do piso, cargo sem
   nome).
4. O que conferimos: órgão, estado e a ligação com o ato no Diário; o selo
   "Conferido por nós" quer dizer isso e só isso.
5. O que pode estar errado e como avisar: o botão "Esta página está certa?" e o
   contato. O edital publicado sempre prevalece.

O texto sai dos specs do engine e não promete o que o motor não faz. Os números
(quantas bancas, quantos concursos) vêm do acervo em tempo de build, não
escritos à mão.

**`/acessibilidade`**

O que o site tem hoje: alto contraste e tamanho da fonte na barra utilitária
(e onde ficam guardados), navegação por teclado com foco visível, textos
alternativos, regiões vivas para avisos, zoom até 200% sem perder conteúdo.
O que ainda não tem, dito com franqueza. Como reportar problema: o e-mail de
contato, com o pedido de dizer página, navegador e tecnologia assistiva.

**`/contato`**

`contato@buscaconcurso.com.br` como link `mailto:`, e para que escrever:
erro de leitura num concurso (com o link da página), problema de
acessibilidade, dúvida sobre a conta. Uma linha dizendo que não respondemos
dúvida sobre edital específico (quem responde é a banca).

## 3. Links e "em breve"

- `BarraUtilitaria` e `Rodape` apontam para as rotas novas.
- `RECURSOS_EM_BREVE` perde `como-lemos`, `acessibilidade` e `contato`; os
  endereços `/em-breve/...` antigos redirecionam.
- O e-mail fica numa constante em `src/lib/site.ts`, usada pelas três páginas.

## 4. Testes

`pnpm verificar` (inclui o teste que proíbe travessão nos textos), um teste que
confere que nenhum link do site aponta mais para os recursos removidos de
`RECURSOS_EM_BREVE`, e a conferência visual das três páginas no navegador.

## 5. Fora de escopo

Formulário de contato, central de ajuda, termos de uso e política de
privacidade (que merecem texto revisado por quem responde por eles).
