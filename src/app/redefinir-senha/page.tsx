import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Redefinir senha" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AuthShell><ResetPasswordScreen token={token} /></AuthShell>;
}
