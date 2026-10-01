import type { ArtigoDetalhe, PaginaDeArtigos } from "@/lib/artigos";
/** Fixture exclusiva dos testes; nenhuma página a importa. */
export const artigoDeTeste: ArtigoDetalhe = {
  slug: "analise-teste", tipo: "concurso", titulo: "Análise <script>alert(1)</script>", descricao: "Descrição & contexto",
  noticia: true, minutosDeLeitura: 4, publicadoEm: "2026-09-30T12:00:00Z", atualizadoEm: "2026-10-01T12:00:00Z",
  uf: "SP", ufs: ["SP"], escolaridade: null, periodo: null, concursoSlug: "concurso-antigo", orgao: null,
  trecho: [{ texto: "<img src=x onerror=alert(1)>", destaque: true }], lide: "Leia <b>com atenção</b>",
  emResumo: ["Resumo <script>"], secoes: [{ titulo: "O que observar", blocos: [{ tipo: "paragrafo", texto: "Texto <iframe>" }, { tipo: "lista", itens: ["Item <b>"] }, { tipo: "dado", qual: "cargos" }, { tipo: "dado", qual: "cronograma" }, { tipo: "dado", qual: "concursos" }] }],
  concursosCitados: ["concurso-antigo", "concurso-ausente"],
};
export const paginaDeTeste: PaginaDeArtigos = {
  itens: [artigoDeTeste], pagina: 1, porPagina: 12, total: 25, totalDePaginas: 3,
  contagemPorTipo: { concurso: 25, semanal_nacional: 0, semanal_uf: 0, prazos_semana: 0, mensal_escolaridade: 0 },
};
