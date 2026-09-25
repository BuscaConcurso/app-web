import type { ReactNode } from "react";
import { ApiError } from "@/lib/auth/api";

export function AuthTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-titulo text-[26px] leading-tight text-tinta-900">
      {children}
    </h1>
  );
}

export function Alert({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`rounded-controle px-4 py-3 text-sm ${
        success
          ? "bg-rebaixada text-tinta-900"
          : "bg-urgente text-urucum-texto"
      }`}
    >
      {children}
    </div>
  );
}

export function FieldError({ children }: { children?: string }) {
  return children ? (
    <p className="mt-1 text-xs text-urucum-texto">{children}</p>
  ) : null;
}

export const inputClass =
  "h-10 w-full rounded-controle bg-rebaixada px-3 text-sm text-tinta-900 outline-none transition-colors placeholder:text-tinta-500 focus:bg-cartao focus:ring-2 focus:ring-acao";

export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-tinta-900">
        {label}
      </label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function SubmitButton({
  children,
  pending,
  variant = "primary",
}: {
  children: ReactNode;
  pending?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-10 w-full rounded-controle px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        variant === "primary"
          ? "bg-acao text-acao-texto hover:bg-acao-hover"
          : "bg-rebaixada text-tinta-900 hover:bg-linha"
      }`}
    >
      {pending ? "Aguarde…" : children}
    </button>
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Não foi possível concluir a solicitação.";
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return Object.fromEntries(
    error.details
      .filter((detail): detail is { field: string; message: string } => Boolean(detail.field))
      .map((detail) => [detail.field, detail.message]),
  );
}
