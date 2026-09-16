import { describe, expect, it } from "vitest";
import {
  faseDoEvento,
  indiceDaMarcaDeHoje,
  ordenarEventos,
} from "./cronograma";
import type { EventoDoCronograma, EventoTipo } from "./dominio";

function evento(
  tipo: EventoTipo,
  inicio: string | null,
  fim: string | null = null,
): EventoDoCronograma {
  return {
    tipo,
    ato: null,
    inicio,
    fim,
    hora: null,
    localidades: [],
    observacao: null,
    evidencia: null,
  };
}

const HOJE = "2026-09-14";

describe("ordenarEventos", () => {
  it("ordena pela data que a tela mostra, e não só por `inicio`", () => {
    // O caso real dos 18 concursos fora de ordem: a API manda o evento sem
    // `inicio` no fim da lista, mas ele tem `fim` e aparece datado na tela.
    const eventos = [
      evento("inicio_inscricao", "2026-06-09"),
      evento("fim_inscricao", "2026-06-22"),
      evento("pagamento_taxa", null, "2026-06-23"),
    ];
    expect(ordenarEventos(eventos).map((e) => e.tipo)).toEqual([
      "inicio_inscricao",
      "fim_inscricao",
      "pagamento_taxa",
    ]);

    const foraDeOrdem = [
      evento("prova_objetiva", "2026-08-02"),
      evento("pagamento_taxa", null, "2026-06-23"),
      evento("inicio_inscricao", "2026-06-09"),
    ];
    expect(ordenarEventos(foraDeOrdem).map((e) => e.tipo)).toEqual([
      "inicio_inscricao",
      "pagamento_taxa",
      "prova_objetiva",
    ]);
  });

  it("manda para o fim quem não tem data nenhuma", () => {
    const eventos = [
      evento("publicacao_edital", null),
      evento("inicio_inscricao", "2026-06-09"),
      evento("prova_titulos", null),
      evento("fim_inscricao", "2026-06-22"),
    ];
    expect(ordenarEventos(eventos).map((e) => e.tipo)).toEqual([
      "inicio_inscricao",
      "fim_inscricao",
      "publicacao_edital",
      "prova_titulos",
    ]);
  });

  it("mantém a ordem do motor no empate de data", () => {
    const eventos = [
      evento("prova_pratica", "2026-06-18", "2026-06-19"),
      evento("resultado_final", "2026-06-19"),
      evento("prova_titulos", "2026-06-19"),
      evento("convocacao", "2026-06-19"),
    ];
    expect(ordenarEventos(eventos).map((e) => e.tipo)).toEqual([
      "prova_pratica",
      "resultado_final",
      "prova_titulos",
      "convocacao",
    ]);
  });

  it("não mexe no array recebido", () => {
    const eventos = [
      evento("homologacao", "2026-10-08"),
      evento("publicacao_edital", "2026-04-15"),
    ];
    ordenarEventos(eventos);
    expect(eventos.map((e) => e.tipo)).toEqual([
      "homologacao",
      "publicacao_edital",
    ]);
  });
});

describe("faseDoEvento", () => {
  it("separa passado, hoje e futuro pela data civil", () => {
    expect(faseDoEvento(evento("prova_objetiva", "2026-09-13"), HOJE)).toBe(
      "passado",
    );
    expect(faseDoEvento(evento("prova_objetiva", "2026-09-14"), HOJE)).toBe(
      "hoje",
    );
    expect(faseDoEvento(evento("prova_objetiva", "2026-09-15"), HOJE)).toBe(
      "futuro",
    );
  });

  it("o período que contém hoje está acontecendo agora", () => {
    const inscricoes = evento("inicio_inscricao", "2026-09-09", "2026-09-29");
    expect(faseDoEvento(inscricoes, HOJE)).toBe("hoje");
    expect(faseDoEvento(evento("pedido_isencao", "2026-09-01", "2026-09-13"), HOJE)).toBe(
      "passado",
    );
  });

  it("usa `fim` quando só ele veio", () => {
    expect(faseDoEvento(evento("pagamento_taxa", null, "2026-09-13"), HOJE)).toBe(
      "passado",
    );
    expect(faseDoEvento(evento("pagamento_taxa", null, "2026-09-20"), HOJE)).toBe(
      "futuro",
    );
  });

  it("sem data nenhuma não tem fase", () => {
    expect(faseDoEvento(evento("publicacao_edital", null), HOJE)).toBe(
      "sem-data",
    );
  });
});

describe("indiceDaMarcaDeHoje", () => {
  it("marca o degrau entre o que passou e o que vem", () => {
    const eventos = [
      evento("publicacao_edital", "2026-08-01"),
      evento("inicio_inscricao", "2026-09-01"),
      evento("fim_inscricao", "2026-09-30"),
      evento("prova_objetiva", "2026-11-29"),
    ];
    expect(indiceDaMarcaDeHoje(eventos, HOJE)).toBe(2);
  });

  it("não aparece quando só há passado, só há futuro, ou não há data", () => {
    expect(
      indiceDaMarcaDeHoje(
        [evento("publicacao_edital", "2026-04-15"), evento("homologacao", "2026-08-01")],
        HOJE,
      ),
    ).toBeNull();
    expect(
      indiceDaMarcaDeHoje(
        [evento("inicio_inscricao", "2026-10-01"), evento("fim_inscricao", "2026-10-20")],
        HOJE,
      ),
    ).toBeNull();
    expect(indiceDaMarcaDeHoje([evento("publicacao_edital", null)], HOJE)).toBeNull();
  });

  it("cala quando um evento está acontecendo hoje: o ponto já diz", () => {
    const eventos = [
      evento("publicacao_edital", "2026-08-01"),
      evento("inicio_inscricao", "2026-09-09", "2026-09-29"),
      evento("prova_objetiva", "2026-11-29"),
    ];
    expect(indiceDaMarcaDeHoje(eventos, HOJE)).toBeNull();
  });
});
