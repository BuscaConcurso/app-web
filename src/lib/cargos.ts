/**
 * Quais cargos viram link, decidido por medição do acervo.
 *
 * O nome do cargo é a primeira coisa que um candidato digita, e é a dimensão
 * que faltava nos links internos: havia estado, órgão e banca. O problema é
 * que o nome não é um cadastro: ele foi lido do texto do ato por um modelo, e
 * chega fragmentado. No acervo de 2026-09-14 são 3.247 nomes distintos em
 * 4.649 concursos, e os quinze mais frequentes trazem SEIS variações de
 * professor ("Professor Substituto", "Professor do Magistério Superior",
 * "Professor Visitante", "Professor Assistente", "Professor de Magistério
 * Superior", "Professor Substituto/Temporário") mais duas disciplinas que não
 * são cargo nenhum ("Matemática", "Física").
 *
 * **Pegar os N mais frequentes, portanto, produz um rodapé ruim.** Pegar de
 * uma lista escrita à mão produz um rodapé que envelhece sem ninguém
 * perceber. O que este arquivo faz é medir, no acervo que está no ar, o que
 * cada link geraria, e recusar por número.
 *
 * Quatro regras, cada uma com uma vítima medida (o relatório delas sai em
 * `recusados`, e `cargos.test.ts` cobra as duas listas):
 *
 * 1. **Só termo que algum ato escreveu.** Candidato é a primeira palavra de
 *    um nome de cargo, ou um nome de cargo inteiro. Nunca um pedaço cortado
 *    no meio: sem isto, "Técnico em Assuntos" (de "Técnico em Assuntos
 *    Educacionais") vira rótulo.
 * 2. **Alcance de pelo menos 1% do acervo listado** (47 concursos hoje). É o
 *    que separa "Professor", com 2.609, de "Residente", com 44. A fatia é
 *    relativa de propósito: um piso absoluto deixaria de valer quando o
 *    acervo dobrar.
 * 3. **Fidelidade de pelo menos 0,8.** De tudo que o link devolve, quatro em
 *    cada cinco precisam ter um cargo com aquele termo na cabeça. É o que
 *    recusa "Técnico" (0,46, quase tudo que volta é "Professor do Ensino
 *    Básico, Técnico e Tecnológico"), "Assistente" (0,53, que é "Professor
 *    Assistente"), "Matemática" e "Física" (a disciplina do professor, não o
 *    cargo) e "Educação" (0,07). A medida separa as duas nuvens com folga: o
 *    que entra vive entre 0,88 e 1,00 e o que é recusado por ela para em
 *    0,68.
 * 4. **Um link por cabeça de família.** A variação de maior alcance
 *    representa a família e as outras saem. É o que reduz as seis variações
 *    de professor a uma, e o que impede "Assistente em Administração" e
 *    "Assistente Administrativo" (a mesma coisa escrita de dois jeitos) de
 *    ocuparem duas linhas.
 *
 * Mais uma recusa, que não é sobre frequência: termo que é rótulo de
 * `Escolaridade` não é cargo. "Mestrado" e "Doutorado" aparecem no campo nome
 * do cargo em concurso de residência e de bolsa, passam pelas quatro regras
 * (alcance 72 e 55, fidelidade 0,81 e 0,89) e diriam, numa lista chamada "por
 * cargo", que mestrado é um cargo. A lista de escolaridades vem do enum do
 * domínio (`ROTULO_ESCOLARIDADE`), não daqui: é o mesmo conjunto que o filtro
 * de escolaridade já oferece ao lado, e cresce com ele.
 */
import type { ConcursoResumo } from "./dominio";
import {
  casaComTermos,
  normalizar,
  termosDaBusca,
  textoBuscavel,
} from "./consulta";
import { slugDaBusca } from "./enderecoDaBusca";
import { ROTULO_ESCOLARIDADE } from "./rotulos";

/** Quanto do acervo o link precisa devolver para valer uma linha. */
const FATIA_MINIMA = 0.01;

