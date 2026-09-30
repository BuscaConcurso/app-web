import type { Metadata } from "next";
import { TelaDeDescadastro } from "@/components/emails/TelaDeDescadastro";

export const metadata: Metadata = {
  title: "Parar lembretes por e-mail",
  robots: { index: false, follow: false },
};

/** O link de descadastro dos e-mails de lembrete. Pública, sem login. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; tipo?: string | string[] }>;
}) {
  const { token, tipo } = await searchParams;
  return (
    <TelaDeDescadastro
      token={typeof token === "string" ? token : undefined}
      tipo={typeof tipo === "string" ? tipo : undefined}
    />
  );
}
