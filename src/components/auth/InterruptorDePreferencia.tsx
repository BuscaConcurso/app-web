/**
 * O interruptor de uma preferência de e-mail em `/conta#avisos`, 52x32 como
 * no artboard `Preferencias`. `role="switch"` porque liga e desliga na hora,
 * sem formulário; o nome acessível vem do título do cartão (`rotuladoPor`).
 * Antes de saber o valor (`ligado` nulo) não há switch nenhum: um
 * `aria-checked="false"` provisório seria anunciado como "desligado".
 */
export function InterruptorDePreferencia({
  ligado,
  rotuladoPor,
  desabilitado = false,
  aoAlternar,
}: {
  ligado: boolean | null;
  rotuladoPor: string;
  desabilitado?: boolean;
  aoAlternar: () => void;
}) {
  if (ligado === null) {
    return (
      <span aria-busy="true" className="inline-flex h-8 w-[3.25rem] shrink-0 animate-pulse rounded-full bg-linha">
        <span className="sr-only">Carregando a preferência</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-labelledby={rotuladoPor}
      disabled={desabilitado}
      onClick={aoAlternar}
      className={`relative inline-flex h-8 w-[3.25rem] shrink-0 rounded-full p-[3px] transition-colors disabled:cursor-wait disabled:opacity-60 ${
        ligado ? "bg-acao" : "bg-linha"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-[1.625rem] rounded-full bg-cartao shadow transition-transform ${
          ligado ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
