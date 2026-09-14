import Link from "next/link";
import { BlocoDeNumeros, Cartao, Numero, Selo } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import type { ConcursoResumo } from "@/lib/dominio";
import {
  dataCurta,
  dataLonga,
  moeda,
  moedaExata,
  numero,
  quantidade,
} from "@/lib/formato";
import {
  ROTULO_ESCOLARIDADE,
  cargosDoCartao,
  etiquetasDeVagas,
  linhaDeContexto,
} from "@/lib/rotulos";
import { ESTILO_DO_TOM, rotuloDeSituacao, tomDoConcurso } from "@/lib/situacao";

/**
 * O cartão de concurso, unidade central do produto.
 *
 * Tudo que decide se vale a pena clicar cabe aqui: quem abre a vaga, em que
 * situação está, quantas vagas, quanto paga, até quando dá para se
 * inscrever e quanto custa a taxa. Os números vão para um bloco rebaixado
 * e usam figuras de largura fixa, então alinham em coluna e leem como tabela.
 */
export function CartaoConcurso({
  concurso,
  hoje,
}: {
  concurso: ConcursoResumo;
  hoje?: Date;
}) {
  const tom = tomDoConcurso(concurso, hoje);
  const estilo = ESTILO_DO_TOM[tom];
  const escolaridadeMaisAlta = concurso.escolaridades[0];
  const vagas = etiquetasDeVagas(concurso);
  // Passa por `quantidade()` pela mesma razão das etiquetas: o tipo diz
  // `number | null`, mas quem preenche é o JSON de outro processo. Sem a
  // guarda, um campo que não veio sairia como "NaN" numa casa de número — e
  // um número inventado é pior aqui do que em qualquer outro lugar da tela.
  const vagasDoAto = quantidade(concurso.vagas);
  const cargos = cargosDoCartao(concurso.nomesDeCargo);

  return (
    <Cartao tom={tom} as="article" className="flex flex-col gap-2.5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Selo sigla={concurso.orgao.sigla} tom={tom} />
          <div className="min-w-0">
            <h3 className="font-titulo text-[15px] leading-6 font-semibold tracking-tight">
              <Link
                href={`/concursos/${concurso.slug}`}
                className="hover:underline hover:underline-offset-4"
              >
                {concurso.orgao.nome}
              </Link>
            </h3>
            <p className={`truncate text-[12px] ${estilo.apoio}`}>
              {linhaDeContexto(concurso.orgao)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm font-medium text-tinta-800">{concurso.titulo}</p>

      {/*
        Os cargos, acima da fileira de etiquetas porque pesam mais que
        escolaridade e banca: o nome do cargo é o que a pessoa digitou na
        busca, e `titulo` não o contém — no acervo real ele é o cabeçalho do
        ato ("… — Edital nº 22/2026").

        Linha rotulada e desenhada sempre, inclusive nos 354 cartões sem
        cargo, pela regra que também governa a casa "Vagas": só um lugar fixo
        consegue mostrar que falta dado. `min-w-0` no texto porque o rótulo é
        `shrink-0`. O `line-clamp-3` é cinto de segurança, não a regra: quem
        garante que o "e mais 12" não seja o pedaço cortado é o orçamento de
        84 caracteres de `cargosDoCartao`. Três linhas e não duas porque a
        375px 84 caracteres cabem em duas (medido: 47 por linha) e a 320px
        não — e uma margem que só aparece abaixo do alvo não custa altura
        nenhuma no alvo.
      */}
      <div className="flex gap-2">
        <span className="shrink-0 text-[10px] leading-[18px] font-semibold tracking-[0.06em] uppercase text-tinta-500">
          Cargos
        </span>
        <p
          className={`line-clamp-3 min-w-0 text-[12px] leading-[18px] ${
            cargos.informado ? "text-tinta-800" : estilo.apoio
          }`}
        >
          {cargos.texto}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta tom={tom} comPonto>
          {rotuloDeSituacao(concurso, hoje)}
        </Etiqueta>
        {escolaridadeMaisAlta && (
          <Etiqueta>{ROTULO_ESCOLARIDADE[escolaridadeMaisAlta]}</Etiqueta>
        )}
        {/*
          Antes da banca, e depois da escolaridade: a ordem relativa das três
          etiquetas que já existiam não muda, e as de vaga entram na frente da
          única que não decide nada (a banca). A 375px a fileira quebra em
          linhas, e o que cai para a segunda linha importa — é por isso que a
          posição foi escolhida e não sorteada.
        */}
        {vagas.map((etiqueta) => (
          <Etiqueta key={etiqueta}>{etiqueta}</Etiqueta>
        ))}
        {concurso.banca && <Etiqueta>Banca: {concurso.banca.nome}</Etiqueta>}
      </div>

      <BlocoDeNumeros className="grid-cols-2 sm:grid-cols-4">
        {/*
          Só o número, ou a ausência dele. O cadastro de reserva saiu daqui e
          virou etiqueta: "CR" é jargão de edital e estava numa casa de
          número, onde parecia uma quantidade. E manter os dois seria repetir
          na fileira o que o bloco já diz — a divisão é a de
          `etiquetasDeVagas`: o bloco diz quantas, a etiqueta diz para quem.

          Esta casa é o único lugar da busca onde a ausência de vaga aparece
          como ausência, e ela aparece em 2.149 dos 3.071 cartões porque o
          rótulo "Vagas" é desenhado mesmo sem número embaixo. É por isso que
          não existe etiqueta apagada de "vagas não informadas": ela repetiria
          aqui, em 70% dos cartões, uma não-informação — e empurraria para a
          segunda linha, no celular, as etiquetas que afirmam alguma coisa.
        */}
        <Numero rotulo="Vagas">
          {vagasDoAto === null ? "a definir" : numero(vagasDoAto)}
        </Numero>
        <Numero rotulo="Salário até">
          {concurso.salarioAte === null ? "a definir" : moeda(concurso.salarioAte)}
        </Numero>
        <Numero rotulo="Inscrições">
          {concurso.inscricoesAte
            ? `até ${dataCurta(concurso.inscricoesAte)}`
            : concurso.previstoPara
              ? `em ${concurso.previstoPara}`
              : "a definir"}
        </Numero>
        <Numero rotulo="Taxa">
          {concurso.taxaInscricao === null
            ? "a definir"
            : moedaExata(concurso.taxaInscricao)}
        </Numero>
      </BlocoDeNumeros>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-[12px] ${estilo.apoio}`}>
          {concurso.publicadoEm
            ? `Publicado em ${dataLonga(concurso.publicadoEm)}`
            : "Sem edital publicado"}
        </p>
        <Link
          href={`/concursos/${concurso.slug}`}
          className="text-[12px] font-semibold text-link underline underline-offset-4 hover:text-link-hover"
        >
          Ver detalhes
        </Link>
      </div>
    </Cartao>
  );
}
