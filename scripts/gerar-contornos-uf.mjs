/**
 * Gera `public/geo/uf.json`, o arquivo de contornos que o navegador usa para
 * descobrir em que estado a pessoa está.
 *
 * Fonte: malha territorial do IBGE, na qualidade mínima, que já vem
 * simplificada. Daqui o arquivo passa por três cortes:
 *
 *   1. Coordenada vira inteiro em milésimos de grau, o que dá cerca de 110 m
 *      de resolução. Divisa estadual não é uma linha exata nesse nível, mas o
 *      resultado é uma sugestão que a pessoa pode trocar num clique.
 *   2. Ponto repetido depois do arredondamento cai fora.
 *   3. Só o anel externo de cada polígono sobrevive. Buraco em contorno de UF
 *      seria enclave, e não existe nenhum que mude a resposta.
 *
 * Cada estado também ganha a sua caixa envolvente, que o teste de ponto usa
 * para descartar 26 candidatos antes de percorrer vértice nenhum.
 *
 * Rodar: node scripts/gerar-contornos-uf.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";

const URL_IBGE =
  "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR" +
  "?intrarregiao=UF&formato=application/vnd.geo+json&qualidade=minima";

/** Código do IBGE para sigla. */
const SIGLA_POR_CODIGO = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
  21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
  28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR",
  42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF",
};

/** Milésimos de grau: 3 casas decimais viram inteiro. */
const ESCALA = 1000;

function quantizarAnel(anel) {
  const plano = [];
  let ultimoX = null;
  let ultimoY = null;
  for (const [lon, lat] of anel) {
    const x = Math.round(lon * ESCALA);
    const y = Math.round(lat * ESCALA);
    if (x === ultimoX && y === ultimoY) continue;
    plano.push(x, y);
    ultimoX = x;
    ultimoY = y;
  }
  // Menos de quatro vértices não fecha área.
  return plano.length >= 8 ? plano : null;
}

function anelExternoDe(geometria) {
  if (geometria.type === "Polygon") return [geometria.coordinates[0]];
  return geometria.coordinates.map((poligono) => poligono[0]);
}

const resposta = await fetch(URL_IBGE);
if (!resposta.ok) {
  throw new Error(`IBGE respondeu ${resposta.status}`);
}
const colecao = await resposta.json();

const contornos = {};
for (const feicao of colecao.features) {
  const sigla = SIGLA_POR_CODIGO[Number(feicao.properties.codarea)];
  if (!sigla) throw new Error(`código sem sigla: ${feicao.properties.codarea}`);

  const aneis = anelExternoDe(feicao.geometry)
    .map(quantizarAnel)
    .filter(Boolean);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const anel of aneis) {
    for (let i = 0; i < anel.length; i += 2) {
      if (anel[i] < minX) minX = anel[i];
      if (anel[i] > maxX) maxX = anel[i];
      if (anel[i + 1] < minY) minY = anel[i + 1];
      if (anel[i + 1] > maxY) maxY = anel[i + 1];
    }
  }

  contornos[sigla] = { caixa: [minX, minY, maxX, maxY], aneis };
}

const faltando = Object.values(SIGLA_POR_CODIGO).filter((s) => !contornos[s]);
if (faltando.length) throw new Error(`faltou estado: ${faltando.join(", ")}`);

await mkdir("public/geo", { recursive: true });
const conteudo = JSON.stringify({ escala: ESCALA, contornos });
await writeFile("public/geo/uf.json", conteudo);

const vertices = Object.values(contornos).reduce(
  (total, uf) => total + uf.aneis.reduce((n, anel) => n + anel.length / 2, 0),
  0,
);
console.log(
  `public/geo/uf.json: ${Object.keys(contornos).length} estados, ` +
    `${vertices} vértices, ${(conteudo.length / 1024).toFixed(1)} KB`,
);
