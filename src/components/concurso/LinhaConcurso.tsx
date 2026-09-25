import { BotaoLink } from "@/components/ui/Botao";
import { Selo } from "@/components/ui/Cartao";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoResumo } from "@/lib/dominio";
import { dataCurta, diasAte, moeda, numero, quantidade } from "@/lib/formato";
import { NOME_UF, cargosDoCartao, tituloDoAto, tituloSemOrgao } from "@/lib/rotulos";

/**
 * As proporções das colunas de `Main.dc.html:206`
 * (`2.6fr 1.2fr 0.9fr 1fr 1.2fr 150px`), como grade CSS.
 *
 * As duas formas de linha compartilham esta medida: o `<tr>` da home, dentro
 * de um `<table>` de verdade (que usa `calc()` no `colgroup` para a mesma
 * razão), e o `<div role="row">` da busca e do órgão, que não são tabela de
 * verdade por causa da paginação e dos filtros (`task-15-brief.md`).
 */
export const COLUNAS_DA_LINHA = "grid-cols-[2.6fr_1.2fr_0.9fr_1fr_1.2fr_150px]";

/**
 * O órgão e o cargo (ou o que existir no lugar dele), coluna 1 da linha e
 * cabeçalho do cartão do celular.
 *
 * `semOrgao` é para a página do órgão: ele já é o `h1` da página, e repetir a
 * sigla em toda linha da lista dele seria a mesma afirmação duas vezes.
 */
export function orgaoECargo(
  concurso: ConcursoResumo,
  semOrgao = false,
): { titulo: string; subtitulo: string } {
  const cargos = cargosDoCartao(concurso.nomesDeCargo);
  const edital = tituloDoAto(tituloSemOrgao(concurso.titulo, concurso.orgao));
  const banca = concurso.banca?.nome && `Banca ${concurso.banca.nome}`;

  if (cargos.informado) {
    const partes = [!semOrgao && concurso.orgao.sigla, edital, banca].filter(
      (parte): parte is string => Boolean(parte),
    );
    return { titulo: cargos.texto, subtitulo: partes.join(" · ") };
  }

  if (semOrgao) {
    const partes = [banca].filter((parte): parte is string => Boolean(parte));
    return {
      titulo: edital || "Cargos ainda não informados",
      subtitulo: partes.length > 0 ? partes.join(" · ") : "Cargos ainda não informados",
    };
  }

  const partes = [edital, banca].filter((parte): parte is string => Boolean(parte));
  return {
    titulo: concurso.orgao.nome,
    subtitulo: partes.length > 0 ? partes.join(" · ") : "Cargos ainda não informados",
  };
}

/**
 * O ícone e o texto da coluna "Local".
 *
 * `concurso.ufs[0]` e não `concurso.uf`: a lista enxuta de `/busca/<slug>`
 * (`paraALista`, em `lib/concursos.ts`) não leva `uf`, ninguém a lia antes
 * desta linha existir, só `ufs`, e os dois concordam sempre (`uf` é
 * `ufs[0]` quando `ufs` tem um item só).
 */
export function localDoConcurso(concurso: ConcursoResumo): {
  icone: "local" | "globo";
  texto: string;
} {
  return concurso.ufs.length === 1
    ? { icone: "local", texto: NOME_UF[concurso.ufs[0]] }
    : { icone: "globo", texto: "Nacional" };
}

/** O chip curto da coluna "Inscrições até" do desktop: `Main.dc.html:215-260`. */
export function chipDoPrazo(iso: string, hoje: Date): { texto: string; classe: string } {
  const dias = diasAte(iso, hoje);
  if (dias <= 0) return { texto: "hoje", classe: "bg-urucum text-white" };
  if (dias === 1) return { texto: "amanhã", classe: "bg-urucum-fundo text-urucum-texto" };
  return { texto: `${dias} dias`, classe: "bg-ouro-fundo text-ouro-sinal-texto" };
}

