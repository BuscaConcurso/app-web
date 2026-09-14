import Link from "next/link";
import { Rotulo } from "@/components/ui/Etiqueta";
import type { ContagensDeFaceta, OpcaoDeFaceta } from "@/lib/concursos";
import { numero } from "@/lib/formato";
import {
  PARAMETRO_DA_DIMENSAO,
  quantosFiltros,
  urlAlternando,
  urlDaBusca,
  type ConsultaDaUrl,
  type Dimensao,
} from "@/lib/parametros";

/**
 * A coluna de filtros.
 *
 * Cada opção é uma âncora, não uma caixa de seleção: o endereço já carrega o
 * estado resultante, então um clique aplica na hora e a múltipla escolha
 * continua funcionando sem uma linha de JavaScript. A alternativa, um
 * formulário com caixas de verdade, exigiria um botão de aplicar que o
 * canvas não desenha.
 *
 * O quadradinho verde é decorativo e fica escondido de leitor de tela. O que
 * o leitor anuncia é o `aria-label` do link: o rótulo, a contagem e o que
 * acontece ao seguir.
 *
 * A faixa de salário é a exceção. São dois campos de texto, então viram um
 * formulário próprio que envia no Enter, com os outros filtros em campos
 * ocultos para não se perderem no caminho.
 */
