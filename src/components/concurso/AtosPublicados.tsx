import { Avaliacao } from "@/components/concurso/Avaliacao";
import { destacar } from "@/lib/destaque";
import type { Origem, RespostaDoFaq } from "@/lib/dominio";
import { dataLonga, numero } from "@/lib/formato";
import { ROTULO_PERGUNTA } from "@/lib/rotulos";

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
 * O texto abre num painel lateral, e **sem JavaScript**: o mecanismo é o
 * `<details>` nativo, e o painel é CSS sobre `[open]`. Isso importa mais do
 * que parece — o pedido de drawer reverteria a decisão de não depender de
 * script, e com ela o "ver o ato" do cronograma (uma âncora) deixaria de
 * funcionar para quem está sem script, e quem chegasse por link direto
 * encontraria um botão morto. Feito assim, nada disso acontece: a âncora
 * continua levando ao bloco do ato, o botão continua abrindo, e o texto
 * continua a um clique de distância com ou sem script.
 *
 * **Nenhum ato abre sozinho**, e isso mudou com o drawer. Antes o ato curto
 * vinha aberto (mediana de 1.623 caracteres, metade do acervo abaixo de
 * 1.700), porque mostrar era barato. Um painel que se abre sozinho por cima
 * da página não é barato: ele cobre o cronograma e os cargos que a pessoa
 * veio ler. E a uniformidade passou a valer mais que o clique economizado
 * porque o bloco do ato deixou de ser só o texto — ele tem o FAQ, o endereço
 * e a procedência antes dele, e o texto virou a evidência atrás disso, não a
 * primeira coisa a ler.
 */

export function AtosPublicados({
  slug,
  origens,
}: {
  slug: string;
  origens: Origem[];
}) {
  return (
    <ul className="flex flex-col gap-4">
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

          {/* `?? []` porque um `bc api` de versão anterior não manda `faq`,
              e sem a guarda a página inteira morre com 500 — visto na tela,
              não suposto: a instância que eu tinha no ar era de antes do
              campo existir, e o detalhe deixou de abrir. */}
          {(origem.faq ?? []).length > 0 && (
            <Faq slug={slug} ato={origem.chave} respostas={origem.faq ?? []} />
          )}

          {origem.texto ? (
            <details className="group/ato mt-2.5">
              <summary
                className={[
                  // Fechado: um botão na linha do ato.
                  "inline-flex cursor-pointer items-center gap-2 rounded-controle",
                  "bg-rebaixada px-3 py-1.5 text-[12px] font-semibold text-tinta-800",
                  "transition-colors hover:bg-tinta-200",
                  // Aberto: a barra de topo do painel, que também é o que
                  // fecha. Sem isto, o painel abriria e não teria como
                  // fechar sem script — `<summary>` é o único elemento que
                  // alterna um `<details>`.
                  "group-open/ato:fixed group-open/ato:top-0 group-open/ato:right-0",
                  "group-open/ato:z-[60] group-open/ato:w-[min(40rem,94vw)]",
                  "group-open/ato:justify-between group-open/ato:rounded-none",
                  "group-open/ato:border-b group-open/ato:border-tinta-200",
                  "group-open/ato:bg-cartao group-open/ato:px-5 group-open/ato:py-3.5",
                ].join(" ")}
              >
                <span>
                  <span className="group-open/ato:hidden">Ler o ato publicado</span>
                  <span className="hidden group-open/ato:inline">
                    O ato publicado
                  </span>
                  {origem.caracteres !== null && (
                    <span className="ml-1 font-normal text-tinta-600">
                      · {numero(origem.caracteres)} caracteres
                    </span>
                  )}
                </span>
                <span className="hidden font-normal text-tinta-600 group-open/ato:inline">
                  fechar
                </span>
              </summary>
              {/* O painel. Sem corte no texto: o ato de 99 mil caracteres
                  cabe inteiro aqui, rolando, sem virar uma página de um
                  quilômetro. O texto do diário vem sem quebra de linha —
                  zero em 9.274 documentos —, então é um parágrafo só. */}
              <div className="fixed inset-y-0 right-0 z-50 w-[min(40rem,94vw)] overflow-y-auto border-l border-tinta-200 bg-cartao px-5 pt-16 pb-10 shadow-2xl">
                <p className="max-w-[78ch] text-[13px] leading-6 text-tinta-800">
                  {/* As respostas do FAQ marcadas onde elas estão. É o que a
                      posição gravada junto do trecho paga: em vez de repetir
                      a resposta fora de contexto, a página mostra a frase do
                      ato que a produziu, dentro do documento. */}
                  {destacar(origem.texto, faixasDoFaq(origem.faq ?? [])).map(
                    (pedaco, indice) =>
                      pedaco.destacado ? (
                        <mark
                          key={indice}
                          className="rounded-[3px] bg-amarelo/40 text-tinta-900"
                        >
                          {pedaco.texto}
                        </mark>
                      ) : (
                        <span key={indice}>{pedaco.texto}</span>
                      ),
                  )}
                </p>
              </div>
            </details>
          ) : (
            <p className="mt-2 text-[12px] leading-5 text-tinta-600">
              O texto deste ato não está guardado.
            </p>
          )}

          {origem.editalCitadoUrl && (
            /* O endereço do edital completo, dito pelo próprio ato. Fica ao
               lado do ato que o citou, e não solto no topo da página, porque
               é a procedência que sustenta o link: foi este documento, desta
               data, que afirmou isso.

               A ressalva não é decoração. Nós nunca visitamos este endereço:
               ele saiu do texto de um ato que pode ter meses, e site de
               banca muda de lugar. Oferecer "leia o edital completo" sem
               dizer isso seria prometer uma porta que talvez não abra — a
               mesma classe do link do Diário que dava 404. */
            <p className="mt-2 text-[13px] leading-5">
              <span className="text-tinta-600">
                Este ato informa que o edital completo está em:{" "}
              </span>
              <a
                href={origem.editalCitadoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium break-all text-link underline underline-offset-4 hover:text-link-hover"
              >
                {origem.editalCitadoUrl.replace(/^https?:\/\//, "")}
              </a>
              <span className="text-tinta-600">
                {" "}
                — endereço informado pelo ato, que não conferimos.
              </span>
            </p>
          )}

          <p className="mt-2 text-[11px] text-tinta-500">
            Coletado do diário em {dataLonga(origem.vistoEm.slice(0, 10))}.
          </p>
        </li>
      ))}
    </ul>
  );
}


