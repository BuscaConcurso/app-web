import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterruptorDePreferencia } from "./InterruptorDePreferencia";

function html(props: { ligado: boolean; desabilitado?: boolean }) {
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

  it("enquanto carrega fica desabilitado", () => {
    expect(html({ ligado: true, desabilitado: true })).toContain('disabled=""');
    expect(html({ ligado: true })).not.toContain('disabled=""');
  });
});
