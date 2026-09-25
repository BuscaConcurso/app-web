import { Fragment } from "react";
import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import { ancoraDoTrecho, grifavel } from "@/lib/destaque";
import type { FaqPergunta, Origem, RespostaDoFaq } from "@/lib/dominio";
import { partirEmEnderecos } from "@/lib/enderecos";
import { ROTULO_PERGUNTA } from "@/lib/rotulos";

/** O ícone de cada pergunta, `Concurso.dc.html:305-312`. */
const ICONE_DA_PERGUNTA: Record<FaqPergunta, NomeDoIcone> = {
  quem_pode: "vagas",
  ate_quando: "previsto",
  quanto_custa: "salario",
  onde_inscrever: "globo",
  como_inscrever: "globo",
  etapas_prova: "lupaDocumento",
};

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

  const cabecalho = cabecalhoDoFaq(origens);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 font-titulo text-[28px] leading-none font-bold tracking-[-0.025em]">
          <Icone nome="duvida" tamanho={24} className="text-link" />
          {cabecalho.titulo}
        </h2>
        {cabecalho.apoio && (
          <p className="mt-1.5 text-[15px] text-tinta-600">{cabecalho.apoio}</p>
        )}
      </div>

      {respondidas.length > 0 && (
        // O acordeão do protótipo (`Concurso.dc.html:160-176`): `<details>`
        // nativo, sem script, com o primeiro aberto. `group` é o que deixa a
        // seta trocar de sentido com `group-open:`, e o
        // `[&::-webkit-details-marker]:hidden`/`list-none` tiram o triângulo
        // padrão do navegador, que os dois motores desenham de um jeito
        // diferente.
        <div className="flex flex-col gap-2">
          {respondidas.map(({ origem, resposta }, indice) => (
            <details
              key={`${origem.chave}-${resposta.pergunta}`}
              open={indice === 0}
              className="group rounded-[14px] bg-cartao shadow-[inset_0_0_0_1px_var(--color-linha-fraca)] open:bg-rebaixada"
            >
              <summary className="flex h-14 cursor-pointer list-none items-center gap-3.5 px-[18px] text-[16px] font-bold text-tinta-900 [&::-webkit-details-marker]:hidden">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-anil-fundo text-anil-texto">
                  <Icone nome={ICONE_DA_PERGUNTA[resposta.pergunta]} tamanho={17} />
                </span>
                <span className="min-w-0 flex-1">{ROTULO_PERGUNTA[resposta.pergunta]}</span>
                <Icone
                  nome="abaixo"
                  tamanho={18}
                  className="shrink-0 text-tinta-600 group-open:hidden"
                />
                <Icone
                  nome="acima"
                  tamanho={18}
                  className="hidden shrink-0 text-tinta-600 group-open:block"
                />
              </summary>

              <div className="flex flex-col gap-2.5 px-[18px] pb-[18px] pl-[66px]">
                {/* A citação. É o produto inteiro: sem ela a resposta vira
                    afirmação nossa. Fica por extenso, sem corte — a mediana é
                    de 160 caracteres e o maior do acervo tem 7.690, e cortar o
                    maior esconderia justamente o que foi lido.

                    `wrap-anywhere` porque o trecho é texto de edital e vem com
                    endereço dentro: medido a 375px, a resposta de "onde se
                    inscrever" da UTFPR tem 316px de linha numa caixa de 274 e
                    o fim da URL ficava cortado. A quebra em qualquer ponto é
                    feia numa URL e é a única alternativa a esconder o
                    endereço, que é justamente a resposta. */}
                <blockquote className="max-w-[74ch] border-l-[3px] border-acao pl-4 text-[15px] leading-[1.6] wrap-anywhere text-tinta-900">
                  “<TrechoComEnderecos texto={resposta.trecho ?? ""} />”
                </blockquote>
                {/* O caminho de volta ao documento. Agora que o FAQ é um
                    bloco separado do texto do ato, é este link que mantém a
                    procedência a um clique: ele abre a gaveta do ato **no
                    trecho grifado**, e não mais no começo do documento.

                    `grifavel` é a mesma régua que o bloco das fontes usa para
                    decidir se pinta a marca. Quando a posição não casa com o
                    texto — ou o texto do ato não está guardado — não há `id`
                    para onde ir, e o link volta a apontar para o ato inteiro,
                    que é onde ele apontava antes. Um link para o ato é pior
                    que um link para o trecho; um link para um `id`
                    inexistente não leva a lugar nenhum, e é calado. */}
                <a
                  href={
                    grifavel(origem.texto, resposta.inicioChar, resposta.fimChar)
                      ? `#${ancoraDoTrecho(origem.chave, resposta.pergunta)}`
                      : `#ato-${origem.chave}`
                  }
                  className="inline-flex w-fit items-center gap-1 text-[13px] font-semibold text-link hover:text-link-hover"
                >
                  {varios && origem.titulo
                    ? `ver em: ${origem.titulo}`
                    : "Ver no ato publicado"}
                  <Icone nome="externo" tamanho={13} />
                </a>
              </div>
            </details>
          ))}
        </div>
      )}

      {ausentes.length > 0 && (
        <div className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-contorno px-[18px] py-3.5 text-[14px] text-tinta-600">
          <Icone nome="duvida" tamanho={18} className="shrink-0" />
          <p>
            <strong className="font-semibold text-tinta-900">
              {respondidas.length === 0
                ? "Nenhuma das seis perguntas: "
                : varios
                  ? "Os atos não respondem: "
                  : "O ato não responde: "}
            </strong>
            {ausentes
              .map((pergunta) =>
                ROTULO_PERGUNTA[pergunta].replace("?", "").toLowerCase(),
              )
              .join("; ")}
            .
          </p>
        </div>
      )}

      {descartadas > 0 && (
        /* Dito, e não escondido: é a conferência funcionando. O trecho que o
           modelo devolveu não existia no ato palavra por palavra, então não
           virou resposta — e quem lê fica sabendo que existe essa régua, em
           vez de ver um silêncio igual ao da lacuna. */
        <p className="max-w-[74ch] text-[12px] leading-5 text-tinta-600">
          {descartadas === 1
            ? "Uma resposta foi descartada"
            : `${descartadas} respostas foram descartadas`}{" "}
          por não conferir com o texto do ato, palavra por palavra.
        </p>
      )}
    </div>
  );
}

