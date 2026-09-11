import { ImageResponse } from "next/og";
import { DESCRICAO_SITE } from "@/lib/site";

export const alt = "BuscaConcurso, concursos públicos abertos no Brasil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * A imagem de compartilhamento.
 *
 * O `ImageResponse` só entende flexbox e um subconjunto de CSS, então nada
 * de grid aqui. Sem fonte embarcada ele usa a padrão, o que é aceitável:
 * a imagem precisa ler bem em miniatura, não reproduzir a tipografia do
 * site.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ECEEED",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <circle cx="14" cy="14" r="10.4" stroke="#0C5434" strokeWidth="2.6" />
            <path
              d="M9 10.6h10M9 14h9M9 17.4h6.4"
              stroke="#141715"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M21.9 21.9 28.2 28.2"
              stroke="#0C5434"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700 }}>
            <span style={{ color: "#141715" }}>Busca</span>
            <span style={{ color: "#0C5434" }}>Concurso</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#141715",
              maxWidth: 900,
            }}
          >
            Concursos públicos abertos, em um lugar só
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.4,
              color: "#4E534F",
              maxWidth: 880,
            }}
          >
            {DESCRICAO_SITE.split(".")[0]}.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: "#1A8C55",
            }}
          />
          <div style={{ display: "flex", fontSize: 24, color: "#4E534F" }}>
            Editais coletados na fonte, todos os dias
          </div>
        </div>
      </div>
    ),
    size,
  );
}
