/**
 * Leitura e escrita da query string.
 *
 * Tudo que chega pela URL é texto de estranho: um `?uf=banana` não pode
 * derrubar a página nem virar filtro. Cada parâmetro é conferido contra o
 * conjunto de valores válidos e descartado quando não bate.
 *
 * As dimensões de faceta são parâmetros repetidos, no plural natural do
 * HTTP: `?escolaridade=superior&escolaridade=medio`. O nome no singular é
 * de propósito, porque é o que os links da home já usam e o que uma pessoa
 * escreveria na mão.
 */
import { UFS, type Escolaridade, type Esfera, type Uf } from "./dominio";
import { ORDENS, SITUACOES, type Filtro, type Ordem, type Situacao } from "./consulta";
import { slugDaBusca } from "./enderecoDaBusca";
import { ROTULO_ESCOLARIDADE, ROTULO_ESFERA } from "./rotulos";
import { BANCAS } from "@/mocks/bancas";

export type Parametros = Record<string, string | string[] | undefined>;

/** As dimensões que aceitam vários valores. */
export type Dimensao = "escolaridades" | "situacoes" | "bancas" | "esferas";

/** Como cada dimensão se chama na URL, no singular. */
export const PARAMETRO_DA_DIMENSAO: Record<Dimensao, string> = {
  escolaridades: "escolaridade",
  situacoes: "situacao",
  bancas: "banca",
  esferas: "esfera",
};

function primeiro(valor: string | string[] | undefined): string | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const limpo = texto?.trim();
  return limpo ? limpo : undefined;
}

function todos(valor: string | string[] | undefined): string[] {
  const brutos = Array.isArray(valor) ? valor : valor === undefined ? [] : [valor];
  // Um parâmetro repetido pode chegar como lista ou, dependendo de quem
  // montou o link, como "a,b" numa string só. Aceita os dois.
  return brutos
    .flatMap((bruto) => bruto.split(","))
    .map((bruto) => bruto.trim())
    .filter(Boolean);
}

function dentroDe<T extends string>(
  valor: string | undefined,
  validos: readonly T[],
): T | undefined {
  return valor && (validos as readonly string[]).includes(valor)
    ? (valor as T)
    : undefined;
}

function apenasValidos<T extends string>(
  valores: string[],
  validos: readonly T[],
): T[] {
  const conhecidos = new Set<string>(validos);
  // `Set` no fim porque `?uf=SP&uf=SP` não deve contar duas vezes.
  return [...new Set(valores.filter((valor) => conhecidos.has(valor)))] as T[];
}

const ESCOLARIDADES = Object.keys(ROTULO_ESCOLARIDADE) as Escolaridade[];
const ESFERAS = Object.keys(ROTULO_ESFERA) as Esfera[];
const SITUACOES_VALIDAS = Object.keys(SITUACOES) as Situacao[];
const BANCAS_VALIDAS = Object.keys(BANCAS);

export interface ConsultaDaUrl {
  q?: string;
  uf?: Uf;
  escolaridades: Escolaridade[];
  situacoes: Situacao[];
  bancas: string[];
  esferas: Esfera[];
  salarioMin?: number;
  salarioMax?: number;
  ordem: Ordem;
  pagina: number;
}

function inteiroPositivo(texto: string | undefined): number | undefined {
  if (texto === undefined) return undefined;
  // Aceita "3.000" e "3000": o campo mostra o valor formatado.
  const numero = Number(texto.replace(/[^\d]/g, ""));
  return Number.isFinite(numero) && numero > 0 ? numero : undefined;
}

export function lerConsulta(parametros: Parametros): ConsultaDaUrl {
  const pagina = Number(primeiro(parametros.pagina));

  return {
    q: primeiro(parametros.q),
    uf: dentroDe(primeiro(parametros.uf), UFS),
    escolaridades: apenasValidos(todos(parametros.escolaridade), ESCOLARIDADES),
    situacoes: apenasValidos(todos(parametros.situacao), SITUACOES_VALIDAS),
    bancas: apenasValidos(todos(parametros.banca), BANCAS_VALIDAS),
    esferas: apenasValidos(todos(parametros.esfera), ESFERAS),
    salarioMin: inteiroPositivo(primeiro(parametros.salarioMin)),
    salarioMax: inteiroPositivo(primeiro(parametros.salarioMax)),
    ordem:
      dentroDe(primeiro(parametros.ordem), Object.keys(ORDENS) as Ordem[]) ??
      "encerrando",
    pagina: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  };
}

/** A consulta sem nada: listagem geral, ordenação padrão, primeira página. */
export const CONSULTA_VAZIA: ConsultaDaUrl = {
  escolaridades: [],
  situacoes: [],
  bancas: [],
  esferas: [],
  ordem: "encerrando",
  pagina: 1,
};

/**
 * Onde a busca mora: `/busca/<slug>` quando há o que buscar, `/concursos`
 * quando não há. É também o `action` dos formulários que editam só uma parte
 * da consulta (a faixa de salário): o termo viaja no caminho, não num campo.
 */
