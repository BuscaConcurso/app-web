import { BlocoAlerta } from "@/components/home/BlocoAlerta";
import { BotaoLink } from "@/components/ui/Botao";
import { Calendario, ESTILO_DO_PRAZO, tomDoCalendario } from "@/components/ui/Calendario";
import { BotaoEmBreve } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import type { ConcursoDetalhe, ConcursoResumo } from "@/lib/dominio";
import { dataCurta } from "@/lib/formato";
import {
  destinoDaInscricao,
  passosDaInscricao,
  periodoDaInscricao,
  prazoPorExtenso,
} from "@/lib/inscricao";
import { NOME_UF } from "@/lib/rotulos";
import { tomDoConcurso } from "@/lib/situacao";
import { PassosDaInscricao } from "./PassosDaInscricao";
import { TambemAbertos } from "./TambemAbertos";

/**
 * A lateral da página do concurso: `Concurso.dc.html:208-260`.
 *
 * `hidden lg:flex`: abaixo de `lg` o prazo, os passos e "também abertos"
 * entram na coluna principal do celular por outro caminho (o cartão de
 * urgência e a barra fixa, `ConcursoMobile.dc.html`), não por este
 * componente escondido.
 *
 * `sticky top-6`: a lateral acompanha a rolagem da coluna principal, mais
 * alta, sem passar do rodapé porque o `<aside>` para de existir quando a
 * página para.
 */
export function LateralDoConcurso({
  concurso,
  hoje,
  tambem,
}: {
  concurso: ConcursoDetalhe;
  hoje: Date;
  tambem: ConcursoResumo[];
}) {
  const tom = tomDoConcurso(concurso, hoje);
  const prazo = prazoPorExtenso(concurso, hoje);
  const periodo = periodoDaInscricao(concurso, hoje);
  const destino = destinoDaInscricao(concurso);
  const passos = passosDaInscricao(concurso);

  const uf = concurso.uf ?? concurso.ufs[0] ?? null;
  const areaOuCargo = concurso.cargos[0]?.area ?? concurso.nomesDeCargo[0] ?? null;

  return (
    <aside className="hidden lg:flex flex-col gap-4 sticky top-6 self-start">
      <div className="overflow-hidden rounded-[22px] bg-cartao shadow-numeros">
        <CabecalhoDoPrazo concurso={concurso} tom={tom} prazo={prazo} hoje={hoje} />

        <div className="flex flex-col gap-[18px] px-6 py-[22px]">
          {periodo && concurso.inscricoesDe && concurso.inscricoesAte && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px] text-tinta-600">
                <span>Abriu {dataCurta(concurso.inscricoesDe)}</span>
                <span>Fecha {dataCurta(concurso.inscricoesAte)}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Período de inscrição"
                aria-valuenow={periodo.passados}
                aria-valuemin={0}
                aria-valuemax={periodo.total}
                aria-valuetext={`${periodo.passados} de ${periodo.total} dias do período já passaram`}
                className={`h-1.5 overflow-hidden rounded-full ${ESTILO_DO_PRAZO[tomDoCalendario(concurso.inscricoesAte, hoje)].trilha}`}
              >
                <span
                  className={`block h-full rounded-full ${ESTILO_DO_PRAZO[tomDoCalendario(concurso.inscricoesAte, hoje)].barra}`}
                  style={{ width: `${periodo.fracao * 100}%` }}
                />
              </div>
              <p className="text-[13px] text-tinta-600">
                {periodo.passados} de {periodo.total} dias do período já passaram
              </p>
            </div>
          )}

          {tom === "previsto" ? (
            <BotaoEmBreve
              recurso="alertas"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[12px] bg-ouro text-base font-bold text-ouro-texto hover:bg-ouro-hover"
            >
              Avisar quando abrir
            </BotaoEmBreve>
          ) : (
            tom !== "encerrado" &&
            destino && (
              <>
                <BotaoLink
                  href={destino.href}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  variante="chamada"
                  tamanho="xl"
                  iconeDepois="externo"
                  className="w-full"
                >
                  {destino.rotulo}
                </BotaoLink>
                <p className="-mt-2 text-center text-[13px] leading-[1.45] text-tinta-600">
                  Você vai para o {destino.host}, endereço lido do ato.
                </p>
              </>
            )
          )}

          {/* R25: o passo a passo de inscrição some inteiro no encerrado (o
              concurso não recebe mais inscrição nenhuma, "faça a inscrição
              até 25/09" depois de fechado seria instrução morta); previsto
              continua com os passos, para quem quiser se preparar antes de
              abrir. */}
          {tom !== "encerrado" && (
            <>
              <div className="h-px bg-linha-fraca" />
              <PassosDaInscricao slug={concurso.slug} passos={passos} />
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <BotaoEmBreve
              recurso="salvos"
              className="flex h-11 items-center justify-center gap-1.5 rounded-controle bg-rebaixada text-sm font-semibold text-tinta-900 hover:bg-linha"
            >
              <Icone nome="salvar" tamanho={16} />
              Salvar
            </BotaoEmBreve>
            <BotaoEmBreve
              recurso="lembrete"
              className="flex h-11 items-center justify-center gap-1.5 rounded-controle bg-rebaixada text-sm font-semibold text-tinta-900 hover:bg-linha"
            >
              <Icone nome="alerta" tamanho={16} />
              Lembrar amanhã
            </BotaoEmBreve>
          </div>
        </div>
      </div>

      {uf && (
        <TambemAbertos nomeUf={NOME_UF[uf]} concursos={tambem} />
      )}

      <BlocoAlerta
        compacto
        titulo={areaOuCargo ? `Avise-me de novas vagas em ${areaOuCargo}` : "Avise-me de novas vagas como esta"}
      />
    </aside>
  );
}

