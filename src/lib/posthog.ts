/**
 * PostHog ligado por `NEXT_PUBLIC_POSTHOG_KEY`, projeto na região US.
 *
 * Tudo aqui é puro, sem importar `posthog-js`: a chave, as opções do `init`
 * e o proxy. Quem chama a biblioteca é `analitica.ts`, e quem liga é
 * `src/instrumentation-client.ts`.
 *
 * **O proxy.** Os eventos saem para `/ingest` no nosso domínio, e o
 * `next.config.ts` os repassa ao PostHog (`REESCRITAS_DO_POSTHOG`): bloqueador
 * de anúncio corta `*.posthog.com` e deixa passar o próprio site. O caminho
 * do PostHog termina em barra (`/e/`, `/flags/`), e o Next redireciona toda
 * URL com barra no fim para a sem barra antes de reescrever. Em vez de
 * desligar esse redirecionamento no site inteiro (`skipTrailingSlashRedirect`),
 * a barra do fim vira um marcador `/_` no navegador
 * (`reescreverCaminhoDoPosthog`) e volta a ser barra no destino da reescrita.
 */
import type { CaptureResult, PostHogConfig } from "posthog-js";

export const CAMINHO_DO_PROXY = "/ingest";

const HOST_DE_EVENTOS = "https://us.i.posthog.com";
const HOST_DE_ARQUIVOS = "https://us-assets.i.posthog.com";

/**
 * Só a chave pública de projeto (`phc_`). A pessoal (`phx_`) é segredo e
 * não pode ir para o navegador; o placeholder da variável do GitHub e o
 * vazio desligam, como o GTM faz com `idDoGtm`.
 */
const FORMATO_DA_CHAVE = /^phc_[A-Za-z0-9]{20,}$/;

export function chaveDoPosthog(valor: string | undefined): string | null {
  const chave = valor?.trim() ?? "";
  return FORMATO_DA_CHAVE.test(chave) ? chave : null;
}

/**
 * `/ingest/e/` vira `/ingest/e/_`, com a query intacta. Estáticos e
 * configuração remota (`/static/`, `/array/`) são arquivos, sem barra no
 * fim, e passam como estão.
 */
export function reescreverCaminhoDoPosthog(url: URL): URL {
  const { pathname } = url;
  const doProxy = pathname.startsWith(`${CAMINHO_DO_PROXY}/`);
  const arquivo =
    pathname.startsWith(`${CAMINHO_DO_PROXY}/static/`) ||
    pathname.startsWith(`${CAMINHO_DO_PROXY}/array/`);
  if (doProxy && !arquivo && pathname.endsWith("/")) url.pathname = `${pathname}_`;
  return url;
}

/** As reescritas do `next.config.ts`: as específicas antes da geral. */
export const REESCRITAS_DO_POSTHOG = [
  { source: `${CAMINHO_DO_PROXY}/static/:path*`, destination: `${HOST_DE_ARQUIVOS}/static/:path*` },
  { source: `${CAMINHO_DO_PROXY}/array/:path*`, destination: `${HOST_DE_ARQUIVOS}/array/:path*` },
  { source: `${CAMINHO_DO_PROXY}/:path*/_`, destination: `${HOST_DE_EVENTOS}/:path*/` },
  { source: `${CAMINHO_DO_PROXY}/:path*`, destination: `${HOST_DE_EVENTOS}/:path*` },
];

/**
 * Parâmetros que são segredo quando aparecem numa URL: o `token` dos links de
 * e-mail (descadastro, senha, confirmação) e o `code` do retorno do OAuth.
 */
const PARAMETROS_SECRETOS = ["token", "code"];

/** A URL sem os parâmetros secretos (chave e valor), o resto intacto. */
export function semSegredosNaUrl<T>(url: T): T {
  if (typeof url !== "string") return url;
  const inicioDaQuery = url.indexOf("?");
  if (inicioDaQuery === -1) return url;
  const inicioDoHash = url.indexOf("#", inicioDaQuery);
  const fim = inicioDoHash === -1 ? url.length : inicioDoHash;
  const parametros = url
    .slice(inicioDaQuery + 1, fim)
    .split("&")
    .filter((par) => par && !PARAMETROS_SECRETOS.includes(par.split("=")[0]!.toLowerCase()));
  const query = parametros.length > 0 ? `?${parametros.join("&")}` : "";
  return `${url.slice(0, inicioDaQuery)}${query}${url.slice(fim)}` as T;
}

const PROPRIEDADES_DE_URL = [
  "$current_url",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
  "$pathname",
];

function limparPropriedades<P extends Record<string, unknown> | undefined>(propriedades: P): P {
  if (!propriedades) return propriedades;
  const limpas: Record<string, unknown> = { ...propriedades };
  for (const chave of PROPRIEDADES_DE_URL) {
    if (chave in limpas) limpas[chave] = semSegredosNaUrl(limpas[chave]);
  }
  return limpas as P;
}

/**
 * O `before_send`: a segunda camada, além da máscara do próprio PostHog
 * (que cobre `$current_url`, mas não o `$referrer`). A primeira são as
 * páginas que recebem token, que o tiram da barra de endereço ao abrir
 * (`useTokenDaUrl`).
 */
export function limparSegredosDoEvento(evento: CaptureResult | null): CaptureResult | null {
  if (!evento) return evento;
  return {
    ...evento,
    properties: limparPropriedades(evento.properties),
    $set: limparPropriedades(evento.$set),
    $set_once: limparPropriedades(evento.$set_once),
  };
}

/**
 * - `cookieless_mode: "on_reject"`: até a pessoa responder o banner, nada vai
 *   para cookie nem para o armazenamento do navegador, e nenhum evento sai.
 *   Aceitou, é o PostHog completo; recusou, só a contagem anônima dele.
 * - `advanced_disable_feature_flags`: o site não usa feature flags, então
 *   nenhuma é avaliada. **Não** `advanced_disable_flags`: esse corta também
 *   a configuração remota do projeto, e é dela que a gravação de sessão,
 *   ligada no painel do PostHog, fica sabendo que deve gravar. Por isso,
 *   antes da resposta ao banner, a configuração e `/flags` ainda saem, com
 *   um id só em memória; evento nenhum, e nada gravado no navegador.
 * - `person_profiles: "identified_only"`: visitante anônimo não vira pessoa;
 *   só a conta que entrou (`identificar`).
 * - Gravação de sessão com todo campo de formulário mascarado. O que mais
 *   não pode aparecer leva a classe `ph-no-capture` na tela.
 * - `token` e `code` nunca saem numa URL: `mask_personal_data_properties`
 *   com esses dois, e `limparSegredosDoEvento` no `before_send`.
 */
export function opcoesDoPosthog(): Partial<PostHogConfig> {
  return {
    api_host: CAMINHO_DO_PROXY,
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    cookieless_mode: "on_reject",
    advanced_disable_feature_flags: true,
    person_profiles: "identified_only",
    session_recording: { maskAllInputs: true },
    mask_personal_data_properties: true,
    custom_personal_data_properties: PARAMETROS_SECRETOS,
    before_send: limparSegredosDoEvento,
    rewriteRequestPath: reescreverCaminhoDoPosthog,
  };
}
