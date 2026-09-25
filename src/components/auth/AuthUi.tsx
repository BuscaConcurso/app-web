import type { ReactNode } from "react";
import { Botao } from "@/components/ui/Botao";
import { ApiError } from "@/lib/auth/api";

/**
 * As peças pequenas que `PublicAuthScreens` e `AccountScreen` compartilham,
 * no visual novo: `Botao` de verdade para os botões, `Campo`/`Selecao` de
 * verdade para os campos (importados direto onde o formulário mora, não
 * daqui). O que sobra aqui é o que não tem componente próprio ainda: o
 * título da tela e o aviso de erro/sucesso.
 */

export function AuthTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-titulo text-[28px] leading-tight font-bold tracking-[-0.02em] text-tinta-900">
      {children}
    </h1>
  );
}

/**
 * O aviso de erro ou sucesso. Tons de sinal de verdade (`verde`/`urucum`),
 * não `rebaixada` neutro para o sucesso: um formulário que deu certo é
 * informação boa, e a etiqueta e o resto do sistema já usam `verde-fundo`
 * para dizer isso.
 */
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
        success ? "bg-verde-fundo text-verde-texto" : "bg-urucum-fundo text-urucum-texto"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * O botão de enviar: `primario`, `lg`, largura total, o mesmo em todo o
 * formulário de autenticação. Nenhum chamador jamais
 * pediu a variante secundária que existia aqui antes, então ela saiu.
 */
export function SubmitButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <Botao
      type="submit"
      variante="primario"
      tamanho="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? "Aguarde…" : children}
    </Botao>
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
