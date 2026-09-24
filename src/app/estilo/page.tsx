import type { Metadata } from "next";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { LinhaConcurso } from "@/components/concurso/LinhaConcurso";
import { Logo } from "@/components/marca/Logo";
import { Botao } from "@/components/ui/Botao";
import { Campo, Selecao } from "@/components/ui/Campo";
import { BlocoDeNumeros, Cartao, Numero, Selo } from "@/components/ui/Cartao";
import { Etiqueta, Rotulo } from "@/components/ui/Etiqueta";
import { Paginacao } from "@/components/ui/Paginacao";
import { Gaveta, Menu } from "@/components/ui/Revelador";
import { Secao } from "@/components/ui/Secao";
import { Trilha } from "@/components/ui/Trilha";
import { AtosPublicados } from "@/components/concurso/AtosPublicados";
import { Cargos, tituloDosCargos } from "@/components/concurso/Cargos";
import { Cronograma } from "@/components/concurso/Cronograma";
import { Faq, cabecalhoDoFaq } from "@/components/concurso/Faq";
import { SeletorDeTema } from "@/components/layout/SeletorDeTema";
import { listarConcursos } from "@/lib/concursos";
import type { EventoDoCronograma, EventoTipo, Tom } from "@/lib/dominio";
import { hojeEmSaoPaulo } from "@/lib/formato";
import {
  ATO_COM_DESCARTE,
  ATO_QUE_NAO_RESPONDE,
  ATO_QUE_RESPONDE,
  CARGOS_DE_PROVA,
} from "./exemplos";

/**
 * Vitrine do design system.
 *
 * Serve para conferir, no navegador, que o código bate com o canvas. Fica
 * fora do sitemap e leva noindex: é ferramenta de trabalho, não conteúdo.
 *
 * O critério do que entra é esse: **a suíte é Node sem DOM**, então entra o
 * que alguém precisa VER para conferir, com os estados que quebram — não só o
 * caminho feliz. Componente que só se lê no código não ganha bloco aqui.
 *
 * ## Os dois que ficaram de fora, e por quê
 *
 * **`Avaliacao`.** Ela tem quatro desfechos (não votado, gravada, sem
 * serviço, falhou) e um modal, e nenhum deles é alcançável por prop: o estado
 * é interno e só muda depois de um `POST /api/avaliacao`, que a rota
 * encaminha ao engine. Pôr os dois botões aqui daria **um** estado — o
 * inicial — e um clique que grava um voto de verdade, para um concurso que
 * não existe, dentro da única medida de qualidade que o produto tem. Os
 * outros três desfechos não têm como ser mostrados sem chamar a API a partir
 * da vitrine, que é justamente o que ela não pode fazer; copiá-los à mão
 * daria um retrato do componente, não o componente.
 *
 * O que se perderia de conferência visual é pouco, e é por acidente feliz: o
 * véu do modal é `bg-escura/40`, exatamente o mesmo token do fundo da gaveta —
 * e a gaveta está no bloco do revelador, logo acima. O véu que clareava no
 * escuro em vez de escurecer continua tendo onde ser visto.
 *
 * **`BarraBusca`.** Um exemplo só não vale nada aqui, e mais de um não cabe.
 * Os `id` dela são fixos (`busca-q`, `busca-uf`), então uma segunda instância
 * duplica `id` no documento e o segundo `<label>` passa a apontar para o campo
 * da primeira — a vitrine introduziria um defeito que o componente não tem.
 * Dar a ela um prefixo de `id` resolveria, e é o que quem quiser a barra aqui
 * tem de fazer primeiro.
 *
 * E com duas instâncias ainda sobraria pouco: dos estados dela, só
 * `dimensoes.comUf === 0` é alcançável por prop. Os que interessam —
 * detectando, negada, falhou, fora do Brasil, a UF lembrada, a lista de
 * buscas recentes — moram na Permissions API, na geolocalização e no
 * `localStorage`, e nenhum deles se alcança do lado de fora. Seriam dois
 * caminhos felizes lado a lado. A barra no estado normal está na home e em
 * `/concursos`.
 */
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

function Bloco({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titulo text-[18px] font-semibold tracking-[-0.01em]">
          {titulo}
        </h2>
        {nota && <Rotulo>{nota}</Rotulo>}
      </div>
      {children}
    </section>
  );
}

