/**
 * O travessao que vem da API, trocado no limite em que o dado entra no app.
 * Mora fora de `concursos.ts` para o cliente (os salvos, que chegam por
 * `/v1/me/salvos` no navegador) usar a mesma regra sem carregar o modulo de
 * servidor do acervo.
 */
import type { ConcursoDetalhe, ConcursoResumo, Orgao } from "./dominio";

/**
 * Regra do parceiro humano contra o travessao em qualquer texto visivel do
 * site (acentuacao solta de proposito nesta nota, adiante ela volta).
 * `semTravessao.test.ts` cobre o que esta escrito no proprio
 * codigo-fonte, varrendo `src/`; mas titulo de concurso e nome de orgao nao
 * vem do codigo-fonte, vem da API, e o acervo ja mostrou o travessao nos
 * dois campos: "ENFAM", seguido dele, "Edital numero 2". Esta funcao troca
 * o travessao por " - " no limite em que o dado da API entra no app, em
 * `lerAcervoDaApi` e `obterDetalhe`, logo abaixo, para que nenhuma tela
 * nova precise lembrar de chama-la de novo.
 *
 * O caractere e o escape `\u2014`, nao o glifo: e o mesmo travessao, so
 * escrito de um jeito que este arquivo nao precisa se excluir da propria
 * varredura.
 */
export function semTravessao(texto: string): string {
  return texto.replace(/\s*\u2014\s*/g, " - ").trim();
}

function normalizarOrgao(orgao: Orgao): Orgao {
  return { ...orgao, nome: semTravessao(orgao.nome) };
}

/**
 * O título, o nome do órgão, o nome da banca, o nome de cada cargo buscável
 * e o título do último ato: todo "título ou nome" do resumo
 * do concurso. `T extends ConcursoResumo` para que chamar com um
 * `ConcursoDetalhe` devolva um `ConcursoDetalhe` (`cronograma`, `cargos`,
 * `origens` e `editalCitadoUrl` seguem juntos no `...concurso`), sem outra
 * cópia desta função lá embaixo.
 */
function normalizarNomeacao<T extends ConcursoResumo>(concurso: T): T {
  return {
    ...concurso,
    titulo: semTravessao(concurso.titulo),
    orgao: normalizarOrgao(concurso.orgao),
    banca: concurso.banca
      ? { ...concurso.banca, nome: semTravessao(concurso.banca.nome) }
      : concurso.banca,
    nomesDeCargo: concurso.nomesDeCargo.map(semTravessao),
    ultimoAto: concurso.ultimoAto
      ? {
          ...concurso.ultimoAto,
          titulo: concurso.ultimoAto.titulo
            ? semTravessao(concurso.ultimoAto.titulo)
            : concurso.ultimoAto.titulo,
        }
      : concurso.ultimoAto,
  };
}

/** A forma exportada de `normalizarNomeacao`, para o resumo da lista. */
export function normalizarResumo(concurso: ConcursoResumo): ConcursoResumo {
  return normalizarNomeacao(concurso);
}

/**
 * O mesmo corte do resumo, mais o nome de cada cargo do detalhe e o titulo
 * de cada ato (`origens[].titulo`, o que o Diario chamou o ato: e o que
 * aparece em "ver em: <titulo>" no FAQ, `Faq.tsx`).
 *
 * **`origens[].texto` e `faq[].trecho` NAO passam por `semTravessao`.** Sao
 * citacao literal do ato (ver o cabecalho de `enderecos.ts`: "a soma dos
 * `texto` devolvidos e identica a entrada, caractere por caractere"), e
 * `inicioChar`/`fimChar` do FAQ grifam um trecho de `texto` pela posicao do
 * caractere: trocar um caractere por tres (`\u2014` por ` - `) desalinha
 * todo grifo depois da troca. O mesmo vale, por design, para
 * `cronograma[].evidencia` e `cargos[].evidencia[].trecho`: tambem sao
 * trecho literal do ato, e esta funcao nao os toca.
 */
export function normalizarDetalhe(detalhe: ConcursoDetalhe): ConcursoDetalhe {
  const base = normalizarNomeacao(detalhe);
  return {
    ...base,
    cargos: detalhe.cargos.map((cargo) => ({
      ...cargo,
      nome: semTravessao(cargo.nome),
    })),
    origens: detalhe.origens.map((origem) => ({
      ...origem,
      titulo: origem.titulo ? semTravessao(origem.titulo) : origem.titulo,
    })),
  };
}
