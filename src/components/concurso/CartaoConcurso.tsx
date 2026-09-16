import type { ReactNode } from "react";
import Link from "next/link";
import { BlocoDeNumeros, Cartao, Numero, Selo } from "@/components/ui/Cartao";
import { Etiqueta } from "@/components/ui/Etiqueta";
import type { ConcursoResumo, Uf } from "@/lib/dominio";
import {
  dataCurta,
  dataLonga,
  moeda,
  moedaExata,
  numero,
  quantidade,
} from "@/lib/formato";
import {
  ROTULO_ESCOLARIDADE,
  cargosDoCartao,
  estadoDoCartao,
  etiquetasDeVagas,
  linhaDeContexto,
} from "@/lib/rotulos";
import { ESTILO_DO_TOM, rotuloDeSituacao, tomDoConcurso } from "@/lib/situacao";

/**
 * O cartão de concurso, unidade central do produto.
 *
 * Tudo que decide se vale a pena clicar cabe aqui: quem abre a vaga, em que
 * situação está, quantas vagas, quanto paga, até quando dá para se
 * inscrever e quanto custa a taxa. Os números vão para um bloco rebaixado
 * e usam figuras de largura fixa, então alinham em coluna e leem como tabela.
 *
 * `ufDoFiltro` é o estado que a busca pediu, e só a busca passa. Com ele o
 * cartão ganha a linha que diz por que satisfaz o filtro; sem ele — na home,
 * na vitrine de estilo — nada muda. É de propósito: a linha existe para
 * responder a uma pergunta que só quem filtrou por estado fez, e desenhá-la
 * nos 4.649 cartões por causa dela transformaria todo cartão numa lista de
 * estados. O porquê de cada número está em `estadoDoCartao`.
 *
 * `semOrgao` é para a página do órgão, e só ela passa. Lá o órgão é o `h1` da
 * página, e repeti-lo em cada cartão o escreveria três vezes por cartão — o
 * selo, o nome e o nome outra vez dentro do título. Medido a 375px na página
 * da UFMG, que é a maior (209 concursos): o bloco do órgão ocupa 31,6px por
 * cartão, 632px nos vinte de uma página. O que fica é a hierarquia que a
 * página já promete — órgão no topo, título em cada cartão.
 */
