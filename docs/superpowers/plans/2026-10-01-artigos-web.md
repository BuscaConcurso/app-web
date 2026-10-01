# Artigos: páginas e indexação

Plano de execução da spec aprovada em `../engine/docs/superpowers/specs/2026-09-30-artigos-design.md`. Trabalho isolado na branch artigos, a partir de 7523cd9. O checkout app-web original fica preservado.

## Contrato e decisões

- A API entrega `itens`, `porPagina`, `totalDePaginas`, `contagemPorTipo`; copiar os tipos de `../api/src/contexts/artigos/domain/model.ts`, sem importar entre repositórios.
- BC_API_URL já inclui /v1. Artigos não usam geração no navegador ou por visita. Nenhuma chamada DeepSeek nesta camada.
- Sem API, catálogo vazio e detalhe ausente. Fixtures são só para testes e prévia local explícita; nunca artigos fictícios indexáveis em produção.
- API configurada indisponível é erro, não catálogo vazio. 404 de detalhe é ausência. Falhas dos dados vivos não viram números inventados.
- Prosa e destaques são texto React escapado, nunca HTML do modelo. A situação atual dos concursos aparece separada da data editorial.
- Novas páginas reutilizam tokens, tipografia, Trilha, Paginacao e componentes existentes. Capa editorial verde, papel claro, detalhes dourados; telas responsivas.
- Google News considera a publicação original nas últimas 48 horas, no máximo 1000 notícias por arquivo, namespace news e idioma pt. Datas futuras ficam fora. Não renovar a publicação quando o artigo mudar.
- O sitemap geral mantém os artigos antigos com lastModified editorial real. Não modificar o comportamento dos concursos existentes nesta feature.
- JSON-LD NewsArticle/Article, sem FAQPage ou JobPosting. Autor organizacional Redação BuscaConcurso com página de método, editor BuscaConcurso, imagens próprias em três proporções, datas e conteúdo condizentes com a tela.
- Nenhuma promessa de revisão humana, veracidade garantida, indexação ou ranking. Informar DeepSeek, dados capturados, verificações automáticas e possibilidade de erro.

## Task 1: dados e consultas

Criar src/lib/artigos.ts com tipos exportados ArtigoResumo, ArtigoDetalhe, TipoDeArtigo, PaginaDeArtigos, EntradaDoMapa e funções listarArtigos(filtro), obterArtigo(slug), mapaDeArtigos(). Contrato da API é a fonte dos nomes. Consultas inválidas da UI normalizadas por helper testável, busca até 200 caracteres, paginação inteira segura, filtros conhecidos. Testar serialização, ausência, falhas e busca escapada. Não mascarar exceções de Next.

## Task 2: páginas e componentes

Criar src/components/artigos/* e páginas /artigos, /artigos/busca, /artigos/[slug], /artigos/como-escrevemos, error e loading. Capa com destaque e cards, formulário GET com busca, tipo, UF e ordem, paginação preservando consulta. Busca noindex/follow, páginas além do fim 404. Detalhe com resumo, seções, tempo, autor, método, fonte oficial, dados vivos do concurso (cargos, cronograma) e citados. Usar dados atuais obtidos pelos helpers de concursos, respeitar ausência e aliases. Relacionados por tipo/UF quando disponível sem carregar todos os detalhes. Nav e rodapé com Artigos.

## Task 3: metadados, imagens e dados estruturados

Criar src/lib/artigosSeo.ts e testes. Exportar metadataDoArtigo(artigo), artigoEstruturado(artigo, citadosVisiveis?), colecaoDeArtigos(artigos, caminho), imagemDoArtigo(slug, formato?). Criar /artigos/[slug]/capa/[formato]/route.tsx com ImageResponse, formatos 16x9, 4x3, 1x1 com largura 1200, azulejo e selo tipográfico (sem fingir selo oficial). Páginas incorporam helpers e DadosEstruturados, canonical próprio e datas ISO. Organization raiz ganha logo público existente adequado.

## Task 4: mapas e descoberta

Criar src/lib/sitemapNoticias.ts testável e /sitemap-noticias.xml/route.ts. XML seguro, datas reais, filtro temporal, erro de backend 503 e Retry-After, XML vazio válido quando não há notícia. Dividir em arquivos de até 1000 quando necessário, com índice no endereço principal. Integrar artigos ao sitemap comum e robots. A rota de imagem devolve 404 para artigo ausente e não congela artigo despublicado. Testar escape, limites 48h/1000, atualização sem reciclar data, não notícia, futuro e erro.

## Task 5: integração e verificação

Rodar pnpm verificar e build. Verificar HTTP HTML, JSON-LD e XML, imagem PNG e 404, e telas a 390px e desktop com fixture explícita fora de produção se API local não estiver disponível. Revisão independente do diff final. Documentar ordem de implantação engine, API, web e manter pauta desligada até implantação e validação dos resumos.

## Execução

- Baseline: 84 arquivos, 756 testes passaram antes das mudanças.
- Interface e dados podem avançar em arquivos separados da implementação de SEO; cada write set tem um responsável.
- Ruling: artigos históricos usam o sitemap comum dedicado /sitemap-artigos.xml, descoberto por robots.txt. Assim o teto de 50000 artigos da API não se soma às URLs de concursos do sitemap preexistente. A API ainda limita o catálogo do mapa aos 50000 artigos mais recentes; ultrapassar esse volume exigirá paginação própria.
- Ruling: indisponibilidade da API nos sitemaps retorna 503 com Retry-After, para não representar uma falha temporária como remoção de todas as URLs. Ausência real de notícias retorna XML vazio válido.
- Ruling: retirado loading.tsx dos artigos após verificar HTTP 200 em páginas ausentes. Sem antecipar streaming, artigo inexistente e página além do fim respondem 404 real. O bloco complementar na ficha do concurso usa Suspense próprio para não atrasar a ficha.
- Ruling: partes do sitemap News usam prefixos SHA256 do slug, não offsets. Uma despublicação não desloca notícias ainda não lidas pelo robô. Parte que cresce além do limite responde503 enquanto o índice atual anuncia suas subdivisões.
- Consultar documentação bundled do Next 16 antes de usar suas APIs.
- Sem .env, segredos, deploy, merge ou alterações no checkout original. Temporários dentro de .superpowers/tmp no disco principal.
