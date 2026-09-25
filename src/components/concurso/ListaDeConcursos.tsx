import { CartaoConcurso } from "./CartaoConcurso";
import { COLUNAS_DA_LINHA, LinhaConcurso } from "./LinhaConcurso";
import type { ConcursoResumo, Uf } from "@/lib/dominio";

const CABECALHO = ["Órgão e cargo", "Local", "Vagas", "Salário até", "Inscrições até", ""];

/**
 * A lista de concursos que a busca (`ListaDeResultados`) e a página do órgão
 * compartilham: no desktop, um cartão com uma linha por concurso
 * (`LinhaConcurso`, o mesmo markup da tabela de abertos da home); no celular,
 * um cartão por concurso (`CartaoConcurso`, o "Abertos agora" do protótipo).
 *
 * Não é um `<table>`: esta lista pagina e tem filtros por cima (a busca) ou
 * fica dentro de uma página que já tem outro cabeçalho (o órgão), então o
 * papel de tabela vem de `role="table"`/`role="row"`, não da marcação.
 */
export function ListaDeConcursos({
  itens,
  hoje,
  ufDoFiltro,
  semOrgao = false,
  comFiltros = false,
}: {
  itens: ConcursoResumo[];
  hoje: Date;
  /** Só a busca: o estado que o filtro pediu, para o cartão do celular. */
  ufDoFiltro?: Uf;
  /** Só a página do órgão: some a sigla, que já é o `h1` da página. */
  semOrgao?: boolean;
  /**
   * A lista divide a largura com a coluna de filtros de 300px (a busca).
   * Aí a tabela só entra a partir de 1440px; sem filtros (o órgão), a partir
   * de `xl`. Abaixo disso as seis colunas não cabem, e o que sobrava era
   * "a / definir" em duas linhas e o nome do cargo cortado numa letra: ficam
   * os cartões do celular.
   */
  comFiltros?: boolean;
}) {
  const tabela = comFiltros ? "min-[1440px]:block" : "xl:block";
  const cartoes = comFiltros ? "min-[1440px]:hidden" : "xl:hidden";
  return (
    <>
      <div
        role="table"
        aria-label="Concursos"
        className={`hidden overflow-hidden rounded-[20px] bg-cartao shadow-tabela ${tabela} [&>*:last-child]:border-b-0`}
      >
        <div
          role="row"
          className={`grid ${COLUNAS_DA_LINHA} h-11 items-center gap-4 bg-pagina px-5 text-left text-xs font-bold tracking-[0.05em] text-tinta-500 uppercase`}
        >
          {CABECALHO.map((coluna, indice) => (
            <span key={indice} role="columnheader" className="whitespace-nowrap">
              {coluna}
            </span>
          ))}
        </div>
        {itens.map((concurso) => (
          <LinhaConcurso key={concurso.slug} as="div" concurso={concurso} hoje={hoje} semOrgao={semOrgao} />
        ))}
      </div>

      <ul className={`flex flex-col gap-2.5 ${cartoes}`}>
        {itens.map((concurso) => (
          <li key={concurso.slug} className="min-w-0">
            <CartaoConcurso concurso={concurso} hoje={hoje} ufDoFiltro={ufDoFiltro} semOrgao={semOrgao} />
          </li>
        ))}
      </ul>
    </>
  );
}
