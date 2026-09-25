import Link from "next/link";
import { Selo } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoResumo, Uf } from "@/lib/dominio";
import { dataCurta, diasAte, moeda, numero, quantidade } from "@/lib/formato";
import { estadoDoCartao } from "@/lib/rotulos";
import { orgaoECargo } from "./LinhaConcurso";

/** A etiqueta de prazo do cartão do celular: `Mobile.dc.html:88,97,105`. */
function chipDoPrazoMovel(iso: string, hoje: Date): { texto: string; classe: string } {
  const dias = diasAte(iso, hoje);
  if (dias <= 0) return { texto: "encerra hoje", classe: "bg-urucum text-white" };
  if (dias === 1) return { texto: "encerra amanhã", classe: "bg-urucum-fundo text-urucum-texto" };
  return { texto: `até ${dataCurta(iso)}`, classe: "bg-ouro-fundo text-ouro-sinal-texto" };
}

/**
 * A segunda etiqueta do cartão.
 *
 * Com `ufDoFiltro` (só a busca passa), o que ela mostra em primeiro lugar é
 * por que este concurso satisfaz o filtro de estado (`estadoDoCartao`, ver
 * o cabeçalho dela para a medição que justifica isto): este cartão compacto
 * não tem uma linha própria de "Local" como a da linha da tabela, então sem
 * a etiqueta o cartão calaria sobre o motivo em até 18% dos filtrados por
 * estado. Sem filtro de estado, ou quando o concurso não casa por estado
 * (é nacional, por exemplo), a etiqueta volta a ser vagas, ou, faltando
 * isso também, o estado do próprio concurso.
 */
function segundaEtiqueta(
  concurso: ConcursoResumo,
  ufDoFiltro?: Uf,
): { icone: "pessoa" | "local"; texto: string } | null {
  if (ufDoFiltro) {
    const estado = estadoDoCartao(concurso.ufs, ufDoFiltro);
    if (estado) return { icone: "local", texto: `${estado.pedido}${estado.resto ?? ""}` };
  }

  const vagas = quantidade(concurso.vagas);
  if (vagas !== null) return { icone: "pessoa", texto: `${numero(vagas)} ${vagas === 1 ? "vaga" : "vagas"}` };
  // `concurso.ufs[0]` e não `concurso.uf`: a lista enxuta de `/busca/<slug>`
  // (`paraALista`) não leva `uf` (ninguém lia antes), só `ufs`, e os dois
  // concordam sempre: `uf` é `ufs[0]` quando `ufs` tem só um item.
  if (concurso.ufs.length === 1) return { icone: "local", texto: concurso.ufs[0] };
  return null;
}

/**
 * O cartão de concurso: `Mobile.dc.html:83-90` ("Abertos agora"), a mesma
 * peça que `TabelaAbertos` usa como cartão do celular na home.
 *
 * `ufDoFiltro`: só a busca passa, o estado que o filtro pediu. Com ele a
 * segunda etiqueta, quando não há vaga informada para render primeiro,
 * conta por que o cartão veio, em vez do estado simples do concurso.
 *
 * `semOrgao`: só a página do órgão, que já é o `h1` dela, ver `orgaoECargo`.
 */
export function CartaoConcurso({
  concurso,
  hoje,
  ufDoFiltro,
  semOrgao = false,
}: {
  concurso: ConcursoResumo;
  hoje: Date;
  ufDoFiltro?: Uf;
  semOrgao?: boolean;
}) {
  const { titulo, subtitulo } = orgaoECargo(concurso, semOrgao);
  const segunda = segundaEtiqueta(concurso, ufDoFiltro);
  const prazo = concurso.inscricoesAte ? chipDoPrazoMovel(concurso.inscricoesAte, hoje) : null;

  return (
    <Link
      href={`/concursos/${concurso.slug}`}
      className="flex flex-col gap-3 rounded-cartao bg-cartao p-4 shadow-cartao"
    >
      <div className="flex items-start gap-3">
        <Selo sigla={concurso.orgao.sigla} tamanho={42} />
        <div className="min-w-0 flex-grow">
          <div className="truncate text-[15px] font-bold">{titulo}</div>
          <div className="mt-0.5 truncate text-[13px] text-tinta-600">{subtitulo}</div>
        </div>
        <Icone nome="salvar" tamanho={20} className="mt-0.5 shrink-0 text-tinta-500" />
      </div>
      <div className="flex flex-wrap gap-1.5 text-[13px]">
        <span className="flex h-7 items-center gap-1.5 rounded-lg bg-verde-fundo px-2.5 font-bold text-verde-texto">
          <Icone nome="salario" tamanho={14} />
          {concurso.salarioAte === null ? "a definir" : moeda(concurso.salarioAte)}
        </span>
        {segunda && (
          <span className="flex h-7 max-w-full items-center gap-1.5 rounded-lg bg-rebaixada px-2.5 font-medium">
            <Icone nome={segunda.icone} tamanho={14} className="shrink-0" />
            <span className="min-w-0 truncate">{segunda.texto}</span>
          </span>
        )}
        {prazo && (
          <span className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 font-semibold ${prazo.classe}`}>
            <Icone nome="prazo" tamanho={14} />
            {prazo.texto}
          </span>
        )}
      </div>
    </Link>
  );
}
