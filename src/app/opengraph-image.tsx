import { ImageResponse } from "next/og";
import { MOSAICO_HERO, type CorDeAzulejo } from "@/components/marca/Azulejos";
import { carregarFonteGoogle } from "@/lib/fonteGoogle";

export const alt = "BuscaConcurso, concursos públicos abertos no Brasil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * A imagem de compartilhamento.
 *
 * Doc lida antes de escrever este arquivo:
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md`.
 * Ela confirma duas coisas que moldam o arquivo inteiro:
 *
 * 1. **Satori (o motor por trás do `ImageResponse`) só entende flexbox e um
 *    subconjunto de CSS.** `display: grid` não funciona, então a faixa de
 *    azulejos à direita não pode usar o componente `Azulejos` de
 *    `components/marca/` (que é `display: grid`): é a mesma malha do herói
 *    (`MOSAICO_HERO`), remontada aqui com `flexWrap` e a cor de cada
 *    ladrilho copiada do `COR` interno de `Azulejos.tsx`, que não é
 *    exportado. Os hex abaixo são os mesmos cinco de lá, duplicados de
 *    propósito e não lidos de um token: a imagem de OG é arte gerada, como o
 *    logo e os próprios azulejos, e está na lista de exceção do hard rule
 *    de "tokens only".
 * 2. **Fonte customizada só entra como `ArrayBuffer`, via `fonts` nas
 *    opções.** Sem `next/font` aqui (ele não roda fora de componente React
 *    normal): o Bricolage Grotesque vem de `carregarFonteGoogle`
 *    (`src/lib/fonteGoogle.ts`), que busca o CSS do Google Fonts sem
 *    `User-Agent` de navegador, o truque conhecido para a Google devolver
 *    TTF em vez de WOFF2 (a doc é explícita: "Only ttf, otf, and woff font
 *    formats are supported").
 *
 * **A fonte é best effort, não obrigatória.** `carregarFonteGoogle` nunca
 * lança: rede fora do ar, resposta que não é 2xx, ou um CSS sem a linha
 * esperada devolvem `null`, e a imagem sai com a fonte padrão do Satori em
 * vez de travar a rota inteira por causa de uma dependência externa (Google
 * Fonts) que esta imagem não deveria conseguir derrubar. Review da Task 15b.
 */

const COR_DO_LADRILHO: Record<CorDeAzulejo, string> = {
  verde: "#0B6B3A",
  verdeAzulejo: "#0E5C35",
  ouro: "#F2C230",
  anil: "#1D3F8F",
  papel: "#F6F4EE",
  transparente: "transparent",
};

const TITULO_1 = "Encontre seu concurso.";
const TITULO_2 = "Direto do edital.";

/**
 * O recorte estático (peso fixo) do Bricolage Grotesque, só com os
 * caracteres do próprio título: o `texto` no pedido faz a Google devolver
 * uma fonte cortada para este uso, bem mais leve que a família inteira, o
 * que importa porque `ImageResponse` tem teto de 500KB de pacote.
 *
 * `null` quando a busca falha (ver o doc do módulo): quem chama decide o que
 * fazer com a ausência, e aqui a resposta é desenhar sem `fonts` nas opções
 * do `ImageResponse`, que é como o arquivo original desta rota sempre
 * funcionou, antes de qualquer fonte customizada.
 */
async function carregarBricolage(): Promise<ArrayBuffer | null> {
  return carregarFonteGoogle({
    familia: "Bricolage Grotesque",
    peso: 700,
    texto: `${TITULO_1}${TITULO_2}`,
  });
}

export default async function Image() {
  const bricolage = await carregarBricolage();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          backgroundColor: "#0A4D2E",
          padding: "0 72px",
          fontFamily: "Bricolage Grotesque",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>
          <svg width={92} height={92} viewBox="0 0 40 40">
            <rect width="40" height="40" rx="10" fill="#F6F4EE" />
            <path d="M25 0H30A10 10 0 0 1 40 10V15A15 15 0 0 1 25 0Z" fill="#F2C230" />
            <circle cx="17.5" cy="19.5" r="8" fill="none" stroke="#0A4D2E" strokeWidth="3.6" />
            <path d="M23.3 25.3 30 32" stroke="#0A4D2E" strokeWidth="3.6" strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#FFFFFF",
              }}
            >
              {TITULO_1}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#F2C230",
              }}
            >
              {TITULO_2}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: 448,
            height: 448,
            flexShrink: 0,
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          {MOSAICO_HERO.map((ladrilho, indice) => (
            <div
              key={indice}
              style={{
                position: "relative",
                display: "flex",
                width: "25%",
                height: "25%",
                overflow: "hidden",
                backgroundColor: COR_DO_LADRILHO[ladrilho.fundo],
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: ladrilho.circulo.x,
                  top: ladrilho.circulo.y,
                  width: ladrilho.circulo.d,
                  height: ladrilho.circulo.d,
                  borderRadius: "50%",
                  backgroundColor: COR_DO_LADRILHO[ladrilho.circulo.cor],
                }}
              />
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      // Sem `bricolage` (Google Fonts fora do ar, resposta ruim, CSS sem a
      // referência esperada), a chave `fonts` nem entra: o Satori cai na
      // fonte padrão dele em vez de o `ImageResponse` lançar por causa de
      // uma fonte que não veio.
      ...(bricolage
        ? { fonts: [{ name: "Bricolage Grotesque", data: bricolage, weight: 700, style: "normal" }] }
        : {}),
    },
  );
}
