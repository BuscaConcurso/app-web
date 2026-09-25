import type { JSX } from "react";

type Parte =
  | { d: string; preenchido?: boolean }
  | { circulo: [number, number, number] }
  | { retangulo: [number, number, number, number, number?] };

/** Paths Lucide (ISC), copiados do protótipo. Traço 1,75, 24 px. */
export const ICONES = {
  busca: [{ circulo: [11, 11, 7] }, { d: "m20 20-3.5-3.5" }],
  tribunais: [{ d: "M12 3v18M7 21h10M5 7h14" }, { d: "m5 7-3 7a3.5 3.5 0 0 0 6 0Z" }, { d: "m19 7-3 7a3.5 3.5 0 0 0 6 0Z" }],
  policia: [{ d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" }, { d: "m9 12 2 2 4-4" }],
  educacao: [{ d: "M22 10 12 5 2 10l10 5 10-5Z" }, { d: "M6 12v5c3 2 9 2 12 0v-5" }, { d: "M22 10v6" }],
  saude: [{ d: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" }, { d: "M3.5 12h5l1.5-3 2 6 1.5-3h7" }],
  fiscal: [{ retangulo: [4, 2, 16, 20, 2] }, { d: "M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h.01M12 18h.01" }],
  estatais: [{ d: "M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7" }, { d: "M12 2 20 7H4Z" }],
  forcas: [{ circulo: [12, 5, 3] }, { d: "M12 22V8M5 12H2a10 10 0 0 0 20 0h-3" }],
  prefeituras: [{ d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }, { d: "M6 12H4a2 2 0 0 0-2 2v8h4M18 9h2a2 2 0 0 1 2 2v11h-4M10 6h4M10 10h4M10 14h4M10 18h4" }],
  conselhos: [{ retangulo: [2, 5, 20, 14, 2] }, { circulo: [8, 11, 2] }, { d: "M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 14h3" }],
  tecnologia: [{ retangulo: [5, 5, 14, 14, 2] }, { retangulo: [9, 9, 6, 6] }, { d: "M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" }],
  administrativo: [{ retangulo: [2, 7, 20, 14, 2] }, { d: "M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20" }],
  ambiente: [{ d: "M7 20h10M12 20v-8" }, { d: "M12 12c0-4 3-7 8-7 0 4-3 7-8 7Z" }, { d: "M12 14c0-3.5-2.5-6-7-6 0 3.5 2.5 6 7 6Z" }],
  salario: [{ retangulo: [2, 6, 20, 12, 2] }, { circulo: [12, 12, 2.5] }, { d: "M6 12h.01M18 12h.01" }],
  vagas: [{ d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }, { circulo: [9, 7, 4] }, { d: "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" }],
  pessoa: [{ circulo: [9, 7, 4] }, { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
  prazo: [{ circulo: [12, 13, 8] }, { d: "M12 9v4l2 2M5 3 2 6M22 6l-3-3" }],
  local: [{ d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" }, { circulo: [12, 10, 3] }],
  banca: [{ d: "M5 22h14M19.3 14H4.7a1.7 1.7 0 0 0-1.7 1.7V18h18v-2.3a1.7 1.7 0 0 0-1.7-1.7Z" }, { d: "M14 14v-3a3 3 0 0 1 1-2.2 4 4 0 1 0-6 0A3 3 0 0 1 10 11v3" }],
  diario: [{ d: "M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" }, { d: "M18 14h-8M15 18h-5M10 6h8v4h-8Z" }],
  aberto: [{ d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }, { d: "M14 2v4a2 2 0 0 0 2 2h4" }, { d: "m9 15 2 2 4-4" }],
  previsto: [{ retangulo: [3, 4, 18, 18, 2] }, { d: "M16 2v4M8 2v4M3 10h18" }],
  homologado: [{ d: "M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" }, { d: "m9 12 2 2 4-4" }],
  alerta: [{ d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }, { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }],
  salvar: [{ d: "m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" }],
  areas: [{ retangulo: [3, 3, 7, 7, 1.5] }, { retangulo: [14, 3, 7, 7, 1.5] }, { retangulo: [3, 14, 7, 7, 1.5] }, { retangulo: [14, 14, 7, 7, 1.5] }],
  estados: [{ d: "M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2L21 17V4Z" }, { d: "M9.9 4v13M14.1 6v13" }],
  entrar: [{ circulo: [12, 8, 4] }, { d: "M4 21a8 8 0 0 1 16 0" }],
  seta: [{ d: "M5 12h14M12 5l7 7-7 7" }],
  externo: [{ d: "M7 17 17 7M7 7h10v10" }],
  abaixo: [{ d: "m6 9 6 6 6-6" }],
  acima: [{ d: "m18 15-6-6-6 6" }],
  voltar: [{ d: "m15 18-6-6 6-6" }],
  mira: [{ circulo: [12, 12, 7] }, { d: "M12 2v3M12 19v3M2 12h3M19 12h3" }, { circulo: [12, 12, 2] }],
  lupaDocumento: [{ d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" }, { d: "M14 2v4a2 2 0 0 0 2 2h4v3" }, { circulo: [16.5, 16.5, 3.5] }, { d: "m21 21-1.9-1.9" }],
  ciclo: [{ d: "M21 12a9 9 0 0 1-15 6.7L3 16" }, { d: "M3 12a9 9 0 0 1 15-6.7L21 8" }, { d: "M21 3v5h-5M3 21v-5h5" }],
  ordenar: [{ d: "M3 6h18M6 12h12M10 18h4" }],
  contraste: [{ circulo: [12, 12, 9] }, { d: "M12 3a9 9 0 0 0 0 18Z", preenchido: true }],
  compartilhar: [{ circulo: [18, 5, 3] }, { circulo: [6, 12, 3] }, { circulo: [18, 19, 3] }, { d: "m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" }],
  check: [{ d: "M20 6 9 17l-5-5" }],
  relogio: [{ circulo: [12, 12, 10] }, { d: "M12 6v6l4 2" }],
  recibo: [{ d: "M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2Z" }, { d: "M8 9h8M8 13h6" }],
  globo: [{ circulo: [12, 12, 10] }, { d: "M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" }],
  sol: [{ circulo: [12, 12, 4] }, { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" }],
  lua: [{ d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }],
  monitor: [{ retangulo: [2, 3, 20, 14, 2] }, { d: "M8 21h8M12 17v4" }],
  fechar: [{ d: "M18 6 6 18M6 6l12 12" }],
  menu: [{ d: "M4 6h16M4 12h16M4 18h16" }],
  lista: [{ d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" }],
  agenda: [{ retangulo: [3, 4, 18, 18, 2] }, { d: "M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" }],
} satisfies Record<string, Parte[]>;

export type NomeDoIcone = keyof typeof ICONES;

export function Icone({
  nome,
  tamanho = 20,
  traco = 1.75,
  className,
  rotulo,
}: {
  nome: NomeDoIcone;
  tamanho?: number;
  traco?: number;
  className?: string;
  rotulo?: string;
}): JSX.Element {
  const partes: Parte[] = ICONES[nome];
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className ?? ""}`}
      {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true })}
    >
      {partes.map((parte, i) => {
        if ("circulo" in parte) {
          const [cx, cy, r] = parte.circulo;
          return <circle key={i} cx={cx} cy={cy} r={r} />;
        }
        if ("retangulo" in parte) {
          const [x, y, width, height, rx] = parte.retangulo;
          return <rect key={i} x={x} y={y} width={width} height={height} rx={rx} />;
        }
        return <path key={i} d={parte.d} fill={parte.preenchido ? "currentColor" : undefined} />;
      })}
    </svg>
  );
}