/**
 * As perguntas que o ato responde, e as que ele não responde.
 *
 * A resposta é o trecho literal do documento — o modelo escolhe onde ela
 * está, o motor confere palavra por palavra e descarta o que não casar. Por
 * isso esta seção pode dizer "o ato responde" em vez de "segundo a nossa
 * leitura", e por isso o mesmo trecho aparece destacado no texto logo abaixo.
 *
 * As duas formas de não haver resposta aparecem com palavras diferentes,
 * porque são coisas diferentes: o ato não dizer é lacuna do documento (46 das
 * 120 respostas do piloto), e o trecho ser descartado é recusa nossa (2 das
 * 120). "Não informado" para as duas esconderia a segunda, que é a única que
 * aponta defeito.
 */
function Faq({
  slug,
  ato,
  respostas,
}: {
  slug: string;
  /** A chave da origem: é o que amarra a avaliação a este ato, e não a outro
      do mesmo concurso. */
  ato: string;
  respostas: RespostaDoFaq[];
}) {
  const respondidas = respostas.filter((r) => r.situacao === "respondida");
  const ausentes = respostas.filter((r) => r.situacao === "nao_respondida");
  const descartadas = respostas.filter((r) => r.situacao === "descartada");

  return (
    <div className="mt-3">
      <h3 className="text-[12px] font-semibold text-tinta-800">
        O que este ato responde
      </h3>

      {respondidas.length > 0 && (
        <dl className="mt-2 flex flex-col gap-2.5">
          {respondidas.map((resposta) => (
            <div key={resposta.pergunta}>
              <dt className="text-[13px] font-medium text-tinta-900">
                {ROTULO_PERGUNTA[resposta.pergunta]}
              </dt>
              <dd className="mt-0.5 max-w-[74ch] border-l-2 border-tinta-200 pl-3 text-[13px] leading-6 text-tinta-700">
                {resposta.trecho}
              </dd>
              {/* Por resposta, e não por ato: a avaliação tem de chegar
                  dizendo QUAL pergunta ficou errada, senão ela não aponta
                  para nada que dê para consertar. */}
              <Avaliacao
                className="mt-0.5 pl-1"
                alvo={{
                  slug,
                  bloco: "faq",
                  pergunta: resposta.pergunta,
                  ato,
                }}
                oQue={`esta resposta sobre ${ROTULO_PERGUNTA[
                  resposta.pergunta
                ].replace("?", "").toLowerCase()}`}
              />
            </div>
          ))}
        </dl>
      )}

      {ausentes.length > 0 && (
        <p className="mt-2.5 max-w-[74ch] text-[12px] leading-5 text-tinta-600">
          O ato não responde:{" "}
          {ausentes
            .map((r) => ROTULO_PERGUNTA[r.pergunta].replace("?", "").toLowerCase())
            .join("; ")}
          .
        </p>
      )}

      {descartadas.length > 0 && (
        /* Dito, e não escondido: é a conferência funcionando. O trecho que o
           modelo devolveu não existia no ato palavra por palavra, então não
           virou resposta — e quem lê fica sabendo que existe essa régua, em
           vez de ver um silêncio igual ao da lacuna. */
        <p className="mt-1.5 max-w-[74ch] text-[12px] leading-5 text-tinta-600">
          {descartadas.length === 1
            ? "Uma resposta foi descartada"
            : `${descartadas.length} respostas foram descartadas`}{" "}
          por não conferir com o texto do ato, palavra por palavra.
        </p>
      )}
    </div>
  );
}

/** As posições das respostas aceitas, para o destaque no texto. */
function faixasDoFaq(respostas: RespostaDoFaq[]) {
  return respostas
    .filter((r) => r.inicioChar !== null && r.fimChar !== null)
    .map((r) => ({ inicio: r.inicioChar as number, fim: r.fimChar as number }));
}
