"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  AUTH_API_BASE_URL,
  AUTH_CLIENT_ID,
  ApiError,
  authApi,
  meApi,
} from "@/lib/auth/api";
import { useSession, withSession } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  Alert,
  AuthTitle,
  FormField,
  SubmitButton,
  errorMessage,
  fieldErrors,
  inputClass,
} from "./AuthUi";

const linkClass = "text-sm font-medium text-link underline hover:text-link-hover";

/**
 * O verbo de cada botão. Entrar e criar conta são o mesmo `authorize`: a API
 * cria a conta no primeiro login social, então o que muda entre as duas
 * telas é só a palavra. Vincular é outro fluxo, com sessão.
 */
const VERBO_DO_OAUTH = {
  login: "Entrar",
  signup: "Criar conta",
  link: "Vincular",
} as const;

export function OAuthButtons({
  mode,
  returnTo = "/",
}: {
  mode: keyof typeof VERBO_DO_OAUTH;
  returnTo?: string;
}) {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState<string>();

  async function start(provider: "google" | "linkedin") {
    setError(undefined);
    setPending(provider);
    sessionStorage.setItem("bc:oauth-mode", mode);
    sessionStorage.setItem("bc:oauth-return-to", safeReturnTo(returnTo));
    try {
      if (mode !== "link") {
        const url = new URL(
          `${AUTH_API_BASE_URL}/v1/auth/oauth/${provider}/authorize`,
        );
        url.searchParams.set("client_id", AUTH_CLIENT_ID);
        window.location.assign(url);
        return;
      }
      const response = await withSession((token) =>
        meApi.oauth.linkStart(provider, token),
      );
      window.location.assign(response.authorizationUrl);
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert>{error}</Alert>}
      {(["google", "linkedin"] as const).map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={Boolean(pending)}
          onClick={() => void start(provider)}
          className="h-10 rounded-controle bg-rebaixada px-4 text-sm font-semibold text-tinta-900 transition-colors hover:bg-tinta-200 disabled:opacity-60"
        >
          {pending === provider
            ? "Abrindo…"
            : `${VERBO_DO_OAUTH[mode]} com ${
                provider === "google" ? "Google" : "LinkedIn"
              }`}
        </button>
      ))}
    </div>
  );
}

export function LoginScreen({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [canResend, setCanResend] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    setErrors({});
    setCanResend(false);
    setPending(true);
    try {
      const response = await authApi.login(email.trim(), password);
      await session.login(response);
      router.replace(safeReturnTo(returnTo));
    } catch (caught) {
      setErrors(fieldErrors(caught));
      setError(
        caught instanceof ApiError && caught.code === "AUTH_INVALID_CREDENTIALS"
          ? "E-mail ou senha inválidos."
          : errorMessage(caught),
      );
      setCanResend(
        caught instanceof ApiError && caught.code === "AUTH_EMAIL_NOT_VERIFIED",
      );
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setPending(true);
    setError(undefined);
    try {
      await authApi.resendVerification(email.trim());
      setSuccess("Se houver uma conta pendente, enviamos um novo link.");
      setCanResend(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthTitle>Entrar</AuthTitle>
      {error && <Alert>{error}</Alert>}
      {success && <Alert success>{success}</Alert>}
      {canResend && (
        <button
          type="button"
          onClick={() => void resend()}
          disabled={pending}
          className="h-10 rounded-controle bg-rebaixada px-4 text-sm font-semibold"
        >
          Reenviar e-mail de confirmação
        </button>
      )}
      <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)} noValidate>
        <FormField id="email" label="E-mail" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField id="password" label="Senha" error={errors.password}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </FormField>
        <SubmitButton pending={pending}>Entrar</SubmitButton>
      </form>
      <div className="flex items-center gap-3 text-xs uppercase text-tinta-500">
        <span className="h-px flex-1 bg-tinta-200" />
        ou
        <span className="h-px flex-1 bg-tinta-200" />
      </div>
      <OAuthButtons mode="login" returnTo={safeReturnTo(returnTo)} />
      <div className="flex flex-col gap-2">
        <Link className={linkClass} href="/esqueci-a-senha">
          Esqueci minha senha
        </Link>
        <Link className={linkClass} href="/cadastrar">
          Criar uma conta
        </Link>
      </div>
    </div>
  );
}

export function RegisterScreen() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setError(undefined);
    setPending(true);
    try {
      await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      setDone(true);
    } catch (caught) {
      setErrors(fieldErrors(caught));
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <AuthTitle>Confirme seu e-mail</AuthTitle>
        <Alert success>
          Se este endereço puder ser usado, enviamos um link de confirmação.
          O link vale por 24 horas.
        </Alert>
        <p className="text-sm text-tinta-600">
          Confira também a caixa de spam. Você pode pedir outro link na tela
          de entrar.
        </p>
        <Link className={linkClass} href="/entrar">Ir para entrar</Link>
      </div>
    );
  }

  const fields = [
    { key: "name", label: "Nome", type: "text", autoComplete: "name" },
    { key: "email", label: "E-mail", type: "email", autoComplete: "email" },
    { key: "password", label: "Senha", type: "password", autoComplete: "new-password" },
    { key: "phone", label: "Telefone (opcional)", type: "tel", autoComplete: "tel" },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <AuthTitle>Criar conta</AuthTitle>
      {error && <Alert>{error}</Alert>}
      <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)} noValidate>
        {fields.map((field) => (
          <FormField key={field.key} id={field.key} label={field.label} error={errors[field.key]}>
            <input
              id={field.key}
              type={field.type}
              autoComplete={field.autoComplete}
              value={form[field.key]}
              onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              className={inputClass}
            />
          </FormField>
        ))}
        <p className="text-xs text-tinta-500">
          Use pelo menos 10 caracteres e evite senhas comuns.
        </p>
        <SubmitButton pending={pending}>Criar conta</SubmitButton>
      </form>
      <div className="flex items-center gap-3 text-xs uppercase text-tinta-500">
        <span className="h-px flex-1 bg-tinta-200" />
        ou
        <span className="h-px flex-1 bg-tinta-200" />
      </div>
      <OAuthButtons mode="signup" />
      <Link className={linkClass} href="/entrar">Já tenho uma conta</Link>
    </div>
  );
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setPending(true);
    try {
      await authApi.forgotPassword(email.trim());
      setDone(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthTitle>Recuperar senha</AuthTitle>
      {error && <Alert>{error}</Alert>}
      {done ? (
        <Alert success>
          Se houver uma conta ativa com este e-mail, enviamos as instruções.
        </Alert>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <FormField id="email" label="E-mail">
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </FormField>
          <SubmitButton pending={pending}>Enviar instruções</SubmitButton>
        </form>
      )}
      <Link className={linkClass} href="/entrar">Voltar para entrar</Link>
    </div>
  );
}

