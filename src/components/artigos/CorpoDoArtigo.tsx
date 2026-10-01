import Link from "next/link";
import type { ArtigoDetalhe, Bloco } from "@/lib/artigos";
import { Cargos } from "@/components/concurso/Cargos";
import { Cronograma } from "@/components/concurso/Cronograma";
import { rotuloDeSituacao } from "@/lib/situacao";
import { paraDataLocal } from "@/lib/formato";
import type { DadosVivosDoArtigo } from "./dadosVivos";

export function ConcursosCitados({ vivos, hoje }: { vivos: DadosVivosDoArtigo; hoje: string }) {
  if (!vivos.citados.length) return <p className="text-base text-tinta-600">Dados atuais indisponíveis para os concursos citados. Consulte os editais oficiais.</p>;
  return <ul className="divide-y divide-linha text-base">{vivos.citados.map(concurso => <li key={concurso.slug} className="space-y-1 py-4"><Link className="font-semibold text-link underline" href={`/concursos/${concurso.slug}`}>{concurso.titulo}</Link><p className="text-tinta-600">{rotuloDeSituacao(concurso, paraDataLocal(hoje))}</p></li>)}</ul>;
}

function QuadroAtual({ qual, vivos, hoje }: { qual: Extract<Bloco, { tipo: "dado" }>["qual"]; vivos: DadosVivosDoArtigo; hoje: string }) {
  const concurso = vivos.principal;
  return <div className="my-8 min-w-0 rounded-cartao border border-linha bg-cartao p-4 sm:p-6">
    <p className="mb-5 text-sm font-medium text-verde-texto">Dados atuais do acervo, consultados em {hoje.split("-").reverse().join("/")}. Podem ter mudado desde a publicação.</p>
    {qual === "concursos" ? <ConcursosCitados vivos={vivos} hoje={hoje} /> : !concurso ? <p className="text-base text-tinta-600">Dados atuais indisponíveis. Confira a fonte oficial antes de se inscrever.</p> : qual === "cargos" ? concurso.cargos.length ? <Cargos cargos={concurso.cargos} /> : <p className="text-base text-tinta-600">O acervo ainda não informa os cargos deste concurso.</p> : concurso.cronograma.length ? <Cronograma eventos={concurso.cronograma} hoje={hoje} hrefBaseDaOrigem={`/concursos/${concurso.slug}`} /> : <p className="text-base text-tinta-600">O acervo ainda não informa o cronograma deste concurso.</p>}
  </div>;
}

export function CorpoDoArtigo({ artigo, vivos, hoje }: { artigo: ArtigoDetalhe; vivos: DadosVivosDoArtigo; hoje: string }) {
  return <div className="space-y-10 text-lg leading-[1.85] text-tinta-900">
    {artigo.secoes.map((secao, i) => <section key={i} id={`secao-${i + 1}`} className="scroll-mt-8 space-y-5">
      <h2 className="font-titulo text-3xl font-bold leading-tight">{secao.titulo}</h2>
      {secao.blocos.map((bloco, j) => bloco.tipo === "paragrafo" ? <p key={j}>{bloco.texto}</p> : bloco.tipo === "lista" ? <ul key={j} className="list-disc space-y-2 pl-6 marker:text-acao">{bloco.itens.map((item, k) => <li key={k}>{item}</li>)}</ul> : <QuadroAtual key={j} qual={bloco.qual} vivos={vivos} hoje={hoje} />)}
    </section>)}
  </div>;
}
