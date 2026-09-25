import Link from "next/link";
import { BotaoLink } from "@/components/ui/Botao";
import { Calendario } from "@/components/ui/Calendario";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Rotulo } from "@/components/ui/Etiqueta";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoResumo } from "@/lib/dominio";
import { diasAte, prazoRelativo, vagasTexto } from "@/lib/formato";
import { ROTULO_ESCOLARIDADE, tituloDoAto, tituloSemOrgao } from "@/lib/rotulos";

/** "Encerra hoje/amanhã/em N dias", na cor de urgência de `Main.dc.html:157-164`. */
function corDoPrazo(iso: string, hoje: Date): string {
  const dias = diasAte(iso, hoje);
  if (dias <= 0) return "text-urucum";
  if (dias === 1) return "text-ouro-sinal-texto";
  return "text-tinta-600";
}

/**
 * A primeira meta do cartão: a banca, quando o concurso tem uma, senão as
 * vagas. É a mesma prioridade nas duas telas, só o desenho muda.
 */
function bancaOuVagas(concurso: ConcursoResumo): { icone: "banca" | "pessoa"; texto: string } {
  if (concurso.banca) return { icone: "banca", texto: `Banca ${concurso.banca.nome}` };
  return { icone: "pessoa", texto: vagasTexto(concurso.vagas, concurso.cadastroReserva).toLowerCase() };
}

/**
 * A segunda meta do desktop: escolaridade quando o ato informou, senão o
 * estado, senão "a definir" com o mesmo ícone genérico da primeira meta sem
 * dado (`Main.dc.html:159`, coluna ENFAM, onde nenhuma das duas está presente).
 */
function escolaridadeOuUf(concurso: ConcursoResumo): { icone: "educacao" | "local" | "pessoa"; texto: string } {
  const escolaridade = concurso.escolaridades[0];
  if (escolaridade) return { icone: "educacao", texto: ROTULO_ESCOLARIDADE[escolaridade] };
  if (concurso.uf) return { icone: "local", texto: concurso.uf };
  return { icone: "pessoa", texto: "a definir" };
}

/** "{sigla} · {edital}", como `Main.dc.html:157` escreve o cabeçalho do cartão. */
function siglaEEdital(concurso: ConcursoResumo): string {
  const edital = tituloDoAto(tituloSemOrgao(concurso.titulo, concurso.orgao));
  return concurso.orgao.sigla ? `${concurso.orgao.sigla} · ${edital}` : edital;
}

function Cartao({ concurso, hoje }: { concurso: ConcursoResumo; hoje: Date }) {
  if (!concurso.inscricoesAte) return null;
  const meta1 = bancaOuVagas(concurso);
  const meta2 = escolaridadeOuUf(concurso);

  return (
    <div className="flex flex-col gap-3.5 rounded-cartao bg-cartao p-[18px] shadow-cartao">
      <div className="flex items-center gap-3.5">
        <Calendario iso={concurso.inscricoesAte} hoje={hoje} />
        <div className="min-w-0">
          <div className={`text-[13px] font-bold ${corDoPrazo(concurso.inscricoesAte, hoje)}`}>
            {prazoRelativo(concurso.inscricoesAte, hoje) ?? "Encerra hoje"}
          </div>
          <div className="mt-0.5 truncate text-base font-bold">{siglaEEdital(concurso)}</div>
        </div>
      </div>
      <div className="text-sm leading-[1.45] text-tinta-600">{concurso.orgao.nome}</div>
      <div className="flex gap-3.5 text-[13px] text-tinta-600">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icone nome={meta1.icone} tamanho={15} />
          <span className="truncate">{meta1.texto}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <Icone nome={meta2.icone} tamanho={15} />
          <span className="truncate">{meta2.texto}</span>
        </span>
      </div>
      <div className="mt-auto flex gap-2">
        <BotaoLink
          href={`/concursos/${concurso.slug}`}
          variante="primario"
          tamanho="sm"
          iconeDepois="externo"
          className="flex-grow"
        >
          Ver edital
        </BotaoLink>
        <BotaoEmBreve
          recurso="salvos"
          aria-label="Salvar"
          className="flex size-[42px] shrink-0 items-center justify-center rounded-controle bg-rebaixada text-tinta-900"
        >
          <Icone nome="salvar" tamanho={18} />
        </BotaoEmBreve>
      </div>
    </div>
  );
}

