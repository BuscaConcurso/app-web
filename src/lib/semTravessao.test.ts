import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Nenhum texto do site usa o travessão, a pedido do parceiro humano.
 *
 * O que conta como texto: literal de string, template, JSX. O que não conta:
 * comentário (não chega à tela) e expressão regular (as duas que existem
 * casam o travessão que vem do Diário, para separar cargo e inciso; elas
 * leem o acervo, não escrevem nele).
 *
 * A varredura é pela árvore sintática do TypeScript, e não removendo `//` e
 * `/* *\/` por expressão regular: medido nesta base, o removedor ingênuo
 * tomava URL e expressão regular por comentário e acusava um comentário de
 * `enderecos.ts` como texto. Na árvore, comentário não é nó.
 *
 * O caractere vai escapado para este arquivo não precisar se excluir.
 */
const TRAVESSAO = "—";
const RAIZ = join(process.cwd(), "src");

const TEXTO = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
]);

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.tsx?$/.test(nome) && !nome.endsWith(".test.ts") ? [caminho] : [];
  });
}

function travessoes(nome: string, codigo: string): string[] {
  const fonte = ts.createSourceFile(
    nome,
    codigo,
    ts.ScriptTarget.Latest,
    true,
    nome.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const achados: string[] = [];
  const visitar = (no: ts.Node) => {
    if (TEXTO.has(no.kind) && no.getText(fonte).includes(TRAVESSAO)) {
      const { line } = fonte.getLineAndCharacterOfPosition(no.getStart(fonte));
      achados.push(`${nome}:${line + 1}`);
    }
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
  return achados;
}

describe("sem travessão", () => {
  it("o detector acha texto e JSX, e deixa comentário e expressão regular", () => {
    const exemplo = [
      `// comentário ${TRAVESSAO} fica`,
      `/* bloco ${TRAVESSAO} fica */`,
      `const a = "texto ${TRAVESSAO} sai";`,
      `const b = /\\s${TRAVESSAO}\\s/;`,
      `const c = <p>frase ${TRAVESSAO} sai</p>;`,
      "const d = `modelo " + TRAVESSAO + " ${a}`;",
    ].join("\n");
    expect(travessoes("x.tsx", exemplo)).toEqual(["x.tsx:3", "x.tsx:5", "x.tsx:6"]);
  });

  it("nenhum texto de src/ usa o travessão fora de comentário", () => {
    const achados = arquivosDe(RAIZ).flatMap((arquivo) =>
      travessoes(relative(RAIZ, arquivo), readFileSync(arquivo, "utf8")),
    );
    expect(achados).toEqual([]);
  });
});
