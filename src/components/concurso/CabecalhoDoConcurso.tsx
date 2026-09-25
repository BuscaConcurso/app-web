import Link from "next/link";
import { AcoesDoConcurso } from "@/components/concurso/AcoesDoConcurso";
import { Azulejos, CANTO_DO_CABECALHO } from "@/components/marca/Azulejos";
import { Selo } from "@/components/ui/Cartao";
import { ESTILO_DO_PRAZO, tomDoCalendario } from "@/components/ui/Calendario";
import { Etiqueta } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoDetalhe } from "@/lib/dominio";
import { icsDoPrazo } from "@/lib/agenda";
import { periodoDaInscricao, prazoPorExtenso } from "@/lib/inscricao";
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
  // O cartão de urgência do celular (`ConcursoMobile.dc.html:38-41`), só
  // quando há prazo de verdade: sem `inscricoesAte` não há dias para contar,
  // e a pílula de situação logo acima já diz o status nesse caso.
  const periodo = periodoDaInscricao(concurso, hoje);
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
    // Abaixo de `md` o cabeçalho não é cartão (`ConcursoMobile.dc.html:29-35`):
    // mora direto na página, com o selo e a linha do órgão numa fileira e o
    // título embaixo, em largura inteira. A partir de `md` é o cartão de
    // `Concurso.dc.html:63-88`, com o selo de 72px numa coluna própria.
    <header className="relative flex flex-col gap-3.5 md:flex-row md:items-start md:gap-8 md:overflow-hidden md:rounded-painel md:bg-cartao md:px-10 md:py-9 md:shadow-cartao">
      {/*
        O canto de azulejos do protótipo (`Concurso.dc.html:80-87`). `hidden
        lg:grid` porque abaixo disso a coluna de texto já usa a largura
        inteira do cartão e o canto cobriria o título; o `md:max-w-[760px]`
        da coluna de texto é o que garante que um `h1` de duas linhas a
        1440px não passe por baixo dele.
      */}
      <Azulejos
        ladrilhos={CANTO_DO_CABECALHO}
        colunas={3}
        papelDaPagina
        className="absolute top-0 right-0 hidden h-32 w-48 lg:grid"
      />

      <div className="flex items-center gap-2.5 md:hidden">
        <Selo sigla={concurso.orgao.sigla} tamanho={44} />
        <div className="min-w-0 text-[13px] leading-[1.35] text-tinta-600">
          <Link href={`/orgaos/${concurso.orgao.slug}`} className="hover:underline hover:underline-offset-4">
            {concurso.orgao.nome}
          </Link>
          {" · "}
          {ato}
        </div>
      </div>
      <div className="hidden md:block">
        <Selo sigla={concurso.orgao.sigla} tamanho={72} />
      </div>

      {/* `max-w-[760px]` no md+: o teto de largura da coluna de texto do
          protótipo, para o título e a linha do órgão não esticarem até a
          borda do cartão. */}
      <div className="flex min-w-0 grow flex-col gap-3.5 md:max-w-[760px] md:gap-3">
        {/* No celular as etiquetas vêm depois do título
            (`ConcursoMobile.dc.html:31-35`); no desktop, antes. */}
        <div className="order-2 flex flex-wrap items-center gap-1.5 md:order-none">
          <Etiqueta tom={tom} comPonto grande>
            {situacao}
          </Etiqueta>
          {concurso.orgao.esfera && (
            <Etiqueta icone="estatais" grande>{ROTULO_ESFERA[concurso.orgao.esfera]}</Etiqueta>
          )}
          {concurso.uf && <Etiqueta icone="local" grande>{NOME_UF[concurso.uf]}</Etiqueta>}
          {area && <Etiqueta icone="areas" grande>{area}</Etiqueta>}
        </div>

        <h1 className="order-1 font-titulo text-[30px] leading-[1.08] font-bold tracking-[-0.03em] break-words text-balance md:order-none md:text-[48px] md:leading-[1.04] md:tracking-[-0.035em]">
          {titulo}
        </h1>

        <div className="order-3 hidden text-[17px] leading-[1.5] text-tinta-600 md:order-none md:block">
          <Link href={`/orgaos/${concurso.orgao.slug}`} className="hover:underline hover:underline-offset-4">
            {concurso.orgao.nome}
          </Link>
          {" · "}
          {ato}
        </div>

        <div className={ics ? "order-4 md:order-none md:mt-2" : "hidden lg:mt-2 lg:block"}>
          <AcoesDoConcurso slug={concurso.slug} titulo={titulo} ics={ics} />
        </div>

        {prazo && concurso.inscricoesAte && (
          <div className="order-5 md:order-none">
            <CartaoDeUrgencia
              prazo={prazo}
              inscricoesAte={concurso.inscricoesAte}
              periodo={periodo}
              hoje={hoje}
            />
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * O bloco `#FBE7E0` de `ConcursoMobile.dc.html:38-41`: o ícone de prazo numa
 * caixa colorida, o prazo por extenso e a barra de progresso, só abaixo de
 * `lg`. Acima disso a mesma informação já está na lateral
 * (`LateralDoConcurso`), maior e com o botão de inscrição ao lado.
 */
function CartaoDeUrgencia({
  prazo,
  inscricoesAte,
  periodo,
  hoje,
}: {
  prazo: NonNullable<ReturnType<typeof prazoPorExtenso>>;
  inscricoesAte: string;
  periodo: ReturnType<typeof periodoDaInscricao>;
  hoje: Date;
}) {
  const estilo = ESTILO_DO_PRAZO[tomDoCalendario(inscricoesAte, hoje)];

  return (
    <div className={`flex flex-col gap-3 rounded-[18px] p-4 lg:hidden ${estilo.fundo}`}>
      <div className="flex items-center gap-3">
        <span className={`flex size-[42px] shrink-0 items-center justify-center rounded-[12px] ${estilo.icone}`}>
          <Icone nome="prazo" tamanho={22} />
        </span>
        <div>
          <div className={`font-titulo text-[22px] leading-none font-bold tracking-[-0.02em] ${estilo.texto}`}>
            {prazo.titulo}
          </div>
          <div className={`mt-1 text-[13px] ${estilo.texto}`}>{prazo.detalhe}</div>
        </div>
      </div>
      {periodo && (
        <div
          role="progressbar"
          aria-label="Período de inscrição"
          aria-valuenow={periodo.passados}
          aria-valuemin={0}
          aria-valuemax={periodo.total}
          aria-valuetext={`${periodo.passados} de ${periodo.total} dias do período já passaram`}
          className={`h-1.5 overflow-hidden rounded-full ${estilo.trilha}`}
        >
          <span
            className={`block h-full rounded-full ${estilo.barra}`}
            style={{ width: `${periodo.fracao * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
