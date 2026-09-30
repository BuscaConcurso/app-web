import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Criar conta" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ retorno?: string | string[] }>;
}) {
  const { retorno } = await searchParams;
  return (
    <AuthShell>
      <RegisterScreen returnTo={typeof retorno === "string" ? retorno : undefined} />
    </AuthShell>
  );
}
