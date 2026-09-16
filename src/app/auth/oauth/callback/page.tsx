import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { OAuthCallbackScreen } from "@/components/auth/PublicAuthScreens";

export const metadata: Metadata = { title: "Concluir autenticação" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    link_code?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell>
      <OAuthCallbackScreen
        code={params.code}
        linkCode={params.link_code}
        oauthError={params.error}
      />
    </AuthShell>
  );
}
