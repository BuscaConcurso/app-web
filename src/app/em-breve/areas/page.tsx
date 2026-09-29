import { permanentRedirect } from "next/navigation";

/**
 * "Concursos por área" era um recurso em breve e agora tem página própria.
 * O endereço antigo continua valendo (link salvo, página já indexada) e leva
 * a `/areas` com 308.
 *
 * Uma rota própria, e não um caso dentro de `[recurso]`: segmento estático
 * vence o dinâmico, e a página genérica do "em breve" não precisa saber de
 * recurso que deixou de ser.
 */
export default function EmBreveAreas() {
  permanentRedirect("/areas");
}
