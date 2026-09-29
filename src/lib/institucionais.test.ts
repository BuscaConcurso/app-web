import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { recursoEmBreve } from "./emBreve";
import {
  PAGINAS_INSTITUCIONAIS,
  REDIRECIONAMENTOS_DO_EM_BREVE,
} from "./institucionais";

const RAIZ = join(process.cwd(), "src");

function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosDe(caminho);
    return /\.tsx?$/.test(nome) && !nome.endsWith(".test.ts") ? [caminho] : [];
  });
}

describe("páginas institucionais", () => {
  it("cada página tem a sua rota em src/app", () => {
    for (const { href } of Object.values(PAGINAS_INSTITUCIONAIS)) {
      expect(existsSync(join(RAIZ, "app", href.slice(1), "page.tsx")), href).toBe(true);
    }
  });

  it("os endereços /em-breve antigos redirecionam, com 308, para a página nova", () => {
    expect(REDIRECIONAMENTOS_DO_EM_BREVE).toEqual([
      { source: "/em-breve/como-lemos", destination: "/como-lemos-os-editais", permanent: true },
      { source: "/em-breve/acessibilidade", destination: "/acessibilidade", permanent: true },
      { source: "/em-breve/contato", destination: "/contato", permanent: true },
    ]);
  });

  it("nenhum recurso que virou página continua em RECURSOS_EM_BREVE", () => {
    for (const recurso of Object.keys(PAGINAS_INSTITUCIONAIS)) {
      expect(recursoEmBreve(recurso), recurso).toBeNull();
    }
  });

  it("nenhum texto de src/ aponta mais para o /em-breve de um recurso removido", () => {
    // Fora este módulo, que é quem guarda os endereços antigos para
    // redirecioná-los. `hrefEmBreve("contato")` já não compila (o tipo
    // perdeu o nome); isto pega o endereço escrito por extenso.
    const antigos = REDIRECIONAMENTOS_DO_EM_BREVE.map(({ source }) => source);
    const achados = arquivosDe(RAIZ)
      .filter((arquivo) => !arquivo.endsWith(join("lib", "institucionais.ts")))
      .flatMap((arquivo) => {
        const codigo = readFileSync(arquivo, "utf8");
        return antigos
          .filter((antigo) => new RegExp(`${antigo}(?![\\w-])`).test(codigo))
          .map((antigo) => `${relative(RAIZ, arquivo)}: ${antigo}`);
      });
    expect(achados).toEqual([]);
  });
});
