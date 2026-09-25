import type { Metadata } from "next";
import { Azulejos, FAIXA_MARCA } from "@/components/marca/Azulejos";
import { Logo } from "@/components/marca/Logo";
import { AtosPublicados } from "@/components/concurso/AtosPublicados";
import { Cargos } from "@/components/concurso/Cargos";
import { Faq } from "@/components/concurso/Faq";
import { SeletorDeTema } from "@/components/layout/SeletorDeTema";
import { Abas } from "@/components/ui/Abas";
import { Botao, type TamanhoDoBotao, type VarianteDoBotao } from "@/components/ui/Botao";
import { Calendario } from "@/components/ui/Calendario";
import { Campo, Selecao } from "@/components/ui/Campo";
import { BlocoDeNumeros, Cartao, Numero, Selo } from "@/components/ui/Cartao";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Etiqueta, Rotulo, type TomDaEtiqueta } from "@/components/ui/Etiqueta";
import { ICONES, Icone } from "@/components/ui/Icone";
import { Paginacao } from "@/components/ui/Paginacao";
import { Trilha } from "@/components/ui/Trilha";
import type { Tom } from "@/lib/dominio";
import { hojeEmSaoPaulo } from "@/lib/formato";
import {
  ATO_COM_DESCARTE,
  ATO_QUE_NAO_RESPONDE,
  ATO_QUE_RESPONDE,
  CARGOS_DE_PROVA,
  CATEGORIA_DO_ICONE,
  PALETA_DE_MARCA,
  ROTULO_ICONE,
  TONS_DE_SINAL,
} from "./exemplos";

/**
 * Vitrine do design system.
 *
 * Serve para conferir, no navegador, que o código bate com o canvas. Fica
 * fora do sitemap e leva noindex: é ferramenta de trabalho, não conteúdo.
 *
 * A ordem segue `docs/prototipo/Logo.dc.html`: marca, faixa de azulejos,
 * paleta, ícones e tipografia primeiro, o sistema de onde tudo o mais sai;
 * depois cada primitivo (`Botao`, `Etiqueta`, `Calendario`, `Abas`, `Selo`,
 * `Cartao`, `Campo`, `Trilha`, `Paginacao`, `BotaoEmBreve`).
 *
 * ## Os blocos do fim, fora da lista de primitivos
 *
 * `Cargos`, `Faq` e `AtosPublicados` continuam na vitrine, depois dos
 * primitivos: são os únicos lugares do app onde eles aparecem contra o mock
 * (`obterDetalhe` sem `BC_API_URL` devolve `cargos: []` e `origens: []`), e o
 * dado deles vem congelado de `./exemplos.ts`, copiado do acervo em
 * 2026-09-14. Os três desenham o próprio `<h2>` de 28px
 * por dentro; por isso entram direto, dentro de um `<section>` que só repete
 * o cartão branco da página real (`rounded-[22px] bg-cartao p-8
 * shadow-cartao`, `Concurso.dc.html`), sem o `Secao` do resto do site por
 * cima. Um `Secao` ali poria um segundo título ao lado do que o próprio
 * componente já desenha.
 *
 * ## O que ficou de fora
 *
 * `CartaoConcurso` e `LinhaConcurso` ficam fora da vitrine: não são
 * primitivos, e quem quiser vê-los encontra exemplo de sobra em
 * `/concursos` e na home.
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

const TONS: Tom[] = ["aberto", "urgente", "previsto", "encerrado"];
const TONS_DA_ETIQUETA: TomDaEtiqueta[] = ["neutro", "verde", "anil", "ouro", "urucum"];
const VARIANTES_DO_BOTAO: VarianteDoBotao[] = [
  "primario",
  "chamada",
  "secundario",
  "contorno",
  "fantasma",
];
const TAMANHOS_DO_BOTAO: TamanhoDoBotao[] = ["sm", "md", "lg", "xl"];

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
 * O que entrou é um representante de cada degrau que muda alguma coisa no
 * desenho, e não os sete larguras do acervo por obrigação: `MD` é a sigla
 * mais curta, `UFMG` é a largura mais comum de longe, `UTFPR` não tem onde
 * quebrar, `CRA-RJ` e `COREN/PE` trazem os dois separadores do acervo,
 * `UNIPAMPA` é o pior caso de quebra, e `null` é a ausência, o caso da
 * maioria relativa dos cartões.
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

// As três faces do selo, mais um logo que quebra: esse tem que mostrar a
// sigla, na mesma caixa.
const FACES_DO_SELO: { rotulo: string; sigla: string | null; logoUrl: string | null }[] = [
  { rotulo: "com logo", sigla: "BC", logoUrl: "/icone-32.png" },
  { rotulo: "com sigla", sigla: "UFMG", logoUrl: null },
  { rotulo: "vazio", sigla: null, logoUrl: null },
  { rotulo: "logo quebrado", sigla: "QUEBRA", logoUrl: "/nao-existe.webp" },
];

/** Um dia depois de `iso`, sem depender de fuso do navegador (UTC puro). */
function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

