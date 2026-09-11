/**
 * Leitura da query string.
 *
 * Tudo que chega pela URL é texto de estranho: um `?uf=banana` não pode
 * derrubar a página nem virar filtro. Cada parâmetro é conferido contra o
 * conjunto de valores válidos e descartado quando não bate.
 */
import { UFS, type Escolaridade, type Esfera, type Uf } from "./dominio";
import { ORDENS, SITUACOES, type Ordem, type Situacao } from "./consulta";
import { ROTULO_ESCOLARIDADE, ROTULO_ESFERA } from "./rotulos";
import { BANCAS } from "@/mocks/bancas";

export type Parametros = Record<string, string | string[] | undefined>;

function primeiro(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const limpo = texto?.trim();
  return limpo ? limpo : undefined;
}

function dentroDe<T extends string>(
  valor: string | undefined,
  validos: readonly T[],
): T | undefined {
  return valor && (validos as readonly string[]).includes(valor)
    ? (valor as T)
    : undefined;
}

export interface ConsultaDaUrl {
  q?: string;
  uf?: Uf;
  escolaridade?: Escolaridade;
  esfera?: Esfera;
  situacao?: Situacao;
  banca?: string;
  salarioMin?: number;
  ordem: Ordem;
  pagina: number;
}

export function lerConsulta(parametros: Parametros): ConsultaDaUrl {
  const salario = Number(primeiro(parametros.salarioMin));
  const pagina = Number(primeiro(parametros.pagina));

  return {
    q: primeiro(parametros.q),
    uf: dentroDe(primeiro(parametros.uf), UFS),
    escolaridade: dentroDe(
      primeiro(parametros.escolaridade),
      Object.keys(ROTULO_ESCOLARIDADE) as Escolaridade[],
    ),
    esfera: dentroDe(
      primeiro(parametros.esfera),
      Object.keys(ROTULO_ESFERA) as Esfera[],
    ),
    situacao: dentroDe(
      primeiro(parametros.situacao),
      Object.keys(SITUACOES) as Situacao[],
    ),
    banca: dentroDe(primeiro(parametros.banca), Object.keys(BANCAS)),
    salarioMin: Number.isFinite(salario) && salario > 0 ? salario : undefined,
    ordem: dentroDe(primeiro(parametros.ordem), Object.keys(ORDENS) as Ordem[]) ?? "encerrando",
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

/** Monta a URL da busca de novo, trocando ou removendo um parâmetro. */
export function comParametro(
  consulta: ConsultaDaUrl,
  chave: keyof ConsultaDaUrl,
  valor: string | number | undefined,
): string {
  const busca = new URLSearchParams();
  const base: Record<string, unknown> = { ...consulta, [chave]: valor };

  for (const [nome, bruto] of Object.entries(base)) {
    if (bruto === undefined || bruto === "") continue;
    // Ordenação padrão e primeira página não precisam aparecer na URL, e
    // deixá-las de fora evita dois endereços para a mesma lista.
    if (nome === "ordem" && bruto === "encerrando") continue;
    if (nome === "pagina" && bruto === 1) continue;
    busca.set(nome, String(bruto));
  }

  const texto = busca.toString();
  return texto ? `/concursos?${texto}` : "/concursos";
}
