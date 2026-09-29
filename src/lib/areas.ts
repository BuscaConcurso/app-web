/**
 * As 12 áreas da home, na ordem do protótipo, e a regra que decide quais
 * concursos são de cada uma.
 *
 * Nome e apoio saem de `docs/prototipo/Main.dc.html:133-144`, assim como o
 * ícone e o tom do fundo do ícone.
 *
 * **Regra, não termo.** Cada área era uma busca por uma palavra só
 * (`tribunal`, `policia`...), e errava para os dois lados: "banco" pegava
 * "Banco de Talentos" de prefeitura, "polícia" perdia "Agente Penitenciário".
 * Agora cada área diz em que campo procura o quê (`RegraDaArea`), e a regra
 * foi conferida contra o acervo local: a tabela de aceite, com os falsos
 * positivos achados e o ajuste feito, está em
 * `docs/superpowers/plans/2026-09-28-concursos-por-area.md`, e os casos reais
 * viraram teste em `areas.test.ts`.
 *
 * A classificação mora aqui, no app, e não no engine: o app já tem o acervo
 * inteiro em memória, e uma regra explícita e testada é fácil de trocar.
 * Classificar no engine seria mais certo a longo prazo, mas é um projeto de
 * dados próprio (ver o spec, `2026-09-28-concursos-por-area-design.md`).
 */
import type { NomeDoIcone } from "@/components/ui/Icone";
import { normalizar } from "./consulta";
import type { ConcursoResumo } from "./dominio";

/**
 * Onde a área procura, e o que a tira. Cada termo casa por palavra inteira
 * (ou sequência de palavras) sobre o texto normalizado: "banco" casa "Banco
 * do Brasil" e não casa "bancada". Termo de várias palavras casa as palavras
 * em sequência, e é o jeito de dizer "tribunal regional" sem pegar todo
 * "regional".
 */
export interface RegraDaArea {
  /** Casa no nome ou na sigla do órgão. */
  orgao?: string[];
  /** Casa no nome de qualquer cargo (`nomesDeCargo`), um cargo por vez. */
  cargo?: string[];
  /** Casa no título do concurso. */
  titulo?: string[];
  /**
   * O que tira. No órgão ou no título, tira o concurso inteiro; num cargo,
   * tira só aquele cargo, que deixa de contar para a área (o concurso ainda
   * entra por outro cargo, pelo órgão ou pelo título). É o que separa
   * "Médico Veterinário" de "Médico" num edital que tem os dois.
   */
  exceto?: string[];
}

export interface Area {
  /** O endereço da área, `/areas/<slug>`. */
  slug: string;
  nome: string;
  apoio: string;
  icone: NomeDoIcone;
  tom: "verde" | "anil" | "ouro" | "urucum";
  regra: RegraDaArea;
}

