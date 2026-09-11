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
} from "@/lib/formato";
import { ROTULO_ESCOLARIDADE, linhaDeContexto } from "@/lib/rotulos";
import { ESTILO_DO_TOM, rotuloDeSituacao, tomDoConcurso } from "@/lib/situacao";

/**
 * O cartão de concurso, unidade central do produto.
 *
 * Tudo que decide se vale a pena clicar cabe aqui: quem abre a vaga, em que
 * situação está, quantas vagas, quanto paga, até quando dá para se
 * inscrever e quanto custa a taxa. Os números vão para um bloco rebaixado
 * porque em Spline Sans Mono eles alinham em coluna e leem como tabela.
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

  return (
    <Cartao tom={tom} as="article" className="flex flex-col gap-3.5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Selo sigla={concurso.orgao.sigla} tom={tom} />
          <div className="min-w-0">
            <h3 className="font-titulo text-[17px] leading-6 font-semibold tracking-tight">
              <Link
                href={`/concursos/${concurso.slug}`}
                className="hover:underline hover:underline-offset-4"
              >
                {concurso.orgao.nome}
              </Link>
            </h3>
            <p className={`truncate text-[13px] ${estilo.apoio}`}>
              {linhaDeContexto(concurso.orgao)}
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm font-medium text-tinta-800">{concurso.titulo}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta tom={tom} comPonto>
          {rotuloDeSituacao(concurso, hoje)}
        </Etiqueta>
        {escolaridadeMaisAlta && (
          <Etiqueta>{ROTULO_ESCOLARIDADE[escolaridadeMaisAlta]}</Etiqueta>
        )}
        {concurso.banca && <Etiqueta>Banca: {concurso.banca.nome}</Etiqueta>}
      </div>

      <BlocoDeNumeros className="grid-cols-2 sm:grid-cols-4">
        <Numero rotulo="Vagas">
          {concurso.vagas === null
            ? concurso.cadastroReserva
              ? "CR"
              : "a definir"
            : numero(concurso.vagas)}
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
        <p className={`text-[13px] ${estilo.apoio}`}>
          {concurso.publicadoEm
            ? `Publicado em ${dataLonga(concurso.publicadoEm)}`
            : "Sem edital publicado"}
        </p>
        <Link
          href={`/concursos/${concurso.slug}`}
          className="text-[13px] font-semibold text-verde-700 underline underline-offset-4 hover:text-verde-600"
        >
          Ver detalhes
        </Link>
      </div>
    </Cartao>
  );
}
