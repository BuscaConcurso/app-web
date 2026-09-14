import type { FaqPergunta, Origem, RespostaDoFaq } from "@/lib/dominio";
import { ROTULO_PERGUNTA } from "@/lib/rotulos";

/**
 * As perguntas que o ato responde, e as que ele não responde.
 *
 * A resposta é o trecho literal do documento — o modelo escolhe onde ela
 * está, o motor confere palavra por palavra e descarta o que não casar. Por
 * isso esta seção pode dizer "o ato responde" em vez de "segundo a nossa
 * leitura", e por isso o mesmo trecho aparece destacado no texto do ato, no
 * bloco de baixo.
 *
 * As duas formas de não haver resposta aparecem com palavras diferentes,
 * porque são coisas diferentes: o ato não dizer é lacuna do documento (2.375
 * das 5.022 respostas do acervo, 47,3%), e o trecho ser descartado é recusa
 * nossa (47, 0,9%). "Não informado" para as duas esconderia a segunda, que é
 * a única que aponta defeito.
 *
 * ## Um bloco por concurso, não um por ato
 *
 * O FAQ morava dentro do bloco dos atos publicados, repetido por ato. Como
 * bloco próprio ele passa a ser um só, consolidado. O acervo é o que decide:
 * **4.507 dos 4.649 concursos têm um único ato**, só 10 têm dois ou mais atos
 * com FAQ, e a mesma pergunta respondida por dois atos diferentes acontece 3
 * vezes no acervo inteiro, em 1 concurso. Um bloco por ato seria um bloco
 * repetido em 99,8% dos casos para resolver um empate que quase nunca existe.
 *
 * Quando ele existe, os dois trechos aparecem os dois, cada um com o link
 * para o seu ato: a divergência entre dois atos sobre a mesma pergunta é
 * informação, não duplicata a esconder.
 *
 * ## A pergunta sem resposta continua aparecendo, mas não como pergunta
 *
 * São seis perguntas fixas e quase metade volta vazia; a mediana é de 4
 * respondidas por ato, mas 102 dos 837 atos com FAQ não respondem nenhuma.
 * Abrir seis blocos de pergunta e responder "o ato não disse" em três deles
 * faria o bloco crescer com o que não tem — e, em 102 casos, um bloco inteiro
 * de nadas. Então **respondida vira pergunta e resposta; não respondida vira
 * uma linha no fim**, que nomeia todas de uma vez. O fato fica dito, sem
 * ocupar a mesma altura de um fato.
 *
 * ## A ordem é a das perguntas, não a do ato
 *
 * Consolidar exige uma ordem própria — dois atos não têm uma ordem comum. É a
 * de `ROTULO_PERGUNTA`, que vai de quem pode se inscrever até as etapas da
 * prova, e é a mesma em todo concurso: quem já leu um FAQ sabe onde procurar
 * no seguinte.
 */
