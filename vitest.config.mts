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
  },
});
