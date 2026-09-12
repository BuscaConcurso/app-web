/**
 * De coordenada para estado.
 *
 * A API de geolocalização do navegador devolve latitude e longitude, e o que
 * a busca precisa é uma sigla. A conversão acontece aqui, no navegador da
 * pessoa, contra os contornos que o próprio site serve: a coordenada exata de
 * alguém não sai da máquina dela.
 *
 * Os contornos vêm de `public/geo/uf.json`, gerado por
 * `scripts/gerar-contornos-uf.mjs` a partir da malha do IBGE. As coordenadas
 * são inteiras, em milésimos de grau, para o arquivo caber em 22 KB
 * comprimidos.
 */
import type { Uf } from "./dominio";
import { UFS } from "./dominio";

export interface ContornoDeUf {
  /** `[minLon, minLat, maxLon, maxLat]`, na escala do arquivo. */
  caixa: [number, number, number, number];
  /** Cada anel é um vetor plano `[lon, lat, lon, lat, ...]`. */
  aneis: number[][];
}

export interface Contornos {
  escala: number;
  contornos: Record<string, ContornoDeUf>;
}

/**
 * Quanto o ponto pode cair fora de todos os contornos e ainda assim ser
 * atribuído ao estado mais próximo, em graus. Meio grau é da ordem de 55 km.
 *
 * Existe por causa do arredondamento: quem está numa praia, numa ilha
 * pequena ou bem em cima de uma divisa pode cair no vão entre dois contornos
 * quantizados. Sem a tolerância, essas pessoas não receberiam sugestão
 * nenhuma; com ela, recebem a do estado vizinho, que é o certo na quase
 * totalidade dos casos e que dá para trocar num clique.
 */
const TOLERANCIA_EM_GRAUS = 0.5;

/** Lançamento de raio: conta quantas arestas o raio para leste atravessa. */
function dentroDoAnel(anel: number[], x: number, y: number): boolean {
  let dentro = false;
  const total = anel.length;
  for (let i = 0, j = total - 2; i < total; j = i, i += 2) {
    const xi = anel[i];
    const yi = anel[i + 1];
    const xj = anel[j];
    const yj = anel[j + 1];
    const cruza = yi > y !== yj > y;
    if (cruza && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function ehUf(sigla: string): sigla is Uf {
  return (UFS as readonly string[]).includes(sigla);
}

/**
 * O estado que contém a coordenada, ou `null` quando ela está longe demais do
 * Brasil.
 */
export function ufDeCoordenada(
  dados: Contornos,
  longitude: number,
  latitude: number,
): Uf | null {
  const x = longitude * dados.escala;
  const y = latitude * dados.escala;

  let maisProxima: { sigla: string; distancia: number } | null = null;
  const limite = TOLERANCIA_EM_GRAUS * dados.escala;

  for (const [sigla, uf] of Object.entries(dados.contornos)) {
    const [minX, minY, maxX, maxY] = uf.caixa;

    // A caixa envolvente descarta a quase totalidade dos estados sem
    // percorrer vértice nenhum.
    const foraDaCaixa =
      x < minX - limite ||
      x > maxX + limite ||
      y < minY - limite ||
      y > maxY + limite;
    if (foraDaCaixa) continue;

    const dentroDaCaixa = x >= minX && x <= maxX && y >= minY && y <= maxY;
    if (dentroDaCaixa) {
      for (const anel of uf.aneis) {
        if (dentroDoAnel(anel, x, y)) return ehUf(sigla) ? sigla : null;
      }
    }

    for (const anel of uf.aneis) {
      for (let i = 0; i < anel.length; i += 2) {
        const dx = anel[i] - x;
        const dy = anel[i + 1] - y;
        const distancia = dx * dx + dy * dy;
        if (!maisProxima || distancia < maisProxima.distancia) {
          maisProxima = { sigla, distancia };
        }
      }
    }
  }

  if (maisProxima && maisProxima.distancia <= limite * limite) {
    return ehUf(maisProxima.sigla) ? maisProxima.sigla : null;
  }
  return null;
}