// Sem hexadecimal: o valor muda com o tema e um número fixo aqui mentiria
// metade do tempo. O nome do token é o que vale nos dois.
const SUPERFICIES = [
  { nome: "Cartão", classe: "bg-cartao", token: "cartao" },
  { nome: "Página", classe: "bg-pagina", token: "pagina" },
  { nome: "Rebaixada", classe: "bg-rebaixada", token: "rebaixada" },
  { nome: "Bloco", classe: "bg-bloco", token: "bloco" },
  { nome: "Rodapé", classe: "bg-rodape", token: "rodape" },
];

const TINTAS = [
  { nome: "900", classe: "bg-tinta-900" },
  { nome: "800", classe: "bg-tinta-800" },
  { nome: "600", classe: "bg-tinta-600" },
  { nome: "500", classe: "bg-tinta-500" },
  { nome: "400", classe: "bg-tinta-400" },
  { nome: "300", classe: "bg-tinta-300" },
  { nome: "200", classe: "bg-tinta-200" },
  { nome: "100", classe: "bg-tinta-100" },
];

const SINAIS = [
  { nome: "Ação", classe: "bg-acao", uso: "Botão primário, marca, filtro marcado." },
  // Não é "texto tinta 900": `tinta-900` é token de texto e inverte no
  // escuro, onde ele vale #edefee — quase branco sobre amarelo. Quem segura o
  // texto da chamada é `amarelo-texto`, que é o mesmo #141715 nos dois temas,
  // de propósito. Este bloco é o lugar onde um token invertido aparece, e a
  // frase que ele mostrava era a própria troca.
  { nome: "Amarelo · chamada única", classe: "bg-amarelo", uso: "Uma por tela, sempre com texto amarelo-texto." },
  { nome: "Vermelho · prazo curto", classe: "bg-vermelho", uso: "Encerra em até sete dias." },
  { nome: "Verde 500 · abertas", classe: "bg-verde-500", uso: "Só como ponto de 6 px." },
  { nome: "Ocre · previsto", classe: "bg-ocre", uso: "O amarelo quando precisa virar letra." },
];

const TONS: Tom[] = ["aberto", "urgente", "previsto", "encerrado"];

/**
 * O pior degrau que a trilha tem de aguentar: o título mais longo do acervo
 * de 2026-09-14, com 208 caracteres. Fica escrito aqui, e não lido da API,
 * para a vitrine mostrar o pior caso mesmo quando ela roda contra o mock.
 */
const TITULO_MAIS_LONGO =
  "Conselho Nacional de Combate à Pirataria e aos Delitos contra a " +
  "Propriedade Intelectual da Secretaria Nacional do Consumidor do " +
  "Ministério da Justiça e Segurança Pública - CNCP/SENACON/MJSP: " +
  "Edital nº 1/2026";

/**
 * As siglas do selo, e agora todas elas existem mesmo no acervo.
 *
 * A lista anterior dizia "todas tiradas do acervo" e trazia "PF" e "TJSP",
 * que não estão lá — o acervo é federal e não tem nem uma nem outra. Dizia
 * também que o acervo produz "quatro larguras (2, 4, 6 e 8 letras)"; ele
 * produz **sete**, de 2 a 8. Medido em 2026-09-14 sobre os 3.034 cartões com
 * sigla: 2 letras 1, 3 letras 301, 4 letras 2.025, 5 letras 324, 6 letras
 * 212, 7 letras 68, 8 letras 103.
 *
 * O que entrou é um representante de cada degrau que muda alguma coisa no
 * desenho, e não os sete por obrigação:
 *
 * - `MD` é a única sigla de duas letras do acervo inteiro, e é o degrau mais
 *   folgado.
 * - `UFMG` é a largura mais comum de longe (2.025 dos 3.034) e o caso normal.
 * - `UTFPR` tem cinco letras sem quebra possível.
 * - `CRA-RJ` e `COREN/PE` trazem os dois separadores que o acervo usa, hífen
 *   e barra — e a barra é a que o navegador aceita quebrar sozinha.
 * - `UNIPAMPA` é o pior caso de todos: oito letras sem um lugar por onde
 *   quebrar, e é ele que define o degrau de baixo da escada de corpo.
 * - `null` no fim é a ausência, que é o caso da maioria relativa.
 */
const SIGLAS_DE_PROVA: (string | null)[] = [
  "MD",
  "UFMG",
  "UTFPR",
  "CRA-RJ",
  "COREN/PE",
  "UNIPAMPA",
  null,
];

