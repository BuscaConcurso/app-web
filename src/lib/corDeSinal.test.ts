import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `urucum`, `verde` e `anil` puros são cores de SUPERFÍCIE (fundo de botão,
 * ponto, barra). Como texto eles não passam 4.5:1 no tema escuro, onde o
 * fundo escurece e eles não clareiam: o texto dessas cores usa os tokens
 * `-texto` (`text-urucum-texto`, `text-verde-texto`, `text-anil-texto`),
 * medidos em `contraste.test.ts`.
 *
 * Esta varredura acha `text-urucum`, `text-verde` e `text-anil` sem sufixo em
 * qualquer `.tsx` de `src/`. Um ícone puramente decorativo que precise da cor
 * cheia pode escapar com o comentário `cor-de-sinal-decorativa` na mesma
 * linha.
 */
const RAIZ = join(process.cwd(), "src");
const PROIBIDO = /\btext-(urucum|verde|anil)(?![-\w])/;
const ESCAPE = "cor-de-sinal-decorativa";

function arquivosTsx(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosTsx(caminho);
    return nome.endsWith(".tsx") ? [caminho] : [];
  });
}

describe("cor de sinal como texto", () => {
  it("nenhum .tsx usa text-urucum, text-verde ou text-anil sem o sufixo -texto", () => {
    const achados = arquivosTsx(RAIZ).flatMap((arquivo) =>
      readFileSync(arquivo, "utf8")
        .split("\n")
        .map((linha, indice) => ({ linha, numero: indice + 1 }))
        .filter(({ linha }) => PROIBIDO.test(linha) && !linha.includes(ESCAPE))
        .map(({ linha, numero }) => `${relative(RAIZ, arquivo)}:${numero}: ${linha.trim()}`),
    );
    expect(achados).toEqual([]);
  });

  it("a expressão pega o token puro e deixa passar os derivados", () => {
    expect(PROIBIDO.test('className="text-urucum"')).toBe(true);
    expect(PROIBIDO.test("text-verde shrink-0")).toBe(true);
    expect(PROIBIDO.test("text-urucum-texto")).toBe(false);
    expect(PROIBIDO.test("text-verde-texto")).toBe(false);
    expect(PROIBIDO.test("text-anil-texto")).toBe(false);
  });
});
