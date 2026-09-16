import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Recuperar senha" };
export default function Page() {
  return <AuthShell><ForgotPasswordScreen /></AuthShell>;
}
