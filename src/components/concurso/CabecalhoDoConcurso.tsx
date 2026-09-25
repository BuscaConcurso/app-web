import Link from "next/link";
import { AcoesDoConcurso } from "@/components/concurso/AcoesDoConcurso";
import { Selo } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import type { ConcursoDetalhe } from "@/lib/dominio";
import { icsDoPrazo } from "@/lib/agenda";
import { prazoPorExtenso } from "@/lib/inscricao";
import { NOME_UF, ROTULO_ESFERA, ROTULO_STATUS, tituloSemOrgao } from "@/lib/rotulos";
import { urlAbsoluta } from "@/lib/site";
import { rotuloDeSituacao, tomDoConcurso } from "@/lib/situacao";

/**
 * O cabeçalho da página do concurso: `Concurso.dc.html:62-89`.
 *
 * O selo grande do órgão, a pílula de situação (com o prazo por extenso
 * quando o tom é urgente), as etiquetas de esfera/UF/área, o título do
 * cargo em destaque, a linha "{órgão} · {ato}" e as três ações à direita.
 *
 * `ESCOLARIDADE` já tem cartão próprio em `FatosDoConcurso`, e por isso não
 * repete etiqueta aqui: as etiquetas deste cabeçalho são só o que o resumo
 * de fatos não cobre.
 */
export function CabecalhoDoConcurso({
  concurso,
  hoje,
}: {
  concurso: ConcursoDetalhe;
  hoje: Date;
}) {
  const tom = tomDoConcurso(concurso, hoje);
  // No cartão de lista a pílula é só o status ou só o prazo (`rotuloDeSituacao`
  // já escolhe um dos dois). Aqui, com mais espaço, os dois aparecem juntos no
  // tom urgente: "Inscrições abertas · encerram amanhã" (`Concurso.dc.html:67`).
  //
  // O verbo concorda com "Inscrições" (plural), não com `prazoPorExtenso`, que
  // fica com "Encerra ..." (singular) para os outros lugares que o chamam
  // sozinho, sem o sujeito "Inscrições" na frase. A composição é só desta
  // pílula, por isso não mexe em `prazoPorExtenso`.
  const prazo = prazoPorExtenso(concurso, hoje);
  const prazoNoPlural = prazo?.titulo.toLowerCase().replace(/^encerra\b/, "encerram");
  const situacao =
    tom === "urgente" && prazoNoPlural
      ? `${ROTULO_STATUS[concurso.status]} · ${prazoNoPlural}`
      : rotuloDeSituacao(concurso, hoje);

  const titulo = concurso.nomesDeCargo[0] ?? tituloSemOrgao(concurso.titulo, concurso.orgao);
  const ato = tituloSemOrgao(concurso.titulo, concurso.orgao);
  const area = concurso.cargos[0]?.area;
  const ics = icsDoPrazo(concurso, urlAbsoluta(`/concursos/${concurso.slug}`));

  return (
    <header className="relative overflow-hidden rounded-painel bg-cartao p-5 shadow-cartao md:px-10 md:py-9">
      {/*
        O canto de azulejos do protótipo (`Concurso.dc.html:78-85`) pede
        1216px de header (`Main.dc.html`, sangria de 112px a 1440px) para
        abrir espaço ao lado do título sem cobri-lo. Esta página é a coluna
        estreita de `max-w-[880px]` (Task 9), onde esse espaço não existe: um
        título de duas linhas passaria por baixo do canto. Fica de fora até a
        Task 13, que muda o container da página para a largura do protótipo.
      */}
      <div className="flex items-start gap-4 md:gap-8">
        <div className="md:hidden">
          <Selo sigla={concurso.orgao.sigla} tamanho={44} />
        </div>
        <div className="hidden md:block">
          <Selo sigla={concurso.orgao.sigla} tamanho={72} />
        </div>

        {/* `max-w-[760px]` no md+: o teto de largura da coluna de texto do
            protótipo, para o título e a linha do órgão não esticarem até a
            borda do cartão. */}
        <div className="flex min-w-0 grow flex-col gap-3 md:max-w-[760px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <Etiqueta tom={tom} comPonto>
              {situacao}
            </Etiqueta>
            {concurso.orgao.esfera && (
              <Etiqueta icone="estatais">{ROTULO_ESFERA[concurso.orgao.esfera]}</Etiqueta>
            )}
            {concurso.uf && <Etiqueta icone="local">{NOME_UF[concurso.uf]}</Etiqueta>}
            {area && <Etiqueta icone="areas">{area}</Etiqueta>}
          </div>

          <h1 className="font-titulo text-[30px] leading-[1.08] font-bold tracking-[-0.03em] break-words text-balance md:text-[48px] md:leading-[1.04] md:tracking-[-0.035em]">
            {titulo}
          </h1>

          <div className="text-[17px] leading-[1.5] text-tinta-600">
            <Link href={`/orgaos/${concurso.orgao.slug}`} className="hover:underline hover:underline-offset-4">
              {concurso.orgao.nome}
            </Link>
            {" · "}
            {ato}
          </div>

          <div className="mt-2">
            <AcoesDoConcurso slug={concurso.slug} titulo={titulo} ics={ics} />
          </div>
        </div>
      </div>
    </header>
  );
}