/**
 * O topo colorido do cartão principal: a folhinha, o título do prazo (ou
 * "Previsto"/"Inscrições encerradas") e o detalhe abaixo, na cor do tom.
 *
 * Só usa `tomDoCalendario` (a régua de urucum/ouro/verde da folhinha) quando
 * há mesmo um prazo por extenso; sem data (previsto) ou com o status fechado
 * a cor vem da situação do concurso (`Tom`), não do prazo que não existe.
 */
function CabecalhoDoPrazo({
  concurso,
  tom,
  prazo,
  hoje,
}: {
  concurso: ConcursoDetalhe;
  tom: ReturnType<typeof tomDoConcurso>;
  prazo: ReturnType<typeof prazoPorExtenso>;
  hoje: Date;
}) {
  if (prazo && concurso.inscricoesAte) {
    const estilo = ESTILO_DO_PRAZO[tomDoCalendario(concurso.inscricoesAte, hoje)];
    return (
      <div className={`flex items-center gap-3.5 px-6 py-[22px] ${estilo.fundo}`}>
        <Calendario iso={concurso.inscricoesAte} hoje={hoje} sobreOTom />
        <div>
          <div className={`font-titulo text-[24px] leading-[1.2] font-bold tracking-[-0.02em] ${estilo.texto}`}>
            {prazo.titulo}
          </div>
          <div className={`mt-1 text-sm ${estilo.texto}`}>{prazo.detalhe}</div>
        </div>
      </div>
    );
  }

  const { fundo, texto, icone } =
    tom === "previsto"
      ? { fundo: "bg-ouro-fundo", texto: "text-ouro-sinal-texto", icone: "bg-ouro-faixa text-white" }
      : tom === "encerrado"
        ? { fundo: "bg-rebaixada", texto: "text-tinta-600", icone: "bg-tinta-500 text-cartao" }
        : { fundo: "bg-verde-fundo", texto: "text-verde-texto", icone: "bg-acao text-acao-texto" };

  const titulo =
    tom === "previsto" ? "Previsto" : tom === "encerrado" ? "Inscrições encerradas" : "Inscrições abertas";

  return (
    <div className={`flex items-center gap-3.5 px-6 py-[22px] ${fundo}`}>
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-[12px] ${icone}`}>
        <Icone nome="previsto" tamanho={26} />
      </span>
      <div className={`font-titulo text-[24px] leading-none font-bold tracking-[-0.02em] ${texto}`}>{titulo}</div>
    </div>
  );
}
