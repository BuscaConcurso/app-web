import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Calendario, tomDoCalendario } from "./Calendario";

const HOJE = new Date(2026, 8, 24);

describe("Calendario", () => {
  it("hoje é urucum, amanhã é ouro, depois é verde", () => {
    expect(tomDoCalendario("2026-09-24", HOJE)).toBe("urucum");
    expect(tomDoCalendario("2026-09-25", HOJE)).toBe("ouro");
    expect(tomDoCalendario("2026-09-30", HOJE)).toBe("verde");
  });

  it("mostra mês abreviado em caixa alta e o dia", () => {
    const html = renderToStaticMarkup(createElement(Calendario, { iso: "2026-09-25", hoje: HOJE }));
    expect(html).toContain("SET");
    expect(html).toContain(">25<");
  });
});
