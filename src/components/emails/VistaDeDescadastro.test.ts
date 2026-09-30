import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { EstadoDoDescadastro } from "@/lib/preferenciasDeEmail";
import { VistaDeDescadastro } from "./VistaDeDescadastro";

function html(estado: EstadoDoDescadastro) {
  return renderToStaticMarkup(
    createElement(VistaDeDescadastro, { estado, aoConfirmar: () => {}, aoDesfazer: () => {} }),
  );
}

describe("VistaDeDescadastro", () => {
  it("antes do clique pergunta, com o botão de parar e sem dizer que parou", () => {
    const pagina = html("pergunta");
    expect(pagina).toContain("Parar os lembretes por e-mail?");
    expect(pagina).toContain(">Parar os lembretes</button>");
    expect(pagina).toContain("Os e-mails da conta continuam.");
    expect(pagina).not.toContain("Pronto");
    expect(pagina).toContain("Esta página abre pelo link do e-mail, sem precisar entrar na conta.");
  });

  it("enviando desabilita o botão", () => {
    expect(html("enviando")).toMatch(/<button[^>]*disabled=""[^>]*>Parando…<\/button>/u);
  });

  it("falha volta à pergunta com o aviso", () => {
    const pagina = html("falhou");
    expect(pagina).toContain("Parar os lembretes por e-mail?");
    expect(pagina).toContain("Não deu para parar agora. Tente de novo.");
  });

  it("pronto: confirma, oferece desfazer e as preferências", () => {
    const pagina = html("pronto");
    expect(pagina).toContain("Pronto: os lembretes por e-mail não chegam mais.");
    expect(pagina).toContain("Desfazer, quero continuar recebendo");
    expect(pagina).toContain('href="/conta#avisos"');
    expect(pagina).toContain("Ajustar todas as preferências");
    expect(pagina).toContain('role="status"');
  });

  it("falha ao desfazer continua no pronto, com o aviso", () => {
    const pagina = html("falhouAoDesfazer");
    expect(pagina).toContain("Desfazer, quero continuar recebendo");
    expect(pagina).toContain("Não deu para desfazer agora. Tente de novo.");
  });

  it("desfeito: os lembretes voltam", () => {
    const pagina = html("reativado");
    expect(pagina).toContain("Lembretes de volta.");
    expect(pagina).toContain("Os avisos dos concursos salvos voltam a chegar, como antes.");
    expect(pagina).toContain('href="/concursos"');
    expect(pagina).not.toContain("Desfazer");
  });

  it("token inválido: mensagem neutra e o caminho para entrar na conta", () => {
    const pagina = html("invalido");
    expect(pagina).toContain("Este link não vale mais.");
    expect(pagina).toContain('href="/entrar?retorno=%2Fconta%23avisos"');
    expect(pagina).not.toContain("<button");
  });
});
