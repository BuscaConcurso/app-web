import type { ConcursoResumo, ConcursoStatus, Escolaridade } from "@/lib/dominio";
import { BANCAS, type SlugBanca } from "./bancas";
import { ORGAOS, type SlugOrgao } from "./orgaos";

/**
 * Acervo de mock com a forma que a API vai devolver.
 *
 * As datas são deslocamentos em dias a partir de agora, não datas fixas. Uma
 * data fixa envelhece: em duas semanas a faixa "encerra esta semana" da home
 * fica vazia e o design deixa de ser demonstrável. O preço é que numa build
 * estática as datas congelam no dia do build, o que é aceitável enquanto não
 * há API.
 */
function dia(deslocamento: number): string {
  const data = new Date();
  data.setDate(data.getDate() + deslocamento);
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const numeroDoDia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${numeroDoDia}`;
}

interface Rascunho {
  slug: string;
  titulo: string;
  orgao: SlugOrgao;
  banca?: SlugBanca | null;
  status: ConcursoStatus;
  escolaridades: Escolaridade[];
  vagas?: number | null;
  /**
   * Nomes dos cargos, como o resumo do engine os publica. Vazio é um caso
   * legítimo e está representado: 354 dos 3.071 concursos do acervo não têm
   * cargo nenhum, e o cartão precisa mostrar essa ausência.
   */
  cargos?: string[];
  /** A repartição legal do total, quando o ato a declarou. */
  vagasPcd?: number | null;
  vagasNegros?: number | null;
  cadastroReserva?: boolean;
  salarioAte?: number | null;
  taxa?: number | null;
  /** Deslocamento em dias: abertura das inscrições. */
  de?: number | null;
  /** Deslocamento em dias: fechamento das inscrições. */
  ate?: number | null;
  /** Deslocamento em dias: publicação do edital. */
  publicado?: number | null;
  previstoPara?: number | null;
}

const RASCUNHOS: Rascunho[] = [
  // Encerrando nesta semana. São estes que o design existe para destacar.
  {
    slug: "trt-2-analista-judiciario-2026",
    cargos: [
      "Analista judiciário",
      "Técnico judiciário",
    ],
    titulo: "Analista e técnico judiciário",
    orgao: "trt-2",
    banca: "vunesp",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio"],
    vagas: 86,
    // A repartição legal, como o acervo real a traz em 197 dos 3.071
    // concursos: sempre um recorte do total, nunca uma soma a mais.
    vagasPcd: 5,
    vagasNegros: 17,
    salarioAte: 13994.78,
    taxa: 95,
    de: -32,
    ate: 2,
    publicado: -38,
  },
  {
    slug: "pmmg-soldado-2026",
    cargos: [
      "Soldado de 1ª classe",
    ],
    titulo: "Soldado da polícia militar",
    orgao: "pmmg",
    banca: "fgv",
    status: "inscricoes_abertas",
    escolaridades: ["medio"],
    vagas: 2500,
    salarioAte: 4712.6,
    taxa: 85.5,
    de: -28,
    ate: 3,
    publicado: -35,
  },
  {
    slug: "sefaz-ce-auditor-fiscal-2026",
    titulo: "Auditor fiscal da receita estadual",
    orgao: "sefaz-ce",
    banca: "cebraspe",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 90,
    salarioAte: 23200,
    taxa: 190,
    de: -40,
    ate: 5,
    publicado: -45,
  },
  {
    slug: "prefeitura-de-curitiba-professor-2026",
    cargos: [
      "Professor de docência 1",
      "Professor de educação infantil",
      "Profissional do magistério - anos iniciais",
      "Pedagogo",
      "Auxiliar de serviços escolares",
    ],
    titulo: "Professor de docência 1",
    orgao: "prefeitura-de-curitiba",
    banca: "aocp",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio_tecnico"],
    vagas: 420,
    // O cartão mais carregado que o acervo produz: situação, escolaridade,
    // duas reservas, cadastro de reserva e banca. São 8 concursos em 3.071
    // com cinco etiquetas, e é a 375px que este caso precisa caber.
    vagasPcd: 21,
    vagasNegros: 84,
    cadastroReserva: true,
    salarioAte: 6127.3,
    taxa: 72,
    de: -25,
    ate: 6,
    publicado: -30,
  },

  // Abertos com folga.
  {
    slug: "tjsp-escrevente-tecnico-judiciario-2026",
    cargos: [
      "Escrevente técnico judiciário",
    ],
    titulo: "Escrevente técnico judiciário",
    orgao: "tjsp",
    banca: "vunesp",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio"],
    vagas: 148,
    salarioAte: 14852.66,
    taxa: 110,
    de: -12,
    ate: 24,
    publicado: -18,
  },
  {
    slug: "pf-agente-de-policia-federal-2026",
    titulo: "Agente, escrivão e delegado",
    orgao: "pf",
    banca: "cebraspe",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 1000,
    salarioAte: 26800,
    taxa: 180,
    de: -6,
    ate: 21,
    publicado: -10,
  },
  {
    slug: "bacen-analista-2026",
    titulo: "Analista do Banco Central",
    orgao: "bacen",
    banca: "cebraspe",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 100,
    salarioAte: 20924.8,
    taxa: 170,
    de: -4,
    ate: 27,
    publicado: -8,
  },
  {
    slug: "tcu-auditor-federal-2026",
    titulo: "Auditor federal de controle externo",
    orgao: "tcu",
    banca: "cebraspe",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 60,
    salarioAte: 25277.16,
    taxa: 200,
    de: -2,
    ate: 30,
    publicado: -6,
  },
  {
    slug: "trf-3-analista-judiciario-2026",
    titulo: "Analista e técnico judiciário",
    orgao: "trf-3",
    banca: "fcc",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio"],
    vagas: 210,
    salarioAte: 13994.78,
    taxa: 100,
    de: -9,
    ate: 19,
    publicado: -14,
  },
  {
    slug: "prefeitura-de-sao-paulo-agente-de-apoio-2026",
    titulo: "Agente de apoio administrativo",
    orgao: "prefeitura-de-sao-paulo",
    banca: "vunesp",
    status: "inscricoes_abertas",
    escolaridades: ["medio", "fundamental"],
    vagas: 1200,
    salarioAte: 3872.4,
    taxa: 58,
    de: -5,
    ate: 17,
    publicado: -11,
  },
  {
    slug: "ibge-recenseador-2026",
    titulo: "Recenseador e supervisor de coleta",
    orgao: "ibge",
    banca: "fgv",
    status: "inscricoes_abertas",
    escolaridades: ["medio", "fundamental"],
    vagas: 8420,
    cadastroReserva: true,
    salarioAte: 3100,
    taxa: 45.5,
    de: -3,
    ate: 15,
    publicado: -7,
  },
  {
    slug: "detran-sp-agente-de-transito-2026",
    titulo: "Agente estadual de trânsito",
    orgao: "detran-sp",
    banca: "vunesp",
    status: "inscricoes_abertas",
    escolaridades: ["medio"],
    vagas: 300,
    salarioAte: 5100.9,
    taxa: 78,
    de: -7,
    ate: 23,
    publicado: -13,
  },
  {
    slug: "ufmg-tecnico-administrativo-2026",
    titulo: "Técnico administrativo em educação",
    orgao: "ufmg",
    banca: "consulplan",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio_tecnico", "medio"],
    vagas: 74,
    salarioAte: 9152.4,
    taxa: 92,
    de: -10,
    ate: 12,
    publicado: -16,
  },
  {
    slug: "tj-rs-oficial-de-justica-2026",
    titulo: "Oficial de justiça",
    orgao: "tj-rs",
    banca: "fgv",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 118,
    salarioAte: 12408,
    taxa: 105,
    de: -8,
    ate: 33,
    publicado: -12,
  },
  {
    slug: "ses-sc-enfermeiro-2026",
    titulo: "Enfermeiro e técnico de enfermagem",
    orgao: "ses-sc",
    banca: "ibfc",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio_tecnico"],
    vagas: 560,
    cadastroReserva: true,
    salarioAte: 8740.15,
    taxa: 66,
    de: -6,
    ate: 26,
    publicado: -10,
  },
  {
    slug: "al-go-analista-legislativo-2026",
    titulo: "Analista legislativo",
    orgao: "al-go",
    banca: "idecan",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 40,
    salarioAte: 11300,
    taxa: 120,
    de: -11,
    ate: 14,
    publicado: -17,
  },
  {
    slug: "mp-df-analista-2026",
    titulo: "Analista e técnico do MPDFT",
    orgao: "mp-df",
    banca: "cebraspe",
    status: "inscricoes_abertas",
    escolaridades: ["superior", "medio"],
    vagas: 92,
    salarioAte: 14186.7,
    taxa: 115,
    de: -1,
    ate: 29,
    publicado: -5,
  },
  {
    slug: "pc-ba-investigador-2026",
    titulo: "Investigador e escrivão de polícia",
    orgao: "pc-ba",
    banca: "ibade",
    status: "inscricoes_abertas",
    escolaridades: ["superior"],
    vagas: 620,
    salarioAte: 7426.4,
    taxa: 88,
    de: -14,
    ate: 11,
    publicado: -20,
  },
  {
    slug: "correios-carteiro-2026",
    titulo: "Carteiro e agente de correios",
    orgao: "correios",
    banca: "ibfc",
    status: "inscricoes_abertas",
    escolaridades: ["medio"],
    vagas: 3600,
    salarioAte: 3672.02,
    taxa: 39.5,
    de: -2,
    ate: 18,
    publicado: -4,
  },
  {
    slug: "ufba-professor-substituto-2026",
    titulo: "Professor substituto",
    orgao: "ufba",
    banca: null,
    status: "inscricoes_abertas",
    escolaridades: ["mestrado", "doutorado"],
    vagas: 28,
    salarioAte: 10481.64,
    taxa: 130,
    de: -3,
    ate: 9,
    publicado: -6,
  },

  // Previstos. Ainda não há edital, e o valor da página é avisar quando sair.
  {
    slug: "inss-tecnico-do-seguro-social-2027",
    titulo: "Técnico do seguro social",
    orgao: "inss",
    banca: null,
    status: "previsto",
    escolaridades: ["medio"],
    vagas: null,
    cadastroReserva: false,
    salarioAte: 5905.79,
    previstoPara: 2027,
  },
  {
    slug: "mpsp-analista-2027",
    titulo: "Analista e oficial de promotoria",
    orgao: "mpsp",
    banca: null,
    status: "autorizado",
    escolaridades: ["superior", "medio"],
    vagas: 340,
    salarioAte: 12864.3,
    previstoPara: 2027,
  },
  {
    slug: "prf-policial-rodoviario-federal-2027",
    titulo: "Policial rodoviário federal",
    orgao: "prf",
    banca: null,
    status: "autorizado",
    escolaridades: ["superior"],
    vagas: 500,
    salarioAte: 10357.88,
    previstoPara: 2027,
  },
  {
    slug: "camara-dos-deputados-analista-2027",
    titulo: "Analista legislativo",
    orgao: "camara-dos-deputados",
    banca: "fgv",
    status: "banca_definida",
    escolaridades: ["superior"],
    vagas: 180,
    salarioAte: 28477.72,
    previstoPara: 2027,
  },
  {
    slug: "tjmg-oficial-judiciario-2027",
    titulo: "Oficial de apoio judicial",
    orgao: "tjmg",
    banca: null,
    status: "previsto",
    escolaridades: ["superior", "medio"],
    vagas: null,
    cadastroReserva: true,
    salarioAte: null,
    previstoPara: 2027,
  },
  {
    slug: "pm-pe-soldado-2027",
    titulo: "Soldado da polícia militar",
    orgao: "pm-pe",
    banca: null,
    status: "previsto",
    escolaridades: ["medio"],
    vagas: 1200,
    salarioAte: 4622.12,
    previstoPara: 2027,
  },
  {
    slug: "sefaz-sp-agente-fiscal-2027",
    titulo: "Agente fiscal de rendas",
    orgao: "sefaz-sp",
    banca: "fcc",
    status: "banca_definida",
    escolaridades: ["superior"],
    vagas: 120,
    salarioAte: 22300.44,
    previstoPara: 2027,
  },
  {
    slug: "prefeitura-de-belo-horizonte-guarda-municipal-2027",
    titulo: "Guarda municipal",
    orgao: "prefeitura-de-belo-horizonte",
    banca: null,
    status: "previsto",
    escolaridades: ["medio"],
    vagas: 500,
    salarioAte: 4318.6,
    previstoPara: 2027,
  },

  // Sem ação possível. Ficam cinza, mas continuam indexáveis e úteis para
  // quem procura resultado ou histórico do órgão.
  {
    slug: "tce-rj-analista-de-controle-externo-2025",
    titulo: "Analista de controle externo",
    orgao: "tce-rj",
    banca: "fgv",
    status: "resultado",
    escolaridades: ["superior"],
    vagas: 45,
    salarioAte: 18944.9,
    taxa: 140,
    de: -220,
    ate: -186,
    publicado: -232,
  },
  {
    slug: "tjrj-tecnico-de-atividade-judiciaria-2025",
    titulo: "Técnico de atividade judiciária",
    orgao: "tjrj",
    banca: "fgv",
    status: "homologado",
    escolaridades: ["medio"],
    vagas: 320,
    salarioAte: 6248.3,
    taxa: 85,
    de: -300,
    ate: -266,
    publicado: -310,
  },
  {
    slug: "quadrix-crea-pr-assistente-2025",
    titulo: "Assistente administrativo",
    orgao: "prefeitura-de-curitiba",
    banca: "quadrix",
    status: "encerrado",
    escolaridades: ["medio"],
    vagas: 60,
    salarioAte: 3420,
    taxa: 52,
    de: -180,
    ate: -150,
    publicado: -190,
  },
  {
    slug: "detran-sp-oficial-administrativo-2025",
    titulo: "Oficial administrativo",
    orgao: "detran-sp",
    banca: "vunesp",
    status: "provas",
    escolaridades: ["medio"],
    vagas: 210,
    salarioAte: 4480.7,
    taxa: 70,
    de: -120,
    ate: -88,
    publicado: -128,
  },
  {
    slug: "ufmg-assistente-em-administracao-2025",
    titulo: "Assistente em administração",
    orgao: "ufmg",
    banca: "consulplan",
    status: "inscricoes_encerradas",
    escolaridades: ["medio_tecnico"],
    vagas: 36,
    salarioAte: 4967.04,
    taxa: 62,
    de: -95,
    ate: -64,
    publicado: -102,
  },
  {
    slug: "pc-ba-delegado-2025",
    titulo: "Delegado de polícia",
    orgao: "pc-ba",
    banca: "ibade",
    status: "suspenso",
    escolaridades: ["superior"],
    vagas: 80,
    salarioAte: 21400,
    taxa: 175,
    de: -70,
    ate: -40,
    publicado: -78,
  },
  {
    slug: "al-go-tecnico-legislativo-2025",
    titulo: "Técnico legislativo",
    orgao: "al-go",
    banca: "idecan",
    status: "cancelado",
    escolaridades: ["medio"],
    vagas: 25,
    salarioAte: 5210,
    taxa: 68,
    de: -150,
    ate: -120,
    publicado: -160,
  },
];

function paraResumo(rascunho: Rascunho): ConcursoResumo {
  const orgao = ORGAOS[rascunho.orgao];
  return {
    slug: rascunho.slug,
    titulo: rascunho.titulo,
    tipo: "concurso_publico",
    status: rascunho.status,
    orgao,
    banca: rascunho.banca ? BANCAS[rascunho.banca] : null,
    uf: orgao.uf,
    // O mock é de um estado por concurso, então o conjunto é o próprio: é o
    // acervo do engine que tem concurso multiestadual.
    ufs: orgao.uf ? [orgao.uf] : [],
    inscricoesDe: rascunho.de == null ? null : dia(rascunho.de),
    inscricoesAte: rascunho.ate == null ? null : dia(rascunho.ate),
    publicadoEm: rascunho.publicado == null ? null : dia(rascunho.publicado),
    previstoPara: rascunho.previstoPara ?? null,
    vagas: rascunho.vagas ?? null,
    vagasPcd: rascunho.vagasPcd ?? null,
    vagasNegros: rascunho.vagasNegros ?? null,
    cadastroReserva: rascunho.cadastroReserva ?? false,
    salarioAte: rascunho.salarioAte ?? null,
    taxaInscricao: rascunho.taxa ?? null,
    escolaridades: rascunho.escolaridades,
    // A cidade continua vazia de propósito — no mock ela vem do órgão. O
    // nome do cargo não pode mais ficar vazio: ele é uma linha do cartão
    // agora, e um mock sem cargo nenhum demonstraria só o estado de ausência.
    nomesDeCargo: rascunho.cargos ?? [],
    localidades: [],
    editalUrl: rascunho.publicado == null ? null : `/editais/${rascunho.slug}.pdf`,
    // O ato mais recente é o próprio edital, na caixa alta em que o Diário
    // publica, para a faixa "Últimas atualizações" ser demonstrável sem o
    // engine. "Novo" nos publicados há até um mês, para a faixa mostrar os dois
    // casos do selo.
    ultimoAto:
      rascunho.publicado == null
        ? null
        : {
            data: dia(rascunho.publicado),
            titulo: "EDITAL DE ABERTURA Nº 1",
            primeiro: rascunho.publicado >= -30,
          },
  };
}

export const CONCURSOS: ConcursoResumo[] = RASCUNHOS.map(paraResumo);
