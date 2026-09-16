import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Criar conta" };
export default function Page() {
  return <AuthShell><RegisterScreen /></AuthShell>;
}
