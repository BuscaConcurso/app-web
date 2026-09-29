import { describe, expect, it } from "vitest";
import {
  CAMINHO_DO_PROXY,
  REESCRITAS_DO_POSTHOG,
  chaveDoPosthog,
  opcoesDoPosthog,
  reescreverCaminhoDoPosthog,
} from "./posthog";

const CHAVE = "phc_" + "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V";

describe("chaveDoPosthog", () => {
  it("aceita a chave pública de projeto, sem espaço nas pontas", () => {
    expect(chaveDoPosthog(CHAVE)).toBe(CHAVE);
    expect(chaveDoPosthog(`  ${CHAVE}\n`)).toBe(CHAVE);
  });

  it("vazio, placeholder ou outro formato desligam o PostHog", () => {
    expect(chaveDoPosthog(undefined)).toBeNull();
    expect(chaveDoPosthog("")).toBeNull();
    expect(chaveDoPosthog("preencher-com-phc")).toBeNull();
    expect(chaveDoPosthog("phc_curta")).toBeNull();
    // Chave pessoal (phx_) é segredo e nunca vai para o navegador.
    expect(chaveDoPosthog("phx_" + CHAVE.slice(4))).toBeNull();
    expect(chaveDoPosthog(`${CHAVE}'); alert(1); ('`)).toBeNull();
  });
});

describe("opcoesDoPosthog", () => {
  const opcoes = opcoesDoPosthog();

  it("manda pelo proxy do próprio domínio e abre o painel na região US", () => {
    expect(opcoes.api_host).toBe(CAMINHO_DO_PROXY);
    expect(opcoes.ui_host).toBe("https://us.posthog.com");
  });

  it("não guarda nada nem captura antes do consentimento", () => {
    expect(opcoes.cookieless_mode).toBe("on_reject");
  });

  it("não avalia feature flags, mas carrega a configuração, de onde a gravação de sessão liga", () => {
    expect(opcoes.advanced_disable_feature_flags).toBe(true);
    // `advanced_disable_flags` cortaria também a configuração remota, e com
    // ela a gravação de sessão ligada no painel do PostHog.
    expect(opcoes.advanced_disable_flags).toBeUndefined();
  });

  it("pessoa só existe quando a conta se identifica, e campo de formulário não aparece na gravação", () => {
    expect(opcoes.person_profiles).toBe("identified_only");
    expect(opcoes.session_recording?.maskAllInputs).toBe(true);
  });
});

describe("reescreverCaminhoDoPosthog", () => {
  const reescrito = (endereco: string) =>
    reescreverCaminhoDoPosthog(new URL(endereco)).toString();

  it("caminho com barra no fim ganha o marcador, para o Next não redirecionar", () => {
    expect(reescrito("https://buscaconcurso.com.br/ingest/e/?ip=0&ver=1")).toBe(
      "https://buscaconcurso.com.br/ingest/e/_?ip=0&ver=1",
    );
    expect(reescrito("https://buscaconcurso.com.br/ingest/i/v0/e/")).toBe(
      "https://buscaconcurso.com.br/ingest/i/v0/e/_",
    );
    expect(reescrito("https://buscaconcurso.com.br/ingest/flags/?v=2")).toBe(
      "https://buscaconcurso.com.br/ingest/flags/_?v=2",
    );
  });

  it("os arquivos estáticos e a configuração remota ficam como estão", () => {
    for (const endereco of [
      "https://buscaconcurso.com.br/ingest/static/recorder.js?v=1.434.17",
      "https://buscaconcurso.com.br/ingest/array/phc_x/config.js",
      "https://buscaconcurso.com.br/ingest/decide",
    ]) {
      expect(reescrito(endereco)).toBe(endereco);
    }
  });

  it("o que não é do proxy não é tocado", () => {
    expect(reescrito("https://us.i.posthog.com/e/")).toBe("https://us.i.posthog.com/e/");
  });
});

describe("REESCRITAS_DO_POSTHOG", () => {
  it("estáticos e configuração antes da regra geral, e o marcador volta a ser a barra", () => {
    expect(REESCRITAS_DO_POSTHOG).toEqual([
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*/_", destination: "https://us.i.posthog.com/:path*/" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ]);
  });
});
