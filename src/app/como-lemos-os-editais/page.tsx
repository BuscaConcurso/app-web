import type { Metadata } from "next";
import Link from "next/link";
import { PaginaDeTexto } from "@/components/ui/PaginaDeTexto";
import { numerosDoAcervo } from "@/lib/concursos";
import { PAGINAS_INSTITUCIONAIS } from "@/lib/institucionais";
import { aberturaDoMetodo, numerosSemDerrubar } from "@/lib/metodo";
import { EMAIL_CONTATO } from "@/lib/site";

const { titulo, href } = PAGINAS_INSTITUCIONAIS["como-lemos"];

export const metadata: Metadata = {
  title: titulo,
  description:
    "Onde o BuscaConcurso procura os concursos, o que lê, como organiza cada concurso " +
    "e como avisar um erro.",
  alternates: { canonical: href },
};

/**
 * ISR de cinco minutos, o mesmo tempo da leitura do acervo (`concursos.ts`):
 * os números da abertura saem da lista, não do texto.
 */
export const revalidate = 300;

/**
 * O método, em linguagem de candidato. Cada frase foi conferida no engine
 * (`engine/src/buscaconcurso`, lido em 2026-09-28), e o que o spec pedia e o
 * motor não faz ficou de fora:
 *
 * - Fonte: só o Diário Oficial da União. As bancas (IBADE, Cebraspe, FGV)
 *   saíram do catálogo em 2026-09-14 (`api.py`, comentário da fila; a tabela
 *   `source` tem só `dou`). INLABS, seções 1, 2 e 3, só dia útil, sem edição
 *   extra (`diarios/dou.py:33-49`, `cli.py:535-545`); nenhum diário estadual
 *   ou municipal. O filtro é "concurso público", "processo seletivo",
 *   "seleção pública" (`diarios/filtro.py`).
 * - Regras que reprovam a leitura (`validacao.py`): data fora de 2000 a
 *   hoje + 5 anos, data que não existe (schema), fim antes do início, cargo
 *   sem nome, salário fora de R$ 100 a R$ 100 mil. **Não há regra de
 *   "salário abaixo do mínimo"**: o piso é R$ 100, para pegar "R$ 3.000"
 *   lido como 3. A regra de cargo sem vaga só vale para edital de banca, e
 *   não há banca como fonte.
 * - Órgão: em geral da hierarquia do próprio Diário
 *   (`diarios/hierarquia.py`), senão da leitura do ato; sem cadastro
 *   externo. Estado (`ufs.py:155-248`): cidade da vaga na tabela do IBGE, ou
 *   o nome do órgão quando nomeia um estado ou traz a sigla; cidade ambígua
 *   só conta com o órgão confirmando. Junção de atos: órgão, ano e número do
 *   edital; título parecido só marca revisão (`pipeline/resolve.py`).
 * - O selo "Conferido por nós" (`AtosPublicados.tsx`, `temSeloConferido`)
 *   só aparece com o texto do ato guardado, e quer dizer isso.
 *
 * Mudou o motor, muda esta página.
 */
