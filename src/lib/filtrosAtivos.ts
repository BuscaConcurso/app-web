/**
 * Os filtros ativos de uma busca, um chip por valor, cada um com o endereço
 * da mesma busca sem ele. Sai de `/concursos/page.tsx` porque `/busca/<slug>`
 * desenha a mesma fileira no navegador.
 */
import { SITUACOES } from "./consulta";
import { moeda } from "./formato";
import { urlDaBusca, urlSemValor, type ConsultaDaUrl } from "./parametros";
import { NOME_UF, ROTULO_ESCOLARIDADE, ROTULO_ESFERA } from "./rotulos";
import { BANCAS } from "@/mocks/bancas";

export interface Chip {
  chave: string;
  rotulo: string;
  href: string;
}

/** Um chip por valor, não por dimensão: cada um sai sozinho. */
export function chipsAtivos(consulta: ConsultaDaUrl): Chip[] {
  const chips: Chip[] = [];

  if (consulta.q) {
    chips.push({
      chave: "q",
      rotulo: `"${consulta.q}"`,
      href: urlDaBusca(consulta, { q: undefined, pagina: 1 }),
    });
  }
  if (consulta.uf) {
    chips.push({
      chave: "uf",
      rotulo: NOME_UF[consulta.uf],
      href: urlDaBusca(consulta, { uf: undefined, pagina: 1 }),
    });
  }
  for (const situacao of consulta.situacoes) {
    chips.push({
      chave: `situacao-${situacao}`,
      rotulo: SITUACOES[situacao],
      href: urlSemValor(consulta, "situacoes", situacao),
    });
  }
  for (const escolaridade of consulta.escolaridades) {
    chips.push({
      chave: `escolaridade-${escolaridade}`,
      rotulo: ROTULO_ESCOLARIDADE[escolaridade],
      href: urlSemValor(consulta, "escolaridades", escolaridade),
    });
  }
  for (const esfera of consulta.esferas) {
    chips.push({
      chave: `esfera-${esfera}`,
      rotulo: ROTULO_ESFERA[esfera],
      href: urlSemValor(consulta, "esferas", esfera),
    });
  }
  for (const banca of consulta.bancas) {
    chips.push({
      chave: `banca-${banca}`,
      rotulo: BANCAS[banca as keyof typeof BANCAS].nome,
      href: urlSemValor(consulta, "bancas", banca),
    });
  }
  if (consulta.salarioMin || consulta.salarioMax) {
    const min = consulta.salarioMin;
    const max = consulta.salarioMax;
    chips.push({
      chave: "salario",
      rotulo:
        min && max
          ? `${moeda(min)} a ${moeda(max)}`
          : min
            ? `Acima de ${moeda(min)}`
            : `Até ${moeda(max!)}`,
      href: urlDaBusca(consulta, {
        salarioMin: undefined,
        salarioMax: undefined,
        pagina: 1,
      }),
    });
  }

  return chips;
}
