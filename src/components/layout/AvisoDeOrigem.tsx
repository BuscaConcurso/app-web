import type { OrigemDoAcervo } from "@/lib/concursos";

/**
 * A faixa que diz quando o que está na tela não é o acervo de verdade.
 *
 * Existe por um caso real desta integração: a API do engine foi reiniciada,
 * demorou a subir, e a tela mostrou "Prefeitura de Curitiba, banca AOCP,
 * Curitiba PR" — o mock — sem nenhum sinal. Quem estava olhando, e sabia da
 * existência do mock, quase relatou aquilo como dado do acervo. Sem a faixa,
 * uma API fora do ar é indistinguível de um acervo pequeno, e o aviso que
 * existia estava no terminal de quem roda o servidor, não na tela de quem
 * olha.
 *
 * A reserva continua: o app funciona sem o engine, de propósito. O que muda é
 * que ele passa a dizer.
 *
 * Nada aparece quando a origem é a API — página limpa é a afirmação de que o
 * dado é real, e ela precisa continuar valendo alguma coisa.
 */
export function AvisoDeOrigem({ origem }: { origem: OrigemDoAcervo }) {
  if (origem === "api") return null;

  const falhou = origem === "falha";

  return (
    <div
      role="status"
      className={`px-4 py-2.5 text-center text-[13px] leading-5 sm:px-6 ${
        falhou
          ? "bg-urgente-chip text-urucum-texto"
          : "bg-previsto-chip text-ouro-sinal-texto"
      }`}
    >
      <strong className="font-semibold">
        {falhou
          ? "A API do engine não respondeu."
          : "Acervo de demonstração."}
      </strong>{" "}
      {falhou
        ? "O que está na tela é o acervo de demonstração, não o acervo real: os concursos abaixo são inventados. Suba a API com `bc api` no repositório engine."
        : "`BC_API_URL` não está configurada, então os concursos abaixo são exemplos, não o acervo do engine."}
    </div>
  );
}
