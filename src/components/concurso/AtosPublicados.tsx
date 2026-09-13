import { Rotulo } from "@/components/ui/Etiqueta";
import type { Origem } from "@/lib/dominio";
import { dataLonga, numero } from "@/lib/formato";

/**
 * Os atos publicados de onde tudo nesta página foi lido, com o texto inteiro.
 *
 * É a parte mais garantida do produto e a que estava guardada sem uso: o
 * texto do ato está no nosso banco, íntegro, com proveniência — 9.274
 * documentos e 40,2 milhões de caracteres. Link pode dar 404, o site da
 * Imprensa Nacional pode sair do ar, a janela do INLABS tem 115 dias; o texto
 * não depende de nada disso.
 *
 * **Não é o edital.** O diário publica o ato, que muitas vezes é o extrato, e
 * o edital completo com anexos e programa de provas fica no site da banca.
 * A seção diz isso em vez de deixar a pessoa supor.
 *
 * O `<details>` abre sozinho no ato curto e fica fechado no longo. O corte
 * saiu da distribuição real, por concurso do acervo: mediana de 1.623
 * caracteres, p90 de 13.961, e 25 dos 325 passando de 20 mil. Com o corte em
 * 3 mil, mais da metade dos concursos mostra o ato inteiro sem clique, e o
 * ato de 99 mil caracteres não empurra o resto da página para fora da tela.
 */
const ABRE_SOZINHO_ATE = 3000;

export function AtosPublicados({ origens }: { origens: Origem[] }) {
  return (
    <section>
      <Rotulo>
        {origens.length === 1 ? "O ato publicado" : "Os atos publicados"}
      </Rotulo>
      <p className="mt-1 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
        O texto abaixo é o ato como saiu no diário oficial, na íntegra — que
        pode ser o extrato, não o edital completo. O edital com anexos e
        programa de provas fica no site da banca.
      </p>

      <ul className="mt-3 flex flex-col gap-4">
        {origens.map((origem) => (
          <li key={origem.chave} id={`ato-${origem.chave}`} className="scroll-mt-4">
            <div className="text-sm">
              {origem.url ? (
                <a
                  href={origem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-link underline underline-offset-4 hover:text-link-hover"
                >
                  {origem.titulo ?? origem.url}
                </a>
              ) : (
                <span className="font-medium text-tinta-900">
                  {origem.titulo ?? "Ato sem título registrado"}
                </span>
              )}
              {origem.fonte && (
                <span className="text-tinta-600"> · {origem.fonte}</span>
              )}
            </div>

            {origem.url ? (
              <p className="mt-0.5 text-[12px] leading-5 text-tinta-600">
                O endereço leva à página do diário em que o ato saiu, que pode
                trazer outros atos do mesmo dia.
              </p>
            ) : (
              /* O endereço público não está gravado para este ato, e não dá
                 para inventá-lo: o que o motor montava a partir do
                 identificador respondia 404. O texto abaixo é o que torna
                 isso suportável — a publicação está aqui, inteira. */
              <p className="mt-0.5 text-[12px] leading-5 text-tinta-600">
                O endereço público deste ato não está registrado, mas o texto
                publicado está guardado por inteiro, abaixo.
              </p>
            )}

            {origem.texto ? (
              <details
                open={(origem.caracteres ?? 0) <= ABRE_SOZINHO_ATE}
                className="mt-2 rounded-caixa bg-bloco px-4 py-3"
              >
                <summary className="cursor-pointer text-[12px] font-semibold text-tinta-800">
                  Ler o ato publicado
                  {origem.caracteres !== null && (
                    <span className="ml-1 font-normal text-tinta-600">
                      · {numero(origem.caracteres)} caracteres
                    </span>
                  )}
                </summary>
                {/* Caixa com rolagem, e não corte no texto: o ato de 99 mil
                    caracteres cabe inteiro aqui sem virar uma página de um
                    quilômetro. O texto do diário vem sem quebra de linha —
                    zero em 9.274 documentos —, então é um parágrafo só. */}
                <div className="mt-2 max-h-[28rem] overflow-y-auto">
                  <p className="max-w-[78ch] text-[13px] leading-6 text-tinta-800">
                    {origem.texto}
                  </p>
                </div>
              </details>
            ) : (
              <p className="mt-2 text-[12px] leading-5 text-tinta-600">
                O texto deste ato não está guardado.
              </p>
            )}

            {/* Aqui entra o endereço do edital completo no site da banca,
                quando o contrato de extração começar a trazê-lo: é mais uma
                linha desta mesma lista, ao lado do ato de onde ele foi
                citado. */}

            <p className="mt-2 text-[11px] text-tinta-500">
              Coletado do diário em {dataLonga(origem.vistoEm.slice(0, 10))}.
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
