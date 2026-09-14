import Link from "next/link";
import { Cartao, Selo } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import type { ConcursoResumo } from "@/lib/dominio";
import { moeda, vagasTexto } from "@/lib/formato";
import { ROTULO_ESCOLARIDADE, tituloSemOrgao } from "@/lib/rotulos";
import { ESTILO_DO_TOM, rotuloDeSituacao, tomDoConcurso } from "@/lib/situacao";

/**
 * A versão compacta do cartão, para as faixas da home.
 *
 * Cabe numa linha porque a decisão ali é outra: na faixa de urgência o que
 * importa é o prazo, e na de previstos é saber que existe. O detalhe fica
 * para a lista de resultados.
 *
 * **O título é o do concurso, e o órgão vai para a linha de apoio.** Era o
 * contrário, e isso tornava dois concursos do mesmo órgão indistinguíveis na
 * mesma faixa — medido na home a 375px: das quatro linhas de "Encerra esta
 * semana", duas eram concursos diferentes da UFU exibindo "Universidade
 * Federal de Uberlândia" nas duas. O `ItemList` estruturado da mesma página
 * já os nomeava separado, então a tela dizia menos que o dado.
 *
 * É o mesmo conserto que `CartaoConcurso` recebeu antes — "três cartões
 * seguidos de concursos DIFERENTES diziam Transpetro" — e este componente
 * ficou de fora porque o pedido falava de "página e cards".
 *
 * O título usa `tituloSemOrgao` e não o título inteiro, ao contrário do
 * cartão da busca: aqui não há bloco de órgão nem trilha por perto, mas o
 * órgão está na linha de apoio logo abaixo e o selo está ao lado — e a faixa
 * é desenhada para caber em uma linha, que o título inteiro estoura.
 */
export function LinhaConcurso({
  concurso,
  acao,
  hoje,
}: {
  concurso: ConcursoResumo;
  /** O texto do botão muda com a faixa: "Abrir", "Avisar", "Ver". */
  acao?: string;
  hoje?: Date;
}) {
  const tom = tomDoConcurso(concurso, hoje);
  const estilo = ESTILO_DO_TOM[tom];
  const escolaridade = concurso.escolaridades[0];

  const resumo = [
    concurso.orgao.nome,
    vagasTexto(concurso.vagas, concurso.cadastroReserva).toLowerCase(),
    escolaridade ? ROTULO_ESCOLARIDADE[escolaridade].toLowerCase() : null,
    concurso.salarioAte ? `até ${moeda(concurso.salarioAte)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Cartao
      tom={tom}
      as="article"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
    >
      <Selo sigla={concurso.orgao.sigla} tom={tom} tamanho="sm" />

      <div className="min-w-[16rem] flex-1">
        <h3 className="font-titulo text-base leading-6 font-semibold">
          <Link
            href={`/concursos/${concurso.slug}`}
            className="hover:underline hover:underline-offset-4"
          >
            {tituloSemOrgao(concurso.titulo, concurso.orgao)}
          </Link>
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Etiqueta tom={tom} comPonto>
            {rotuloDeSituacao(concurso, hoje)}
          </Etiqueta>
          <p className={`numero text-xs ${estilo.apoio}`}>{resumo}</p>
        </div>
      </div>

      <Link
        href={`/concursos/${concurso.slug}`}
        className="ml-auto inline-flex h-[30px] items-center rounded-controle bg-inverso px-4 text-[12px] font-semibold text-inverso-texto hover:bg-inverso-hover"
      >
        {acao ?? "Abrir"}
      </Link>
    </Cartao>
  );
}
