import type { Metadata } from "next";
import Link from "next/link";
import { Trilha } from "@/components/ui/Trilha";
import { EMAIL_CONTATO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Como escrevemos os artigos",
  description: "De onde vêm os dados, como o DeepSeek gera os textos e quais são os limites das verificações automáticas do BuscaConcurso.",
  alternates: { canonical: "/artigos/como-escrevemos" },
};

export default function ComoEscrevemos() {
  return <div className="conteudo pb-12">
    <Trilha degraus={[{ nome: "Início", href: "/" }, { nome: "Artigos", href: "/artigos" }, { nome: "Como escrevemos", href: "/artigos/como-escrevemos" }]} />
    <article className="max-w-[70ch] space-y-10 pt-8 text-lg leading-[1.85]">
      <header><h1 className="font-titulo text-4xl font-bold leading-tight sm:text-5xl">Como escrevemos os artigos</h1><p className="mt-5 text-xl text-tinta-600">Informação para ajudar na leitura dos concursos, com a origem e os limites à vista.</p></header>
      <section id="redacao" className="space-y-4"><h2 className="font-titulo text-2xl font-bold">Redação BuscaConcurso</h2><p>Redação BuscaConcurso é a assinatura organizacional dos nossos artigos. Os textos são gerados com inteligência artificial, pelo modelo DeepSeek, a partir de dados capturados pelo BuscaConcurso. Essa assinatura não significa que cada artigo passou por revisão humana.</p></section>
      <section className="space-y-4"><h2 className="font-titulo text-2xl font-bold">Da publicação oficial ao texto</h2><p>O ponto de partida são os atos oficiais e as informações extraídas para o acervo: cargos, requisitos, vagas, remunerações e cronograma, quando disponíveis. O texto organiza esse material em análises de concursos e panoramas por período, estado ou escolaridade.</p><p>O artigo é produzido antes de ser publicado. Abrir uma página não gera um novo texto.</p><Link href="/como-lemos-os-editais" className="text-link underline">Como lemos os editais e montamos o acervo</Link></section>
      <section className="space-y-4"><h2 className="font-titulo text-2xl font-bold">O que as verificações automáticas conferem</h2><p>Antes da publicação, verificações automáticas checam a estrutura, o tamanho do texto e se números, datas e valores citados encontram correspondência nos dados usados na geração. Textos reprovados não devem ser publicados.</p><p>Essas verificações não garantem que uma interpretação esteja correta. A captura pode estar incompleta, a extração pode falhar e o modelo pode produzir uma análise equivocada. Não há garantia de veracidade nem promessa de aprovação em concurso.</p></section>
      <section className="space-y-4"><h2 className="font-titulo text-2xl font-bold">Data do artigo e situação atual</h2><p>A data de publicação registra quando o artigo foi publicado pela primeira vez. A de atualização registra mudanças editoriais. Os quadros de cargos, cronograma e concursos citados consultam os dados atuais do acervo e podem divergir de um texto mais antigo.</p><p>Uma retificação pode mudar requisitos e prazos. Antes de se inscrever, leia o edital completo e as retificações no site da banca ou do órgão. O BuscaConcurso não organiza os concursos.</p></section>
      <section className="space-y-4"><h2 className="font-titulo text-2xl font-bold">Encontrou um erro?</h2><p>Envie o endereço do artigo, o trecho em questão e, se possível, o link para a publicação oficial que permite conferir a informação.</p><a href={`mailto:${EMAIL_CONTATO}`} className="text-link underline">{EMAIL_CONTATO}</a><p><Link href="/contato" className="text-link underline">Outras informações de contato</Link></p></section>
    </article>
  </div>;
}