export default async function ComoLemosOsEditais() {
  const numeros = await numerosSemDerrubar(numerosDoAcervo);

  return (
    <PaginaDeTexto titulo={titulo} href={href} abertura={aberturaDoMetodo(numeros)}>
      <h2>Onde procuramos</h2>
      <p>
        Hoje lemos só o Diário Oficial da União, todo dia útil. Lemos as três
        seções da edição do dia e separamos os atos que falam em concurso
        público, processo seletivo ou seleção pública.
      </p>
      <p>
        Ainda não lemos os sites das bancas organizadoras, os diários oficiais
        dos estados e dos municípios, nem as edições extras do Diário Oficial
        da União. Um concurso publicado só nesses lugares pode não estar aqui.
      </p>

      <h2>O que lemos</h2>
      <p>
        Lemos o edital de abertura e os atos que mudam o concurso depois, como
        as retificações. Quando lemos uma retificação, o dado novo em geral
        toma o lugar do antigo. Retificação publicada em edição extra do
        Diário não é lida.
      </p>
      <p>
        Um edital costuma trazer os cargos, as vagas, a escolaridade, o
        salário, a taxa de inscrição e as datas: inscrição, prova, resultado.
        Mas o Diário Oficial muitas vezes publica só um resumo do edital, o
        extrato. A tabela de cargos, o quadro de vagas e os anexos ficam no
        site da banca. Quando é assim, a página do concurso tem menos detalhe
        do que o edital completo.
      </p>
      <p>
        Quando o ato diz onde está o edital completo, mostramos esse endereço
        como &quot;Informado pelo ato, não conferido&quot;: ele vem escrito
        no ato, e nós não o visitamos.
      </p>

      <h2>Como o edital vira página</h2>
      <p>
        Um programa lê o texto de cada ato e anota o que interessa: cargos,
        vagas, escolaridade, salário, taxa e as datas do cronograma. A
        instrução é deixar em branco o que o texto não diz, em vez de
        adivinhar.
      </p>
      <p>Antes de ir para a página, a leitura passa por regras que reprovam erro:</p>
      <ul>
        <li>data que não existe, de antes de 2000 ou de mais de cinco anos à frente;</li>
        <li>data de fim antes da data de início, como inscrição que acaba antes de começar;</li>
        <li>cargo sem nome;</li>
        <li>
          salário abaixo de R$ 100 ou acima de R$ 100 mil, sinal de número
          lido errado, como R$ 3.000 que virou R$ 3.
        </li>
      </ul>
      <p>
        O que é reprovado não entra na página, e o concurso fica marcado para
        revisão. As regras pegam erros grosseiros. Uma data trocada por outra
        data possível passa por elas.
      </p>

      <h2>Como organizamos cada concurso</h2>
      <ul>
        <li>
          <strong>O órgão.</strong> Em geral sai da própria estrutura do
          Diário, que diz a que ministério, secretaria ou autarquia o ato
          pertence; quando o Diário não diz, sai da leitura do ato. Não
          conferimos o órgão em cadastro de fora, como o do CNPJ.
        </li>
        <li>
          <strong>O estado.</strong> Vem da cidade das vagas, conferida na
          lista de municípios do IBGE, ou do nome do órgão quando ele nomeia
          um estado ou traz a sigla, como Universidade Federal do Piauí ou
          Prefeitura de Campinas/SP. Cidade com o mesmo nome em mais de um estado só conta se o
          órgão confirmar o estado.
        </li>
        <li>
          <strong>A ligação com o ato no Diário.</strong> Um ato novo só é
          juntado a um concurso que já temos quando o órgão, o ano e o número
          do edital batem. Se só o título é parecido, não juntamos: marcamos
          para revisão.
        </li>
      </ul>
      <p>
        Na página do concurso, o ato do Diário aparece com o selo
        &quot;Conferido por nós&quot;. Ele quer dizer isto, e só isto: aquele
        é o texto do ato como saiu no Diário, guardado por nós e mostrado
        inteiro, para você comparar com o que está resumido acima dele. O selo
        não quer dizer que uma pessoa conferiu cada dado da página.
      </p>

      <h2>O que pode estar errado, e como avisar</h2>
      <p>
        A leitura automática erra: pode trocar uma data, juntar dois cargos ou
        perder uma vaga. Por isso o cronograma mostra, quando o ato permite,
        de onde cada data foi lida, e o ato inteiro fica no fim da página do
        concurso.
      </p>
      <p>
        Achou um erro? Na página do concurso, responda &quot;Não, tem
        erro&quot; na pergunta &quot;Esta página está certa?&quot; e diga
        qual parte está errada. O aviso fica guardado para a equipe conferir.
        Você também pode escrever para{" "}
        <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>, com o link da
        página. Outros jeitos de falar conosco estão em{" "}
        <Link href={PAGINAS_INSTITUCIONAIS.contato.href}>contato</Link>.
      </p>
      <p>
        <strong>O edital publicado sempre vale mais do que esta página.</strong>{" "}
        O BuscaConcurso não organiza concursos. Antes de se inscrever, confira
        tudo no edital, no Diário Oficial ou no site da banca.
      </p>
    </PaginaDeTexto>
  );
}
