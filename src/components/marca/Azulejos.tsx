/**
 * Azulejos: o mosaico da home e a faixa de marca são o mesmo padrão, só com
 * dimensão e recorte diferentes. Cada ladrilho é um quadrado de fundo com um
 * círculo posicionado dentro dele, em porcentagem da própria célula, como no
 * protótipo (`docs/prototipo/Main.dc.html` e `docs/prototipo/Logo.dc.html`).
 *
 * As cinco cores são arte fixa de Athos Bulcão e não tokens: valem o mesmo
 * hex nos dois temas, claro e escuro.
 */

export type CorDeAzulejo = "verde" | "verdeAzulejo" | "ouro" | "anil" | "papel";

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
