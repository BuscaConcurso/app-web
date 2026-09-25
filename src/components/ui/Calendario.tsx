import { diasAte } from "@/lib/formato";

const MESES = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export type TomDoCalendario = "urucum" | "ouro" | "verde";

/**
 * O tom da folhinha: vermelho no dia em que encerra ou já encerrou, ouro na
 * véspera e verde daí para a frente. É a mesma régua de `tomDoConcurso`
 * (`situacao.ts`), só que sem os status previsto/encerrado: aqui a data é
 * sempre um prazo que ainda importa mostrar.
 */
export function tomDoCalendario(iso: string, hoje: Date): TomDoCalendario {
  const dias = diasAte(iso, hoje);
  return dias <= 0 ? "urucum" : dias === 1 ? "ouro" : "verde";
}

const ESTILO: Record<
  TomDoCalendario,
  { caixa: string; faixa: string; dia: string }
> = {
  urucum: {
    caixa: "bg-urucum-fundo",
    faixa: "bg-urucum text-white",
    dia: "text-urucum-texto",
  },
  ouro: {
    caixa: "bg-ouro-fundo",
    faixa: "bg-ouro-faixa text-white",
    dia: "text-ouro-sinal-texto",
  },
  verde: {
    caixa: "bg-verde-fundo",
    faixa: "bg-acao text-acao-texto",
    dia: "text-verde-texto",
  },
};

/**
 * A folhinha de calendário do cartão de concurso: mês abreviado numa faixa
 * colorida, dia grande embaixo. Decorativo, então `aria-hidden`; a informação
 * de prazo já é dita em texto ao lado (`prazoRelativo`, `dataLonga`).
 */
export function Calendario({
  iso,
  hoje,
  tamanho = "md",
}: {
  iso: string;
  hoje: Date;
  tamanho?: "md" | "lg";
}) {
  const [, mes, dia] = iso.split("-");
  const estilo = ESTILO[tomDoCalendario(iso, hoje)];
  const lg = tamanho === "lg";
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 flex-col items-center overflow-hidden rounded-[12px] ${estilo.caixa} ${
        lg ? "h-[72px] w-16" : "h-[60px] w-14"
      }`}
    >
      <span
        className={`flex h-[18px] w-full items-center justify-center text-[10px] font-bold ${estilo.faixa}`}
      >
        {MESES[Number(mes) - 1]}
      </span>
      <span
        className={`font-titulo font-bold ${estilo.dia} ${
          lg ? "text-[30px] leading-[54px]" : "text-2xl leading-10"
        }`}
      >
        {Number(dia)}
      </span>
    </div>
  );
}
