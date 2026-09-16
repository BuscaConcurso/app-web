import type { Metadata } from "next";
import { AccountScreen } from "@/components/auth/AccountScreen";

export const metadata: Metadata = { title: "Minha conta" };
export default function Page() {
  return <AccountScreen />;
}