function CartaoMovel({ concurso, hoje }: { concurso: ConcursoResumo; hoje: Date }) {
  if (!concurso.inscricoesAte) return null;
  const meta1 = bancaOuVagas(concurso);

  return (
    <Link
      href={`/concursos/${concurso.slug}`}
      className="flex w-[290px] shrink-0 flex-col gap-3 rounded-cartao bg-cartao p-4 shadow-cartao"
    >
      <div className="flex items-center gap-3">
        <Calendario iso={concurso.inscricoesAte} hoje={hoje} />
        <div className="min-w-0">
          <div className={`text-[13px] font-bold ${corDoPrazo(concurso.inscricoesAte, hoje)}`}>
            {prazoRelativo(concurso.inscricoesAte, hoje) ?? "Encerra hoje"}
          </div>
          <div className="truncate text-base font-bold">{siglaEEdital(concurso)}</div>
        </div>
      </div>
      <div className="text-[13px] leading-[1.45] text-tinta-600">
        {concurso.orgao.nome} · {meta1.texto}
      </div>
    </Link>
  );
}

/**
 * "Encerram esta semana" (`Main.dc.html:148-185`): os concursos que fecham
 * inscrição nos próximos sete dias, os mesmos que `obterDestaques` já separa
 * como `encerrando`.
 *
 * `null` sem concurso nenhum: um acervo com zero urgentes some a seção
 * inteira, em vez de desenhar quatro colunas vazias (Review Focus 2 dos
 * `global-constraints.md`).
 */
export function EncerramSemana({
  concursos,
  hoje,
}: {
  concursos: ConcursoResumo[];
  hoje: Date;
}) {
  if (concursos.length === 0) return null;

  return (
    <section className="mt-12 flex flex-col gap-5 md:conteudo md:mt-24 md:gap-7">
      <div className="flex items-end justify-between gap-4 px-4 md:px-0">
        <div>
          <div className="mb-2.5 hidden md:block">
            <Rotulo icone="prazo" tom="urgente">ÚLTIMA CHAMADA</Rotulo>
          </div>
          <h2 className="font-titulo text-[26px] leading-[1.08] font-bold tracking-[-0.025em] md:text-[40px] md:leading-[1.05] md:tracking-[-0.03em]">
            Encerram esta semana
          </h2>
        </div>
        <Link
          href="/concursos?situacao=abertas"
          className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-tinta-900 hover:text-verde-texto"
        >
          <span>Ver</span>
          <span className="hidden md:inline">todos</span>
          <Icone nome="seta" tamanho={17} className="hidden md:block" />
        </Link>
      </div>

      {/* Desktop: 4 colunas, com o cartão inteiro (`Main.dc.html:154`), a
          partir de `xl`; abaixo disso cada cartão tinha menos de 200px e o
          nome do órgão quebrava letra a letra. Entre 768 e 1279px, 2. */}
      <div className="hidden gap-3 md:grid md:grid-cols-2 md:px-0 xl:grid-cols-4">
        {concursos.map((concurso) => (
          <Cartao key={concurso.slug} concurso={concurso} hoje={hoje} />
        ))}
      </div>

      {/* Celular: cartões compactos, rolagem horizontal (`Mobile.dc.html:66-78`). */}
      <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] snap-x snap-mandatory md:hidden">
        {concursos.map((concurso) => (
          <div key={concurso.slug} className="snap-start">
            <CartaoMovel concurso={concurso} hoje={hoje} />
          </div>
        ))}
      </div>
    </section>
  );
}
