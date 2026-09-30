import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { EstadoDoDescadastro, TipoDeEmail } from "@/lib/preferenciasDeEmail";
import { VistaDeDescadastro } from "./VistaDeDescadastro";

function html(estado: EstadoDoDescadastro, tipo: TipoDeEmail = "lembretes") {
  return renderToStaticMarkup(
    createElement(VistaDeDescadastro, { estado, tipo, aoConfirmar: () => {}, aoDesfazer: () => {} }),
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

  describe("resumo semanal (tipo=resumo)", () => {
    it("pergunta pelo resumo, sem falar de lembretes", () => {
      const pagina = html("pergunta", "resumo");
      expect(pagina).toContain("Cancelar o resumo semanal?");
      expect(pagina).toContain("o e-mail das segundas com os concursos da semana");
      expect(pagina).toContain(">Cancelar o resumo</button>");
      expect(pagina).not.toContain("lembrete");
    });

    it("enviando e falha", () => {
      expect(html("enviando", "resumo")).toMatch(/<button[^>]*disabled=""[^>]*>Cancelando…<\/button>/u);
      expect(html("falhou", "resumo")).toContain("Não deu para cancelar agora. Tente de novo.");
    });

    it("religar só na conta: troca o desfazer por entrar", () => {
      const pagina = html("religarNaConta", "resumo");
      expect(pagina).toContain("Pronto: o resumo semanal não chega mais.");
      expect(pagina).toContain("Para voltar a receber o resumo, entre na sua conta.");
      expect(pagina).toMatch(/href="\/entrar\?retorno=%2Fconta%23avisos"[^>]*>Entrar para religar</u);
      expect(pagina).not.toContain("Desfazer");
    });

    it("pronto e desfeito", () => {
      const pronto = html("pronto", "resumo");
      expect(pronto).toContain("Pronto: o resumo semanal não chega mais.");
      expect(pronto).toContain("Os outros e-mails continuam como estão.");
      expect(pronto).toContain("Desfazer, quero continuar recebendo");
      const reativado = html("reativado", "resumo");
      expect(reativado).toContain("Resumo de volta.");
      expect(reativado).toContain("O resumo volta a chegar às segundas, como antes.");
    });
  });
});