export function CartaoConcurso({
  concurso,
  hoje,
  ufDoFiltro,
  semOrgao = false,
}: {
  concurso: ConcursoResumo;
  hoje?: Date;
  ufDoFiltro?: Uf;
  semOrgao?: boolean;
}) {
  const tom = tomDoConcurso(concurso, hoje);
  const estilo = ESTILO_DO_TOM[tom];
  const escolaridadeMaisAlta = concurso.escolaridades[0];
  const vagas = etiquetasDeVagas(concurso);
  // Passa por `quantidade()` pela mesma razão das etiquetas: o tipo diz
  // `number | null`, mas quem preenche é o JSON de outro processo. Sem a
  // guarda, um campo que não veio sairia como "NaN" numa casa de número — e
  // um número inventado é pior aqui do que em qualquer outro lugar da tela.
  const vagasDoAto = quantidade(concurso.vagas);
  const cargos = cargosDoCartao(concurso.nomesDeCargo);
  const estado = ufDoFiltro
    ? estadoDoCartao(concurso.ufs, ufDoFiltro)
    : null;

  return (
    <Cartao tom={tom} as="article" className="flex flex-col gap-2.5 p-4">
      {/*
        O órgão acima, o concurso abaixo — a mesma hierarquia da página de
        detalhe, e a inversão do que o cartão fazia até aqui: o `h3` era o
        nome do órgão e o título do concurso vinha embaixo, como parágrafo.
        Quem lê uma lista de resultados está escolhendo entre concursos, não
        entre órgãos, e dois editais do mesmo órgão davam dois cartões com o
        mesmo cabeçalho.

        O selo fica com o órgão, e não com o título, porque é a sigla DELE: o
        quadrado e o nome ao lado são a mesma afirmação, e o título começa
        abaixo dos dois, na largura inteira do cartão — que é onde ele cabe.
      */}
      {!semOrgao && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Selo sigla={concurso.orgao.sigla} tom={tom} />
            <div className="min-w-0">
              {/* Sem `truncate`: o nome do órgão é o nível de cima da
                  hierarquia e quebra em duas linhas quando precisa, como já
                  fazia no `h3`. Cortá-lo agora que ele é a linha menor
                  esconderia justamente o que a hierarquia acabou de prometer
                  mostrar. */}
              <p className="text-[13px] leading-5 font-medium text-tinta-800">
                <Link
                  href={`/orgaos/${concurso.orgao.slug}`}
                  className="hover:underline hover:underline-offset-4"
                >
                  {concurso.orgao.nome}
                </Link>
              </p>
              <p className={`truncate text-[12px] ${estilo.apoio}`}>
                {linhaDeContexto(concurso.orgao)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/*
        O título INTEIRO, que é o que o parceiro humano pediu: "o título da
        página e dos cards precisa ser o título do concurso".

        Houve aqui um recorte que tirava da frente o nome do órgão. Ele media
        bem em altura e era ruim de ler: na primeira página da busca, cinco
        dos vinte cartões ficavam com doze caracteres ou menos — "INCQS",
        "Transpetro", "Edital nº 1" —, e três cartões seguidos de concursos
        DIFERENTES diziam "Transpetro". Cartão que não distingue um concurso
        do outro é o mesmo defeito que a linha de cargos e a de estado vieram
        consertar, por outro caminho.
      */}
      <h3 className="font-titulo text-[15px] leading-6 font-semibold tracking-tight">
        <Link
          href={`/concursos/${concurso.slug}`}
          className="hover:underline hover:underline-offset-4"
        >
          {concurso.titulo}
        </Link>
      </h3>

      {/*
        Os cargos, acima da fileira de etiquetas porque pesam mais que
        escolaridade e banca: o nome do cargo é o que a pessoa digitou na
        busca, e `titulo` não o contém — no acervo real ele é o cabeçalho do
        ato ("… — Edital nº 22/2026").

        Linha rotulada e desenhada sempre, inclusive nos 354 cartões sem
        cargo, pela regra que também governa a casa "Vagas": só um lugar fixo
        consegue mostrar que falta dado. `min-w-0` no texto porque o rótulo é
        `shrink-0`. O `line-clamp-3` é cinto de segurança, não a regra: quem
        garante que o "e mais 12" não seja o pedaço cortado é o orçamento de
        84 caracteres de `cargosDoCartao`. Três linhas e não duas porque a
        375px 84 caracteres cabem em duas (medido: 47 por linha) e a 320px
        não — e uma margem que só aparece abaixo do alvo não custa altura
        nenhuma no alvo.

        O rótulo de largura fixa de `LinhaRotulada` tirou 1,8px do texto
        (264,9px para 262,4px). Remedido depois disso, em 80 cartões de
        quatro buscas a 375px: nenhuma linha de cargos cortada, e o pior
        texto da amostra — 83 caracteres, um a menos que o orçamento — cabe
        em duas linhas.
      */}
      <LinhaRotulada rotulo="Cargos">
        <p
          className={`line-clamp-3 min-w-0 text-[12px] leading-[18px] ${
            cargos.informado ? "text-tinta-800" : estilo.apoio
          }`}
        >
          {cargos.texto}
        </p>
      </LinhaRotulada>

      {/*
        A linha que responde "por que este veio". Ela só existe quando a busca
        pediu um estado, e fica logo abaixo dos cargos porque as duas
        respondem à mesma pergunta para filtros diferentes — cargos para o
        texto digitado, esta para o estado —, na ordem em que os dois campos
        aparecem na barra de busca.

        O estado pedido é o que ganha peso e tinta cheia: é a afirmação que o
        cartão não fazia. O resto fica no tom de apoio, porque é contexto —
        explica o órgão nacional na lista de um estado, sem disputar a leitura
        com o que a pessoa perguntou.

        Sem `line-clamp` porque não precisa, e isso foi visto na tela: o pior
        caso que o acervo produz é "Rio Grande do Norte · e mais 21 estados",
        e a 375px ele ocupa **217px dos 262,4px** da linha, numa linha só.
      */}
      {estado && (
        <LinhaRotulada rotulo="Onde">
          <p className="min-w-0 text-[12px] leading-[18px]">
            <span className="font-semibold text-tinta-900">{estado.pedido}</span>
            {estado.resto && (
              <span className={estilo.apoio}>{estado.resto}</span>
            )}
          </p>
        </LinhaRotulada>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta tom={tom} comPonto>
          {rotuloDeSituacao(concurso, hoje)}
        </Etiqueta>
        {escolaridadeMaisAlta && (
          <Etiqueta>{ROTULO_ESCOLARIDADE[escolaridadeMaisAlta]}</Etiqueta>
        )}
        {/*
          Antes da banca, e depois da escolaridade: a ordem relativa das três
          etiquetas que já existiam não muda, e as de vaga entram na frente da
          única que não decide nada (a banca). A 375px a fileira quebra em
          linhas, e o que cai para a segunda linha importa — é por isso que a
          posição foi escolhida e não sorteada.
        */}
        {vagas.map((etiqueta) => (
          <Etiqueta key={etiqueta}>{etiqueta}</Etiqueta>
        ))}
        {concurso.banca && <Etiqueta>Banca: {concurso.banca.nome}</Etiqueta>}
      </div>

      <BlocoDeNumeros tom={tom} className="grid-cols-2 sm:grid-cols-4">
        {/*
          Só o número, ou a ausência dele. O cadastro de reserva saiu daqui e
          virou etiqueta: "CR" é jargão de edital e estava numa casa de
          número, onde parecia uma quantidade. E manter os dois seria repetir
          na fileira o que o bloco já diz — a divisão é a de
          `etiquetasDeVagas`: o bloco diz quantas, a etiqueta diz para quem.

          Esta casa é o único lugar da busca onde a ausência de vaga aparece
          como ausência, e ela aparece em 2.149 dos 3.071 cartões porque o
          rótulo "Vagas" é desenhado mesmo sem número embaixo. É por isso que
          não existe etiqueta apagada de "vagas não informadas": ela repetiria
          aqui, em 70% dos cartões, uma não-informação — e empurraria para a
          segunda linha, no celular, as etiquetas que afirmam alguma coisa.
        */}
        <Numero rotulo="Vagas">
          {vagasDoAto === null ? "a definir" : numero(vagasDoAto)}
        </Numero>
        <Numero rotulo="Salário até">
          {concurso.salarioAte === null ? "a definir" : moeda(concurso.salarioAte)}
        </Numero>
        <Numero rotulo="Inscrições">
          {concurso.inscricoesAte
            ? `até ${dataCurta(concurso.inscricoesAte)}`
            : concurso.previstoPara
              ? `em ${concurso.previstoPara}`
              : "a definir"}
        </Numero>
        <Numero rotulo="Taxa">
          {concurso.taxaInscricao === null
            ? "a definir"
            : moedaExata(concurso.taxaInscricao)}
        </Numero>
      </BlocoDeNumeros>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-[12px] ${estilo.apoio}`}>
          {concurso.publicadoEm
            ? `Publicado em ${dataLonga(concurso.publicadoEm)}`
            : "Sem edital publicado"}
        </p>
        <Link
          href={`/concursos/${concurso.slug}`}
          className="text-[12px] font-semibold text-link underline underline-offset-4 hover:text-link-hover"
        >
          Ver detalhes
        </Link>
      </div>
    </Cartao>
  );
}

/**
 * Uma linha rotulada do cartão: o rótulo em caixa alta à esquerda, o texto à
 * direita. É a forma das duas linhas que dizem por que o cartão veio na busca
 * — "Cargos", para quem digitou um termo, e "Onde", para quem filtrou por
 * estado.
 *
 * **A largura do rótulo é fixa, e é isso que a função existe para garantir.**
 * Sem ela os dois rótulos medem o que o texto deles mede — "CARGOS" 47,5px e
 * "ONDE" 31,5px, medido em Chrome com a fonte real —, e duas linhas vizinhas
 * começariam com 16px de desencontro. `w-14` (49,3px) é o menor degrau da
 * escala que cabe o maior dos dois sem cortar.
 *
 * O custo disso na linha de cargos foi medido, não estimado: o texto perde
 * 1,8px (264,9px para 263,1px), o que mantém os 84 caracteres de
 * `cargosDoCartao` dentro de duas linhas a 375px com folga, e o
 * `line-clamp-3` de margem continua sobrando.
 *
 * O texto vem de fora com o seu próprio `min-w-0`: `min-width` de item de
 * flex é `auto`, e sem a licença para encolher um texto comprido estica o
 * cartão, a lista e a página. É a armadilha que já deu scroll horizontal
 * neste projeto duas vezes.
 */
function LinhaRotulada({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-14 shrink-0 text-[10px] leading-[18px] font-semibold tracking-[0.06em] uppercase text-tinta-500">
        {rotulo}
      </span>
      {children}
    </div>
  );
}
