import type { Metadata } from "next";
import { TelaDeDescadastro } from "@/components/emails/TelaDeDescadastro";
import { TEXTOS_DO_DESCADASTRO, tipoDoLink } from "@/lib/preferenciasDeEmail";

type Busca = Promise<{ token?: string | string[]; tipo?: string | string[] }>;

export async function generateMetadata({ searchParams }: { searchParams: Busca }): Promise<Metadata> {
  const { tipo } = await searchParams;
  const conhecido = tipoDoLink(typeof tipo === "string" ? tipo : undefined) ?? "lembretes";
  return {
    title: TEXTOS_DO_DESCADASTRO[conhecido].titulo,
    robots: { index: false, follow: false },
  };
}

/** O link de descadastro dos e-mails opcionais (lembretes e resumo). Pública, sem login. */
export default async function Page({
  searchParams,
}: {
  searchParams: Busca;
}) {
  const { token, tipo } = await searchParams;
  return (
    <TelaDeDescadastro
      token={typeof token === "string" ? token : undefined}
      tipo={typeof tipo === "string" ? tipo : undefined}
    />
  );
}
