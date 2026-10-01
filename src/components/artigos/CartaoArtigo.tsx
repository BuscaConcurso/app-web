import Image from "next/image";
import Link from "next/link";
import type { ArtigoResumo } from "@/lib/artigos";
import { ROTULO_TIPO_ARTIGO } from "@/lib/artigosConsulta";
import { imagemDoArtigo } from "@/lib/artigosSeo";

export function DataEditorial({ iso }: { iso: string }) {
  return <time dateTime={iso}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(iso))}</time>;
}

export function CartaoArtigo({ artigo, destaque = false }: { artigo: ArtigoResumo; destaque?: boolean }) {
  return (
    <article className={destaque ? "grid min-w-0 gap-6 overflow-hidden rounded-cartao bg-faixa text-white md:grid-cols-2" : "min-w-0 overflow-hidden rounded-cartao border border-linha bg-cartao"}>
      <Link href={`/artigos/${artigo.slug}`} tabIndex={-1} aria-hidden="true">
        <Image unoptimized src={imagemDoArtigo(artigo.slug, destaque ? "16x9" : "4x3")} alt="" width={1200} height={destaque ? 675 : 900} className="h-auto w-full" />
      </Link>
      <div className={destaque ? "flex flex-col justify-center gap-4 p-6 md:pl-0" : "flex flex-col gap-3 p-5"}>
        <p className={destaque ? "text-sm text-faixa-texto" : "text-sm font-medium text-verde-texto"}>{ROTULO_TIPO_ARTIGO[artigo.tipo]}{artigo.uf ? ` • ${artigo.uf}` : ""}</p>
        <h2 className={`font-titulo font-bold leading-tight ${destaque ? "text-3xl md:text-4xl" : "text-2xl"}`}>
          <Link href={`/artigos/${artigo.slug}`} className="hover:underline">{artigo.titulo}</Link>
        </h2>
        <p className={destaque ? "leading-relaxed text-faixa-texto" : "leading-relaxed text-tinta-600"}>{artigo.descricao}</p>
        {artigo.trecho && <p className="text-sm leading-relaxed">{artigo.trecho.map((trecho, i) => trecho.destaque ? <mark key={i} className="bg-ouro-fundo text-ouro-texto">{trecho.texto}</mark> : <span key={i}>{trecho.texto}</span>)}</p>}
        <p className={`mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-2 text-sm ${destaque ? "text-faixa-texto" : "text-tinta-500"}`}><DataEditorial iso={artigo.publicadoEm} /><span>{artigo.minutosDeLeitura} min de leitura</span></p>
      </div>
    </article>
  );
}
