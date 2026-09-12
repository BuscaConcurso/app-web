import { UFS } from "@/lib/dominio";
import { NOME_UF } from "@/lib/rotulos";

/**
 * A barra de busca.
 *
 * É um `<form method="get">` nativo, sem JavaScript nenhum. Submeter leva a
 * `/concursos?q=...&uf=...`, que é uma URL que o buscador rastreia, que o
 * usuário pode guardar nos favoritos e que funciona antes de qualquer
 * hidratação. Um combobox com autocompletar viria depois, por cima disso, e
 * não no lugar disso.
 */
export function BarraBusca({
  q,
  uf,
  compacta = false,
}: {
  q?: string;
  uf?: string;
  compacta?: boolean;
}) {
  return (
    <form
      action="/concursos"
      method="get"
      role="search"
      className={`flex flex-col gap-2 rounded-caixa bg-cartao sm:flex-row sm:items-center ${
        compacta ? "p-2" : "p-2.5"
      }`}
    >
      <div className="flex flex-1 items-center gap-2.5 rounded-controle px-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="size-[16px] shrink-0 text-tinta-500"
        >
          <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="m13.6 13.6 3.2 3.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <label htmlFor="busca-q" className="sr-only">
          Cargo, órgão ou banca
        </label>
        <input
          id="busca-q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Cargo, órgão ou banca. Ex.: analista judiciário"
          className={`w-full bg-transparent text-tinta-900 outline-none placeholder:text-tinta-400 ${
            compacta ? "h-10 text-sm" : "h-12 text-[13px]"
          }`}
        />
      </div>

      <div className="flex gap-2">
        <label htmlFor="busca-uf" className="sr-only">
          Estado
        </label>
        <div className="relative">
          <select
            id="busca-uf"
            name="uf"
            defaultValue={uf ?? ""}
            className={`w-full cursor-pointer appearance-none rounded-controle bg-rebaixada pr-9 pl-3 text-sm font-medium text-tinta-900 outline-none sm:w-[11rem] ${
              compacta ? "h-10" : "h-12"
            }`}
          >
            <option value="">Todo o Brasil</option>
            {UFS.map((sigla) => (
              <option key={sigla} value={sigla}>
                {NOME_UF[sigla]}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-tinta-600"
          >
            <path
              d="M4 6.5 8 10.5l4-4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <button
          type="submit"
          className={`shrink-0 rounded-controle bg-verde-700 px-6 font-semibold text-white transition-colors hover:bg-verde-600 ${
            compacta ? "h-10 text-sm" : "h-12 text-[13px]"
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
