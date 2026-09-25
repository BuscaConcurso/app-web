"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Gaveta } from "@/components/ui/Revelador";
import { useSession } from "@/lib/auth/session";

/**
 * O gatilho da gaveta de conta, no mesmo formato do botão "Entrar"
 * (`contorno`, `md`): 44px de altura, o mesmo traço fino, sem preencher.
 * Trocar de deslogado para logado não muda o formato do controle, só o
 * conteúdo dentro dele.
 */
const GATILHO =
  "h-11 rounded-controle px-[18px] text-[15px] font-semibold text-tinta-900 " +
  "shadow-[inset_0_0_0_1px_var(--color-contorno)] transition-colors hover:bg-rebaixada";

/**
 * O menu de conta.
 *
 * Deslogado é só o botão "Entrar" (`Main.dc.html:49`): sem gaveta, sem
 * "criar conta" ao lado, porque o topo do protótipo novo não tem os dois.
 * Quem quer se cadastrar encontra o link dentro de `/entrar`.
 *
 * Logado continua sendo a gaveta de sempre, com o mesmo gatilho por fora. O
 * seletor de tema saiu de dentro dela: ele agora mora na barra utilitária
 * (`BarraUtilitaria`, sempre visível a partir de `md`) e na gaveta de
 * navegação do celular, e repeti-lo aqui seria um terceiro lugar para a
 * mesma escolha.
 */
export function MenuConta() {
  const session = useSession();
  const router = useRouter();

  async function sair() {
    await session.logout();
    router.replace("/");
  }

  if (session.status !== "authenticated") {
    return (
      <BotaoLink href="/entrar" variante="contorno" tamanho="md" icone="entrar">
        Entrar
      </BotaoLink>
    );
  }

  const nomeDaConta = session.profile?.name ?? "Minha conta";

  return (
    <Gaveta
      rotulo={nomeDaConta}
      titulo="Minha conta"
      largura="estreita"
      gatilho={GATILHO}
      className="min-w-0"
    >
      <div className="flex flex-col gap-1">
        <p className="min-w-0 truncate text-sm font-semibold text-tinta-900">
          {nomeDaConta}
        </p>
        {session.profile?.email && (
          <p className="truncate text-xs text-tinta-500">{session.profile.email}</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="/conta"
          className="inline-flex h-8 items-center justify-center rounded-controle bg-acao px-3 text-[12px] font-medium text-acao-texto hover:bg-acao-hover"
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
    </Gaveta>
  );
}
