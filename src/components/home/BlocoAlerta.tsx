import { Fragment } from "react";
import type { AvisoDoAcervo } from "@/lib/concursos";
import { numero } from "@/lib/formato";
import { acervoIncompletoEmPartes } from "@/lib/rotulos";

/**
 * O que a lista não está mostrando, dito em voz baixa.
 *
 * A lista traz só os concursos que já têm cargo ou evento extraído. Os outros
 * existem no acervo e não aparecem — em 2026-09-14 são 189 de 4.838 —, e uma
 * tela que mostra 4.649 concursos sem dizer isso afirma, por omissão, que o
 * acervo tem 4.649.
 *
 * **Este parágrafo já mentiu, e é bom saber como.** Ele dizia que os que
 * estão fora "ainda não foram lidos" e que "entram na lista conforme forem
 * lidos". Nada disso descrevia o banco: 138 tinham sido lidos, com sucesso,
 * e o ato era retificação ou anexo — não há cargo para extrair de uma
 * retificação de prazo, e esses 138 nunca virariam linha da lista. O número
 * não estava errado; a frase em volta dele é que descrevia uma realidade que
 * não existe, e um leitor que a levasse a sério ficaria esperando o número
 * virar zero. Era o mesmo erro que o produto recusa do lado do dado —
 * afirmar o que o ato não disse — cometido do lado da tela.
 *
 * O conserto foi a API passar a publicar a repartição (`foraDaLista`) e a
 * frase passar a ser montada a partir dela, em `acervoIncompletoEmPartes()`.
 * A regra de produto não mudou: a lista traz só concurso com dado, e a
 * contagem do resto aparece como aviso. O que mudou é o aviso dizer o que
 * essa contagem é.
 *
 * **Hoje a frase tem duas orações, e amanhã pode ter três.** A fila de
 * leitura está vazia desde a remoção da fonte IBADE, então a oração da fila
 * não é escrita — some a oração inteira, não vira "0 esperam na fila". O
 * `tick` da manhã enfileira o Diário do dia e ela volta sozinha. Nada aqui
 * precisa mudar para isso acontecer, e é esse o teste que importa.
 *
 * Cinza e não amarelo de propósito. O amarelo desta página é um só, o do
 * `BlocoAlerta` logo abaixo; dois amarelos e nenhum dos dois chama.
 */
export function AcervoIncompleto({ aviso }: { aviso: AvisoDoAcervo }) {
  const partes = acervoIncompletoEmPartes(aviso);
  return (
    <p className="rounded-caixa bg-cartao px-6 py-5 text-sm leading-6 text-tinta-600">
      Outros{" "}
      <strong className="numero font-medium text-tinta-900">
        {numero(aviso.semDado)}
      </strong>{" "}
      dos {numero(aviso.total)} concursos do acervo estão fora desta lista
      {/*
        Sem a repartição — engine mais velho, ou soma que não fecha —, a frase
        conta o total e para por aí. Ela não promete entrada automática nem
        finge que está tudo certo; é menos do que a tela sabe dizer num dia
        bom, e é tudo o que ela pode afirmar num dia ruim.
      */}
      {partes.length === 0 ? (
        <>
          : não temos cargo nem cronograma deles. Nem todos vão entrar: parte
          dos atos é retificação ou anexo, que não abre concurso.
        </>
      ) : partes.length === 1 && partes[0].quantos === aviso.semDado ? (
        /*
          Uma parte só, e ela cobre o total: repetir o número faria a frase
          gaguejar ("Outros 138 ... estão fora desta lista. 138 não vão
          entrar"). O número já foi dito; aqui entra só a explicação, presa à
          abertura. Cada texto de parte começa por locução verbal justamente
          para caber nas duas posições — ver `acervoIncompletoEmPartes`.

          É o estado para o qual o acervo caminha: fila vazia e lacuna zerada
          deixam de pé só os atos que nunca viram concurso.
        */
        <>, e {partes[0].texto}</>
      ) : (
        <>
          {/* O ponto que fecha a abertura. Ele mora aqui e não no texto da
              abertura porque o ramo de cima continua a mesma oração com
              dois-pontos; cada parte já traz o seu. */}
          .
          {partes.map((parte) => (
            <Fragment key={parte.texto}>
              {" "}
              <strong className="numero font-medium text-tinta-900">
                {numero(parte.quantos)}
              </strong>{" "}
              {parte.texto}
            </Fragment>
          ))}
        </>
      )}
    </p>
  );
}

/**
 * A chamada única da tela.
 *
 * É o único amarelo da home, e por isso ele funciona. Dois amarelos numa
 * página e nenhum dos dois chama. O texto do botão sempre carrega o número,
 * porque "criar alerta" é abstrato e "avisar sobre 184 concursos" não é.
 */
export function BlocoAlerta({ totalAbertos }: { totalAbertos: number }) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <div className="flex flex-col items-start gap-5 rounded-caixa bg-amarelo px-7 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em] text-amarelo-texto">
            Receba os {numero(totalAbertos)} concursos abertos por e-mail
          </h2>
          <p className="mt-1.5 max-w-[62ch] text-sm leading-5 text-amarelo-texto/75">
            Salvamos a sua busca e avisamos assim que sair edital novo, sem
            custo. Um e-mail por dia, no máximo, e só quando houver novidade.
          </p>
        </div>

        <form
          action="/concursos"
          method="get"
          className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <label htmlFor="alerta-email" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="alerta-email"
            name="email"
            type="email"
            required
            placeholder="voce@email.com"
            className="h-12 w-full rounded-controle bg-cartao px-3.5 text-sm text-tinta-900 outline-none placeholder:text-tinta-400 sm:w-[16rem]"
          />
          <button
            type="submit"
            className="h-12 shrink-0 rounded-controle bg-inverso px-6 text-[13px] font-semibold text-inverso-texto transition-colors hover:bg-inverso-hover"
          >
            Criar alerta grátis
          </button>
        </form>
      </div>
    </section>
  );
}
