import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterruptorDePreferencia } from "./InterruptorDePreferencia";

function html(props: { ligado: boolean | null; desabilitado?: boolean }) {
  return renderToStaticMarkup(
    createElement(InterruptorDePreferencia, { rotuladoPor: "t-lembretes", aoAlternar: () => {}, ...props }),
  );
}

describe("InterruptorDePreferencia", () => {
  it("é um switch rotulado pelo título do cartão", () => {
    const ligado = html({ ligado: true });
    expect(ligado).toMatch(/^<button/u);
    expect(ligado).toContain('role="switch"');
    expect(ligado).toContain('aria-checked="true"');
    expect(ligado).toContain('aria-labelledby="t-lembretes"');
    expect(html({ ligado: false })).toContain('aria-checked="false"');
  });

  it("salvando fica desabilitado", () => {
    expect(html({ ligado: true, desabilitado: true })).toContain('disabled=""');
    expect(html({ ligado: true })).not.toContain('disabled=""');
  });

  it("antes de saber o valor não é um switch: nada de anunciar desligado", () => {
    const carregando = html({ ligado: null });
    expect(carregando).not.toContain("aria-checked");
    expect(carregando).not.toContain('role="switch"');
    expect(carregando).toContain('aria-busy="true"');
    expect(carregando).toContain("Carregando a preferência");
  });
});
