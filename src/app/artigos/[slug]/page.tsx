import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarArtigos, obterArtigo } from "@/lib/artigos";
import { metadataDoArtigo, artigoEstruturado, imagemDoArtigo } from "@/lib/artigosSeo";
import { ROTULO_TIPO_ARTIGO } from "@/lib/artigosConsulta";
import { hojeEmSaoPaulo, moeda, numero, paraDataLocal } from "@/lib/formato";
import { rotuloDeSituacao } from "@/lib/situacao";
import { DadosEstruturados } from "@/components/ui/DadosEstruturados";
import { Trilha } from "@/components/ui/Trilha";
import { CartaoArtigo, DataEditorial } from "@/components/artigos/CartaoArtigo";
import { CorpoDoArtigo, ConcursosCitados } from "@/components/artigos/CorpoDoArtigo";
import { carregarDadosDoArtigo } from "@/components/artigos/dadosVivos";
import { FontesDoArtigo } from "@/components/artigos/FontesDoArtigo";

type Props = { params: Promise<{ slug: string }> };

/**
 * Estática, gerada na primeira visita e servida do cache, como a busca por
 * termo: sem isto cada visita refazia todas as leituras (4 s num resumo com
 * 30 concursos). O texto do artigo fica guardado por um dia; os cinco minutos
 * são dos quadros de situação atual, que dependem do dia. Por ser estática,
 * nenhuma leitura daqui pode ser `no-store`.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artigo = await obterArtigo((await params).slug);
  if (!artigo) notFound();
  return metadataDoArtigo(artigo);
}

export default async function PaginaDoArtigo({ params }: Props) {
  const artigo = await obterArtigo((await params).slug);
  if (!artigo) notFound();
  const [vivos, relacionados] = await Promise.all([
    carregarDadosDoArtigo(artigo),
    listarArtigos({ pagina: 1, tipo: artigo.tipo, ...(artigo.uf ? { uf: artigo.uf } : {}) }, { validadeS: revalidate }),
  ]);
  const hoje = hojeEmSaoPaulo();
  const concurso = vivos.principal;
  const leiaTambem = relacionados.itens.filter(item => item.slug !== artigo.slug).slice(0, 3);
  const temQuadroDeCitados = artigo.secoes.some(secao => secao.blocos.some(bloco => bloco.tipo === "dado" && bloco.qual === "concursos"));
  const dadosEstruturados = artigoEstruturado(
    { ...artigo, concursoSlug: concurso?.slug ?? null },
    vivos.citados.length ? vivos.citados.map(({ slug, titulo }) => ({ slug, titulo })) : undefined,
  );
  return <div className="conteudo pb-12">
    <DadosEstruturados dados={dadosEstruturados} />
    <Trilha degraus={[{ nome: "Início", href: "/" }, { nome: "Artigos", href: "/artigos" }, { nome: artigo.titulo, href: `/artigos/${artigo.slug}` }]} />
    <article>
      <header className="max-w-4xl space-y-5 pb-8 pt-7">
        <p className="font-medium text-verde-texto">{ROTULO_TIPO_ARTIGO[artigo.tipo]}{artigo.uf ? ` • ${artigo.uf}` : ""}</p>
        <h1 className="font-titulo text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl">{artigo.titulo}</h1>
        <p className="max-w-[65ch] text-xl leading-relaxed text-tinta-600">{artigo.lide}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-tinta-600"><Link href="/artigos/como-escrevemos#redacao" className="font-semibold text-link underline">Redação BuscaConcurso</Link><span>{artigo.minutosDeLeitura} min de leitura</span></div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-tinta-600"><p>Publicado em <DataEditorial iso={artigo.publicadoEm} /></p><p>Atualizado em <DataEditorial iso={artigo.atualizadoEm} /></p></div>
      </header>
      <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
        <div className="min-w-0 max-w-[72ch] space-y-10">
          <Image unoptimized src={imagemDoArtigo(artigo.slug, "16x9")} width={1200} height={675} alt={`Capa editorial: ${artigo.titulo}`} className="h-auto w-full rounded-cartao" />
          {artigo.emResumo.length > 0 && <section className="border-l-4 border-ouro-faixa bg-rebaixada p-6"><h2 className="font-titulo text-2xl font-bold">Em resumo</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-lg leading-relaxed">{artigo.emResumo.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
          <CorpoDoArtigo artigo={artigo} vivos={vivos} hoje={hoje} />
          {!temQuadroDeCitados && artigo.concursosCitados.length > 0 && <section><h2 className="font-titulo text-2xl font-bold">Concursos citados</h2><p className="mt-2 text-sm text-tinta-600">Situação atual do acervo em {hoje.split("-").reverse().join("/")}.</p><ConcursosCitados vivos={vivos} hoje={hoje} /></section>}
          {vivos.indisponiveis > 0 && <p className="rounded-controle bg-rebaixada p-4 text-sm text-tinta-600">Parte dos dados atuais não está disponível nesta leitura. O texto acima retrata a publicação editorial; confirme a situação na fonte oficial.</p>}
          <section className="space-y-4 border-t border-linha pt-8"><h2 className="font-titulo text-2xl font-bold">Fonte e edital</h2><FontesDoArtigo concurso={concurso} />{!concurso && vivos.citados.map(citado => <div key={citado.slug} className="space-y-3"><h3 className="font-semibold">{citado.titulo}</h3><FontesDoArtigo concurso={citado} /></div>)}</section>
          <section className="space-y-3 rounded-cartao bg-rebaixada p-6 text-base leading-relaxed"><h2 className="font-titulo text-2xl font-bold">Como este texto foi feito</h2><p>Texto gerado com DeepSeek a partir dos dados capturados de concursos e atos oficiais, com verificações automáticas. Pode conter erros e não substitui o edital.</p><Link href="/artigos/como-escrevemos" className="text-link underline">Conheça o método e como avisar de um erro</Link></section>
        </div>
        <aside className="min-w-0 space-y-8 lg:sticky lg:top-6">
          {concurso && <section className="space-y-4 rounded-cartao border border-linha bg-cartao p-5"><h2 className="font-titulo text-2xl font-bold">Concurso agora</h2><p className="text-sm text-tinta-600">Consulta ao acervo em {hoje.split("-").reverse().join("/")}, independente da data do artigo.</p><p className="font-medium text-verde-texto">{rotuloDeSituacao(concurso, paraDataLocal(hoje))}</p><dl className="space-y-3"><div><dt className="text-sm text-tinta-600">Vagas</dt><dd className="font-semibold">{concurso.vagas === null ? "Não informadas" : numero(concurso.vagas)}</dd></div><div><dt className="text-sm text-tinta-600">Remuneração até</dt><dd className="font-semibold">{concurso.salarioAte === null ? "Não informada" : moeda(concurso.salarioAte)}</dd></div></dl><Link href={`/concursos/${concurso.slug}`} className="block font-semibold text-link underline">Ver a ficha do concurso</Link><Link href={`/orgaos/${concurso.orgao.slug}`} className="block text-sm text-link underline">{concurso.orgao.nome}</Link></section>}
          {artigo.uf && <Link href={`/artigos?uf=${encodeURIComponent(artigo.uf)}`} className="block text-link underline">Mais artigos de {artigo.uf}</Link>}
          {artigo.secoes.length > 1 && <nav aria-label="Neste artigo" className="space-y-3"><h2 className="font-titulo text-xl font-bold">Neste artigo</h2><ol className="space-y-3 text-sm">{artigo.secoes.map((secao, i) => <li key={i}><a href={`#secao-${i + 1}`} className="text-link hover:underline">{secao.titulo}</a></li>)}</ol></nav>}
        </aside>
      </div>
    </article>
    {leiaTambem.length > 0 && <section className="mt-16 border-t border-linha pt-8"><h2 className="mb-6 font-titulo text-3xl font-bold">Leia também</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{leiaTambem.map(item => <CartaoArtigo key={item.slug} artigo={item} />)}</div></section>}
  </div>;
}