/**
 * O trecho do ato com os endereços clicáveis.
 *
 * ## O texto sai idêntico ao do ato
 *
 * Não há um caractere a mais nem a menos do que `partirEmEnderecos` recebeu:
 * ela devolve pedaços cuja soma é a entrada, e aqui cada pedaço vira ou texto
 * ou o conteúdo de um `<a>`. Isso é exigência e não capricho — a citação é o
 * produto, e `inicioChar`/`fimChar` grifam esse mesmo trecho dentro do texto
 * do ato, no bloco de baixo. Um caractere de diferença e o grifo marca outra
 * frase.
 *
 * É também por isso que **não há aviso de "abre em nova aba" escondido aqui
 * dentro**: um `<span>` de leitor de tela não aparece na tela, mas entra na
 * seleção e vai junto quando alguém copia a resposta — e uma citação literal
 * que chega ao Ctrl+V com palavra nossa no meio deixa de ser literal. O preço
 * é sabido: quem usa leitor de tela depende do navegador para anunciar a aba
 * nova.
 *
 * ## Nós de React, nunca `dangerouslySetInnerHTML`
 *
 * O trecho é texto do Diário lido por um modelo e chega como string. Montar
 * HTML com ele seria deixar o conteúdo de terceiro escrever marcação na nossa
 * página — injeção pela porta da frente. Aqui o texto nunca é marcação: é
 * filho de elemento React, que escapa tudo. O acervo já mostrou entidade crua
 * (`&amp;lt;`) chegando na tela; com `innerHTML` aquilo teria sido tag, não
 * texto. **Se alguém "simplificar" isto para `dangerouslySetInnerHTML`, o
 * buraco volta.**
 *
 * ## `rel` e aba nova
 *
 * `nofollow` porque nada aqui é recomendação nossa: é o endereço que o ato
 * citou e que nós nunca visitamos — a mesma ressalva que o link do edital
 * citado carrega por escrito. `noopener` porque com `target="_blank"` a
 * página aberta ganharia `window.opener` sobre a nossa, e `noreferrer` para
 * não contar ao site da banca de qual concurso o clique saiu.
 *
 * Abre em aba nova de propósito: a página do concurso é de pesquisa, com a
 * rolagem e o resto do FAQ no lugar, e o destino é site de terceiro que pode
 * ter mudado desde o ato — trocar a página por um 404 de banca custa mais do
 * que uma aba a mais.
 */
function TrechoComEnderecos({ texto }: { texto: string }) {
  return (
    <>
      {partirEmEnderecos(texto).map((pedaco, indice) =>
        pedaco.href === null ? (
          <Fragment key={indice}>{pedaco.texto}</Fragment>
        ) : (
          <a
            key={indice}
            href={pedaco.href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            // Sem `break-all` próprio: o `wrap-anywhere` do parágrafo é
            // herdado e já quebra a URL longa dentro do link. A mais longa do
            // acervo tem 143 caracteres e é de "onde se inscrever", que é
            // justamente a resposta que ninguém pode deixar de ler.
            className="text-link underline underline-offset-2 hover:text-link-hover"
          >
            {pedaco.texto}
          </a>
        ),
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
