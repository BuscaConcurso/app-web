import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ConfirmEmailChangeScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Confirmar novo e-mail" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AuthShell><ConfirmEmailChangeScreen token={token} /></AuthShell>;
}
