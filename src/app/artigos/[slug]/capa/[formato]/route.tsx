import { ImageResponse } from "next/og";
import { obterArtigo } from "@/lib/artigos";
import { FORMATOS_DA_CAPA, type FormatoDaCapa } from "@/lib/artigosSeo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; formato: string }> }) {
  const { slug, formato } = await params;
  if (!Object.hasOwn(FORMATOS_DA_CAPA, formato)) return new Response("Formato não encontrado", { status: 404 });
  const artigo = await obterArtigo(slug);
  if (!artigo) return new Response("Artigo não encontrado", { status: 404 });
  const tamanho = FORMATOS_DA_CAPA[formato as FormatoDaCapa];
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#123e35", color: "#faf7eb", width: "100%", height: "100%", padding: 64, position: "relative" }}>
      <div style={{ display: "flex", position: "absolute", inset: 0, flexWrap: "wrap", opacity: 0.09 }}>
        {Array.from({ length: 40 }, (_, i) => <div key={i} style={{ width: 180, height: 180, border: "2px solid #f8dc8b", borderRadius: i % 2 ? "50% 0 50% 0" : "0 50% 0 50%" }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
        <span style={{ color: "#f8dc8b", fontWeight: 700 }}>BuscaConcurso · Artigos</span>
        <span style={{ border: "1px solid #789589", borderRadius: 60, padding: "12px 24px" }}>{artigo.uf ?? "Brasil"}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 24, color: "#f8dc8b" }}>{artigo.orgao?.sigla ?? (artigo.tipo === "concurso" ? "Concursos públicos" : "Panorama de concursos")}</div>
        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.12, maxWidth: 1050 }}>{artigo.titulo}</div>
      </div>
      <div style={{ display: "flex", fontSize: 24, borderTop: "1px solid #789589", paddingTop: 22 }}>Informação para escolher seu próximo passo.</div>
    </div>,
    { ...tamanho, headers: { "Cache-Control": "public, max-age=300, must-revalidate" } },
  );
}
