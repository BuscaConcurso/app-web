import { AREAS } from "@/lib/areas";
import { UFS, type Uf } from "@/lib/dominio";
import { NOME_UF } from "@/lib/rotulos";
import { InterruptorDePreferencia } from "./InterruptorDePreferencia";

/** As 27 UFs pelo nome, em ordem alfabética: é como se procura numa lista. */
const UFS_POR_NOME = [...UFS].sort((a, b) => NOME_UF[a].localeCompare(NOME_UF[b], "pt-BR"));

const ROTULO = "text-[0.8125rem] font-bold tracking-[0.06em] text-tinta-600";

/**
 * O bloco "Resumo semanal" de `/conta#avisos` (artboards `Preferencias` e
 * `PreferenciasCelular`). Só apresentação: quem salva é a `AvisosSection`.
 * Áreas e estado aparecem só com o resumo ligado. Enquanto uma mudança
 * salva, os controles ficam `aria-disabled` (e não `disabled`, que tiraria
 * o foco de quem usa teclado) e quem chama ignora o clique.
 */
export function BlocoDoResumo({
  ligado,
  areas,
  uf,
  ocupado,
  aoAlternar,
  aoAlternarArea,
  aoMudarUf,
}: {
  ligado: boolean | null;
  areas: string[];
  uf: Uf | null;
  ocupado: boolean;
  aoAlternar: () => void;
  aoAlternarArea: (slug: string) => void;
  aoMudarUf: (uf: Uf | null) => void;
}) {
  const marcadas = new Set(areas);
  return (
    <section
      aria-labelledby="t-resumo"
      className="flex flex-col gap-5 rounded-painel p-5 shadow-[inset_0_0_0_1px_var(--color-linha)]"
    >
      <div className="flex items-start gap-5">
        <div className="flex min-w-0 grow flex-col gap-1.5">
          <h3 id="t-resumo" className="text-base font-bold text-tinta-900">
            Resumo semanal
          </h3>
          <p className="text-sm leading-[1.55] text-tinta-600">
            Os concursos que abriram e os que fecham na semana, das áreas e do estado que você
            escolher. Um e-mail por semana, às segundas.
          </p>
        </div>
        <InterruptorDePreferencia
          ligado={ligado}
          rotuladoPor="t-resumo"
          desabilitado={ocupado}
          aoAlternar={aoAlternar}
        />
      </div>

      {ligado && (
        <div className="flex flex-col gap-5 border-t border-linha pt-5">
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className={`mb-2.5 p-0 ${ROTULO}`}>ÁREAS DE INTERESSE</legend>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area) => {
                const marcada = marcadas.has(area.slug);
                return (
                  <button
                    key={area.slug}
                    type="button"
                    aria-pressed={marcada}
                    aria-disabled={ocupado || undefined}
                    onClick={() => {
                      if (!ocupado) aoAlternarArea(area.slug);
                    }}
                    className={`min-h-11 rounded-controle px-4 text-sm aria-disabled:cursor-wait ${
                      marcada ? "bg-acao font-bold text-white" : "bg-rebaixada font-medium text-tinta-900"
                    }`}
                  >
                    {area.nome}
                  </button>
                );
              })}
            </div>
            <p className="text-[0.8125rem] text-tinta-600">Nenhuma marcada: o resumo traz todas as áreas.</p>
          </fieldset>
          <div className="flex flex-col gap-2 sm:w-80">
            <label htmlFor="resumo-uf" className={ROTULO}>
              ESTADO
            </label>
            <select
              id="resumo-uf"
              value={uf ?? ""}
              aria-disabled={ocupado || undefined}
              onChange={(evento) => {
                if (ocupado) return;
                const valor = evento.target.value;
                aoMudarUf((UFS as readonly string[]).includes(valor) ? (valor as Uf) : null);
              }}
              className="h-12 rounded-controle border-0 bg-rebaixada px-3.5 text-base text-tinta-900 aria-disabled:cursor-wait"
            >
              <option value="">Todo o Brasil</option>
              {UFS_POR_NOME.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {NOME_UF[sigla]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