const CORES_DA_CAIXA_DE_ICONE: Record<
  "verde" | "anil" | "ouro" | "urucum" | "neutro",
  string
> = {
  verde: "bg-verde-fundo text-verde-texto",
  anil: "bg-anil-fundo text-anil-texto",
  ouro: "bg-ouro-fundo text-ouro-sinal-texto",
  urucum: "bg-urucum-fundo text-urucum-texto",
  neutro: "bg-neutro-fundo text-neutro-texto",
};

export default function Estilo() {
  const hoje = new Date();
  const hojeIso = hojeEmSaoPaulo(hoje);
  const amanha = somarDias(hojeIso, 1);
  const depois = somarDias(hojeIso, 14);

  return (
    <div className="conteudo py-10">
      <header className="mb-8">
        <h1 className="font-titulo text-[27px] font-semibold tracking-[-0.02em]">
          Design system
        </h1>
        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-tinta-600">
          Cinza por padrão, cor só quando informa alguma coisa. Sem borda em
          caixa: o que separa é o degrau entre a página cinza e o cartão
          branco. Bricolage Grotesque nos títulos e Public Sans em todo o
          resto, número incluído.
        </p>
      </header>

      {/*
        O seletor de tema abre a página, e não fecha: tudo abaixo tem de ser
        olhado duas vezes, e este é o interruptor. É o MESMO componente do
        cabeçalho, e não uma cópia: o estado vive no atributo `data-tema` do
        `html`, e clicar aqui e ver o de cima mudar é a própria conferência.
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

      <Bloco titulo="Marca" nota="Uma lupa sobre um azulejo de Athos Bulcão">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_440px]">
          <Cartao className="flex flex-col items-center justify-center gap-4 p-6 sm:p-10">
            {/*
              Dois `Logo`, um por faixa: o horizontal em 80px tem a palavra
              inteira em `white-space: nowrap` (`Logo.tsx`), sem onde quebrar
              dentro dela, e isso é o que a caixa mede para o `min-width`
              automático do item de grid por trás do cartão, não só o que se
              vê, o próprio layout. A 375px esse mínimo passava da largura do
              cartão e dava rolagem lateral na página inteira, com ou sem
              `flex-wrap` no `Logo` (a palavra por si só já não cabia).
              `hidden`/`flex` por breakpoint, um par de elementos e não um só
              tamanho comprometido nos dois portes.
            */}
            <div className="hidden items-center justify-center sm:flex">
              <Logo tamanho={80} />
            </div>
            <div className="flex items-center justify-center sm:hidden">
              <Logo tamanho={44} />
            </div>
            <Rotulo>Horizontal · padrão</Rotulo>
          </Cartao>
          <div className="flex flex-col items-center justify-center gap-4 rounded-cartao bg-faixa p-6 sm:p-10">
            <Logo variante="empilhado" tom="claro" tamanho={64} />
            <span className="text-[12px] font-bold tracking-[0.06em] text-faixa-texto uppercase">
              Empilhado · sobre verde
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Cartao className="flex flex-col items-center justify-center gap-3 p-6">
            <Logo variante="simbolo" tamanho={64} />
            <Rotulo>Símbolo · cor</Rotulo>
          </Cartao>
          <div className="flex flex-col items-center justify-center gap-3 rounded-cartao bg-faixa p-6">
            <Logo variante="simbolo" tom="claro" tamanho={64} />
            <span className="text-[12px] font-bold tracking-[0.06em] text-faixa-texto uppercase">
              Símbolo · claro
            </span>
          </div>
          <Cartao className="flex flex-col items-center justify-center gap-3 p-6 text-tinta-900">
            <Logo variante="simbolo" tom="mono" tamanho={64} />
            <Rotulo>Símbolo · mono</Rotulo>
          </Cartao>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/*
            `min-w-0` no rótulo, de reforço: o defeito de verdade era o
            `grid` sem `grid-cols-1` na base (corrigido acima, no `div` de
            fora), que media a coluna implícita pelo `max-content` do card
            inteiro. Sem a coluna presa, a palavra mais longa em caixa alta
            do `Rotulo` ("MONOCROMÁTICO") ainda seria o item mais largo do
            card e valeria a pena travar o mínimo dela também.
          */}
          <Cartao className="flex items-center gap-5 p-6">
            <div className="flex shrink-0 items-end gap-4">
              <span className="flex size-8 items-center justify-center rounded-[9px] bg-tinta-900">
                <Logo variante="simbolo" tom="claro" tamanho={32} />
              </span>
              <span className="flex size-4 items-center justify-center rounded-[7px] bg-tinta-900">
                <Logo variante="simbolo" tom="claro" tamanho={16} />
              </span>
            </div>
            <Rotulo className="min-w-0">Favicon · 32 e 16 px</Rotulo>
          </Cartao>
          <Cartao className="flex items-center gap-5 p-6 text-tinta-900">
            <Logo tom="mono" tamanho={30} className="shrink-0" />
            <Rotulo className="min-w-0">Monocromático · ofícios e impressos</Rotulo>
          </Cartao>
        </div>
      </Bloco>

      <Bloco titulo="Faixa de azulejos" nota="A mesma malha do herói e da marca">
        <Cartao className="overflow-hidden p-0">
          <Azulejos ladrilhos={FAIXA_MARCA} colunas={6} />
        </Cartao>
      </Bloco>

      <Bloco titulo="Paleta" nota="Seis cores fixas, mais os tons de sinal por token">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PALETA_DE_MARCA.map((cor) => (
            <Cartao key={cor.nome} className="flex flex-col overflow-hidden p-0">
              <div
                className={`h-[100px] ${cor.classe} ${
                  // O papel é a mesma cor da página por trás do cartão: sem
                  // um traço nos quatro lados a amostra some, porque não há
                  // nenhum degrau contra o fundo ao redor do cartão (a
                  // vitrine também é `bg-pagina`) para desenhar o quadrado.
                  cor.comBorda ? "shadow-[inset_0_0_0_1px_var(--color-linha)]" : ""
                }`}
              />
              <div className="flex flex-col gap-1 p-4">
                <p className="text-sm font-bold">{cor.nome}</p>
                <p className="numero text-[12px] text-tinta-500">{cor.hex}</p>
                <p className="text-[12px] text-tinta-600">{cor.uso}</p>
              </div>
            </Cartao>
          ))}
        </div>

        <div className="mt-2 overflow-x-auto">
          <Cartao className="p-5">
            <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.06em] text-tinta-500 uppercase">
                  <th className="pb-2 pr-4">Sinal</th>
                  <th className="pb-2 pr-4">Fundo</th>
                  <th className="pb-2 pr-4">Texto</th>
                  <th className="pb-2">Amostra</th>
                </tr>
              </thead>
              <tbody>
                {TONS_DE_SINAL.map((sinal) => (
                  <tr key={sinal.nome} className="border-t border-linha">
                    <td className="py-2.5 pr-4 font-semibold text-tinta-900">
                      {sinal.nome}
                    </td>
                    <td className="numero py-2.5 pr-4 text-tinta-500">{sinal.fundo}</td>
                    <td className="numero py-2.5 pr-4 text-tinta-500">{sinal.texto}</td>
                    <td className="py-2.5">
                      <Etiqueta tom={sinal.tom} comPonto>
                        {sinal.nome}
                      </Etiqueta>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Cartao>
        </div>
      </Bloco>

      <Bloco titulo="Ícones" nota="Traço 1,75 · cantos arredondados · sempre com rótulo">
        <Cartao className="p-6">
          <div className="grid grid-cols-3 gap-x-3 gap-y-5 text-center sm:grid-cols-5 lg:grid-cols-8">
            {Object.keys(ICONES).map((nome) => {
              const chave = nome as keyof typeof ICONES;
              const categoria = CATEGORIA_DO_ICONE[chave] ?? "neutro";
              return (
                <div key={chave} className="flex flex-col items-center gap-2">
                  <span
                    className={`flex size-[52px] items-center justify-center rounded-[14px] ${CORES_DA_CAIXA_DE_ICONE[categoria]}`}
                  >
                    <Icone nome={chave} tamanho={26} />
                  </span>
                  <span className="text-[11px] leading-4 text-tinta-600">
                    {ROTULO_ICONE[chave]}
                  </span>
                </div>
              );
            })}
          </div>
        </Cartao>
      </Bloco>

      <Bloco titulo="Tipografia" nota="Bricolage Grotesque no título · Public Sans no resto">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_460px]">
          <Cartao className="flex flex-col justify-center gap-2.5 p-7">
            <Rotulo>Títulos · Bricolage Grotesque 700</Rotulo>
            <p className="font-titulo text-[56px] leading-[1] font-bold tracking-[-0.035em]">
              Encontre seu concurso.
            </p>
          </Cartao>
          <Cartao className="flex flex-col justify-center gap-2.5 p-7">
            <Rotulo>Texto e números · Public Sans</Rotulo>
            <p className="text-[17px] leading-[1.55]">
              Tipografia cívica, feita para serviço público: legível em
              qualquer tela. Números tabulares alinham{" "}
              <strong>R$ 13.753</strong> e <strong>27/09</strong> em coluna.
            </p>
          </Cartao>
        </div>
      </Bloco>

      <Bloco titulo="Botão" nota="Cinco variantes, quatro tamanhos, sem sombra">
        <Cartao className="overflow-x-auto p-5">
          <table className="w-full min-w-[720px] border-separate border-spacing-3">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-semibold tracking-[0.06em] text-tinta-500 uppercase" />
                {TAMANHOS_DO_BOTAO.map((tamanho) => (
                  <th
                    key={tamanho}
                    className="text-left text-[11px] font-semibold tracking-[0.06em] text-tinta-500 uppercase"
                  >
                    {tamanho}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIANTES_DO_BOTAO.map((variante) => (
                <tr key={variante}>
                  <th className="pr-3 text-left text-[12px] font-semibold text-tinta-900">
                    {variante}
                  </th>
                  {TAMANHOS_DO_BOTAO.map((tamanho) => (
                    <td key={tamanho}>
                      <Botao variante={variante} tamanho={tamanho}>
                        Ver edital
                      </Botao>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Cartao>
      </Bloco>

      <Bloco titulo="Etiqueta" nota="Cinco tons, ponto de 6 px quando marca situação">
        <Cartao className="flex flex-wrap items-center gap-3 p-5">
          {TONS_DA_ETIQUETA.map((tom) => (
            <Etiqueta key={tom} tom={tom} comPonto>
              {tom}
            </Etiqueta>
          ))}
          <Etiqueta>Escolaridade superior</Etiqueta>
        </Cartao>
      </Bloco>

      <Bloco titulo="Calendário" nota="Vermelho hoje · ouro amanhã · verde depois">
        <Cartao className="flex flex-wrap items-end gap-4 p-5">
          <Calendario iso={hojeIso} hoje={hoje} />
          <Calendario iso={amanha} hoje={hoje} />
          <Calendario iso={depois} hoje={hoje} />
          <Calendario iso={depois} hoje={hoje} tamanho="lg" />
        </Cartao>
      </Bloco>

      <Bloco titulo="Abas" nota="Trilho rebaixado, a aba ativa em cartão branco">
        <Cartao className="p-5">
          <Abas
            rotulo="Situação, exemplo"
            itens={[
              { id: "abertas", rotulo: "Abertas", ativo: true },
              { id: "previstas", rotulo: "Previstas", ativo: false },
              { id: "encerradas", rotulo: "Encerradas", ativo: false },
            ]}
          />
        </Cartao>
      </Bloco>

      {/*
        O selo, nos dois tamanhos e nos quatro tons, contra o fundo de cartão
        de cada tom, que é o único lugar onde as cores dele significam alguma
        coisa. Cada tom traz as larguras de sigla que mudam o desenho, e na
        última coluna a ausência: o caso de 1.614 dos 4.648 cartões do acervo
        de 2026-09-14, e o que garante que a falta continue lendo como falta.
      */}
      <Bloco titulo="Selo" nota="Sem sigla, sem quadrado: só a caixa">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TONS.map((tom) => (
            <Cartao key={tom} tom={tom} className="p-5">
              <Rotulo>{tom}</Rotulo>
              {(["md", "sm"] as const).map((tamanho) => (
                <div key={tamanho} className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="numero w-6 text-[11px] text-tinta-500">{tamanho}</span>
                  {SIGLAS_DE_PROVA.map((sigla) => (
                    <Selo key={sigla ?? "sem"} sigla={sigla} tom={tom} tamanho={tamanho} />
                  ))}
                </div>
              ))}
            </Cartao>
          ))}
        </div>
      </Bloco>

      {/*
        O logo oficial do órgão, quando há um revisado (`faceDoSelo`): mesma
        caixa e mesmo raio da sigla em cada tamanho, fundo branco nos dois
        temas. O último logo não existe, e a caixa tem que cair para a sigla.
      */}
      <Bloco titulo="Selo com logo" nota="Logo, sigla ou vazio, na mesma caixa">
        <Cartao className="flex flex-col gap-4 p-5">
          {[72, 44, 36].map((tamanho) => (
            <div key={tamanho} className="flex flex-wrap items-center gap-3">
              <span className="numero w-6 text-[11px] text-tinta-500">{tamanho}</span>
              {FACES_DO_SELO.map(({ rotulo, sigla, logoUrl }) => (
                <Selo key={rotulo} sigla={sigla} logoUrl={logoUrl} tamanho={tamanho} />
              ))}
            </div>
          ))}
          <p className="text-xs text-tinta-500">
            {FACES_DO_SELO.map(({ rotulo }) => rotulo).join(" · ")}
          </p>
        </Cartao>
      </Bloco>

      <Bloco titulo="Cartão" nota="O degrau que separa é a sombra, não a borda">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Cartao className="p-6">
            <p className="text-sm text-tinta-600">
              O cartão branco padrão, sempre `bg-cartao`: o que muda de um
              tema para o outro é o degrau contra a página, não o próprio
              cartão.
            </p>
          </Cartao>
          <Cartao className="p-6">
            <BlocoDeNumeros className="grid-cols-2">
              <Numero rotulo="Vagas">148</Numero>
              <Numero rotulo="Salário até">R$ 14.852</Numero>
            </BlocoDeNumeros>
          </Cartao>
        </div>
      </Bloco>

      <Bloco titulo="Campo">
        <Cartao className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
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

      {/*
        A trilha, nos dois tamanhos que o acervo produz: a de dois degraus da
        página do órgão e a de três da página do concurso, esta com o pior
        título do acervo (208 caracteres) no degrau corrente.
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

      <Bloco
        titulo="Botão em breve"
        nota="Sem função ainda, e diz o que está por vir"
      >
        <Cartao className="flex flex-wrap items-center gap-3 p-5">
          <BotaoEmBreve
            recurso="alertas"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-controle bg-rebaixada px-[18px] text-[15px] font-semibold text-tinta-900 transition-colors hover:bg-linha"
          >
            Criar alerta
          </BotaoEmBreve>
        </Cartao>
      </Bloco>

      {/*
        Daqui até o fim é a página do concurso, na ordem em que ela se lê:
        cargos, o que o ato responde, e o ato. Os três desenham o próprio
        cabeçalho por dentro, então entram direto
        num cartão branco, sem um `Secao` por cima duplicando o título.
      */}
      <section className="mb-8 rounded-[22px] bg-cartao p-8 shadow-cartao">
        <Cargos cargos={CARGOS_DE_PROVA} />
      </section>

      {/*
        O FAQ nos três desfechos que ele tem, cada um no seu cartão, porque o
        cabeçalho muda com o conteúdo e um exemplo só esconderia isso: o
        primeiro responde a maioria das perguntas, o segundo tem uma resposta
        descartada (o único sinal que aponta defeito nosso, não lacuna do
        documento), e o terceiro não responde nenhuma.
      */}
      <div className="mb-8 flex flex-col gap-6">
        <section className="rounded-[22px] bg-cartao p-8 shadow-cartao">
          <Faq origens={[ATO_QUE_RESPONDE]} />
        </section>
        <section className="rounded-[22px] bg-cartao p-8 shadow-cartao">
          <Faq origens={[ATO_COM_DESCARTE]} />
        </section>
        <section className="rounded-[22px] bg-cartao p-8 shadow-cartao">
          <Faq origens={[ATO_QUE_NAO_RESPONDE]} />
        </section>
      </div>

      {/*
        Os três atos, com os grifos que os FAQ acima produziram. O terceiro
        tem `url` nula (o estado de todo o acervo hoje), e nele o link do
        diário vira texto explicando que o ato está guardado inteiro aqui.
      */}
      <section className="rounded-[22px] bg-cartao p-8 shadow-cartao">
        <AtosPublicados
          origens={[ATO_QUE_RESPONDE, ATO_COM_DESCARTE, ATO_QUE_NAO_RESPONDE]}
        />
      </section>
    </div>
  );
}
