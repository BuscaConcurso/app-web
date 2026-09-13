import type { AvisoDoAcervo } from "@/lib/concursos";
import { numero } from "@/lib/formato";

/**
 * O que a lista não está mostrando, dito em voz baixa.
 *
 * A lista traz só os concursos que já têm cargo ou evento extraído. Os outros
 * existem no acervo e ainda não foram lidos pelo modelo — hoje são 9.309 de
 * 9.311 —, e uma tela que mostra dois concursos sem dizer isso afirma, por
 * omissão, que o acervo tem dois. Não é "não há mais resultados": é "ainda
 * não lemos o resto".
 *
 * Cinza e não amarelo de propósito. O amarelo desta página é um só, o do
 * `BlocoAlerta` logo abaixo; dois amarelos e nenhum dos dois chama.
 */
export function AcervoIncompleto({ aviso }: { aviso: AvisoDoAcervo }) {
  return (
    <p className="rounded-caixa bg-cartao px-6 py-5 text-sm leading-6 text-tinta-600">
      Outros{" "}
      <strong className="numero font-medium text-tinta-900">
        {numero(aviso.semDado)}
      </strong>{" "}
      dos {numero(aviso.total)} concursos do acervo ainda não foram lidos: o
      diário oficial publicou o ato, e o cargo, as vagas e o cronograma ainda
      não foram extraídos do documento. Eles entram na lista conforme forem
      lidos.
    </p>
  );
}

/**
 * A chamada única da tela.
 *
 * É o único amarelo da home, e por isso ele funciona. Dois amarelos numa
 * página e nenhum dos dois chama. O texto do botão sempre carrega o número,
 * porque "criar alerta" é abstrato e "avisar sobre 184 concursos" não é.
 */
export function BlocoAlerta({ totalAbertos }: { totalAbertos: number }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <div className="flex flex-col items-start gap-5 rounded-caixa bg-amarelo px-7 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em] text-amarelo-texto">
            Receba os {numero(totalAbertos)} concursos abertos por e-mail
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-5 text-amarelo-texto/75">
            Salvamos a sua busca e avisamos assim que sair edital novo, sem
            custo. Um e-mail por dia, no máximo, e só quando houver novidade.
          </p>
        </div>

        <form
          action="/concursos"
          method="get"
          className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <label htmlFor="alerta-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="alerta-email"
            name="email"
            type="email"
            required
            placeholder="voce@email.com"
            className="h-12 w-full rounded-controle bg-cartao px-3.5 text-sm text-tinta-900 outline-none placeholder:text-tinta-400 sm:w-[16rem]"
          />
          <button
            type="submit"
            className="h-12 shrink-0 rounded-controle bg-inverso px-6 text-[13px] font-semibold text-inverso-texto transition-colors hover:bg-inverso-hover"
          >
            Criar alerta grátis
          </button>
        </form>
      </div>
    </section>
  );
}
