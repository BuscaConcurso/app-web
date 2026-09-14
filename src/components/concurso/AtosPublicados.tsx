import { Gaveta } from "@/components/ui/Revelador";
import { destacar } from "@/lib/destaque";
import type { Origem, RespostaDoFaq } from "@/lib/dominio";
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
 * O texto abre numa gaveta, e **sem JavaScript**: o mecanismo continua sendo o
 * `<details>` nativo. Isso importa mais do que parece — um drawer de
 * biblioteca reverteria a decisão de não depender de script, e com ela o "ver
 * o ato" do cronograma (uma âncora) deixaria de funcionar para quem está sem
 * script, e quem chegasse por link direto encontraria um botão morto. Feito
 * assim, nada disso acontece: a âncora continua levando ao bloco do ato, o
 * botão continua abrindo, e o texto continua a um clique de distância com ou
 * sem script.
 *
 * **O painel deixou de ser escrito aqui.** Ele é `ui/Revelador`, a gaveta do
 * design system, e o que esta seção ganhou com a mudança é o que não estava
 * resolvido enquanto o painel morava neste arquivo: animação nos dois
 * sentidos, Escape, clique fora, o fundo que não rola por baixo, o foco que
 * entra e volta ao gatilho, e `prefers-reduced-motion`. O porquê do mecanismo
 * — e o que se perdeu ao não usar `<dialog>` — está medido no topo daquele
 * arquivo. Nada disto muda o conteúdo: o que a gaveta mostra é o mesmo
 * parágrafo, com os mesmos grifos.
 *
 * **Nenhum ato abre sozinho**, e isso mudou com o drawer. Antes o ato curto
 * vinha aberto (mediana de 1.623 caracteres, metade do acervo abaixo de
 * 1.700), porque mostrar era barato. Um painel que se abre sozinho por cima
 * da página não é barato: ele cobre o cronograma e os cargos que a pessoa
 * veio ler. E a uniformidade passou a valer mais que o clique economizado
 * porque o bloco do ato deixou de ser só o texto — ele tem o endereço e a
 * procedência antes dele, e o texto virou a evidência atrás disso, não a
 * primeira coisa a ler.
 *
 * **O FAQ saiu daqui** e virou bloco próprio (`Faq.tsx`), acima deste. O que
 * ficou é o que ele deixou: o destaque das respostas dentro do texto, que
 * continua sendo feito aqui porque é aqui que o texto está — o link de cada
 * resposta aponta para o item do ato correspondente e o trecho aparece
 * grifado no documento.
 */

export function AtosPublicados({ origens }: { origens: Origem[] }) {
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

          {origem.texto ? (
            /* Sem corte no texto: o ato de 99 mil caracteres cabe inteiro na
               gaveta, rolando, sem virar uma página de um quilômetro. O texto
               do diário vem sem quebra de linha — zero em 9.274 documentos —,
               então é um parágrafo só. */
            <Gaveta
              className="mt-2.5"
              rotulo="Ler o ato publicado"
              titulo="O ato publicado"
              apoio={
                origem.caracteres !== null ? (
                  <>· {numero(origem.caracteres)} caracteres</>
                ) : undefined
              }
            >
              <p className="max-w-[78ch] text-[13px] leading-6 text-tinta-800">
                {/* As respostas do FAQ marcadas onde elas estão. É o que a
                    posição gravada junto do trecho paga: em vez de repetir a
                    resposta fora de contexto, a página mostra a frase do ato
                    que a produziu, dentro do documento. */}
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
            </Gaveta>
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


/** As posições das respostas aceitas, para o destaque no texto. */
function faixasDoFaq(respostas: RespostaDoFaq[]) {
  return respostas
    .filter((r) => r.inicioChar !== null && r.fimChar !== null)
    .map((r) => ({ inicio: r.inicioChar as number, fim: r.fimChar as number }));
}
