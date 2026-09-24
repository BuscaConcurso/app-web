import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A imagem de produção copia só `.next/standalone` (servidor + dependências
  // usadas), sem `node_modules` inteiro.
  output: "standalone",

  // Cache ISR só em memória, com teto. /busca/<slug> aceita qualquer termo
  // (dynamicParams + revalidate) e cada slug distinto viraria um arquivo em
  // `.next/server/app/busca`, sem limite, no disco compartilhado da VPS
  // (/busca/a e /busca/a-a casam com quase todo o acervo, MBs cada). Com a
  // gravação em disco desligada, as páginas geradas em tempo de execução ficam
  // num LRU em memória de até 256 MB: o que passa do teto é descartado e
  // renderizado de novo na próxima visita.
  // Custo: o cache não sobrevive a reinício nem a deploy (cada instância
  // começa fria e renderiza de novo na primeira visita de cada slug), e as
  // revalidações das páginas geradas no build também ficam só em memória.
  cacheMaxMemorySize: 256 * 1024 * 1024,
  experimental: {
    isrFlushToDisk: false,
  },

  // O `next dev` bloqueia recursos de desenvolvimento (`/_next/hmr`) vindos de
  // origem diferente de localhost, por segurança. Validar no celular significa
  // abrir o app pelo IP da máquina na rede local, que é outra origem — e sem
  // esta lista o recarregamento automático fica fora do ar no aparelho, com um
  // aviso que só aparece no terminal de quem subiu o servidor.
  //
  // Vale só em desenvolvimento: `next build`/`next start` ignoram esta opção.
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.15.100"],
};

export default nextConfig;
