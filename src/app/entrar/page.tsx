import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Entrar" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ retorno?: string }>;
}) {
  const { retorno } = await searchParams;
  return <AuthShell><LoginScreen returnTo={retorno} /></AuthShell>;
}
