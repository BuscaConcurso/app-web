import { numero } from "@/lib/formato";

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
          <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em] text-tinta-900">
            Receba os {numero(totalAbertos)} concursos abertos por e-mail
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-5 text-tinta-900/75">
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
            className="h-12 shrink-0 rounded-controle bg-escura px-6 text-[13px] font-semibold text-white transition-colors hover:bg-tinta-800"
          >
            Criar alerta grátis
          </button>
        </form>
      </div>
    </section>
  );
}
