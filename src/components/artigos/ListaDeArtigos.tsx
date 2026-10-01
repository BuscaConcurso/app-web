import Link from "next/link";
import type { FiltroDeArtigos, PaginaDeArtigos } from "@/lib/artigos";
import { TIPOS_DE_ARTIGO } from "@/lib/artigos";
import { hrefDosArtigos, ROTULO_TIPO_ARTIGO } from "@/lib/artigosConsulta";
import { NOME_UF } from "@/lib/rotulos";
import { Paginacao } from "@/components/ui/Paginacao";
import { CartaoArtigo } from "./CartaoArtigo";

const CAMPO = "mt-1 min-h-11 w-full rounded-controle border border-contorno bg-cartao px-3 text-base text-tinta-900";

export function ListaDeArtigos({ dados, filtro, caminho }: { dados: PaginaDeArtigos; filtro: FiltroDeArtigos; caminho: "/artigos" | "/artigos/busca" }) {
  const destaque = caminho === "/artigos" && filtro.pagina === 1 && !filtro.tipo && !filtro.uf && !filtro.q ? dados.itens[0] : undefined;
  const restante = destaque ? dados.itens.slice(1) : dados.itens;
  return <div className="space-y-8">
    <form action="/artigos/busca" method="get" role="search" aria-label="Buscar artigos" className="grid items-end gap-4 rounded-cartao border border-linha bg-rebaixada p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr_auto]">
      <label className="text-sm font-medium">Buscar artigos<input type="search" name="q" maxLength={200} defaultValue={filtro.q} placeholder="Cargo, órgão ou assunto" className={CAMPO} /></label>
      <label className="text-sm font-medium">Tipo<select name="tipo" defaultValue={filtro.tipo ?? ""} className={CAMPO}><option value="">Todos os tipos</option>{TIPOS_DE_ARTIGO.map(tipo => <option key={tipo} value={tipo}>{ROTULO_TIPO_ARTIGO[tipo]} ({dados.contagemPorTipo[tipo]})</option>)}</select></label>
      <label className="text-sm font-medium">Estado<select name="uf" defaultValue={filtro.uf ?? ""} className={CAMPO}><option value="">Todo o Brasil</option>{Object.entries(NOME_UF).map(([uf, nome]) => <option key={uf} value={uf}>{nome}</option>)}</select></label>
      <label className="text-sm font-medium">Ordem<select name="ordem" defaultValue={filtro.ordem ?? "recentes"} className={CAMPO}><option value="recentes">Mais recentes</option><option value="relevantes">Mais relevantes</option></select></label>
      <button type="submit" className="min-h-11 rounded-controle bg-acao px-5 font-semibold text-acao-texto hover:bg-acao-hover">Buscar</button>
    </form>
    <p className="text-sm text-tinta-600">{dados.total} {dados.total === 1 ? "artigo encontrado" : "artigos encontrados"}{filtro.q ? ` para “${filtro.q}”` : ""}</p>
    {dados.itens.length === 0 ? <div className="max-w-2xl space-y-3 py-10"><h2 className="font-titulo text-2xl font-bold">{filtro.q || filtro.tipo || filtro.uf ? "Nenhum artigo para esta consulta" : "Ainda não há artigos publicados"}</h2><p className="text-tinta-600">{filtro.q || filtro.tipo || filtro.uf ? "Tente outro termo ou remova os filtros." : "Enquanto isso, consulte os concursos e seus editais no acervo."}</p><Link href={filtro.q || filtro.tipo || filtro.uf ? "/artigos" : "/concursos"} className="text-link underline">{filtro.q || filtro.tipo || filtro.uf ? "Ver todos os artigos" : "Consultar concursos"}</Link></div> : <>
      {destaque && <CartaoArtigo artigo={destaque} destaque />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{restante.map(artigo => <CartaoArtigo key={artigo.slug} artigo={artigo} />)}</div>
    </>}
    <Paginacao pagina={filtro.pagina} paginas={dados.totalDePaginas} hrefDe={pagina => hrefDosArtigos(caminho, filtro, pagina)} />
  </div>;
}
