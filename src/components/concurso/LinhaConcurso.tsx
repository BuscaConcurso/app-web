import Link from "next/link";
import { Cartao, Selo } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import type { ConcursoResumo, UltimoAto } from "@/lib/dominio";
import { moeda, vagasTexto } from "@/lib/formato";
import { ROTULO_ESCOLARIDADE, textoDoAto, tituloSemOrgao } from "@/lib/rotulos";
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
 * mesma faixa (medido na home a 375px: das quatro linhas de "Encerra esta
 * semana", duas eram concursos diferentes da UFU exibindo "Universidade
 * Federal de Uberlândia" nas duas). O `ItemList` estruturado da mesma página
 * já os nomeava separado, então a tela dizia menos que o dado.
 *
 * É o mesmo conserto que `CartaoConcurso` recebeu antes ("três cartões
 * seguidos de concursos DIFERENTES diziam Transpetro"), e este componente
 * ficou de fora porque o pedido falava de "página e cards".
 *
 * O título usa `tituloSemOrgao` e não o título inteiro, ao contrário do
 * cartão da busca: aqui não há bloco de órgão nem trilha por perto, mas o
 * órgão está na linha de apoio logo abaixo e o selo está ao lado, e a faixa
 * é desenhada para caber em uma linha, que o título inteiro estoura.
 */
export function LinhaConcurso({
  concurso,
  acao,
  hoje,
  ato,
}: {
  concurso: ConcursoResumo;
  /** O texto do botão muda com a faixa: "Abrir", "Avisar", "Ver". */
  acao?: string;
  hoje?: Date;
  /**
   * Só na faixa "Últimas atualizações": o motivo de o concurso estar ali. Vira
   * uma linha com a data da edição e o título do ato, e o selo "Novo" quando
   * é a primeira aparição do concurso no Diário.
   */
  ato?: UltimoAto;
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
      <Selo sigla={concurso.orgao.sigla} logoUrl={concurso.orgao.logoUrl} tom={tom} tamanho="sm" />

      {/* `min-w-0 basis-[16rem]` e não `min-w-[16rem]`, e `wrap-anywhere` no
          título: um título de ato sem espaço (do tipo
          "11/2026/SEGAP/COALEP/...") esticava a linha a 1.044px numa tela de
          360px, medido na faixa "Previstos" da home. `overflow-wrap:
          anywhere` é o que reduz a largura mínima intrínseca do bloco
          (`break-word` não reduz), e `min-w-0` deixa o item de flex encolher
          abaixo dela. A base de 16rem mantém o selo e o botão na mesma linha
          quando cabe. */}
      <div className="min-w-0 flex-1 basis-[16rem]">
        <h3 className="font-titulo text-base leading-6 font-semibold wrap-anywhere">
          <Link
            href={`/concursos/${concurso.slug}`}
            className="hover:underline hover:underline-offset-4"
          >
            {tituloSemOrgao(concurso.titulo, concurso.orgao)}
          </Link>
        </h3>
        {ato && (
          // `truncate` e o título inteiro no `title`: há ato com mais de cem
          // caracteres de título, e a faixa foi desenhada para uma linha.
          <p
            className={`numero mt-1 truncate text-xs ${estilo.apoio}`}
            title={textoDoAto(ato, concurso.titulo)}
          >
            {textoDoAto(ato, concurso.titulo)}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {ato?.primeiro && <Etiqueta>Novo</Etiqueta>}
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
