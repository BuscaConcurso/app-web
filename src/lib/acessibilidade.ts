/**
 * Alto contraste e tamanho da fonte, guardados entre visitas.
 *
 * A fonte da verdade no cliente são os atributos `data-contraste` e
 * `data-fonte` do `html`, que o script embutido no `head` já escreveu antes da
 * primeira pintura. Guardar o valor duas vezes, aqui e lá, daria duas versões
 * da mesma coisa; ler dali mantém uma só.
 *
 * O CSS trata a ausência dos atributos como o padrão (contraste normal, fonte
 * em 100%), então a página está certa mesmo se este módulo nunca carregar.
 */

export const CHAVE_CONTRASTE = "buscaconcurso.contraste";
export const CHAVE_FONTE = "buscaconcurso.fonte";

/**
 * Os degraus da fonte, relativos ao padrão: cada um vira um `font-size` no
 * `html` em `globals.css`, e como todo tamanho de texto do site é `rem`, o
 * site inteiro acompanha. Um degrau abaixo e três acima: diminuir muito
 * derruba a leitura, e aumentar além de 137,5% é o zoom do navegador que faz
 * melhor, porque reflui a página junto.
 */
export const FONTE_MINIMA = -1;
export const FONTE_MAXIMA = 3;

const ouvintes = new Set<() => void>();

function avisar(): void {
  for (const ouvinte of ouvintes) ouvinte();
}

function guardar(chave: string, valor: string | null): void {
  try {
    if (valor === null) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, valor);
  } catch {
    // Armazenamento bloqueado: vale para esta navegação e pronto.
  }
}

/** Converte o valor cru (do atributo ou do armazenamento) num degrau válido. */
export function degrauDaFonte(valor: string | null | undefined): number {
  const numero = Number(valor);
  if (!Number.isInteger(numero)) return 0;
  return Math.min(FONTE_MAXIMA, Math.max(FONTE_MINIMA, numero));
}

export function assinarAcessibilidade(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function contrasteAltoAtual(): boolean {
  return document.documentElement.dataset.contraste === "alto";
}

export function fonteAtual(): number {
  return degrauDaFonte(document.documentElement.dataset.fonte);
}

/** No servidor não dá para saber; o padrão é o que o CSS assume. */
export function contrasteAltoNoServidor(): boolean {
  return false;
}

export function fonteNoServidor(): number {
  return 0;
}

export function definirContrasteAlto(alto: boolean): void {
  const raiz = document.documentElement;
  if (alto) raiz.dataset.contraste = "alto";
  else delete raiz.dataset.contraste;
  guardar(CHAVE_CONTRASTE, alto ? "alto" : null);
  avisar();
}

export function definirFonte(degrau: number): void {
  const valido = degrauDaFonte(String(degrau));
  const raiz = document.documentElement;
  if (valido === 0) delete raiz.dataset.fonte;
  else raiz.dataset.fonte = String(valido);
  guardar(CHAVE_FONTE, valido === 0 ? null : String(valido));
  avisar();
}

/**
 * O script que roda antes da primeira pintura.
 *
 * Precisa ser síncrono e estar no `head`: qualquer coisa depois disso já
 * pintou a página nas cores e no tamanho errados para quem escolheu outro.
 * É curto de propósito, porque bloqueia a renderização. O degrau é conferido
 * contra a mesma faixa de `degrauDaFonte`: o `localStorage` é editável por
 * quem quiser.
 */
export const SCRIPT_DE_ACESSIBILIDADE = `try{var r=document.documentElement,c=localStorage.getItem(${JSON.stringify(
  CHAVE_CONTRASTE,
)}),f=Number(localStorage.getItem(${JSON.stringify(
  CHAVE_FONTE,
)}));if(c==="alto")r.dataset.contraste="alto";if(Number.isInteger(f)&&f!==0&&f>=${FONTE_MINIMA}&&f<=${FONTE_MAXIMA})r.dataset.fonte=String(f)}catch(e){}`;
