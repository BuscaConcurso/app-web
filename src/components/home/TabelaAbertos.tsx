import Link from "next/link";
import { Abas, type ItemDeAba } from "@/components/ui/Abas";
import { BotaoLink } from "@/components/ui/Botao";
import { Selo } from "@/components/ui/Cartao";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Rotulo } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoResumo } from "@/lib/dominio";
import { dataCurta, diasAte, moeda, numero, quantidade } from "@/lib/formato";
import { NOME_UF, cargosDoCartao, tituloDoAto, tituloSemOrgao } from "@/lib/rotulos";

const HREF_ABERTOS = "/concursos?situacao=abertas";

function abas(total: number): ItemDeAba[] {
  return [
    {
      id: "todos",
      rotulo: (
        <>
          Todos <span className="text-tinta-500">{numero(total)}</span>
        </>
      ),
      href: HREF_ABERTOS,
      ativo: true,
    },
    { id: "superior", rotulo: "Superior", href: `${HREF_ABERTOS}&escolaridade=superior`, ativo: false },
    { id: "medio", rotulo: "Médio", href: `${HREF_ABERTOS}&escolaridade=medio`, ativo: false },
    {
      id: "fundamental",
      rotulo: "Fundamental",
      href: `${HREF_ABERTOS}&escolaridade=fundamental`,
      ativo: false,
    },
  ];
}

/** O órgão e o cargo (ou o que existir no lugar dele), colunas 1 do desktop e da linha do celular. */
function orgaoECargo(concurso: ConcursoResumo): { titulo: string; subtitulo: string } {
  const cargos = cargosDoCartao(concurso.nomesDeCargo);
  const edital = tituloDoAto(tituloSemOrgao(concurso.titulo, concurso.orgao));

  if (cargos.informado) {
    const partes = [concurso.orgao.sigla, edital, concurso.banca?.nome && `Banca ${concurso.banca.nome}`].filter(
      (parte): parte is string => Boolean(parte),
    );
    return { titulo: cargos.texto, subtitulo: partes.join(" · ") };
  }

  const partes = [edital, concurso.banca?.nome && `Banca ${concurso.banca.nome}`].filter(
    (parte): parte is string => Boolean(parte),
  );
  return {
    titulo: concurso.orgao.nome,
    subtitulo: partes.length > 0 ? partes.join(" · ") : "Cargos ainda não informados",
  };
}

function local(concurso: ConcursoResumo): { icone: "local" | "globo"; texto: string } {
  return concurso.uf
    ? { icone: "local", texto: NOME_UF[concurso.uf] }
    : { icone: "globo", texto: "Nacional" };
}

/** O chip curto da coluna "Inscrições até" do desktop: `Main.dc.html:215-260`. */
function chipDoPrazo(iso: string, hoje: Date): { texto: string; classe: string } {
  const dias = diasAte(iso, hoje);
  if (dias <= 0) return { texto: "hoje", classe: "bg-urucum text-white" };
  if (dias === 1) return { texto: "amanhã", classe: "bg-urucum-fundo text-urucum-texto" };
  return { texto: `${dias} dias`, classe: "bg-ouro-fundo text-ouro-sinal-texto" };
}

/** O chip da etiqueta de prazo do cartão do celular: `Mobile.dc.html:88,97,105`. */
function chipDoPrazoMovel(iso: string, hoje: Date): { texto: string; classe: string } {
  const dias = diasAte(iso, hoje);
  if (dias <= 0) return { texto: "encerra hoje", classe: "bg-urucum text-white" };
  if (dias === 1) return { texto: "encerra amanhã", classe: "bg-urucum-fundo text-urucum-texto" };
  return { texto: `até ${dataCurta(iso)}`, classe: "bg-ouro-fundo text-ouro-sinal-texto" };
}

/** A segunda etiqueta do cartão do celular: vagas quando o ato informou, senão o estado. */
function vagasOuUf(concurso: ConcursoResumo): { icone: "pessoa" | "local"; texto: string } | null {
  const vagas = quantidade(concurso.vagas);
  if (vagas !== null) return { icone: "pessoa", texto: `${numero(vagas)} ${vagas === 1 ? "vaga" : "vagas"}` };
  if (concurso.uf) return { icone: "local", texto: concurso.uf };
  return null;
}

