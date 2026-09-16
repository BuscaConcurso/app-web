import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmailScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Confirmar e-mail" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AuthShell><VerifyEmailScreen token={token} /></AuthShell>;
}
