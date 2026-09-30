/**
 * Para onde leva a chamada do resumo semanal (o bloco amarelo da home e da
 * lateral do concurso). A adesão é na conta, com e-mail confirmado (spec do
 * resumo semanal, §8): com sessão, direto às preferências; sem, o cadastro,
 * que volta às preferências, e a opção de entrar para quem já tem conta.
 */
const PREFERENCIAS = "/conta#avisos";
const RETORNO = `retorno=${encodeURIComponent(PREFERENCIAS)}`;

export interface DestinoDaChamada {
  href: string;
  rotulo: string;
  /** Só sem sessão: o link de entrar, para quem já tem conta. */
  entrar: string | null;
}

export function destinoDaChamada(logado: boolean): DestinoDaChamada {
  return logado
    ? { href: PREFERENCIAS, rotulo: "Ligar o resumo semanal", entrar: null }
    : { href: `/cadastrar?${RETORNO}`, rotulo: "Criar conta e receber", entrar: `/entrar?${RETORNO}` };
}