export function caminhoDaBusca(q?: string): string {
  const slug = q ? slugDaBusca(q) : "";
  return slug ? `/busca/${slug}` : "/concursos";
}

/**
 * Monta o endereço da busca a partir de uma consulta, aplicando as
 * alterações pedidas.
 *
 * Ordenação padrão e primeira página não aparecem na URL: deixá-las de fora
 * evita dois endereços diferentes para exatamente a mesma lista.
 */
export function urlDaBusca(
  consulta: ConsultaDaUrl,
  alteracoes: Partial<ConsultaDaUrl> = {},
): string {
  const final = { ...consulta, ...alteracoes };
  const busca = new URLSearchParams();

  if (final.uf) busca.set("uf", final.uf);

  for (const [dimensao, parametro] of Object.entries(PARAMETRO_DA_DIMENSAO)) {
    for (const valor of final[dimensao as Dimensao]) {
      busca.append(parametro, valor);
    }
  }

  if (final.salarioMin) busca.set("salarioMin", String(final.salarioMin));
  if (final.salarioMax) busca.set("salarioMax", String(final.salarioMax));
  if (final.ordem !== "encerrando") busca.set("ordem", final.ordem);
  if (final.pagina > 1) busca.set("pagina", String(final.pagina));

  // O termo vai no caminho, e não na query: `/busca/<slug>` é o endereço
  // que o buscador indexa, e a query fica só para os recortes dele.
  const caminho = caminhoDaBusca(final.q);
  const texto = busca.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

/** "Limpar filtros": fica o termo e a ordenação, sai todo recorte. */
export function urlSemFiltros(consulta: ConsultaDaUrl): string {
  return urlDaBusca(consulta, {
    uf: undefined,
    escolaridades: [],
    situacoes: [],
    bancas: [],
    esferas: [],
    salarioMin: undefined,
    salarioMax: undefined,
    pagina: 1,
  });
}

/**
 * Para onde a barra do cabeçalho navega. `uf` chega do `<select>` como texto
 * de formulário, e o que não é estado não entra.
 */
export function destinoDoFormulario(q: string, uf: string): string {
  return urlDaBusca(CONSULTA_VAZIA, {
    q: q.trim() || undefined,
    uf: (UFS as readonly string[]).includes(uf) ? (uf as Uf) : undefined,
  });
}

/** O que `filtrar` recebe: a consulta sem ordenação nem página. */
export function filtroDaConsulta(consulta: ConsultaDaUrl): Filtro {
  const { q, uf, escolaridades, situacoes, bancas, esferas, salarioMin, salarioMax } = consulta;
  return { q, uf, escolaridades, situacoes, bancas, esferas, salarioMin, salarioMax };
}

/**
 * `useSearchParams` na forma que `lerConsulta` lê. Repetido vira lista,
 * único continua texto, que é o que o `searchParams` do servidor entrega.
 */
export function parametrosDaUrl(busca: URLSearchParams): Parametros {
  const parametros: Parametros = {};
  for (const chave of new Set(busca.keys())) {
    const valores = busca.getAll(chave);
    parametros[chave] = valores.length === 1 ? valores[0] : valores;
  }
  return parametros;
}

/**
 * O endereço que marca ou desmarca uma opção, conforme ela já esteja
 * marcada. É o que faz cada quadradinho da coluna ser só um link: o estado
 * resultante já está no `href`.
 *
 * Mexer em filtro sempre volta para a primeira página. Estar na página 3 de
 * um resultado e trocar o filtro costuma levar a uma página que não existe
 * mais no resultado novo.
 */
export function urlAlternando(
  consulta: ConsultaDaUrl,
  dimensao: Dimensao,
  valor: string,
): string {
  const atuais = consulta[dimensao] as string[];
  const proximos = atuais.includes(valor)
    ? atuais.filter((item) => item !== valor)
    : [...atuais, valor];

  return urlDaBusca(consulta, {
    [dimensao]: proximos,
    pagina: 1,
  } as Partial<ConsultaDaUrl>);
}

export function urlSemValor(
  consulta: ConsultaDaUrl,
  dimensao: Dimensao,
  valor: string,
): string {
  const atuais = consulta[dimensao] as string[];
  return urlDaBusca(consulta, {
    [dimensao]: atuais.filter((item) => item !== valor),
    pagina: 1,
  } as Partial<ConsultaDaUrl>);
}

/** Quantos filtros estão em uso, para o rótulo "Filtros · 2" no celular. */
export function quantosFiltros(consulta: ConsultaDaUrl): number {
  return (
    consulta.escolaridades.length +
    consulta.situacoes.length +
    consulta.bancas.length +
    consulta.esferas.length +
    (consulta.uf ? 1 : 0) +
    (consulta.salarioMin ? 1 : 0) +
    (consulta.salarioMax ? 1 : 0)
  );
}