export function Faq({ origens }: { origens: Origem[] }) {
  const comFaq = origens.filter((origem) => (origem.faq ?? []).length > 0);
  if (comFaq.length === 0) return null;

  const varios = comFaq.length > 1;

  // Respondidas na ordem das perguntas, e dentro de cada pergunta na ordem
  // dos atos.
  const respondidas: { origem: Origem; resposta: RespostaDoFaq }[] = [];
  for (const pergunta of PERGUNTAS) {
    for (const origem of comFaq) {
      for (const resposta of origem.faq ?? []) {
        if (resposta.pergunta === pergunta && resposta.situacao === "respondida") {
          respondidas.push({ origem, resposta });
        }
      }
    }
  }

  const respondidasPor = new Set(respondidas.map((r) => r.resposta.pergunta));
  // Ausente é a pergunta que **nenhum** ato respondeu. Com dois atos, o que um
  // respondeu não é lacuna só porque o outro calou.
  const ausentes = PERGUNTAS.filter(
    (pergunta) =>
      !respondidasPor.has(pergunta) &&
      comFaq.some((origem) =>
        (origem.faq ?? []).some(
          (r) => r.pergunta === pergunta && r.situacao === "nao_respondida",
        ),
      ),
  );

  const descartadas = comFaq.reduce(
    (total, origem) =>
      total +
      (origem.faq ?? []).filter((r) => r.situacao === "descartada").length,
    0,
  );

  return (
    <>
      {respondidas.length > 0 && (
        <ul className="flex flex-col gap-3">
          {respondidas.map(({ origem, resposta }) => (
            <li
              key={`${origem.chave}-${resposta.pergunta}`}
              // O mesmo rebaixo dos cargos, pelo mesmo motivo: dentro de um
              // bloco branco, cada par pergunta/resposta é uma caixa
              // rebaixada, não um cartão dentro de outro.
              className="rounded-lg bg-bloco px-4 py-3.5"
            >
              <h3 className="text-sm font-semibold text-tinta-900">
                {ROTULO_PERGUNTA[resposta.pergunta]}
              </h3>
              {/* A citação. É o produto inteiro: sem ela a resposta vira
                  afirmação nossa. Fica por extenso, sem corte — a mediana é de
                  160 caracteres e o maior do acervo tem 7.690, e cortar o
                  maior esconderia justamente o que foi lido.

                  `wrap-anywhere` porque o trecho é texto de edital e vem com
                  endereço dentro: medido a 375px, a resposta de "onde se
                  inscrever" da UTFPR tem 316px de linha numa caixa de 274 e o
                  fim da URL ficava cortado. A quebra em qualquer ponto é feia
                  numa URL e é a única alternativa a esconder o endereço, que
                  é justamente a resposta. */}
              <p className="mt-1.5 max-w-[74ch] border-l-2 border-tinta-200 pl-3 text-[13px] leading-6 wrap-anywhere text-tinta-700">
                {resposta.trecho}
              </p>
              {/* O caminho de volta ao documento. Agora que o FAQ é um bloco
                  separado do texto do ato, é este link que mantém a
                  procedência a um clique: ele leva ao item do ato, onde o
                  trecho aparece grifado dentro do documento.
                  Sozinho na linha desde que a avaliação saiu daqui — a caixa
                  de flex existia para dividir a linha com ela. */}
              <a
                href={`#ato-${origem.chave}`}
                className="mt-1 inline-block text-[12px] text-tinta-600 underline underline-offset-4 hover:text-tinta-900"
              >
                {varios && origem.titulo
                  ? `ver em: ${origem.titulo}`
                  : "ver no ato publicado"}
              </a>
            </li>
          ))}
        </ul>
      )}

      {ausentes.length > 0 && (
        <p
          className={`max-w-[74ch] text-[12px] leading-5 text-tinta-600 ${
            respondidas.length > 0 ? "mt-3" : ""
          }`}
        >
          {respondidas.length === 0
            ? "Nenhuma das seis perguntas: "
            : varios
              ? "Os atos não respondem: "
              : "O ato não responde: "}
          {ausentes
            .map((pergunta) =>
              ROTULO_PERGUNTA[pergunta].replace("?", "").toLowerCase(),
            )
            .join("; ")}
          .
        </p>
      )}

      {descartadas > 0 && (
        /* Dito, e não escondido: é a conferência funcionando. O trecho que o
           modelo devolveu não existia no ato palavra por palavra, então não
           virou resposta — e quem lê fica sabendo que existe essa régua, em
           vez de ver um silêncio igual ao da lacuna. */
        <p className="mt-1.5 max-w-[74ch] text-[12px] leading-5 text-tinta-600">
          {descartadas === 1
            ? "Uma resposta foi descartada"
            : `${descartadas} respostas foram descartadas`}{" "}
          por não conferir com o texto do ato, palavra por palavra.
        </p>
      )}
    </>
  );
}

/**
 * O cabeçalho do bloco, que agora fica fora dele e por isso é montado aqui,
 * onde se sabe quantos atos entraram na conta e quantas perguntas voltaram
 * com resposta.
 *
 * **O título muda de sinal quando não há resposta nenhuma.** São 90 concursos
 * no acervo em que o ato foi lido e não respondeu nenhuma das seis; visto na
 * tela, "O que este ato responde" em cima de um bloco cuja única linha é "o
 * ato não responde: ..." é o título prometendo o contrário do que o bloco
 * entrega. Nesses, o título diz o que o bloco tem — a lacuna — e a linha de
 * apoio sobre o trecho literal sai, porque não há trecho nenhum.
 */
export function cabecalhoDoFaq(origens: Origem[]): {
  titulo: string;
  apoio?: string;
} {
  const comFaq = origens.filter((origem) => (origem.faq ?? []).length > 0);
  const varios = comFaq.length > 1;
  const respondeAlguma = comFaq.some((origem) =>
    (origem.faq ?? []).some((r) => r.situacao === "respondida"),
  );

  if (!respondeAlguma) {
    return {
      titulo: varios
        ? "O que estes atos não respondem"
        : "O que este ato não responde",
    };
  }
  return {
    titulo: varios ? "O que estes atos respondem" : "O que este ato responde",
    apoio:
      "Cada resposta é o trecho literal do ato, conferido palavra por palavra contra o documento.",
  };
}

/** Há FAQ a mostrar? É o que decide se o bloco existe. */
export function temFaq(origens: Origem[]): boolean {
  return origens.some((origem) => (origem.faq ?? []).length > 0);
}

/**
 * A ordem de leitura das perguntas, que é a de `ROTULO_PERGUNTA`. Escrita à
 * mão e tipada para que uma pergunta nova no domínio quebre a compilação aqui
 * em vez de sumir da tela sem aviso.
 */
const PERGUNTAS: FaqPergunta[] = [
  "quem_pode",
  "ate_quando",
  "quanto_custa",
  "onde_inscrever",
  "como_inscrever",
  "etapas_prova",
];
