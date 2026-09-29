import type { Metadata } from "next";
import { TelaDeSalvos } from "@/components/salvos/TelaDeSalvos";

/** Página da conta: `noindex`, como `/conta`, não é conteúdo para o buscador. */
export const metadata: Metadata = {
  title: "Salvos",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TelaDeSalvos />;
}