function Quadradinho({ marcado }: { marcado: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-[16px] shrink-0 items-center justify-center rounded-[5px] ${
        marcado ? "bg-acao" : "bg-tinta-200"
      }`}
    >
      {marcado && (
        <svg viewBox="0 0 12 12" fill="none" className="size-3 text-white">
          <path
            d="m2.5 6.2 2.3 2.3 4.7-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

function Grupo({
  titulo,
  dimensao,
  opcoes,
  consulta,
}: {
  titulo: string;
  dimensao: Dimensao;
  opcoes: OpcaoDeFaceta[];
  consulta: ConsultaDaUrl;
}) {
  const marcados = consulta[dimensao] as string[];

  return (
    <div className="flex flex-col gap-2.5">
      <Rotulo>{titulo}</Rotulo>
      <ul className="flex flex-col gap-1">
        {opcoes.map((opcao) => {
          const marcado = marcados.includes(opcao.valor);
          return (
            <li key={opcao.valor}>
              <Link
                href={urlAlternando(consulta, dimensao, opcao.valor)}
                aria-label={`${opcao.rotulo}, ${numero(opcao.total)} concursos, ${
                  marcado ? "remover filtro" : "filtrar"
                }`}
                className="-mx-1.5 flex items-center gap-2.5 rounded-controle px-1.5 py-1 text-sm text-tinta-800 transition-colors hover:bg-rebaixada"
              >
                <Quadradinho marcado={marcado} />
                <span className={marcado ? "font-medium text-tinta-900" : ""}>
                  {opcao.rotulo}
                </span>
                <span className="numero ml-auto text-xs text-tinta-500">
                  {numero(opcao.total)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GrupoDeBancas({
  opcoes,
  consulta,
}: {
  opcoes: OpcaoDeFaceta[];
  consulta: ConsultaDaUrl;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <Rotulo>Banca</Rotulo>
      <ul className="flex flex-wrap gap-1.5">
        {opcoes.map((opcao) => {
          const marcada = consulta.bancas.includes(opcao.valor);
          return (
            <li key={opcao.valor}>
              <Link
                href={urlAlternando(consulta, "bancas", opcao.valor)}
                aria-label={`${opcao.rotulo}, ${numero(opcao.total)} concursos, ${
                  marcada ? "remover filtro" : "filtrar"
                }`}
                className={`inline-block rounded-controle px-2.5 py-1.5 text-[12px] transition-colors ${
                  marcada
                    ? "bg-acao font-medium text-acao-texto hover:bg-acao-hover"
                    : "bg-rebaixada text-tinta-800 hover:bg-tinta-200"
                }`}
              >
                {opcao.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Os filtros que o formulário de salário não edita precisam viajar com ele,
 * senão enviar a faixa apagaria todo o resto.
 */
function CamposOcultos({ consulta }: { consulta: ConsultaDaUrl }) {
  const ocultos: { nome: string; valor: string }[] = [];
  if (consulta.q) ocultos.push({ nome: "q", valor: consulta.q });
  if (consulta.uf) ocultos.push({ nome: "uf", valor: consulta.uf });
  if (consulta.ordem !== "encerrando") {
    ocultos.push({ nome: "ordem", valor: consulta.ordem });
  }
  for (const [dimensao, parametro] of Object.entries(PARAMETRO_DA_DIMENSAO)) {
    for (const valor of consulta[dimensao as Dimensao]) {
      ocultos.push({ nome: parametro, valor });
    }
  }

  return (
    <>
      {ocultos.map((campo, indice) => (
        <input
          key={`${campo.nome}-${campo.valor}-${indice}`}
          type="hidden"
          name={campo.nome}
          value={campo.valor}
        />
      ))}
    </>
  );
}

function FaixaDeSalario({
  consulta,
  prefixo,
}: {
  consulta: ConsultaDaUrl;
  prefixo: string;
}) {
  const campo =
    "h-[34px] w-full rounded-controle bg-rebaixada px-2.5 text-[12px] " +
    "text-tinta-900 outline-none placeholder:text-tinta-500 " +
    "focus:bg-cartao focus:ring-2 focus:ring-acao numero";

  return (
    <form action="/concursos" method="get" className="flex flex-col gap-2.5">
      <CamposOcultos consulta={consulta} />
      <Rotulo>Salário</Rotulo>
      <div className="flex items-center gap-2">
        <label htmlFor={`${prefixo}-salario-min`} className="sr-only">
          Salário mínimo
        </label>
        <input
          id={`${prefixo}-salario-min`}
          name="salarioMin"
          type="text"
          inputMode="numeric"
          defaultValue={consulta.salarioMin ? numero(consulta.salarioMin) : ""}
          placeholder="R$ 0"
          className={campo}
        />
        <span className="shrink-0 text-[12px] text-tinta-600">a</span>
        <label htmlFor={`${prefixo}-salario-max`} className="sr-only">
          Salário máximo
        </label>
        <input
          id={`${prefixo}-salario-max`}
          name="salarioMax"
          type="text"
          inputMode="numeric"
          defaultValue={consulta.salarioMax ? numero(consulta.salarioMax) : ""}
          placeholder="sem limite"
          className={campo}
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-controle bg-rebaixada text-[12px] font-semibold text-tinta-900 transition-colors hover:bg-tinta-200"
      >
        Aplicar faixa
      </button>
    </form>
  );
}

function Painel({
  consulta,
  contagens,
  prefixo,
}: {
  consulta: ConsultaDaUrl;
  contagens: ContagensDeFaceta;
  prefixo: string;
}) {
  const ativos = quantosFiltros(consulta);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-5 rounded-caixa bg-cartao p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Filtros</p>
          {ativos > 0 && (
            <Link
              href={urlDaBusca(consulta, {
                escolaridades: [],
                situacoes: [],
                bancas: [],
                esferas: [],
                uf: undefined,
                salarioMin: undefined,
                salarioMax: undefined,
                pagina: 1,
              })}
              className="text-[12px] font-semibold text-tinta-900 underline underline-offset-[3px] hover:text-link"
            >
              Limpar
            </Link>
          )}
        </div>

        <Grupo
          titulo="Situação"
          dimensao="situacoes"
          opcoes={contagens.situacoes}
          consulta={consulta}
        />
        <Grupo
          titulo="Escolaridade"
          dimensao="escolaridades"
          opcoes={contagens.escolaridades}
          consulta={consulta}
        />
        <FaixaDeSalario consulta={consulta} prefixo={prefixo} />
        <GrupoDeBancas opcoes={contagens.bancas} consulta={consulta} />
      </div>
    </div>
  );
}

function CartaoDeAlerta({ total }: { total: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-caixa bg-cartao p-4">
      <p className="text-sm leading-5 font-semibold">
        Receba estes {numero(total)} concursos por e-mail
      </p>
      <p className="text-[12px] leading-5 text-tinta-600">
        Salvamos esta busca e avisamos a cada edital novo.
      </p>
      <Link
        href="/concursos"
        className="flex h-10 items-center justify-center rounded-controle bg-acao text-sm font-semibold text-acao-texto transition-colors hover:bg-acao-hover"
      >
        Criar alerta grátis
      </Link>
    </div>
  );
}

export function ColunaFiltros({
  consulta,
  contagens,
  total,
}: {
  consulta: ConsultaDaUrl;
  contagens: ContagensDeFaceta;
  total: number;
}) {
  const ativos = quantosFiltros(consulta);

  return (
    <>
      {/* Celular: mesmo painel dentro de um `details`, que abre e fecha sem
          script, igual ao menu do cabeçalho. O conteúdo é duplicado no DOM
          porque não há como forçar um `details` a ficar aberto por CSS, e o
          painel é leve. */}
      <details className="lg:hidden">
        <summary className="flex h-10 w-fit cursor-pointer list-none items-center gap-2 rounded-controle bg-rebaixada px-3.5 text-sm font-semibold text-tinta-900 hover:bg-tinta-200 [&::-webkit-details-marker]:hidden">
          <svg aria-hidden="true" viewBox="0 0 18 18" className="size-4">
            <path
              d="M2 4.5h14M4.5 9h9M7 13.5h4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          Filtros
          {ativos > 0 && <span className="numero text-tinta-600">· {ativos}</span>}
        </summary>
        <div className="mt-3">
          <Painel consulta={consulta} contagens={contagens} prefixo="celular" />
        </div>
      </details>

      {/* No desktop a coluna acompanha a rolagem. Ancora pelo topo, e não pelo
          rodapé: a restrição de `bottom` só impede o elemento de descer além
          de uma linha perto da base da janela, e quem rola para baixo faz o
          painel subir, o que nunca viola essa linha. Com `bottom` sozinho a
          coluna some junto com a página; é o `top` que prende na descida.

          **Sem rolagem própria**, por decisão do parceiro humano. Havia aqui
          um teto de altura com `overflow-y-auto`, para a tela baixa em que o
          painel não cabe inteiro. O preço era uma barra de rolagem dentro da
          página, e duas áreas roláveis lado a lado confundem: a roda do mouse
          faz uma coisa sobre a coluna e outra a dois centímetros dali.

          Sem o teto, numa tela onde o painel não cabe, a coluna grudada
          simplesmente passa do fim da janela e o que sobra é alcançado
          rolando a página — que é o gesto que a pessoa já ia fazer. */}
      <aside className="hidden w-[288px] shrink-0 flex-col gap-2 lg:sticky lg:top-4 lg:flex">
        <Painel consulta={consulta} contagens={contagens} prefixo="coluna" />
        <CartaoDeAlerta total={total} />
      </aside>
    </>
  );
}