/** Quanto do que o link devolve precisa ser daquele cargo. */
const FIDELIDADE_MINIMA = 0.8;

const ESCOLARIDADES = new Set(
  Object.values(ROTULO_ESCOLARIDADE).map((rotulo) => normalizar(rotulo)),
);

/**
 * O ato escreve a especialização depois de um traço, de dois-pontos ou de uma
 * barra: "Especialista em Desenvolvimento de Tecnologia Nuclear e Defesa -
 * Engenheiro Mecânico" é um cargo de engenheiro, e "Analista - Especialidade:
 * Administrador" é um cargo de administrador. Cada pedaço conta como nome.
 *
 * A vírgula **não** separa, e é a diferença que decide um caso real: em
 * "Professor do Ensino Básico, Técnico e Tecnológico" o pedaço depois da
 * vírgula não é um cargo de técnico, é o resto do nome do cargo de professor.
 * Separar por vírgula daria a "Técnico" uma família de 89 concursos que são
 * todos de professor.
 */
function partesDoNome(bruto: string): string[] {
  return bruto
    .split(/\s[-–\u2014]\s|[:;/]/)
    .map((parte) => parte.trim())
    .filter(Boolean);
}

function palavrasDe(normalizado: string): string[] {
  return normalizado.split(/[^a-z0-9]+/).filter(Boolean);
}

export interface CargoMedido {
  /** Normalizado, e é o que vira o slug de `/busca/<slug>`: o mesmo que a busca compara. */
  termo: string;
  /** Como o ato escreveu, na grafia mais frequente do acervo. */
  rotulo: string;
  /** Quantos concursos `/busca/<slug>` devolve. Nunca zero. */
  alcance: number;
  /** Quantos têm um cargo com este termo na cabeça do nome. */
  familia: number;
  /** `familia ∩ alcance` sobre `alcance`. Quanto do link é do cargo. */
  fidelidade: number;
}

export interface CargoRecusado extends CargoMedido {
  motivo: string;
}

export interface CargosDoAcervo {
  /** O alcance mínimo desta medição, para a regra poder ser conferida. */
  piso: number;
  escolhidos: CargoMedido[];
  recusados: CargoRecusado[];
}

interface Candidato {
  termo: string;
  /** `termosDaBusca(termo)`, uma vez só em vez de uma vez por concurso. */
  termos: string[];
  rotulo: string;
}

/**
 * Os candidatos e o alcance de cada um, medidos sobre o acervo inteiro.
 *
 * Duas passadas, e a primeira existe para a segunda ser barata. A primeira lê
 * só os nomes de cargo, que são curtos, e conta a família de cada prefixo. A
 * segunda é a cara: normaliza o texto buscável de cada concurso e testa cada
 * candidato contra ele, e por isso só roda para quem a primeira deixou
 * passar.
 *
 * O corte da primeira passada **não perde nada**: quem sobrevive às regras
 * tem `familia = fidelidade × alcance ≥ 0,8 × piso`, então um candidato com
 * família menor que isso já estaria recusado. É um limite demonstrado, não um
 * teto arbitrário: hoje ele leva os 8.900 prefixos distintos a 37
 * candidatos.
 */
