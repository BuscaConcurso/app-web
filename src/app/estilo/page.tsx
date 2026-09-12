import type { Metadata } from "next";
import { CartaoConcurso } from "@/components/concurso/CartaoConcurso";
import { LinhaConcurso } from "@/components/concurso/LinhaConcurso";
import { Logo } from "@/components/marca/Logo";
import { Botao } from "@/components/ui/Botao";
import { Campo, Selecao } from "@/components/ui/Campo";
import { BlocoDeNumeros, Cartao, Numero, Selo } from "@/components/ui/Cartao";
import { Etiqueta, Rotulo } from "@/components/ui/Etiqueta";
import { Paginacao } from "@/components/ui/Paginacao";
import { listarConcursos } from "@/lib/concursos";
import type { Tom } from "@/lib/dominio";

/**
 * Vitrine do design system.
 *
 * Serve para conferir, no navegador, que o código bate com o canvas. Fica
 * fora do sitemap e leva noindex: é ferramenta de trabalho, não conteúdo.
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

const SUPERFICIES = [
  { nome: "Cartão", classe: "bg-cartao", hex: "#FFFFFF" },
  { nome: "Página", classe: "bg-pagina", hex: "#ECEEED" },
  { nome: "Rebaixada", classe: "bg-rebaixada", hex: "#E2E5E3" },
  { nome: "Bloco", classe: "bg-bloco", hex: "#F4F6F5" },
  { nome: "Escura", classe: "bg-escura", hex: "#141715" },
];

const TINTAS = [
  { nome: "900", classe: "bg-tinta-900", hex: "141715" },
  { nome: "800", classe: "bg-tinta-800", hex: "2A2E2B" },
  { nome: "600", classe: "bg-tinta-600", hex: "4E534F" },
  { nome: "500", classe: "bg-tinta-500", hex: "666C68" },
  { nome: "400", classe: "bg-tinta-400", hex: "8D938F" },
  { nome: "300", classe: "bg-tinta-300", hex: "C3C7C5" },
  { nome: "200", classe: "bg-tinta-200", hex: "D9DDDB" },
  { nome: "100", classe: "bg-tinta-100", hex: "E9EBEA" },
];

const SINAIS = [
  { nome: "Verde 700 · ação", classe: "bg-verde-700", uso: "Botão primário, marca, filtro marcado." },
  { nome: "Amarelo · chamada única", classe: "bg-amarelo", uso: "Uma por tela, sempre com texto tinta 900." },
  { nome: "Vermelho · prazo curto", classe: "bg-vermelho", uso: "Encerra em até sete dias." },
  { nome: "Verde 500 · abertas", classe: "bg-verde-500", uso: "Só como ponto de 6 px." },
  { nome: "Ocre · previsto", classe: "bg-ocre", uso: "O amarelo quando precisa virar letra." },
];

const TONS: Tom[] = ["aberto", "urgente", "previsto", "encerrado"];

export default async function Estilo() {
  const hoje = new Date();
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
          branco. Literata nos títulos, Archivo na interface, Spline Sans Mono
          nos números.
        </p>
      </header>

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

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div className="rounded-caixa bg-escura p-6">
            <Logo tom="claro" tamanho={28} />
          </div>
          <div className="rounded-caixa bg-verde-900 p-6">
            <Logo tom="claro" tamanho={28} />
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
              <p className="numero text-[10px] text-tinta-500">{superficie.hex}</p>
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
                <p className="numero text-[9px] text-tinta-500">{tinta.hex}</p>
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

      <Bloco titulo="Tipografia" nota="Literata · Archivo · Spline Sans Mono">
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
        </Cartao>
      </Bloco>

      <Bloco titulo="Botões" nota="40 px padrão · 48 na chamada · 32 no compacto">
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

      <Bloco titulo="Etiquetas e selos" nota="Ponto de 6 px, cor só no ponto">
        <Cartao className="flex flex-wrap items-center gap-3 p-5">
          {TONS.map((tom) => (
            <Etiqueta key={tom} tom={tom} comPonto>
              {tom}
            </Etiqueta>
          ))}
          <Etiqueta>Superior</Etiqueta>
          <Etiqueta>Banca: Vunesp</Etiqueta>
          {TONS.map((tom) => (
            <Selo key={tom} sigla="TJSP" tom={tom} />
          ))}
        </Cartao>
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

      <Bloco titulo="Paginação">
        <Cartao className="p-5">
          <Paginacao pagina={3} paginas={32} hrefDe={() => "/estilo"} />
        </Cartao>
      </Bloco>

      <Bloco titulo="Espaço e separação">
        <Cartao className="flex flex-col gap-2 p-5 text-[12px] leading-5 text-tinta-600">
          <p>
            Escala de 4:{" "}
            <span className="numero text-tinta-900">
              4 8 12 16 20 24 32 40 48 64
            </span>
            . Cartões se separam por 12, seções por 32.
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
