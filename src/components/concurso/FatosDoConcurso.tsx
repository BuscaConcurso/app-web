import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import type { Fato } from "@/lib/fatos";

/**
 * Os seis fatos do cabeçalho do concurso: cor do ícone, e nada mais, porque
 * a ordem e o texto de cada um já vêm prontos de `fatosDoConcurso`
 * (`lib/fatos.ts`), sempre nos seis, sempre nessa ordem.
 */
const CONFIGURACAO: Record<Fato["rotulo"], { icone: NomeDoIcone; cor: string }> = {
  VAGAS: { icone: "vagas", cor: "bg-verde-fundo text-verde-texto" },
  "REMUNERAÇÃO": { icone: "salario", cor: "bg-rebaixada text-tinta-600" },
  TAXA: { icone: "recibo", cor: "bg-ouro-fundo text-ouro-sinal-texto" },
  "CARGA HORÁRIA": { icone: "relogio", cor: "bg-anil-fundo text-anil-texto" },
  ESCOLARIDADE: { icone: "educacao", cor: "bg-verde-fundo text-verde-texto" },
  "CADASTRO RESERVA": { icone: "lista", cor: "bg-rebaixada text-tinta-600" },
};

/** A ordem do celular, os quatro primeiros de `ConcursoMobile.dc.html:44-47`. */
const ORDEM_DO_CELULAR: Fato["rotulo"][] = [
  "VAGAS",
  "TAXA",
  "CARGA HORÁRIA",
  "REMUNERAÇÃO",
];

/**
 * `Concurso.dc.html:90-99` (o cartão) e `ConcursoMobile.dc.html:43-48` (a
 * fileira de quatro do celular, com o ícone ao lado em vez de em cima).
 *
 * As duas marcações vivem lado a lado, cada uma visível só no seu tamanho de
 * tela (`md:hidden`/`hidden md:grid`), como a faixa de números da home
 * (`Numeros.tsx`) já faz para o mesmo tipo de troca.
 */
export function FatosDoConcurso({ fatos }: { fatos: Fato[] }) {
  const doCelular = ORDEM_DO_CELULAR.map((rotulo) =>
    fatos.find((fato) => fato.rotulo === rotulo),
  ).filter((fato): fato is Fato => fato !== undefined);

  return (
    <section aria-label="Resumo">
      {/* Celular: quatro cartões, ícone e texto lado a lado. */}
      <div className="grid grid-cols-2 gap-2 md:hidden">
        {doCelular.map((fato) => (
          <CartaoDoCelular key={fato.rotulo} fato={fato} />
        ))}
      </div>

      {/* Tablet e desktop: os seis, ícone em cima do texto. */}
      <div className="hidden gap-3 md:grid md:grid-cols-3 xl:grid-cols-6">
        {fatos.map((fato) => (
          <CartaoDoFato key={fato.rotulo} fato={fato} />
        ))}
      </div>
    </section>
  );
}

/**
 * O cartão de um fato, na forma genérica (ícone, cor, rótulo, valor, apoio):
 * a mesma caixa de `Concurso.dc.html:90-99`, sem depender dos seis rótulos
 * fixos do concurso. `FatosDoConcurso`, abaixo, é quem resolve `CONFIGURACAO`
 * e chama esta forma; a página do órgão (`/orgaos/[slug]`), que tem outros
 * três fatos (abertos, previstos, total), chama-a direto: é a variante que
 * `task-15-brief.md` pede "sem quebrar a página do concurso", e o motivo de
 * isto estar separado da tabela fixa de rótulos.
 */
export function CartaoDeFato({
  icone,
  cor,
  rotulo,
  valor,
  apoio,
  informado = true,
}: {
  icone: NomeDoIcone;
  cor: string;
  rotulo: string;
  valor: string;
  apoio?: string;
  informado?: boolean;
}) {
  return (
    // `Concurso.dc.html:90-99`: padding 18, raio 18, 10px entre o ícone e o
    // texto, valor em Bricolage 28px (22px quando o ato não informa).
    <div className="flex min-w-0 flex-col gap-2.5 rounded-cartao bg-cartao p-[18px] shadow-cartao">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] ${cor}`}>
        <Icone nome={icone} tamanho={20} />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] font-bold tracking-[0.05em] text-tinta-500">{rotulo}</div>
        <div
          className={`break-words ${
            informado
              ? "font-titulo text-[28px] leading-[1.1] font-bold text-tinta-900"
              : "font-titulo text-[22px] leading-[1.25] font-semibold text-tinta-500"
          }`}
        >
          {valor}
        </div>
        {apoio && <div className="text-[13px] text-tinta-600">{apoio}</div>}
      </div>
    </div>
  );
}

/** A mesma caixa, na forma compacta do celular (`ConcursoMobile.dc.html:43-48`). */
export function CartaoDeFatoCelular({
  icone,
  cor,
  valor,
  apoio,
  informado = true,
}: {
  icone: NomeDoIcone;
  cor: string;
  valor: string;
  apoio?: string;
  informado?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[16px] bg-cartao p-3.5 shadow-cartao">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${cor}`}>
        <Icone nome={icone} tamanho={18} />
      </span>
      <div className="min-w-0">
        <div className={informado ? "text-[18px] font-bold text-tinta-900" : "text-[15px] font-bold text-tinta-600"}>
          {valor}
        </div>
        {apoio && <div className="truncate text-[12px] text-tinta-600">{apoio}</div>}
      </div>
    </div>
  );
}

function CartaoDoFato({ fato }: { fato: Fato }) {
  const { icone, cor } = CONFIGURACAO[fato.rotulo];
  return (
    <CartaoDeFato
      icone={icone}
      cor={cor}
      rotulo={fato.rotulo}
      valor={fato.valor}
      apoio={fato.apoio}
      informado={fato.informado}
    />
  );
}

function CartaoDoCelular({ fato }: { fato: Fato }) {
  const { icone, cor } = CONFIGURACAO[fato.rotulo];
  return (
    <CartaoDeFatoCelular
      icone={icone}
      cor={cor}
      valor={fato.valor}
      apoio={fato.apoio}
      informado={fato.informado}
    />
  );
}
