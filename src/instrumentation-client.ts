/**
 * Roda no navegador antes da página ficar interativa (convenção do Next:
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
 * instrumentation-client.md`). Só liga o PostHog, e só com a chave pública
 * de projeto válida; sem ela, nada carrega.
 *
 * O `try` é o que a documentação do Next pede: falha da analítica não pode
 * derrubar a página.
 */
import { iniciarAnalitica } from "@/lib/analitica";
import { chaveDoPosthog } from "@/lib/posthog";

const chave = chaveDoPosthog(process.env.NEXT_PUBLIC_POSTHOG_KEY);

if (chave) {
  try {
    iniciarAnalitica(chave);
  } catch (erro) {
    console.error("[analitica] o PostHog não ligou; o site segue sem ele.", erro);
  }
}