export const AREAS: Area[] = [
  {
    slug: "tribunais",
    nome: "Tribunais",
    apoio: "TJ, TRT, TRF, TRE",
    icone: "tribunais",
    tom: "verde",
    regra: {
      orgao: ["tribunal", "poder judiciario", "justica federal", "conselho da justica federal", "conselho nacional de justica"],
      cargo: ["analista judiciario", "tecnico judiciario", "juiz"],
      // Tribunal de Contas é Fiscal e controle; a Funpresp-Jud é um fundo de
      // pensão que só tem "Poder Judiciário" no nome.
      exceto: ["tribunal de contas", "previdencia complementar"],
    },
  },
  {
    slug: "policia-e-seguranca",
    nome: "Polícia e segurança",
    apoio: "PF, PRF, PM, PC",
    icone: "policia",
    tom: "anil",
    regra: {
      // Não "segurança pública": o Ministério da Justiça e Segurança Pública
      // publica chamada de conselheiro e de consultor, que não é segurança.
      orgao: ["policia"],
      cargo: ["delegado", "escrivao", "papiloscopista", "agente de policia", "policial", "policia judicial", "agente penitenciario", "policia penal", "execucao penal"],
      titulo: ["politicas penais", "senappen", "depen"],
    },
  },
  {
    slug: "educacao",
    nome: "Educação",
    apoio: "Universidades e IFs",
    icone: "educacao",
    tom: "ouro",
    regra: {
      orgao: ["universidade", "instituto federal", "centro federal de educacao tecnologica", "colegio pedro ii"],
      cargo: ["professor", "docente"],
    },
  },
  {
    slug: "saude",
    nome: "Saúde",
    apoio: "Hospitais e SUS",
    icone: "saude",
    tom: "urucum",
    regra: {
      orgao: ["hospital", "ministerio da saude", "sus", "ebserh", "hemoderivados", "pioneiras sociais", "fundacao nacional de saude", "saude suplementar", "instituto nacional de cancer", "instituto nacional de cardiologia", "instituto nacional de traumatologia"],
      cargo: ["medico", "enfermeiro", "tecnico de enfermagem", "tecnico em enfermagem", "auxiliar de enfermagem", "farmaceutico", "nutricionista", "fisioterapeuta", "fonoaudiologo", "odontologo", "cirurgiao dentista"],
      // Veterinário é Ambiente e agro.
      exceto: ["medico veterinario"],
    },
  },
  {
    slug: "fiscal-e-controle",
    nome: "Fiscal e controle",
    apoio: "Receita, TCU, CGU",
    icone: "fiscal",
    tom: "verde",
    regra: {
      orgao: ["receita federal", "tribunal de contas", "controladoria", "cgu"],
      cargo: ["auditor", "auditor fiscal", "analista tributario"],
    },
  },
  {
    slug: "bancos-e-estatais",
    nome: "Bancos e estatais",
    apoio: "BB, Caixa, BNDES",
    icone: "estatais",
    tom: "anil",
    regra: {
      orgao: ["banco", "caixa economica", "bndes", "empresa brasileira", "companhia", "fundos garantidores", "empresa de tecnologia e informacoes da previdencia", "empresa gerencial de projetos navais"],
    },
  },
  {
    slug: "forcas-armadas",
    nome: "Forças Armadas",
    apoio: "Marinha, Exército, FAB",
    icone: "forcas",
    tom: "anil",
    regra: {
      orgao: ["marinha", "exercito", "aeronautica", "comando militar", "ministerio da defesa", "colegio militar", "operacoes navais", "fuzileiros navais", "distrito naval"],
      exceto: ["tribunal militar"],
    },
  },
  {
    slug: "prefeituras",
    nome: "Prefeituras",
    apoio: "Municípios do país",
    icone: "prefeituras",
    tom: "ouro",
    regra: {
      orgao: ["prefeitura", "municipio"],
    },
  },
  {
    slug: "conselhos",
    nome: "Conselhos",
    apoio: "CRA, COREN, CREA",
    icone: "conselhos",
    tom: "verde",
    regra: {
      orgao: ["conselho regional", "conselho federal", "conselho de arquitetura e urbanismo"],
    },
  },
  {
    slug: "tecnologia",
    nome: "Tecnologia",
    apoio: "Analista de TI e dados",
    icone: "tecnologia",
    tom: "anil",
    regra: {
      // Não "informática" sozinha: nos editais de IF ela é a área do
      // professor ("Informática", "Informática Educativa"), que é Educação.
      cargo: ["tecnologia da informacao", "tecnico em informatica", "tecnico de informatica", "analista de informatica", "agente censitario de informatica", "tecnico de laboratorio informatica", "tecnico de laboratorio area informatica", "analista de sistemas", "administrador de redes", "desenvolvedor", "programador", "ciencia de dados", "cientista de dados", "analista de dados"],
    },
  },
  {
    slug: "administrativo",
    nome: "Administrativo",
    apoio: "Técnico e assistente",
    icone: "administrativo",
    tom: "urucum",
    regra: {
      cargo: ["assistente em administracao", "assistente administrativo", "auxiliar em administracao", "auxiliar administrativo", "tecnico administrativo", "agente administrativo", "administrador"],
      titulo: ["tecnico administrativo", "tecnicos administrativos"],
      exceto: ["administrador de redes"],
    },
  },
  {
    slug: "ambiente-e-agro",
    nome: "Ambiente e agro",
    apoio: "IBAMA, ICMBio, CONAB",
    icone: "ambiente",
    tom: "verde",
    regra: {
      orgao: ["meio ambiente", "ibama", "icmbio", "chico mendes", "conab", "abastecimento", "agricultura", "agropecuaria", "reforma agraria", "pesca", "aguas e saneamento", "florestal", "vegetacao nativa", "mata atlantica", "extensao rural"],
      cargo: ["engenheiro agronomo", "engenheiro florestal", "engenheiro ambiental", "medico veterinario", "zootecnista", "tecnico em agropecuaria", "tecnico agricola", "analista ambiental", "gestor ambiental"],
    },
  },
];

