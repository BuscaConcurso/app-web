import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
