/**
 * A régua da linha do tempo: em que ordem os eventos entram nela e onde cada
 * um cai em relação a hoje.
 *
 * Fica aqui, e não no componente, porque é a única parte da linha do tempo
 * que dá para provar sem navegador — a suíte deste repositório é Node sem
 * DOM. O componente desenha; este módulo decide.
 */
import type { EventoDoCronograma } from "./dominio";

/**
 * A data que representa o evento na linha, e a data em que ele termina.
 *
 * São duas porque o acervo tem evento só com `fim` — `pagamento_taxa` com
 * `inicio: null` e `fim: "2026-06-29"` aparece 86 vezes — e evento com faixa,
 * como `pedido_isencao` de 09/06 a 18/06. Um ponto na linha precisa de um
 * começo para se posicionar e de um fim para saber se já passou.
 */
function comeco(evento: EventoDoCronograma): string | null {
  const a = evento.inicio ?? evento.fim;
  const b = evento.fim ?? evento.inicio;
  if (!a || !b) return a ?? b ?? null;
  return a < b ? a : b;
}

function termino(evento: EventoDoCronograma): string | null {
  const a = evento.inicio ?? evento.fim;
  const b = evento.fim ?? evento.inicio;
  if (!a || !b) return a ?? b ?? null;
  return a > b ? a : b;
}

/**
 * A ordem em que os eventos descem a linha.
 *
 * A lista antiga confiava na ordem da API e dizia, em comentário, que era
 * "por data, com o que não tem data no fim". Medido no acervo inteiro, não
 * é: em **18 dos 4.479 concursos com cronograma** a sequência não sobe. A
 * causa é sempre a mesma, e é uma divergência de chave — a API ordena por
 * `inicio`, e a tela mostra `inicio ?? fim`, então todo evento com `inicio`
 * nulo e `fim` preenchido era empurrado para o fim da lista com uma data
 * visível no meio do período. Numa lista isso passava; numa linha do tempo é
 * uma seta apontando para trás.
 *
 * Então a tela passa a ordenar pela mesma data que exibe. Quem não tem data
 * nenhuma (1.197 dos 10.608 eventos, 11,3%) vai para o fim: não há onde
 * colocá-lo entre dois dias, e inventar um lugar seria afirmar uma ordem que
 * o ato não disse.
 *
 * **Empate fica como a API mandou.** São 547 pares consecutivos com a mesma
 * data, em 451 concursos — "prova prática" e "prova de títulos" no mesmo dia,
 * "resultado final" e "convocação" no mesmo dia. `Array.prototype.sort` é
 * estável desde a ES2019, então a ordem relativa do empate é a que veio do
 * motor, que leu o ato na sequência em que ele está escrito.
 */
export function ordenarEventos(
  eventos: EventoDoCronograma[],
): EventoDoCronograma[] {
  return [...eventos].sort((a, b) => {
    const da = comeco(a);
    const db = comeco(b);
    if (da === db) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    // `AAAA-MM-DD` compara como texto na mesma ordem em que compara como
    // data. É por isso que nada aqui vira `Date`.
    return da < db ? -1 : 1;
  });
}

/**
 * Onde o evento cai em relação a hoje.
 *
 * `hoje` entra como `AAAA-MM-DD` e não como `Date` porque a pergunta é de
 * calendário brasileiro, não de instante: ver `hojeEmSaoPaulo`.
 */
export type FaseDoEvento = "passado" | "hoje" | "futuro" | "sem-data";

export function faseDoEvento(
  evento: EventoDoCronograma,
  hoje: string,
): FaseDoEvento {
  const de = comeco(evento);
  const ate = termino(evento);
  if (!de || !ate) return "sem-data";
  if (ate < hoje) return "passado";
  if (de > hoje) return "futuro";
  // Sobra o dia de hoje e a faixa que o contém: "inscrições de 09/09 a 29/09"
  // com hoje em 14/09 está acontecendo agora, e é o que a pessoa veio ver.
  return "hoje";
}

/**
 * O índice onde entra a marca de "hoje" — o degrau entre o que já aconteceu e
 * o que ainda vai acontecer —, ou `null` quando ela não teria o que separar.
 *
 * Só aparece quando existem os dois lados. Medido no acervo: 200 dos 4.479
 * concursos com cronograma (4,5%) têm passado e futuro ao mesmo tempo; 90,1%
 * são só passado e 0,5% só futuro, e nesses a marca ficaria encostada numa
 * ponta sem separar coisa nenhuma. Quando algum evento está acontecendo hoje
 * (39 concursos), quem diz isso é o próprio ponto do evento, e a marca some
 * para não dizer duas vezes.
 */
export function indiceDaMarcaDeHoje(
  eventos: EventoDoCronograma[],
  hoje: string,
): number | null {
  const fases = eventos.map((evento) => faseDoEvento(evento, hoje));
  if (fases.includes("hoje")) return null;
  const primeiroFuturo = fases.indexOf("futuro");
  if (primeiroFuturo <= 0) return null;
  return fases.slice(0, primeiroFuturo).includes("passado")
    ? primeiroFuturo
    : null;
}
