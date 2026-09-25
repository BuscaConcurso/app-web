import { describe, expect, it, vi } from "vitest";
import {
  MENSAGEM_FALHA_AO_COPIAR,
  MENSAGEM_LINK_COPIADO,
  resolverCompartilhamento,
} from "./useCompartilhar";

const DADOS = { titulo: "Edital nº 51/2026", url: "https://buscaconcurso.com.br/concursos/x" };

describe("resolverCompartilhamento", () => {
  it("com navigator.share, abre a folha nativa e não avisa nada", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const aviso = await resolverCompartilhamento({ share }, DADOS);
    expect(share).toHaveBeenCalledWith({ title: DADOS.titulo, url: DADOS.url });
    expect(aviso).toBeNull();
  });

  it("sem share, com clipboard funcionando, avisa link copiado", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const aviso = await resolverCompartilhamento({ clipboard: { writeText } }, DADOS);
    expect(writeText).toHaveBeenCalledWith(DADOS.url);
    expect(aviso).toBe(MENSAGEM_LINK_COPIADO);
  });

  it("sem share e sem clipboard, avisa a falha", async () => {
    const aviso = await resolverCompartilhamento({}, DADOS);
    expect(aviso).toBe(MENSAGEM_FALHA_AO_COPIAR);
  });

  it("com clipboard.writeText rejeitando, avisa a falha em vez de estourar", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("sem permissão"));
    const aviso = await resolverCompartilhamento({ clipboard: { writeText } }, DADOS);
    expect(aviso).toBe(MENSAGEM_FALHA_AO_COPIAR);
  });

  it("com navigator.share cancelado (AbortError), não avisa nada", async () => {
    const erro = new DOMException("A pessoa cancelou", "AbortError");
    const share = vi.fn().mockRejectedValue(erro);
    const aviso = await resolverCompartilhamento({ share }, DADOS);
    expect(aviso).toBeNull();
  });
});