function LinhaDaTabela({ concurso, hoje }: { concurso: ConcursoResumo; hoje: Date }) {
  const { titulo, subtitulo } = orgaoECargo(concurso);
  const vagas = quantidade(concurso.vagas);
  const { icone: iconeLocal, texto: textoLocal } = local(concurso);

  return (
    <tr className="h-[88px] border-b border-linha-fraca text-[15px]">
      <td className="px-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <Selo sigla={concurso.orgao.sigla} tamanho={44} />
          <div className="min-w-0">
            <div className="truncate font-bold">{titulo}</div>
            <div className="mt-0.5 truncate text-[13px] text-tinta-600">{subtitulo}</div>
          </div>
        </div>
      </td>
      <td className="px-0">
        <span className="flex items-center gap-1.5 text-tinta-600">
          <Icone nome={iconeLocal} tamanho={16} />
          {textoLocal}
        </span>
      </td>
      <td className="px-0 font-semibold">{vagas === null ? <span className="text-tinta-500">a definir</span> : numero(vagas)}</td>
      <td className="px-0">
        {concurso.salarioAte === null ? (
          <span className="text-tinta-500">a definir</span>
        ) : (
          <span className="font-bold text-verde-texto">{moeda(concurso.salarioAte)}</span>
        )}
      </td>
      <td className="px-0">
        {concurso.inscricoesAte ? (
          <span className="flex items-center gap-2">
            <span className="font-semibold">{dataCurta(concurso.inscricoesAte)}</span>
            <span
              className={`flex h-6 items-center rounded-full px-2 text-xs font-bold ${
                chipDoPrazo(concurso.inscricoesAte, hoje).classe
              }`}
            >
              {chipDoPrazo(concurso.inscricoesAte, hoje).texto}
            </span>
          </span>
        ) : (
          <span className="text-tinta-500">a definir</span>
        )}
      </td>
      <td className="px-5">
        <div className="flex items-center justify-end gap-1.5">
          <BotaoEmBreve
            recurso="salvos"
            aria-label="Salvar"
            className="flex size-10 items-center justify-center rounded-controle text-tinta-600 hover:bg-rebaixada"
          >
            <Icone nome="salvar" tamanho={18} />
          </BotaoEmBreve>
          <BotaoLink href={`/concursos/${concurso.slug}`} variante="contorno" tamanho="sm" iconeDepois="seta">
            Ver
          </BotaoLink>
        </div>
      </td>
    </tr>
  );
}