export function medirCargos(acervo: ConcursoResumo[]): CargosDoAcervo {
  const piso = Math.ceil(acervo.length * FATIA_MINIMA);
  const pisoDaFamilia = Math.ceil(piso * FIDELIDADE_MINIMA);

  const familiaDe = new Map<string, number>();
  const grafiasDe = new Map<string, Map<string, number>>();
  const prefixosDe: Set<string>[] = [];

  const anotarGrafia = (termo: string, grafia: string) => {
    let grafias = grafiasDe.get(termo);
    if (!grafias) grafiasDe.set(termo, (grafias = new Map()));
    grafias.set(grafia, (grafias.get(grafia) ?? 0) + 1);
  };

  for (const concurso of acervo) {
    const prefixos = new Set<string>();
    // `?? []` porque um `bc api` de versão anterior não manda `nomesDeCargo`,
    // e a mesma guarda já existe em `consulta.ts` pelo mesmo motivo.
    for (const bruto of new Set(concurso.nomesDeCargo ?? [])) {
      for (const parte of partesDoNome(bruto)) {
        const palavras = palavrasDe(normalizar(parte));
        if (palavras.length === 0) continue;
        for (let k = 1; k <= palavras.length; k += 1) {
          prefixos.add(palavras.slice(0, k).join(" "));
        }
        // Só o nome inteiro e a primeira palavra ganham grafia, e é isso que
        // faz a regra 1: quem não tem grafia não pode ser candidato, então
        // nenhum prefixo cortado no meio chega a virar rótulo.
        anotarGrafia(palavras.join(" "), parte);
        anotarGrafia(
          palavras[0],
          (parte.match(/[\p{L}\p{N}]+/u) ?? [parte])[0],
        );
      }
    }
    prefixosDe.push(prefixos);
    for (const prefixo of prefixos) {
      familiaDe.set(prefixo, (familiaDe.get(prefixo) ?? 0) + 1);
    }
  }

  const candidatos: Candidato[] = [];
  for (const [termo, familia] of familiaDe) {
    if (familia < pisoDaFamilia) continue;
    const grafias = grafiasDe.get(termo);
    if (!grafias) continue;
    const rotulo = [...grafias].sort((a, b) => b[1] - a[1])[0][0];
    candidatos.push({ termo, termos: termosDaBusca(termo), rotulo });
  }

  const alcance = new Array<number>(candidatos.length).fill(0);
  const daFamilia = new Array<number>(candidatos.length).fill(0);
  const familia = new Array<number>(candidatos.length).fill(0);
  for (let i = 0; i < acervo.length; i += 1) {
    const texto = textoBuscavel(acervo[i]);
    const prefixos = prefixosDe[i];
    for (let j = 0; j < candidatos.length; j += 1) {
      const dentro = prefixos.has(candidatos[j].termo);
      if (dentro) familia[j] += 1;
      if (casaComTermos(texto, candidatos[j].termos)) {
        alcance[j] += 1;
        if (dentro) daFamilia[j] += 1;
      }
    }
  }

  const medidos = candidatos
    .map((candidato, j) => ({
      termo: candidato.termo,
      rotulo: candidato.rotulo,
      alcance: alcance[j],
      familia: familia[j],
      fidelidade: alcance[j] === 0 ? 0 : daFamilia[j] / alcance[j],
    }))
    .sort((a, b) => b.alcance - a.alcance || a.termo.localeCompare(b.termo));

  const escolhidos: CargoMedido[] = [];
  const recusados: CargoRecusado[] = [];
  const cabecasUsadas = new Set<string>();

  for (const medido of medidos) {
    const cabeca = medido.termo.split(" ")[0];
    const motivo = ESCOLARIDADES.has(medido.termo)
      ? "escolaridade, não cargo"
      : medido.alcance < piso
        ? `alcance ${medido.alcance}, abaixo do piso de ${piso}`
        : medido.fidelidade < FIDELIDADE_MINIMA
          ? `fidelidade ${medido.fidelidade.toFixed(2)}`
          : cabecasUsadas.has(cabeca)
            ? `outra variação de "${cabeca}" já entrou`
            : null;

    if (motivo) {
      recusados.push({ ...medido, motivo });
    } else {
      escolhidos.push(medido);
      cabecasUsadas.add(cabeca);
    }
  }

  return { piso, escolhidos, recusados };
}

/**
 * O endereço do cargo é a busca pelo termo, no caminho. O termo já sai
 * normalizado da medição e nunca é vazio (é feito de palavras `[a-z0-9]+`),
 * então todo cargo tem slug.
 */
export function urlDoCargo(cargo: CargoMedido): string {
  return `/busca/${slugDaBusca(cargo.termo)}`;
}

/** Só para a suíte: o piso e a fidelidade, sem repetir os números no teste. */
export const REGRA = {
  FATIA_MINIMA,
  FIDELIDADE_MINIMA,
} as const;
