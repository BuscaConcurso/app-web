import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ufDeCoordenada, type Contornos } from "./localizacao";

/**
 * Roda contra o arquivo de contornos de verdade, o mesmo que o navegador
 * baixa. Testar contra um contorno inventado provaria que o algoritmo de
 * ponto em polígono funciona e não provaria nada sobre a resposta que a
 * pessoa vai receber, que é o que importa: o risco aqui está no
 * arredondamento do arquivo, não na aritmética.
 */
const dados = JSON.parse(
  readFileSync("public/geo/uf.json", "utf-8"),
) as Contornos;

/** Coordenadas de praças e marcos conhecidos, em [longitude, latitude]. */
const LUGARES: [string, number, number, string][] = [
  ["Praça da Sé, São Paulo", -46.6339, -23.5504, "SP"],
  ["Cristo Redentor, Rio de Janeiro", -43.2105, -22.9519, "RJ"],
  ["Praça dos Três Poderes, Brasília", -47.8617, -15.8032, "DF"],
  ["Praça da Liberdade, Belo Horizonte", -43.9375, -19.9314, "MG"],
  ["Elevador Lacerda, Salvador", -38.5131, -12.9740, "BA"],
  ["Mercado Público, Porto Alegre", -51.2306, -30.0247, "RS"],
  ["Teatro Amazonas, Manaus", -60.0233, -3.1301, "AM"],
  ["Ver-o-Peso, Belém", -48.5030, -1.4522, "PA"],
  ["Marco Zero, Recife", -34.8711, -8.0632, "PE"],
  ["Praça do Ferreira, Fortaleza", -38.5270, -3.7275, "CE"],
  ["Jardim Botânico, Curitiba", -49.2400, -25.4416, "PR"],
  ["Ponte Hercílio Luz, Florianópolis", -48.5750, -27.5935, "SC"],
  ["Praça do Rádio, Campo Grande", -54.6156, -20.4640, "MS"],
  ["Praça da República, Cuiabá", -56.0949, -15.5989, "MT"],
  ["Praça Cívica, Goiânia", -49.2550, -16.6799, "GO"],
  ["Centro, Palmas", -48.3336, -10.1841, "TO"],
  ["Centro, Porto Velho", -63.9004, -8.7619, "RO"],
  ["Centro, Rio Branco", -67.8100, -9.9747, "AC"],
  ["Centro, Boa Vista", -60.6714, 2.8235, "RR"],
  ["Centro, Macapá", -51.0705, 0.0356, "AP"],
  ["Centro, São Luís", -44.3028, -2.5307, "MA"],
  ["Centro, Teresina", -42.8034, -5.0892, "PI"],
  ["Centro, Natal", -35.2094, -5.7945, "RN"],
  ["Centro, João Pessoa", -34.8811, -7.1195, "PB"],
  ["Centro, Maceió", -35.7353, -9.6658, "AL"],
  ["Centro, Aracaju", -37.0731, -10.9472, "SE"],
  ["Centro, Vitória", -40.3376, -20.3155, "ES"],
];

describe("ufDeCoordenada", () => {
  it.each(LUGARES)("acha %s", (_lugar, longitude, latitude, esperado) => {
    expect(ufDeCoordenada(dados, longitude, latitude)).toBe(esperado);
  });

  it("cobre as 27 unidades da federação", () => {
    expect(new Set(LUGARES.map(([, , , uf]) => uf)).size).toBe(27);
    expect(Object.keys(dados.contornos)).toHaveLength(27);
  });

  it("não confunde o Distrito Federal com Goiás em volta", () => {
    // Goiânia fica a menos de 200 km de Brasília e o DF é um recorte dentro
    // de Goiás, que é onde um contorno grosseiro erraria.
    expect(ufDeCoordenada(dados, -49.255, -16.6799)).toBe("GO");
    expect(ufDeCoordenada(dados, -47.8617, -15.8032)).toBe("DF");
  });

  it("resolve quem está na praia, fora do contorno arredondado", () => {
    // Copacabana, com o ponto puxado para dentro do mar.
    expect(ufDeCoordenada(dados, -43.1729, -23.0)).toBe("RJ");
  });

  it("devolve nulo longe do Brasil", () => {
    expect(ufDeCoordenada(dados, -0.1276, 51.5072)).toBeNull(); // Londres
    expect(ufDeCoordenada(dados, -58.3816, -34.6037)).toBeNull(); // Buenos Aires
    expect(ufDeCoordenada(dados, 0, 0)).toBeNull();
  });
});
