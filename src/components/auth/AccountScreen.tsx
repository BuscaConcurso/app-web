"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, authApi, meApi } from "@/lib/auth/api";
import type { OAuthIdentity } from "@/lib/auth/api";
import { useSession, withSession } from "@/lib/auth/session";
import { Botao } from "@/components/ui/Botao";
import { Campo } from "@/components/ui/Campo";
import { Rotulo } from "@/components/ui/Etiqueta";
import { useSalvos } from "@/components/salvos/contexto";
import { avisoDePreferencia } from "@/lib/preferenciasDeEmail";
import { InterruptorDePreferencia } from "./InterruptorDePreferencia";
import { OAuthButtons } from "./PublicAuthScreens";
import {
  Alert,
  SubmitButton,
  errorMessage,
  fieldErrors,
} from "./AuthUi";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-linha pt-7 first:border-0 first:pt-0">
      <h2 className="mb-5 font-titulo text-xl font-bold text-tinta-900">{title}</h2>
      {children}
    </section>
  );
}

function ProfileSection() {
  const session = useSession();
  const profile = session.profile;
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ success: boolean; text: string }>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    setMessage(undefined);
    setPending(true);
    try {
      await withSession((token) =>
        meApi.update({ name: name.trim(), phone: phone.trim() || null }, token),
      );
      await session.reloadProfile();
      setMessage({ success: true, text: "Dados salvos." });
    } catch (caught) {
      setErrors(fieldErrors(caught));
      setMessage({ success: false, text: errorMessage(caught) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section id="perfil" title="Perfil">
      {message && <Alert success={message.success}>{message.text}</Alert>}
      <form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <Campo
          id="name"
          etiqueta="Nome"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          erro={errors.name}
        />
        <Campo
          id="phone"
          etiqueta="Telefone (opcional)"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          erro={errors.phone}
        />
        <SubmitButton pending={pending}>Salvar perfil</SubmitButton>
      </form>
    </Section>
  );
}

function PasswordSection() {
  const session = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ success: boolean; text: string }>();
  const [pending, setPending] = useState(false);

  if (!session.profile?.hasPassword) {
    return (
      <Section id="senha" title="Senha">
        <p className="text-sm text-tinta-600">
          Sua conta foi criada por um provedor e ainda não possui senha.
          Use a recuperação para criar uma.
        </p>
        <Link className="mt-3 inline-block text-sm font-medium text-link underline" href="/esqueci-a-senha">
          Criar uma senha
        </Link>
      </Section>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(undefined);
    setPending(true);
    try {
      await withSession((token) =>
        meApi.changePassword({ currentPassword, newPassword }, token),
      );
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ success: true, text: "Senha alterada. As outras sessões foram encerradas." });
    } catch (caught) {
      setMessage({ success: false, text: errorMessage(caught) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section id="senha" title="Senha">
      {message && <Alert success={message.success}>{message.text}</Alert>}
      <form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
        <Campo
          id="current-password"
          etiqueta="Senha atual"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <Campo
          id="new-password"
          etiqueta="Nova senha"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <SubmitButton pending={pending}>Alterar senha</SubmitButton>
      </form>
    </Section>
  );
}

function EmailSection() {
  const session = useSession();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [message, setMessage] = useState<{ success: boolean; text: string }>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(undefined);
    setPending(true);
    try {
      await withSession((token) =>
        meApi.requestEmailChange({ newEmail: newEmail.trim(), currentPassword }, token),
      );
      setMessage({ success: true, text: "Enviamos uma confirmação para o novo endereço." });
      setNewEmail("");
      setCurrentPassword("");
    } catch (caught) {
      setMessage({ success: false, text: errorMessage(caught) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section id="email" title="E-mail">
      <p className="mb-4 text-sm text-tinta-600">
        Atual: <strong className="ph-no-capture text-tinta-900">{session.profile?.email}</strong>
      </p>
      {message && <Alert success={message.success}>{message.text}</Alert>}
      {session.profile?.hasPassword ? (
        <form className="mt-4 flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
          <Campo
            id="new-email"
            etiqueta="Novo e-mail"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <Campo
            id="email-password"
            etiqueta="Senha atual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <SubmitButton pending={pending}>Solicitar troca</SubmitButton>
        </form>
      ) : (
        <p className="text-sm text-tinta-600">
          Crie uma senha antes de trocar o e-mail da conta.
        </p>
      )}
    </Section>
  );
}

function ProvidersSection() {
  const [identities, setIdentities] = useState<OAuthIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string }>();

  async function load() {
    setLoading(true);
    try {
      setIdentities(await withSession((token) => meApi.oauth.list(token)));
    } catch (caught) {
      setMessage({ success: false, text: errorMessage(caught) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void withSession((token) => meApi.oauth.list(token))
      .then((items) => {
        if (active) setIdentities(items);
      })
      .catch((caught) => {
        if (active) setMessage({ success: false, text: errorMessage(caught) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function unlink(provider: string) {
    setMessage(undefined);
    try {
      await withSession((token) => meApi.oauth.unlink(provider, token));
      await load();
      setMessage({ success: true, text: "Provedor desvinculado." });
    } catch (caught) {
      const text =
        caught instanceof ApiError && caught.code === "ACCOUNT_LAST_AUTH_METHOD"
          ? "Esta é sua única forma de entrar. Crie uma senha antes de desvincular."
          : errorMessage(caught);
      setMessage({ success: false, text });
    }
  }

  return (
    <Section id="provedores" title="Google e LinkedIn">
      {message && <Alert success={message.success}>{message.text}</Alert>}
      <div className="mt-4 flex flex-col gap-3">
        {loading && <p className="text-sm text-tinta-600">Carregando vínculos…</p>}
        {!loading && identities.length === 0 && (
          <p className="text-sm text-tinta-600">Nenhum provedor vinculado.</p>
        )}
        {identities.map((identity) => (
          <div key={identity.provider} className="flex items-center justify-between gap-3 rounded-controle bg-rebaixada p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-tinta-900 capitalize">{identity.provider}</p>
              <p className="truncate text-xs text-tinta-500">{identity.email}</p>
            </div>
            <button type="button" onClick={() => void unlink(identity.provider)} className="text-xs font-semibold text-urucum-texto underline">
              Desvincular
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-tinta-900">Vincular outro provedor</p>
        <OAuthButtons mode="link" returnTo="/conta#provedores" />
      </div>
    </Section>
  );
}

function SessionsSection() {
  const session = useSession();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function logoutAll() {
    setPending(true);
    setError(undefined);
    try {
      await withSession((token) => authApi.logoutAll(token));
      await session.logout();
      router.replace("/entrar");
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(false);
    }
  }

  return (
    <Section id="sessoes" title="Sessões">
      {error && <Alert>{error}</Alert>}
      <p className="mb-4 text-sm text-tinta-600">
        Encerra o acesso desta conta em todos os navegadores e dispositivos.
      </p>
      <Botao
        type="button"
        variante="secundario"
        tamanho="lg"
        className="w-full"
        disabled={pending}
        onClick={() => void logoutAll()}
      >
        {pending ? "Encerrando…" : "Sair de todos os dispositivos"}
      </Botao>
    </Section>
  );
}

/**
 * "E-mails e avisos" (artboard `Preferencias`). Nesta etapa só há um e-mail
 * opcional, os lembretes; o resumo semanal e o "parar todos" chegam com a
 * etapa 2. O interruptor muda na hora e salva sozinho; se a api recusar,
 * volta ao que estava e avisa. O aviso é o flutuante dos salvos, um só na
 * página.
 */
function AvisosSection() {
  const session = useSession();
  const salvos = useSalvos();
  const [lembretes, setLembretes] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void withSession((token) => meApi.preferenciasDeEmail.ler(token))
      .then((preferencias) => {
        if (active) setLembretes(preferencias.lembretes);
      })
      .catch((caught) => {
        if (active) setError(errorMessage(caught));
      });
    return () => {
      active = false;
    };
  }, []);

  async function alternar() {
    if (lembretes === null || pending) return;
    const anterior = lembretes;
    setLembretes(!anterior);
    setPending(true);
    try {
      const salvo = await withSession((token) =>
        meApi.preferenciasDeEmail.alterar({ lembretes: !anterior }, token),
      );
      setLembretes(salvo.lembretes);
      salvos.avisar(avisoDePreferencia(null));
    } catch (caught) {
      setLembretes(anterior);
      salvos.avisar(avisoDePreferencia(caught));
    } finally {
      setPending(false);
    }
  }

  const comLembrete =
    salvos.estado === "pronto" ? [...salvos.mapa.values()].filter(Boolean).length : null;

  return (
    <Section id="avisos" title="E-mails e avisos">
      <p className="mb-5 text-sm text-tinta-600">
        Escolha o que chega em{" "}
        <strong className="ph-no-capture text-tinta-900">{session.profile?.email}</strong>. Cada
        mudança vale na hora.
      </p>
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-col gap-3">
        <section
          aria-labelledby="t-lembretes"
          className="flex items-start gap-5 rounded-painel p-5 shadow-[inset_0_0_0_1px_var(--color-linha)]"
        >
          <div className="flex min-w-0 grow flex-col gap-1.5">
            <h3 id="t-lembretes" className="text-base font-bold text-tinta-900">
              Lembretes dos concursos salvos
            </h3>
            <p className="text-sm leading-[1.55] text-tinta-600">
              Avisamos quando a inscrição abre e na véspera do fim, só dos concursos com o
              lembrete ligado.
            </p>
            <Link href="/salvos" className="self-start text-sm font-bold text-link underline">
              Escolher em Meus salvos
              {comLembrete !== null && ` (${comLembrete} com lembrete)`}
            </Link>
          </div>
          <InterruptorDePreferencia
            ligado={lembretes ?? false}
            rotuladoPor="t-lembretes"
            desabilitado={lembretes === null || pending}
            aoAlternar={() => void alternar()}
          />
        </section>
        <section aria-labelledby="t-conta" className="flex flex-col gap-1.5 rounded-painel bg-rebaixada p-5">
          <h3 id="t-conta" className="text-base font-bold text-tinta-900">
            E-mails da conta
          </h3>
          <p className="text-sm leading-[1.55] text-tinta-600">
            Confirmação de cadastro, redefinição de senha e avisos de segurança chegam sempre. Sem
            eles, não dá para proteger a sua conta.
          </p>
        </section>
      </div>
    </Section>
  );
}

export function AccountScreen() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "anonymous") {
      router.replace("/entrar?retorno=%2Fconta");
    }
  }, [router, session.status]);

  if (session.status !== "authenticated" || !session.profile) {
    return (
      <div className="mx-auto max-w-[47.5rem] px-4 py-12 text-sm text-tinta-600">
        Carregando sua conta…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[47.5rem] px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <Rotulo tom="verde" className="mb-2">Sua conta</Rotulo>
        <h1 className="font-titulo text-[2rem] leading-tight font-bold tracking-[-0.02em] text-tinta-900">
          Conta e segurança
        </h1>
      </header>
      <div className="flex flex-col gap-8 rounded-painel bg-cartao p-6 shadow-cartao sm:p-8">
        <ProfileSection />
        <PasswordSection />
        <EmailSection />
        <ProvidersSection />
        <SessionsSection />
        <AvisosSection />
      </div>
    </div>
  );
}