export default async function Estilo() {
  const hoje = new Date();
  const hojeCivil = hojeEmSaoPaulo(hoje);
  const { itens } = await listarConcursos({ porPagina: 6 }, hoje);
  const urgente = itens.find((c) => c.inscricoesAte) ?? itens[0];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="font-titulo text-[27px] font-semibold tracking-[-0.02em]">
          Design system
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-tinta-600">
          Cinza por padrão, cor só quando informa alguma coisa. Sem borda em
          caixa: o que separa é o degrau entre a página cinza e o cartão
          branco. Literata nos títulos e Archivo em todo o resto, número
          incluído.
        </p>
      </header>

      {/*
        O seletor de tema, e ele abre a página em vez de fechar: tudo o que
        vem abaixo tem de ser olhado duas vezes, e este é o interruptor.

        É o **mesmo** componente do cabeçalho, e não uma cópia: o estado vive
        no atributo `data-tema` do `html`, lido por `useSyncExternalStore`, o
        que faz os dois se moverem juntos. Clicar aqui e ver o de cima mudar é
        a conferência: se eles divergirem, o estado deixou de vir do documento.

        Por que ele entra numa vitrine onde já está presente pelo cabeçalho: a
        posição marcada é `bg-cartao` sobre `bg-rebaixada`, dois tokens de
        superfície vizinhos, e é o degrau mais curto do sistema inteiro.
        Medido a 375px: **1,27:1 no claro** (#ffffff sobre #e2e5e3) e
        **1,16:1 no escuro** (#1c201e sobre #272c29). Não há inversão entre os
        temas, o degrau é igualmente curto nos dois, e é de propósito:
        **quem diz a posição é o ícone, não a pastilha**. Ativo é `tinta-900`,
        inativo é `tinta-400`.

        O par que carregava o estado já foi outro: `tinta-900`/`tinta-500`
        fazia **3,36:1 no claro** e **2,82:1 no escuro**, abaixo dos 3:1 que um
        indicador não textual precisa, porque o degrau ficava mais apertado no
        escuro do que no claro. A pastilha não carrega o estado em tema
        nenhum, então quem precisava segurar os 3:1 sozinho era o ícone.

        A distância entre o ícone ativo e o inativo é de **4,23:1 no claro** e
        de **3,23:1 no escuro**: a saída aplicada troca o inativo para
        `tinta-400`, que ainda faz 3,36:1 no claro e 3,81:1 no escuro contra o
        trilho `rebaixada`, o mínimo de que ele próprio precisa. Fica medido
        em vez de consertado de passagem: a medida é `src/lib/contraste.test.ts`,
        no par `tinta-400`/`tinta-900`.
      */}
      <Bloco titulo="Tema" nota="claro · escuro · sistema, e sistema é o padrão">
        <Cartao className="flex flex-wrap items-center gap-4 p-5">
          <SeletorDeTema />
          <p className="max-w-[60ch] text-[12px] leading-5 text-tinta-600">
            Três posições e não um interruptor de duas: quem quer que o site
            siga o aparelho precisa de um lugar para onde voltar. Sem escolha
            (e portanto também sem JavaScript), o CSS segue a preferência do
            sistema sozinho.
          </p>
        </Cartao>
      </Bloco>

      <Bloco titulo="Marca" nota="Uma lente sobre um edital">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao className="flex flex-col items-start gap-4 p-5">
            <Logo tamanho={22} />
            <Rotulo>Horizontal · padrão</Rotulo>
          </Cartao>
          <Cartao className="flex flex-col items-start gap-4 p-5">
            <Logo variante="empilhado" tamanho={30} />
            <Rotulo>Empilhado · espaço estreito</Rotulo>
          </Cartao>
          <Cartao className="flex flex-col items-start gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-[9px] bg-escura">
                <Logo variante="simbolo" tom="claro" tamanho={24} />
              </span>
              <span className="flex size-6 items-center justify-center rounded-md bg-escura">
                <Logo variante="simbolo" tom="claro" tamanho={15} />
              </span>
            </div>
            <Rotulo>App e favicon · abaixo de 24 px caem as linhas</Rotulo>
          </Cartao>
          <Cartao className="flex flex-col items-start gap-4 p-5 text-tinta-900">
            <Logo tom="mono" tamanho={26} />
            <Rotulo>Monocromático · ofícios e impressos</Rotulo>
          </Cartao>
        </div>

        {/* Os três fundos em que a marca precisa se segurar. Eram quatro, e
            dois deles eram o mesmo `bg-escura` com a mesma logo — repetição,
            não estado. `bg-amarelo` entrou no lugar do duplicado porque é o
            único fundo forte da tela e o que nunca muda entre os temas. */}
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div className="rounded-caixa bg-escura p-6">
            <Logo tom="claro" tamanho={28} />
          </div>
          <div className="rounded-caixa bg-amarelo p-6 text-amarelo-texto">
            <Logo tom="mono" tamanho={28} />
          </div>
          <div className="rounded-caixa bg-rebaixada p-6">
            <Logo tamanho={28} />
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Superfícies" nota="O degrau separa, não a borda">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {SUPERFICIES.map((superficie) => (
            <Cartao key={superficie.nome} className="flex flex-col gap-2 p-4">
              <div className={`h-9 rounded-md ${superficie.classe}`} />
              <p className="text-[12px] font-semibold">{superficie.nome}</p>
              <p className="numero text-[10px] text-tinta-500">{superficie.token}</p>
            </Cartao>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Tinta" nota="Todo o texto e todo o resto">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {TINTAS.map((tinta) => (
            <div key={tinta.nome} className="overflow-hidden rounded-lg bg-cartao">
              <div className={`h-12 ${tinta.classe}`} />
              <div className="px-2.5 py-2">
                <p className="text-[10px] font-semibold">{tinta.nome}</p>
              </div>
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="As cinco cores que sobraram">
        <Cartao className="flex flex-col gap-2.5 p-5">
          {SINAIS.map((sinal) => (
            <div key={sinal.nome} className="flex items-center gap-3">
              <span className={`size-7 shrink-0 rounded-[7px] ${sinal.classe}`} />
              <p className="text-[12px] leading-5">
                <span className="font-semibold">{sinal.nome}.</span>{" "}
                <span className="text-tinta-600">{sinal.uso}</span>
              </p>
            </div>
          ))}
        </Cartao>
      </Bloco>

      <Bloco titulo="Tipografia" nota="Literata no título · Archivo no resto">
        <Cartao className="flex flex-col gap-4 p-6">
          <p className="font-titulo text-[30px] leading-[34px] font-semibold tracking-[-0.02em]">
            Concursos abertos
          </p>
          <p className="font-titulo text-[21px] leading-8 font-semibold tracking-[-0.01em]">
            Tribunal de Justiça de São Paulo
          </p>
          <p className="text-xl leading-7 font-semibold tracking-[-0.02em]">
            Cargos e vagas
          </p>
          <p className="text-base leading-6 font-semibold tracking-[-0.01em]">
            Analista judiciário · Área administrativa
          </p>
          <p className="max-w-[60ch] text-[13px] leading-6 text-tinta-800">
            Corpo de texto do edital e das notícias. Linha de 60 a 75
            caracteres, alinhada à esquerda, nunca justificada.
          </p>
          <p className="text-[12px] leading-5 text-tinta-600">
            Texto de apoio e metadado de cartão.
          </p>
          <Rotulo>Rótulo de seção e de filtro</Rotulo>
          <p className="numero text-[12px] leading-5 font-medium">
            Edital 01/2026 · até 14/04/2026 · R$ 14.852,66
          </p>
          <p className="text-[11px] leading-4 text-tinta-500">
            Número usa o mesmo Archivo, com as figuras de largura fixa ligadas
            para alinhar em coluna.
          </p>
        </Cartao>
      </Bloco>

      {/*
        A nota dizia "40 px padrão · 48 na chamada · 32 no compacto". Esses
        são os três degraus do canvas, e não é o que o navegador desenha: a
        unidade de espaço deste projeto é 3,52px e não 4 (`--spacing: 0.22rem`
        em `globals.css`), e foi ela que apertou tudo em 12% de uma vez só,
        altura de controle incluída. `h-10`, `h-12` e `h-8` medem 35, 42 e 28.
        A escala do canvas continua valendo como escala; o número em pixel é
        que era de antes do aperto.
      */}
      <Bloco titulo="Botões" nota="35 px padrão · 42 na chamada · 28 no compacto">
        <Cartao className="flex flex-wrap items-center gap-3 p-5">
          <Botao>Ver edital</Botao>
          <Botao variante="secundario">Salvar</Botao>
          <Botao variante="fantasma">Limpar filtros</Botao>
          <Botao disabled>Indisponível</Botao>
          <Botao variante="chamada" tamanho="lg">
            Criar alerta grátis
          </Botao>
          <Botao variante="secundario" tamanho="sm">
            Compartilhar
          </Botao>
        </Cartao>
      </Bloco>

      <Bloco titulo="Campos">
        <Cartao className="grid gap-4 p-5 sm:grid-cols-2">
          <Campo id="exemplo-cargo" etiqueta="Cargo ou órgão" defaultValue="Analista judiciário" />
          <Selecao
            id="exemplo-uf"
            etiqueta="Estado"
            defaultValue="SP"
            opcoes={[
              { valor: "SP", rotulo: "São Paulo" },
              { valor: "RJ", rotulo: "Rio de Janeiro" },
            ]}
          />
          <Campo id="exemplo-vazio" etiqueta="Banca" placeholder="Qualquer banca" />
          <Campo
            id="exemplo-erro"
            etiqueta="CPF"
            defaultValue="123.456"
            erro="CPF incompleto"
          />
        </Cartao>
      </Bloco>

      <Bloco titulo="Etiquetas" nota="Ponto de 6 px, cor só no ponto">
        <Cartao className="flex flex-wrap items-center gap-3 p-5">
          {TONS.map((tom) => (
            <Etiqueta key={tom} tom={tom} comPonto>
              {tom}
            </Etiqueta>
          ))}
          <Etiqueta>Superior</Etiqueta>
          <Etiqueta>21 vagas PcD</Etiqueta>
          <Etiqueta>84 vagas para negros</Etiqueta>
          <Etiqueta>Cadastro reserva</Etiqueta>
          <Etiqueta>Banca: Vunesp</Etiqueta>
        </Cartao>
      </Bloco>

      {/*
        O selo, nos dois tamanhos e nos quatro tons, contra o fundo de cartão
        de cada tom — que é o único lugar onde as cores dele significam alguma
        coisa. Cada tom traz as larguras de sigla que mudam o desenho — ver
        `SIGLAS_DE_PROVA` — e, na última coluna, a ausência.

        A coluna "sem sigla" é a que existe para ser olhada: é o caso de 1.614
        dos 4.648 cartões do acervo de 2026-09-14, e é ela que garante que a
        falta continue lendo como falta e não como selo que não carregou.
        Repare que o traço fica na mesma caixa da sigla — é o que mantém o
        título alinhado entre um cartão e o seguinte.
      */}
      <Bloco titulo="Selo do órgão" nota="Sem sigla, sem quadrado: só o traço">
        <div className="grid gap-2 sm:grid-cols-2">
          {TONS.map((tom) => (
            <Cartao key={tom} tom={tom} className="p-5">
              <Rotulo>{tom}</Rotulo>
              {(["md", "sm"] as const).map((tamanho) => (
                <div
                  key={tamanho}
                  className="mt-3 flex flex-wrap items-center gap-3"
                >
                  <span className="numero w-6 text-[11px] text-tinta-500">
                    {tamanho}
                  </span>
                  {SIGLAS_DE_PROVA.map((sigla) => (
                    <Selo
                      key={sigla ?? "sem"}
                      sigla={sigla}
                      tom={tom}
                      tamanho={tamanho}
                    />
                  ))}
                </div>
              ))}
            </Cartao>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Bloco de números" nota="Rebaixo dentro do cartão">
        <Cartao className="p-5">
          <BlocoDeNumeros className="grid-cols-2 sm:grid-cols-4">
            <Numero rotulo="Vagas">148</Numero>
            <Numero rotulo="Salário até">R$ 14.852</Numero>
            <Numero rotulo="Inscrições">até 14/04</Numero>
            <Numero rotulo="Taxa">R$ 110,00</Numero>
          </BlocoDeNumeros>
        </Cartao>
      </Bloco>

      <Bloco titulo="Cartão de concurso" nota="Unidade central do produto">
        <div className="grid gap-2 lg:grid-cols-2">
          {urgente && <CartaoConcurso concurso={urgente} hoje={hoje} />}
          <div className="flex flex-col gap-2">
            {itens.slice(0, 3).map((concurso) => (
              <LinhaConcurso key={concurso.slug} concurso={concurso} hoje={hoje} />
            ))}
          </div>
        </div>
      </Bloco>

      {/*
        A trilha, nos dois tamanhos que o acervo produz: a de dois degraus da
        página do órgão e a de três da página do concurso, esta com o pior
        título do acervo (208 caracteres) no degrau corrente.

        O que conferir aqui, porque a suíte é Node sem DOM: o degrau corrente
        não é link e os de cima são; o corte em `40ch` aparece no degrau longo;
        o separador tem 2px de cada lado; e a 375px a trilha ocupa uma linha
        nos dois casos. O `BreadcrumbList` que sai da mesma lista está no
        código-fonte da página, em `application/ld+json`.
      */}
      <Bloco titulo="Trilha" nota="A tela e o buscador, da mesma lista">
        <Cartao className="flex flex-col gap-4 p-5">
          <Trilha
            degraus={[
              { nome: "Concursos", href: "/concursos" },
              { nome: "CRA-RJ", href: "/orgaos/cra-rj" },
            ]}
          />
          <Trilha
            degraus={[
              { nome: "Concursos", href: "/concursos" },
              { nome: "FUNAI", href: "/orgaos/fundacao-nacional-povos-indigenas" },
              {
                nome: TITULO_MAIS_LONGO,
                href: "/concursos/exemplo-do-titulo-mais-longo",
              },
            ]}
          />
        </Cartao>
      </Bloco>

      <Bloco titulo="Paginação">
        <Cartao className="p-5">
          <Paginacao pagina={3} paginas={32} hrefDe={() => "/estilo"} />
        </Cartao>
      </Bloco>

      {/*
        O revelador, que é o lugar onde todo painel que abre e fecha mora. As
        duas formas ficam lado a lado de propósito: é aqui que dá para ver, num
        gesto, que a gaveta é modal e o menu não — a gaveta escurece o fundo,
        trava a rolagem e prende o foco; o menu deixa a página viva atrás dele.

        O que conferir no navegador, porque a suíte é Node sem DOM: abrir e
        fechar animam nos dois sentidos; Escape fecha; clique fora fecha; a
        página não rola por trás da gaveta; o foco entra ao abrir e volta ao
        gatilho ao fechar; e, com "reduzir movimento" ligado no sistema, os dois
        aparecem e somem sem percorrer caminho nenhum.
      */}
      <Bloco
        titulo="Revelador"
        nota="gaveta é modal · menu não é · os dois abrem sem script"
      >
        <Cartao className="flex flex-wrap items-center gap-3 p-5">
          <Gaveta
            rotulo="Abrir a gaveta"
            titulo="A gaveta"
            apoio={<>· 352,5px a 375px</>}
          >
            <p className="max-w-[74ch] text-[13px] leading-6 text-tinta-800">
              O painel entra pela direita e cobre 94vw, o que a 375px deixa
              22,5px de página à mostra, o bastante para se ver que há algo
              atrás sem que a faixa vire um alvo de toque por engano. A barra
              de cima é o mesmo <code>&lt;summary&gt;</code> que abriu, porque
              ele é o único elemento que fecha um <code>&lt;details&gt;</code>{" "}
              sem JavaScript; um botão desenhado aqui dentro deixaria quem está
              sem script com a gaveta aberta e sem saída.
            </p>
            <p className="mt-4 max-w-[74ch] text-[13px] leading-6 text-tinta-600">
              O conteúdo rola por dentro, e enquanto a gaveta está aberta ela é
              a única área rolável da tela.
            </p>
          </Gaveta>

          <Menu
            rotulo="Abrir o menu de exemplo"
            gatilho={
              <span className="flex h-8 items-center rounded-controle bg-rebaixada px-3 text-[12px] font-semibold text-tinta-800 transition-colors hover:bg-tinta-200">
                Abrir o menu
              </span>
            }
            painelClassName="w-56"
          >
            <p className="px-3 py-2 text-[13px] leading-5 text-tinta-600">
              Cai do gatilho, ancorado nele. Não trava a rolagem e não apaga o
              resto da página: quem abriu vai escolher um item ou desistir, e
              os dois caminhos são curtos.
            </p>
          </Menu>
        </Cartao>
      </Bloco>

      {/* Os números são os medidos, não os degraus da escala: `mt-1`, `mb-2`
          e `gap-6` sobre a unidade de 3,52px dão 3,5, 7 e 21px. A nota daqui
          dizia 4, 8 e 24, que é a escala de 4 do canvas — a mesma troca que
          estava na altura dos botões. A tabela medida está na docstring de
          `ui/Secao`, e 7 contra 21 é o 1 para 3 que faz o título pertencer ao
          bloco de baixo. */}
      <Bloco
        titulo="Seção: o rótulo fora do bloco"
        nota="3,5 do rótulo ao apoio · 7 do cabeçalho ao bloco · 21 entre seções"
      >
        <div className="flex flex-col gap-6">
          <Secao
            titulo="Cronograma"
            apoio="Cada data com a procedência: de qual ato publicado ela foi lida."
          >
            <p className="text-sm text-tinta-600">
              O conteúdo do bloco. O rótulo acima não mora aqui dentro: ele
              nomeia o bloco de fora, e a distância curta até o cartão é o que
              diz a qual dos dois blocos ele pertence.
            </p>
          </Secao>
          <Secao titulo="Cargos (3)">
            <p className="text-sm text-tinta-600">
              Seção sem linha de apoio. O cabeçalho é só o rótulo.
            </p>
          </Secao>
        </div>
      </Bloco>

      <Bloco
        titulo="Linha do tempo"
        nota="ordinal · ponto cheio é passado, vazado é futuro"
      >
        <Secao titulo="Cronograma" apoio="Passado, hoje, futuro e sem data.">
          <Cronograma eventos={EVENTOS_DE_EXEMPLO(hojeCivil)} hoje={hojeCivil} />
        </Secao>
      </Bloco>

      {/*
        Daqui até o fim dos atos publicados é a página do concurso, na ordem em
        que ela se lê: cargos, o que o ato responde, e o ato.

        **Por que estes três só existem aqui.** `obterDetalhe` sem
        `BC_API_URL` devolve `cargos: []` e `origens: []` — o mock é um acervo
        de resumos e não tem ato nem cargo. Quem desenha contra o mock, que é
        o modo padrão e o que a suíte usa, não vê nenhum dos três em tela
        nenhuma do app. A vitrine é a única tela onde eles aparecem, e é por
        isso que o dado deles está congelado em `./exemplos.ts` em vez de vir
        de uma chamada: a vitrine não fala com a API nem com o banco.

        O dado é real e verbatim, copiado do acervo em 2026-09-14. O que ele
        **não** reproduz está dito: o ato mediano do acervo tem 1.623
        caracteres e o maior tem 99 mil, e o maior daqui tem 1.481. Quem
        precisar ver a parede de 99 mil caracteres partida em parágrafos tem
        de olhar um concurso de verdade, com o engine no ar — este bloco mostra
        a mecânica do corte, não a escala dela.
      */}
      <Bloco
        titulo="Cargos"
        nota="do cargo completo ao cargo que é só um nome"
      >
        <Secao titulo={tituloDosCargos(CARGOS_DE_PROVA)}>
          <Cargos cargos={CARGOS_DE_PROVA} />
        </Secao>
      </Bloco>

      {/*
        O FAQ nos três desfechos que ele tem, cada um no seu bloco, porque o
        cabeçalho muda com o conteúdo e um exemplo só esconderia isso.

        O que conferir no navegador, porque a suíte é Node sem DOM:

        - No primeiro, "ver no ato publicado" abre a gaveta **no trecho
          grifado**, e não no começo do ato. Os três primeiros links caem todos
          na MESMA marca amarela: três perguntas respondidas pela mesma frase
          viram um `<mark>` só com três `id` dentro, e não três marcas
          aninhadas. O endereço dentro da citação é link e o texto ao redor
          dele sai idêntico ao do ato, sem um caractere a mais.
        - No segundo, a linha do descarte no fim — a que aponta defeito nosso.
        - No terceiro, o título inverte e a linha de apoio some, porque não há
          trecho literal nenhum sobre o que falar.

        Os atos ficam num bloco só, embaixo, que é a forma que `AtosPublicados`
        tem na página de detalhe: uma lista de `Origem[]`. São os mesmos três
        atos, então cada âncora do FAQ tem para onde ir.
      */}
      <Bloco
        titulo="FAQ"
        nota="respondida · descartada · o ato que não responde nenhuma"
      >
        <div className="flex flex-col gap-6">
          <Secao {...cabecalhoDoFaq([ATO_QUE_RESPONDE])}>
            <Faq origens={[ATO_QUE_RESPONDE]} />
          </Secao>
          <Secao {...cabecalhoDoFaq([ATO_COM_DESCARTE])}>
            <Faq origens={[ATO_COM_DESCARTE]} />
          </Secao>
          <Secao {...cabecalhoDoFaq([ATO_QUE_NAO_RESPONDE])}>
            <Faq origens={[ATO_QUE_NAO_RESPONDE]} />
          </Secao>
        </div>
      </Bloco>

      {/*
        Os três atos, com os grifos que o FAQ acima produziu. O terceiro é o
        que tem `url` nula — o estado de todo o acervo hoje —, e nele o link do
        diário vira texto explicando que o ato está guardado inteiro aqui.

        Os dois com `editalCitadoUrl` mostram a ressalva por escrito: é o
        endereço que o ato afirma e que nós nunca visitamos.
      */}
      <Bloco titulo="Atos publicados" nota="o texto abre em gaveta, e sem script">
        <Secao
          titulo="Os atos publicados"
          apoio="O ato como saiu no diário oficial, na íntegra. Pode ser o extrato, não o edital completo."
        >
          <AtosPublicados
            origens={[ATO_QUE_RESPONDE, ATO_COM_DESCARTE, ATO_QUE_NAO_RESPONDE]}
          />
        </Secao>
      </Bloco>

      {/*
        Este bloco dizia "Escala de 4: 4 8 12 16 20 24 32 40 48 64. Cartões se
        separam por 12, seções por 32, e os blocos da página de detalhe por
        24". Nenhum dos três números sobreviveu, e por dois motivos diferentes.

        O primeiro é a unidade: `--spacing` é 0.22rem, ou 3,52px, e não 4 — o
        aperto de 12% que `globals.css` documenta. A escala do canvas continua
        sendo 4 8 12…, mas nenhum desses é um pixel na tela.

        O segundo é que os vãos mudaram e a frase não foi junto: hoje cartão
        se separa de cartão por `gap-2`, não por 12 de escala, e os blocos da
        página de detalhe por `gap-6`, que é 21 e não 24. "Seções por 32"
        continua escrito também em `globals.css`, logo abaixo do token, e lá
        não é meu para consertar.
      */}
      <Bloco titulo="Espaço e separação" nota="a unidade é 3,52px, não 4">
        <Cartao className="flex flex-col gap-2 p-5 text-[12px] leading-5 text-tinta-600">
          <p>
            A escala é a do canvas:{" "}
            <span className="numero text-tinta-900">
              1 2 3 4 5 6 8 10 12 16
            </span>{" "}
            de degrau, sobre uma unidade de{" "}
            <span className="numero text-tinta-900">3,52px</span>, o que na
            tela dá{" "}
            <span className="numero text-tinta-900">
              3,5 7 10,6 14,1 17,6 21,1 28,2 35,2 42,2 56,3
            </span>
            .
          </p>
          <p>
            Cartão se separa de cartão por <span className="numero">2</span>{" "}
            (7px) e os blocos da página de detalhe por{" "}
            <span className="numero">6</span> (21px), que é o vão que cabe um
            rótulo de seção do lado de fora sem ele grudar no bloco de cima, e
            é três vezes os 7px que separam o rótulo do bloco que ele nomeia.
          </p>
          <p>
            Nenhuma sombra e nenhuma borda em caixa. Dentro do cartão, um bloco
            rebaixado agrupa os números.
          </p>
        </Cartao>
      </Bloco>
    </div>
  );
}

/**
 * O cronograma de exemplo, montado em volta de hoje.
 *
 * Aqui o dado é inventado de propósito, e é o único lugar da vitrine em que
 * isso acontece: as quatro fases do ponto (passado, hoje, futuro, sem data) e
 * a marca do degrau só aparecem juntas num concurso que não existe. Datas
 * relativas a hoje, senão a vitrine envelhece e para de mostrar o que
 * promete.
 */
function EVENTOS_DE_EXEMPLO(hoje: string): EventoDoCronograma[] {
  const mais = (dias: number) => {
    const [ano, mes, dia] = hoje.split("-").map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia + dias));
    return data.toISOString().slice(0, 10);
  };
  const evento = (
    tipo: EventoTipo,
    inicio: string | null,
    fim: string | null = null,
    evidencia: string | null = null,
  ): EventoDoCronograma => ({
    tipo,
    ato: null,
    inicio,
    fim,
    hora: null,
    localidades: [],
    observacao: null,
    evidencia,
  });

  return [
    evento(
      "publicacao_edital",
      mais(-40),
      null,
      "Edital nº 003/2026, publicado no D.O.U.",
    ),
    evento("inicio_inscricao", mais(-12)),
    evento("fim_inscricao", mais(9)),
    evento("prova_objetiva", mais(46), null, "As provas serão aplicadas em"),
    evento("resultado_final", null),
  ];
}
