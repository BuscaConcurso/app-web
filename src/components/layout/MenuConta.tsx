"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { Gaveta } from "@/components/ui/Revelador";
import { useSession } from "@/lib/auth/session";
import { SeletorDeTema } from "./SeletorDeTema";

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="size-5"
    >
      <path d="M3 6h14M3 10h14M3 14h14" />
    </svg>
  );
}

const linkClass =
  "inline-flex h-8 items-center justify-center rounded-controle px-3 text-[12px] font-medium transition-colors";

export function MenuConta() {
  const session = useSession();
  const router = useRouter();

  async function sair() {
    await session.logout();
    router.replace("/");
  }

  const authenticated = session.status === "authenticated";
  const title = authenticated
    ? "Conta e tema"
    : "Entrar, criar conta e tema";

  return (
    <Gaveta
      rotulo={<MenuIcon />}
      titulo={title}
      nome={title}
      largura="estreita"
      gatilho="size-10 justify-center rounded-controle bg-rebaixada text-tinta-900 transition-colors hover:bg-linha"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-tinta-600">Tema</span>
        <SeletorDeTema />
      </div>

      {authenticated ? (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-tinta-900">
              {session.profile?.name ?? "Minha conta"}
            </p>
            {session.profile?.email && (
              <p className="truncate text-xs text-tinta-500">
                {session.profile.email}
              </p>
            )}
          </div>
          <Link
            href="/conta"
            className={`${linkClass} bg-acao text-acao-texto hover:bg-acao-hover`}
          >
            Minha conta
          </Link>
          <Botao
            variante="secundario"
            tamanho="sm"
            type="button"
            onClick={() => void sair()}
          >
            Sair
          </Botao>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Link
            href="/entrar"
            className={`${linkClass} bg-rebaixada text-tinta-900 hover:bg-linha`}
          >
            Entrar
          </Link>
          <Link
            href="/cadastrar"
            className={`${linkClass} bg-acao text-acao-texto hover:bg-acao-hover`}
          >
            Criar conta
          </Link>
        </div>
      )}
    </Gaveta>
  );
}
