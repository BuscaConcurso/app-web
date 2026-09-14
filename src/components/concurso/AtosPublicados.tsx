import { Gaveta } from "@/components/ui/Revelador";
import {
  ancoraDoTrecho,
  destacar,
  grifavel,
  type Faixa,
} from "@/lib/destaque";
import type { Origem } from "@/lib/dominio";
import { dataLonga, numero } from "@/lib/formato";
import { partirEmParagrafos, type Paragrafo } from "@/lib/leitura";

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
 * arquivo. Nada disto mudou o conteúdo: o que a gaveta mostra é o mesmo texto,
 * com os mesmos grifos.
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
 * continua sendo feito aqui porque é aqui que o texto está — e agora o link
 * de cada resposta aponta para **o trecho**, não mais para o ato inteiro.
 *
 * O `id` do `<li>` (`ato-{chave}`) continua onde estava, e é ele que o
 * cronograma usa: quem vem de uma data sabe de qual ato ela saiu, e não de
 * qual frase. As duas âncoras convivem, e é por isso que a do cronograma não
 * precisou mudar.
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
            <GavetaDoAto origem={origem} texto={origem.texto} />
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
 * A gaveta com o ato, em parágrafos e com os trechos endereçáveis.
 *
 * ## O ato deixou de ser um parágrafo só
 *
 * O texto do Diário chega sem uma única quebra de linha (zero em 420 atos
 * medidos) e era renderizado como um `<p>`: ler o ato de 86 mil caracteres
 * era percorrer uma parede. A estrutura está lá, como marcador — `3.2.1.`,
 * `Art. 5º`, `II - `, `a)`, `ANEXO I` —, e `lib/leitura.ts` acha onde ela
 * abre. **A regra, os dois lados medidos e o que ficou de fora estão lá**,
 * junto do código que decide, e não aqui.
 *
 * O que importa deste lado: **o texto exibido não muda**. A partição cai
 * entre dois caracteres que já existiam e os `<p>` somados dão o ato
 * caractere por caractere — o que se confere no HTML renderizado, não aqui.
 *
 * ## E o grifo continua caindo no mesmo lugar
 *
 * As posições do FAQ são deslocamentos no texto original; cada parágrafo
 * desconta o seu `inicio` antes de pintar (`faixasDoParagrafo`). O trecho que
 * atravessa uma quebra vira duas marcas, uma em cada parágrafo, porque
 * `<mark>` não pode cruzar `<p>`.
 *
 * ## Cada trecho ganhou endereço
 *
 * Antes, o link do FAQ levava ao `<li>` do ato com a gaveta fechada, e a
 * pessoa procurava o grifo num parágrafo que podia ter 66 mil caracteres — o
 * grifo existia e ninguém chegava nele. Agora cada marca carrega o `id` das
 * respostas que a produziram, e o link do FAQ abre a gaveta no trecho. O
 * porquê de a âncora bastar, sem script, está em `useAbrirNaAncora`.
 */
function GavetaDoAto({ origem, texto }: { origem: Origem; texto: string }) {
  const faixas = faixasDoFaq(origem);

  return (
    /* Sem corte no texto: o ato de 99 mil caracteres cabe inteiro na gaveta,
       rolando, sem virar uma página de um quilômetro. */
    <Gaveta
      className="mt-2.5"
      rotulo="Ler o ato publicado"
      titulo="O ato publicado"
      ancoras={faixas.map((faixa) => faixa.ancora as string)}
      apoio={
        origem.caracteres !== null ? (
          <>· {numero(origem.caracteres)} caracteres</>
        ) : undefined
      }
    >
      <div className="flex max-w-[78ch] flex-col gap-3">
        {partirEmParagrafos(texto).map((paragrafo) => (
          <p
            key={paragrafo.inicio}
            /* `wrap-anywhere` pelo mesmo motivo do trecho no FAQ: o ato traz
               endereço de banca dentro do texto corrido, e a URL mais longa
               do acervo tem 143 caracteres. É a quebra em qualquer ponto ou a
               rolagem horizontal a 375px, onde o painel mede 352,5px. */
            className="text-[13px] leading-6 wrap-anywhere text-tinta-800"
          >
            {destacar(paragrafo.texto, faixasDoParagrafo(faixas, paragrafo)).map(
              (pedaco, indice) =>
                pedaco.destacado ? (
                  <mark
                    key={indice}
                    className="rounded-[3px] bg-amarelo/40 text-tinta-900"
                  >
                    {/* A âncora do trecho. É um elemento **vazio**, e é de
                        propósito: um `<span>` sem conteúdo não acrescenta
                        caractere nenhum ao ato, e uma marca só pode ter um
                        `id` — enquanto três perguntas respondidas pela mesma
                        frase viram uma marca só e precisam de três endereços
                        apontando para cá. O `scroll-mt` é a barra de topo
                        `fixed` da gaveta, medida em 44px, que sem folga
                        cobriria justamente o começo do grifo. */}
                    {pedaco.ancoras?.map((ancora) => (
                      <span key={ancora} id={ancora} className="scroll-mt-16" />
                    ))}
                    {pedaco.texto}
                  </mark>
                ) : (
                  <span key={indice}>{pedaco.texto}</span>
                ),
            )}
          </p>
        ))}
      </div>
    </Gaveta>
  );
}

/**
 * As posições das respostas aceitas, para o destaque no texto, cada uma com o
 * `id` que o link do FAQ procura.
 *
 * O filtro é `grifavel` e não mais "tem posição": é a **mesma** régua que o
 * FAQ usa para decidir se aponta para o trecho ou para o ato inteiro. Se as
 * duas discordassem, o link do FAQ levaria a um `id` que não existe.
 */
function faixasDoFaq(origem: Origem): Faixa[] {
  return (origem.faq ?? [])
    .filter((r) => grifavel(origem.texto, r.inicioChar, r.fimChar))
    .map((r) => ({
      inicio: r.inicioChar as number,
      fim: r.fimChar as number,
      ancora: ancoraDoTrecho(origem.chave, r.pergunta),
    }));
}

/**
 * As mesmas faixas, medidas de dentro de um parágrafo.
 *
 * As posições do banco são deslocamentos no texto inteiro; partir o ato não
 * pode mover o grifo, então cada parágrafo desconta o próprio `inicio`. O que
 * sobra fora dele `destacar` descarta sozinho, por já clampear e exigir
 * `fim > inicio` — inclusive a faixa que atravessa a quebra, que fica
 * recortada dos dois lados e vira uma marca em cada parágrafo.
 *
 * A âncora é a única coisa que não se recorta: ela é o **começo** do trecho,
 * e repeti-la na continuação poria o mesmo `id` duas vezes no documento.
 */
function faixasDoParagrafo(faixas: Faixa[], paragrafo: Paragrafo): Faixa[] {
  return faixas.map((faixa) => ({
    inicio: faixa.inicio - paragrafo.inicio,
    fim: faixa.fim - paragrafo.inicio,
    ancora: faixa.inicio >= paragrafo.inicio ? faixa.ancora : undefined,
  }));
}
