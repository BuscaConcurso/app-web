import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import { numero } from "@/lib/formato";

interface ItemDeNumero {
  icone: NomeDoIcone;
  fundo: string;
  texto: string;
  valor: string;
  rotulo: string;
}

/**
 * A faixa de números logo abaixo do herói.
 *
 * `Main.dc.html:119-124`: uma barra só, com um divisor fino entre cada
 * caixa. `Mobile.dc.html` não repete essa barra: no celular são dois
 * cartões soltos, lado a lado, só com "abertos" e "vagas previstas" (sem os
 * atos lidos nem o "todo dia"), porque é isso que cabe sem rolar antes da
 * dobra. Por isso as duas marcações vivem lado a lado aqui, cada uma visível
 * só no seu tamanho de tela, em vez de uma tentar servir às duas.
 *
 * `vagasPrevistas === null` (nenhum dos previstos em destaque tem vaga
 * informada) tira a caixa por completo, dos dois lados: dizer "0 vagas
 * previstas" afirmaria um dado que o ato não deu.
 */
export function Numeros({
  totalAbertos,
  vagasPrevistas,
  atosLidos,
}: {
  totalAbertos: number;
  vagasPrevistas: number | null;
  atosLidos: number;
}) {
  const itensDoDesktop: ItemDeNumero[] = [
    {
      icone: "aberto",
      fundo: "bg-verde-fundo text-verde-texto",
      texto: "text-tinta-900",
      valor: numero(totalAbertos),
      rotulo: "inscrições abertas",
    },
    ...(vagasPrevistas !== null
      ? [
          {
            icone: "vagas" as const,
            fundo: "bg-ouro-fundo text-ouro-sinal-texto",
            texto: "text-tinta-900",
            valor: numero(vagasPrevistas),
            rotulo: "vagas nos 4 maiores previstos",
          },
        ]
      : []),
    {
      icone: "lupaDocumento",
      fundo: "bg-anil-fundo text-anil-texto",
      texto: "text-tinta-900",
      valor: numero(atosLidos),
      rotulo: "atos oficiais lidos",
    },
    {
      icone: "ciclo",
      fundo: "bg-urucum-fundo text-urucum-texto",
      texto: "text-tinta-900",
      valor: "Todo dia",
      rotulo: "robô visita bancas e diários",
    },
  ];

  return (
    <>
      {/* Desktop: uma barra só, com divisor entre as caixas. */}
      <section
        className="relative mx-4 -mt-14 hidden rounded-[20px] bg-cartao shadow-numeros md:mx-[112px] md:grid md:h-[120px]"
        style={{ gridTemplateColumns: `repeat(${itensDoDesktop.length}, minmax(0, 1fr))` }}
      >
        {itensDoDesktop.map((item, indice) => (
          <div
            key={item.rotulo}
            className={`flex items-center gap-4 px-7 ${
              indice < itensDoDesktop.length - 1 ? "border-r border-linha-fraca" : ""
            }`}
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-[14px] ${item.fundo}`}
            >
              <Icone nome={item.icone} tamanho={24} />
            </span>
            <div className="min-w-0">
              <div className="font-titulo text-[32px] leading-none font-bold">{item.valor}</div>
              <div className="mt-1 text-sm text-tinta-600">{item.rotulo}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Celular: dois cartões soltos, só abertos e vagas previstas. */}
      <section className="mx-4 mt-5 grid grid-cols-2 gap-2 md:hidden">
        <div className="flex items-center gap-2.5 rounded-[16px] bg-cartao p-3.5 shadow-cartao">
          <span className="flex size-[38px] shrink-0 items-center justify-center rounded-controle bg-verde-fundo text-verde-texto">
            <Icone nome="aberto" tamanho={20} />
          </span>
          <div className="min-w-0">
            <div className="font-titulo text-[22px] leading-none font-bold">
              {numero(totalAbertos)}
            </div>
            <div className="text-xs text-tinta-600">abertos</div>
          </div>
        </div>

        {vagasPrevistas !== null && (
          <div className="flex items-center gap-2.5 rounded-[16px] bg-cartao p-3.5 shadow-cartao">
            <span className="flex size-[38px] shrink-0 items-center justify-center rounded-controle bg-ouro-fundo text-ouro-sinal-texto">
              <Icone nome="vagas" tamanho={20} />
            </span>
            <div className="min-w-0">
              <div className="font-titulo text-[22px] leading-none font-bold">
                {numero(vagasPrevistas)}
              </div>
              <div className="text-xs text-tinta-600">vagas previstas</div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
