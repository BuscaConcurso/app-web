/**
 * Azulejos: o mosaico da home e a faixa de marca são o mesmo padrão, só com
 * dimensão e recorte diferentes. Cada ladrilho é um quadrado de fundo com um
 * círculo posicionado dentro dele, em porcentagem da própria célula, como no
 * protótipo (`docs/prototipo/Main.dc.html` e `docs/prototipo/Logo.dc.html`).
 *
 * As cinco cores são arte fixa de Athos Bulcão e não tokens: valem o mesmo
 * hex nos dois temas, claro e escuro.
 */

export type CorDeAzulejo =
  | "verde"
  | "verdeAzulejo"
  | "ouro"
  | "anil"
  | "papel"
  // O sexto, só para o canto do cabeçalho do concurso (Task 13): ladrilho
  // que não pinta fundo nenhum, para o branco do protótipo (`Concurso.
  // dc.html:81,84,85`) virar "deixa ver o cartão de baixo" em vez de um hex
  // fixo — que destoaria do `bg-cartao` escuro no tema escuro.
  | "transparente";

export type Ladrilho = {
  fundo: CorDeAzulejo;
  circulo: { x: string; y: string; d: string; cor: CorDeAzulejo };
};

const COR: Record<CorDeAzulejo, string> = {
  verde: "#0B6B3A",
  verdeAzulejo: "#0E5C35",
  ouro: "#F2C230",
  anil: "#1D3F8F",
  papel: "#F6F4EE",
  transparente: "transparent",
};

/** Hero da home, 4×4, transcrito de `Main.dc.html:83-98` (célula de 112px). */
export const MOSAICO_HERO: Ladrilho[] = [
  { fundo: "papel", circulo: { x: "0%", y: "0%", d: "200%", cor: "verde" } },
  { fundo: "ouro", circulo: { x: "0%", y: "50%", d: "100%", cor: "anil" } },
  { fundo: "verde", circulo: { x: "-100%", y: "-100%", d: "200%", cor: "ouro" } },
  { fundo: "anil", circulo: { x: "21.43%", y: "21.43%", d: "57.14%", cor: "papel" } },
  { fundo: "verdeAzulejo", circulo: { x: "50%", y: "0%", d: "100%", cor: "papel" } },
  { fundo: "papel", circulo: { x: "0%", y: "-100%", d: "200%", cor: "ouro" } },
  { fundo: "anil", circulo: { x: "-100%", y: "0%", d: "200%", cor: "ouro" } },
  { fundo: "ouro", circulo: { x: "-100%", y: "-100%", d: "200%", cor: "verde" } },
  { fundo: "anil", circulo: { x: "0%", y: "-50%", d: "100%", cor: "ouro" } },
  { fundo: "verde", circulo: { x: "32.14%", y: "32.14%", d: "35.71%", cor: "papel" } },
  { fundo: "papel", circulo: { x: "0%", y: "0%", d: "200%", cor: "anil" } },
  { fundo: "verdeAzulejo", circulo: { x: "-50%", y: "0%", d: "100%", cor: "ouro" } },
  { fundo: "ouro", circulo: { x: "0%", y: "-100%", d: "200%", cor: "verde" } },
  { fundo: "anil", circulo: { x: "-100%", y: "0%", d: "200%", cor: "papel" } },
  { fundo: "verde", circulo: { x: "21.43%", y: "21.43%", d: "57.14%", cor: "ouro" } },
  { fundo: "papel", circulo: { x: "0%", y: "50%", d: "100%", cor: "verde" } },
];

/** Faixa de marca, 6×2, transcrita de `Logo.dc.html:47-58` (célula de 110px). */
export const FAIXA_MARCA: Ladrilho[] = [
  { fundo: "verde", circulo: { x: "0%", y: "-100%", d: "200%", cor: "ouro" } },
  { fundo: "papel", circulo: { x: "0%", y: "0%", d: "200%", cor: "anil" } },
  { fundo: "ouro", circulo: { x: "25%", y: "25%", d: "50%", cor: "verde" } },
  { fundo: "anil", circulo: { x: "-100%", y: "0%", d: "200%", cor: "papel" } },
  { fundo: "verdeAzulejo", circulo: { x: "0%", y: "-50%", d: "100%", cor: "ouro" } },
  { fundo: "papel", circulo: { x: "-100%", y: "-100%", d: "200%", cor: "verde" } },
  { fundo: "ouro", circulo: { x: "0%", y: "-100%", d: "200%", cor: "anil" } },
  { fundo: "verde", circulo: { x: "30%", y: "30%", d: "40%", cor: "papel" } },
  { fundo: "papel", circulo: { x: "0%", y: "50%", d: "100%", cor: "verde" } },
  { fundo: "ouro", circulo: { x: "-100%", y: "0%", d: "200%", cor: "verde" } },
  { fundo: "anil", circulo: { x: "25%", y: "25%", d: "50%", cor: "ouro" } },
  { fundo: "verdeAzulejo", circulo: { x: "0%", y: "0%", d: "200%", cor: "papel" } },
];

/**
 * O canto do cabeçalho do concurso, 3×2, transcrito de
 * `Concurso.dc.html:80-87` (célula de 64px). Três dos seis ladrilhos são
 * "transparente": no protótipo eles são `#FFFFFF` sólido, mas o cabeçalho
 * real é `bg-cartao` (branco no claro, quase preto no escuro), e um branco
 * fixo ali viraria um retalho aceso sobre o cartão escuro. Sem fundo, o
 * ladrilho deixa ver o próprio cartão nos dois temas.
 */
export const CANTO_DO_CABECALHO: Ladrilho[] = [
  { fundo: "transparente", circulo: { x: "0%", y: "0%", d: "0%", cor: "transparente" } },
  { fundo: "ouro", circulo: { x: "-100%", y: "0%", d: "200%", cor: "verde" } },
  { fundo: "anil", circulo: { x: "0%", y: "-100%", d: "200%", cor: "papel" } },
  { fundo: "transparente", circulo: { x: "0%", y: "0%", d: "0%", cor: "transparente" } },
  { fundo: "transparente", circulo: { x: "0%", y: "0%", d: "0%", cor: "transparente" } },
  { fundo: "verde", circulo: { x: "31.25%", y: "31.25%", d: "37.5%", cor: "ouro" } },
];

export function Azulejos({
  ladrilhos,
  colunas,
  className,
}: {
  ladrilhos: Ladrilho[];
  colunas: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`grid overflow-hidden ${className ?? ""}`}
      style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}
    >
      {ladrilhos.map((ladrilho, indice) => (
        <div
          key={indice}
          className="relative aspect-square overflow-hidden"
          style={{ background: COR[ladrilho.fundo] }}
        >
          <span
            className="absolute rounded-full"
            style={{
              left: ladrilho.circulo.x,
              top: ladrilho.circulo.y,
              width: ladrilho.circulo.d,
              height: ladrilho.circulo.d,
              background: COR[ladrilho.circulo.cor],
            }}
          />
        </div>
      ))}
    </div>
  );
}
