/**
 * Eventos de analítica declarados no HTML, com atributos `data-analitica-*`.
 *
 * Existe para os componentes de servidor: o botão de inscrição e os links
 * da coluna de filtros são desenhados no servidor, e um `onClick` ali os
 * obrigaria a virar componente de cliente. Em vez disso, o elemento leva
 * os atributos (`atributosDeAnalitica`), e um ouvinte só, no layout
 * (`OuvinteDeAnalitica`), lê o evento do elemento clicado ou do formulário
 * enviado (`eventoDoElemento`) e o registra.
 *
 * Só os eventos desta lista: o atributo vem do HTML, e HTML é texto que
 * qualquer extensão do navegador pode mexer.
 */
import type { EventoDeAnalitica } from "./analitica";

const EVENTOS_NA_PAGINA = ["inscricao_clicada", "filtro_aplicado"] as const satisfies readonly EventoDeAnalitica[];

type EventoNaPagina = (typeof EVENTOS_NA_PAGINA)[number];

const PREFIXO = "analitica";

export function atributosDeAnalitica(
  evento: EventoNaPagina,
  propriedades: Record<string, string | null | undefined>,
): Record<string, string> {
  const atributos: Record<string, string> = { [`data-${PREFIXO}`]: evento };
  for (const [nome, valor] of Object.entries(propriedades)) {
    if (valor) atributos[`data-${PREFIXO}-${nome}`] = valor;
  }
  return atributos;
}

/** O evento de um elemento, pelo `dataset` dele, ou `null` se não há um válido. */
export function eventoDoElemento(
  dataset: DOMStringMap,
): { evento: EventoNaPagina; propriedades: Record<string, string> } | null {
  const evento = dataset[PREFIXO];
  if (!evento || !(EVENTOS_NA_PAGINA as readonly string[]).includes(evento)) return null;
  const propriedades: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(dataset)) {
    if (chave.length <= PREFIXO.length || !chave.startsWith(PREFIXO) || valor === undefined) continue;
    const resto = chave.slice(PREFIXO.length);
    propriedades[resto[0]!.toLowerCase() + resto.slice(1)] = valor;
  }
  return { evento: evento as EventoNaPagina, propriedades };
}
