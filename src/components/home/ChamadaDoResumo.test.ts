import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChamadaDoResumo } from "./ChamadaDoResumo";

const html = (logado: boolean, compacto = false) =>
  renderToStaticMarkup(createElement(ChamadaDoResumo, { logado, compacto }));

describe("ChamadaDoResumo", () => {
  it("fala do resumo semanal, sem formulário nem alerta", () => {
    const bloco = html(false);
    expect(bloco).toContain("RESUMO SEMANAL");
    expect(bloco).toContain("Os concursos da sua área, toda segunda no seu e-mail.");
    expect(bloco).toContain("Um e-mail por semana");
    expect(bloco).not.toContain("<input");
    expect(bloco).not.toContain("<form");
    expect(bloco).not.toContain("Criar alerta");
    expect(bloco).not.toContain("Em breve");
  });

  it("sem sessão: cria a conta com retorno às preferências, ou entra", () => {
    const bloco = html(false);
    expect(bloco).toMatch(/href="\/cadastrar\?retorno=%2Fconta%23avisos"[^>]*>Criar conta e receber</u);
    expect(bloco).toContain('href="/entrar?retorno=%2Fconta%23avisos"');
  });

  it("com sessão: liga o resumo nas preferências", () => {
    const bloco = html(true);
    expect(bloco).toMatch(/href="\/conta#avisos"[^>]*>Ligar o resumo semanal</u);
    expect(bloco).not.toContain("/cadastrar");
  });

  it("compacto: o mesmo título e botão, sem as garantias", () => {
    const bloco = html(true, true);
    expect(bloco).toContain("Os concursos da sua área, toda segunda no seu e-mail.");
    expect(bloco).toContain('href="/conta#avisos"');
    expect(bloco).not.toContain("Cancele com um clique");
  });
});
