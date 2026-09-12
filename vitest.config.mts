import { defineConfig } from "vitest/config";

/**
 * Ambiente Node, sem DOM: o que tem teste aqui é lógica pura de formatação,
 * situação e consulta. Componente se confere no navegador, em `/estilo`.
 *
 * Extensão `.mts` porque o pacote é CommonJS e o carregador nativo do Vite
 * recusa sintaxe ESM num `.ts` nessa condição.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    /**
     * `acervo()` (src/lib/concursos.ts) faz `fetch` da API do engine quando
     * `BC_API_URL` está definida. Aqui ela nunca está: teste de filtro e de
     * contagem precisa de um acervo conhecido e de nenhuma rede, e quem tem a
     * variável exportada no shell não devia ver a suíte mudar de resultado por
     * causa disso.
     */
    env: { BC_API_URL: "" },
  },
});