/**
 * Minúsculo, sem acento (`normalizar`, a mesma da busca), e todo o resto que
 * não é letra nem número vira um espaço só. As bordas de espaço são o que
 * faz o `includes` de baixo casar por palavra inteira: " banco " não está
 * dentro de " bancada ".
 */
function textoDaRegra(texto: string): string {
  return ` ${normalizar(texto).replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/** Os termos de cada regra, já na forma do texto: normalizados uma vez só. */
const TERMOS = new WeakMap<RegraDaArea, Required<RegraDaArea>>();

function termosDa(regra: RegraDaArea): Required<RegraDaArea> {
  let termos = TERMOS.get(regra);
  if (!termos) {
    const preparar = (lista: string[] = []) => lista.map(textoDaRegra);
    termos = {
      orgao: preparar(regra.orgao),
      cargo: preparar(regra.cargo),
      titulo: preparar(regra.titulo),
      exceto: preparar(regra.exceto),
    };
    TERMOS.set(regra, termos);
  }
  return termos;
}

interface TextosDoConcurso {
  orgao: string;
  cargos: string[];
  titulo: string;
}

/**
 * Os três campos de um concurso, normalizados, guardados pelo próprio objeto.
 * `/areas` passa as 12 regras pelo acervo inteiro, e normalizar 12 vezes o
 * mesmo título seria trabalho repetido; o acervo é o mesmo objeto por cinco
 * minutos (`lerAcervoDaApi`), e o `WeakMap` some com ele.
 */
const TEXTOS = new WeakMap<ConcursoResumo, TextosDoConcurso>();

function textosDo(concurso: ConcursoResumo): TextosDoConcurso {
  let textos = TEXTOS.get(concurso);
  if (!textos) {
    textos = {
      orgao: textoDaRegra(`${concurso.orgao.nome} ${concurso.orgao.sigla ?? ""}`),
      // `?? []` pela mesma razão de `textoBuscavel`: um `bc api` anterior não
      // manda o campo.
      cargos: (concurso.nomesDeCargo ?? []).map(textoDaRegra),
      titulo: textoDaRegra(concurso.titulo),
    };
    TEXTOS.set(concurso, textos);
  }
  return textos;
}

function contem(texto: string, termos: string[]): boolean {
  return termos.some((termo) => texto.includes(termo));
}

/**
 * O concurso inteiro entra ou não: basta um campo casar e o órgão e o título
 * não excluírem. O cargo que casa com `exceto` só deixa de contar (ver
 * `RegraDaArea.exceto`).
 */
export function casaComArea(concurso: ConcursoResumo, area: Area): boolean {
  const termos = termosDa(area.regra);
  const { orgao, cargos, titulo } = textosDo(concurso);
  if (contem(orgao, termos.exceto) || contem(titulo, termos.exceto)) return false;
  return (
    contem(orgao, termos.orgao) ||
    contem(titulo, termos.titulo) ||
    cargos.some((cargo) => contem(cargo, termos.cargo) && !contem(cargo, termos.exceto))
  );
}

/**
 * A área de um slug de rota, ou `null`. Comparação exata: `/areas/Saude` é
 * 404, e não uma segunda URL para a mesma lista.
 */
export function areaDoSlug(slug: string): Area | null {
  return AREAS.find((area) => area.slug === slug) ?? null;
}

/** Para onde o azulejo da área leva: a página dela. */
export function hrefDaArea(area: Area): string {
  return `/areas/${area.slug}`;
}
