import { describe, expect, it } from "vitest";
import { aplicarConsulta } from "./buscaLocal";
import { contagensDeFaceta, listarConcursos, paraALista } from "./concursos";
import { filtrar } from "./consulta";
import { CONSULTA_VAZIA, filtroDaConsulta, type ConsultaDaUrl } from "./parametros";
import { CONCURSOS } from "@/mocks/concursos";

const HOJE = new Date("2026-09-24T12:00:00");
const TERMOS = ["a", "auxiliar", "professor"];
const RECORTES: Partial<ConsultaDaUrl>[] = [
  {},
  { situacoes: ["abertas"] },
  { ordem: "salario", pagina: 2 },
  { uf: "SP" },
  { escolaridades: ["superior"], salarioMin: 3000 },
  { situacoes: ["previstos", "encerrados"], ordem: "vagas" },
];

function combinacoes() {
  return TERMOS.flatMap((termo) =>
    RECORTES.map((recorte) => ({
      termo,
      consulta: { ...CONSULTA_VAZIA, ...recorte, q: termo } as ConsultaDaUrl,
    })),
  );
}

describe("aplicarConsulta", () => {
  it("dá a mesma página que o servidor dá para a mesma consulta", async () => {
    for (const { termo, consulta } of combinacoes()) {
      // Sobre a lista enxuta, que é a que viaja: o que ela tirou não pode
      // mudar quem entra, a ordem nem a página.
      const { resultado } = aplicarConsulta(
        paraALista(filtrar(CONCURSOS, { q: termo })),
        consulta,
        HOJE,
      );
      const servidor = await listarConcursos(
        { ...filtroDaConsulta(consulta), ordem: consulta.ordem, pagina: consulta.pagina },
        HOJE,
      );
      expect(resultado.itens.map((c) => c.slug), JSON.stringify(consulta)).toEqual(
        servidor.itens.map((c) => c.slug),
      );
      expect(resultado.itens, JSON.stringify(consulta)).toEqual(paraALista(servidor.itens));
      expect({ ...resultado, itens: [] }).toEqual({ ...servidor, itens: [] });
    }
  });

  // O servidor lista toda banca e escolaridade do acervo; o navegador só as
  // do termo, porque as outras dariam zero sempre. O número de cada opção que
  // aparece nas duas é o mesmo.
  it("a contagem de cada opção é a do servidor", async () => {
    for (const { termo, consulta } of combinacoes()) {
      const { contagens } = aplicarConsulta(
        paraALista(filtrar(CONCURSOS, { q: termo })),
        consulta,
        HOJE,
      );
      const servidor = await contagensDeFaceta(filtroDaConsulta(consulta), HOJE);
      for (const dimensao of ["situacoes", "escolaridades", "bancas"] as const) {
        for (const opcao of contagens[dimensao]) {
          const la = servidor[dimensao].find((outra) => outra.valor === opcao.valor);
          expect(la?.total, `${dimensao}=${opcao.valor} em ${JSON.stringify(consulta)}`).toBe(opcao.total);
        }
      }
    }
  });

  it("o termo da consulta não filtra de novo: a lista já é a do termo", () => {
    const consulta = { ...CONSULTA_VAZIA, q: "texto que não existe em lugar nenhum" };
    expect(aplicarConsulta(CONCURSOS.slice(0, 3), consulta, HOJE).resultado.total).toBe(3);
  });
});