export function ResetPasswordScreen({ token }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("O link de redefinição está incompleto.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthTitle>Definir nova senha</AuthTitle>
      {error && <Alert>{error}</Alert>}
      {done ? (
        <>
          <Alert success>Senha redefinida. Todas as sessões anteriores foram encerradas.</Alert>
          <Link className={linkClass} href="/entrar">Entrar com a nova senha</Link>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <FormField id="password" label="Nova senha">
            <input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </FormField>
          <FormField id="confirmation" label="Confirmar nova senha">
            <input id="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} />
          </FormField>
          <SubmitButton pending={pending}>Redefinir senha</SubmitButton>
        </form>
      )}
    </div>
  );
}

function OneTimeResult({
  title,
  token,
  kind,
}: {
  title: string;
  token?: string;
  kind: "verify" | "email-change";
}) {
  const started = useRef(false);
  const [result, setResult] = useState<{ success: boolean; message: string }>();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const operation = token
      ? kind === "verify"
        ? authApi.verifyEmail(token)
        : meApi.confirmEmailChange(token)
      : Promise.reject(new Error("O link de confirmação está incompleto."));
    void operation
      .then((response) => setResult({ success: true, message: response.message }))
      .catch((error) => setResult({ success: false, message: errorMessage(error) }));
  }, [kind, token]);

  return (
    <div className="flex flex-col gap-6">
      <AuthTitle>{title}</AuthTitle>
      {!result && <p className="text-sm text-tinta-600">Processando…</p>}
      {result && <Alert success={result.success}>{result.message}</Alert>}
      {result?.success && <Link className={linkClass} href="/entrar">Ir para entrar</Link>}
    </div>
  );
}

export function VerifyEmailScreen({ token }: { token?: string }) {
  return <OneTimeResult title="Confirmar e-mail" token={token} kind="verify" />;
}

export function ConfirmEmailChangeScreen({ token }: { token?: string }) {
  return <OneTimeResult title="Confirmar novo e-mail" token={token} kind="email-change" />;
}

export function OAuthCallbackScreen({
  code,
  linkCode,
  oauthError,
}: {
  code?: string;
  linkCode?: string;
  oauthError?: string;
}) {
  const session = useSession();
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string>();
  const staticError = oauthError
    ? "O provedor não concluiu a autenticação. Tente novamente."
    : !code && !linkCode
      ? "O retorno do provedor está incompleto."
      : linkCode && session.status === "anonymous"
        ? "Sua sessão expirou antes da confirmação do vínculo."
        : undefined;

  useEffect(() => {
    if (started.current || session.status === "loading" || staticError) return;
    started.current = true;
    const destination = safeReturnTo(sessionStorage.getItem("bc:oauth-return-to") ?? "/");
    if (code) {
      void authApi.exchangeOAuth(code)
        .then(async (response) => {
          await session.login(response);
          router.replace(destination);
        })
        .catch((caught) => setError(errorMessage(caught)));
      return;
    }
    if (linkCode) {
      void withSession((token) => meApi.oauth.confirmLink(linkCode, token))
        .then(() => {
          router.replace("/conta#provedores");
        })
        .catch((caught) => setError(errorMessage(caught)));
      return;
    }
  }, [code, linkCode, router, session, staticError]);

  const shownError = error ?? staticError;

  return (
    <div className="flex flex-col gap-6">
      <AuthTitle>Concluir autenticação</AuthTitle>
      {shownError ? <Alert>{shownError}</Alert> : <p className="text-sm text-tinta-600">Concluindo…</p>}
      {shownError && <Link className={linkClass} href="/entrar">Voltar para entrar</Link>}
    </div>
  );
}