/**
 * A linha de um concurso: `Main.dc.html:208-265`.
 *
 * Existe numa forma só, com dois moldes. `as="tr"` é a linha de verdade
 * dentro do `<table>` da home (`TabelaAbertos`), que a usa para não duplicar
 * o markup. `as="div"` é `role="row"` solto numa lista, a busca e a página
 * do órgão, que não são tabela porque têm paginação e filtros por cima, com
 * as mesmas seis colunas em grade CSS (`COLUNAS_DA_LINHA`) no lugar do
 * `colgroup`.
 */
export function LinhaConcurso({
  concurso,
  hoje,
  as = "tr",
  semOrgao = false,
}: {
  concurso: ConcursoResumo;
  hoje: Date;
  as?: "tr" | "div";
  /** Só a página do órgão: esconde a sigla da coluna 1, que já é o `h1`. */
  semOrgao?: boolean;
}) {
  const { titulo, subtitulo } = orgaoECargo(concurso, semOrgao);
  const vagas = quantidade(concurso.vagas);
  const { icone: iconeLocal, texto: textoLocal } = localDoConcurso(concurso);
  const prazo = concurso.inscricoesAte ? chipDoPrazo(concurso.inscricoesAte, hoje) : null;

  const Raiz = as;
  const Celula = as === "tr" ? "td" : "div";
  const emGrade = as === "div";

  return (
    <Raiz
      role={emGrade ? "row" : undefined}
      className={
        emGrade
          ? `grid ${COLUNAS_DA_LINHA} h-[88px] items-center gap-4 border-b border-linha-fraca px-5 text-[15px]`
          : "h-[88px] border-b border-linha-fraca text-[15px]"
      }
    >
      <Celula role={emGrade ? "cell" : undefined} className={emGrade ? "min-w-0" : "px-5"}>
        <div className="flex min-w-0 items-center gap-3.5">
          <Selo sigla={concurso.orgao.sigla} tamanho={44} />
          <div className="min-w-0">
            <div className="truncate font-bold">{titulo}</div>
            <div className="mt-0.5 truncate text-[13px] text-tinta-600">{subtitulo}</div>
          </div>
        </div>
      </Celula>

      <Celula role={emGrade ? "cell" : undefined} className={emGrade ? "min-w-0" : "px-0"}>
        <span className="flex min-w-0 items-center gap-1.5 text-tinta-600">
          <Icone nome={iconeLocal} tamanho={16} className="shrink-0" />
          <span className="truncate">{textoLocal}</span>
        </span>
      </Celula>

      <Celula role={emGrade ? "cell" : undefined} className={`font-semibold ${emGrade ? "" : "px-0"}`}>
        {vagas === null ? <span className="text-tinta-500">a definir</span> : numero(vagas)}
      </Celula>

      <Celula role={emGrade ? "cell" : undefined} className={emGrade ? undefined : "px-0"}>
        {concurso.salarioAte === null ? (
          <span className="text-tinta-500">a definir</span>
        ) : (
          <span className="font-bold text-verde-texto">{moeda(concurso.salarioAte)}</span>
        )}
      </Celula>

      <Celula role={emGrade ? "cell" : undefined} className={emGrade ? undefined : "px-0"}>
        {concurso.inscricoesAte && prazo ? (
          <span className="flex items-center gap-2">
            <span className="font-semibold">{dataCurta(concurso.inscricoesAte)}</span>
            <span className={`flex h-6 items-center rounded-full px-2 text-xs font-bold ${prazo.classe}`}>
              {prazo.texto}
            </span>
          </span>
        ) : (
          <span className="text-tinta-500">a definir</span>
        )}
      </Celula>

      <Celula role={emGrade ? "cell" : undefined} className={emGrade ? undefined : "px-5"}>
        <div className="flex items-center justify-end gap-1.5">
          <BotaoEmBreve
            recurso="salvos"
            aria-label="Salvar"
            className="flex size-10 shrink-0 items-center justify-center rounded-controle text-tinta-600 hover:bg-rebaixada"
          >
            <Icone nome="salvar" tamanho={18} />
          </BotaoEmBreve>
          <BotaoLink href={`/concursos/${concurso.slug}`} variante="contorno" tamanho="sm" iconeDepois="seta">
            Ver
          </BotaoLink>
        </div>
      </Celula>
    </Raiz>
  );
}
