/**
 * A escolha de tema, guardada entre visitas.
 *
 * A fonte da verdade no cliente é o atributo `data-tema` do `html`, que o
 * script embutido no `head` já escreveu antes da primeira pintura. Guardar o
 * valor duas vezes, aqui e lá, daria duas versões da mesma coisa; ler dali
 * mantém uma só.
 *
 * O CSS trata a ausência do atributo como "sistema", então a página está
 * certa mesmo se este módulo nunca carregar.
 */
export type Tema = "claro" | "escuro" | "sistema";

export const TEMAS: Tema[] = ["claro", "escuro", "sistema"];

export const CHAVE_TEMA = "buscaconcurso.tema";

const ouvintes = new Set<() => void>();

function valido(valor: string | undefined): Tema {
  return valor === "claro" || valor === "escuro" ? valor : "sistema";
}

export function assinarTema(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function temaAtual(): Tema {
  return valido(document.documentElement.dataset.tema);
}

/** No servidor não dá para saber; "sistema" é o padrão e o que o CSS assume. */
export function temaNoServidor(): Tema {
  return "sistema";
}

export function definirTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema;
  try {
    if (tema === "sistema") window.localStorage.removeItem(CHAVE_TEMA);
    else window.localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Armazenamento bloqueado: vale para esta navegação e pronto.
  }
  for (const ouvinte of ouvintes) ouvinte();
}

/**
 * O script que roda antes da primeira pintura.
 *
 * Precisa ser síncrono e estar no `head`: qualquer coisa depois disso já
 * pintou a página no tema errado para quem escolheu o contrário do sistema.
 * É curto de propósito, porque bloqueia a renderização.
 */
export const SCRIPT_DO_TEMA = `try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)});document.documentElement.dataset.tema=t==="claro"||t==="escuro"?t:"sistema"}catch(e){document.documentElement.dataset.tema="sistema"}`;