function CartaoMovel({ concurso, hoje }: { concurso: ConcursoResumo; hoje: Date }) {
  const { titulo, subtitulo } = orgaoECargo(concurso);
  const segunda = vagasOuUf(concurso);
  const prazo = concurso.inscricoesAte ? chipDoPrazoMovel(concurso.inscricoesAte, hoje) : null;

  return (
    <Link
      href={`/concursos/${concurso.slug}`}
      className="flex flex-col gap-3 rounded-cartao bg-cartao p-4 shadow-cartao"
    >
      <div className="flex items-start gap-3">
        <Selo sigla={concurso.orgao.sigla} tamanho={42} />
        <div className="min-w-0 flex-grow">
          <div className="truncate text-[15px] font-bold">{titulo}</div>
          <div className="mt-0.5 truncate text-[13px] text-tinta-600">{subtitulo}</div>
        </div>
        <Icone nome="salvar" tamanho={20} className="mt-0.5 text-tinta-500" />
      </div>
      <div className="flex flex-wrap gap-1.5 text-[13px]">
        <span className="flex h-7 items-center gap-1.5 rounded-lg bg-verde-fundo px-2.5 font-bold text-verde-texto">
          <Icone nome="salario" tamanho={14} />
          {concurso.salarioAte === null ? "a definir" : moeda(concurso.salarioAte)}
        </span>
        {segunda && (
          <span className="flex h-7 items-center gap-1.5 rounded-lg bg-rebaixada px-2.5 font-medium">
            <Icone nome={segunda.icone} tamanho={14} />
            {segunda.texto}
          </span>
        )}
        {prazo && (
          <span className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 font-semibold ${prazo.classe}`}>
            <Icone nome="prazo" tamanho={14} />
            {prazo.texto}
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * "Inscrições abertas agora" (`Main.dc.html:187-269`): o cartão único da
 * lista de abertos, com as abas de escolaridade e as seis linhas em
 * destaque, cada uma levando ao detalhe do próprio concurso.
 *
 * **Não pagina nem filtra de verdade.** As abas e o "Ordenar" são âncoras
 * para `/concursos`, que é quem faz o trabalho de filtro e ordenação de
 * fato; aqui a home só mostra a amostra que `obterDestaques` já escolheu
 * (os seis abertos de prazo mais curto) e diz quantos ficaram de fora.
 */
export function TabelaAbertos({
  concursos,
  total,
  hoje,
}: {
  concursos: ConcursoResumo[];
  total: number;
  hoje: Date;
}) {
  return (
    <section className="mt-12 flex flex-col gap-4 px-4 md:mt-24 md:gap-5 md:px-[112px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-2.5 hidden md:block">
            <Rotulo icone="aberto" tom="aberto">INSCRIÇÕES ABERTAS</Rotulo>
          </div>
          <h2 className="font-titulo text-[26px] leading-[1.08] font-bold tracking-[-0.025em] md:text-[40px] md:leading-[1.05] md:tracking-[-0.03em]">
            {numero(total)} concursos abertos agora
          </h2>
        </div>
        <BotaoLink href={HREF_ABERTOS} variante="secundario" tamanho="sm" icone="filtros" className="shrink-0 md:hidden">
          Filtros
        </BotaoLink>
      </div>

      {/* Desktop: um cartão só, com as abas, o cabeçalho e as linhas de verdade. */}
      <div className="hidden overflow-hidden rounded-[20px] bg-cartao shadow-tabela md:block">
        <div className="flex h-[72px] items-center gap-3 border-b border-linha-fraca px-5">
          <Abas rotulo="Escolaridade" itens={abas(total)} />
          <div className="flex-grow" />
          <BotaoLink href={HREF_ABERTOS} variante="secundario" icone="ordenar" iconeDepois="abaixo">
            Ordenar: prazo mais curto
          </BotaoLink>
          <BotaoLink href={HREF_ABERTOS} variante="secundario" icone="filtros">
            Filtros
          </BotaoLink>
        </div>

        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">Concursos com inscrição aberta agora</caption>
          {/* As proporções de `Main.dc.html:206`
              (`2.6fr 1.2fr 0.9fr 1fr 1.2fr 150px`), num `<table>` de verdade:
              a última coluna é fixa e as outras cinco dividem o resto na
              mesma razão. */}
          <colgroup>
            <col style={{ width: "calc((100% - 150px) * 2.6 / 6.9)" }} />
            <col style={{ width: "calc((100% - 150px) * 1.2 / 6.9)" }} />
            <col style={{ width: "calc((100% - 150px) * 0.9 / 6.9)" }} />
            <col style={{ width: "calc((100% - 150px) * 1 / 6.9)" }} />
            <col style={{ width: "calc((100% - 150px) * 1.2 / 6.9)" }} />
            <col style={{ width: "150px" }} />
          </colgroup>
          <thead>
            <tr className="h-11 bg-pagina text-left text-xs font-bold tracking-[0.05em] text-tinta-500 uppercase">
              <th scope="col" className="px-5 font-bold">
                Órgão e cargo
              </th>
              <th scope="col" className="px-0 font-bold">
                Local
              </th>
              <th scope="col" className="px-0 font-bold">
                Vagas
              </th>
              <th scope="col" className="px-0 font-bold">
                Salário até
              </th>
              <th scope="col" className="px-0 font-bold">
                Inscrições até
              </th>
              <th scope="col" className="px-5" />
            </tr>
          </thead>
          <tbody>
            {concursos.map((concurso) => (
              <LinhaDaTabela key={concurso.slug} concurso={concurso} hoje={hoje} />
            ))}
          </tbody>
        </table>

        <div className="flex h-[72px] items-center justify-between px-5 text-sm text-tinta-600">
          <span>
            Mostrando {numero(concursos.length)} de {numero(total)} · ordenados pelo prazo
          </span>
          <BotaoLink href={HREF_ABERTOS} variante="primario" iconeDepois="seta">
            Ver todos os {numero(total)}
          </BotaoLink>
        </div>
      </div>

      {/* Celular: cartões de verdade, um por concurso (`Mobile.dc.html:80-109`). */}
      <div className="flex flex-col gap-2.5 md:hidden">
        <ul className="flex flex-col gap-2.5">
          {concursos.map((concurso) => (
            <li key={concurso.slug} className="min-w-0">
              <CartaoMovel concurso={concurso} hoje={hoje} />
            </li>
          ))}
        </ul>
        <BotaoLink href={HREF_ABERTOS} variante="primario" iconeDepois="seta" className="mt-1 w-full">
          Ver todos os {numero(total)}
        </BotaoLink>
      </div>
    </section>
  );
}
