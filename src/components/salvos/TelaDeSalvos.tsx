"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListaDeConcursos } from "@/components/concurso/ListaDeConcursos";
import { Botao } from "@/components/ui/Botao";
import { Rotulo } from "@/components/ui/Etiqueta";
import { authApi } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/session";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";
import { useSalvos } from "./contexto";
import { InterruptorDeLembrete } from "./InterruptorDeLembrete";

/**
 * A página `/salvos`: exige sessão (sem ela, vai para `/entrar` e volta).
 *
 * Recarrega a lista ao montar: o mapa dos botões já está em dia, mas os
 * resumos de um concurso salvo depois da primeira leitura (noutra página,
 * ou noutra aba) ainda não estão em `resposta`. O que a pessoa remove aqui
 * some na hora, porque a lista é filtrada pelo mapa.
 */
export function TelaDeSalvos() {
  const session = useSession();
  const { estado, mapa, resposta, recarregar, remover, emailConfirmado } = useSalvos();
  const router = useRouter();

  useEffect(() => {
    if (session.status === "anonymous") router.replace("/entrar?retorno=%2Fsalvos");
  }, [router, session.status]);

  useEffect(() => {
    if (session.status === "authenticated") void recarregar();
  }, [session.status, recarregar]);

  return (
    <div className="conteudo flex flex-col gap-6 py-10 sm:py-14">
      <header>
        <Rotulo tom="verde" className="mb-2">Sua conta</Rotulo>
        <h1 className="font-titulo text-[2rem] leading-tight font-bold tracking-[-0.02em] text-tinta-900">
          Concursos salvos
        </h1>
      </header>
      {session.status === "authenticated" && !emailConfirmado && session.profile && (
        <AvisoDeEmailNaoConfirmado email={session.profile.email} />
      )}
      <Conteudo
        estado={estado}
        resposta={resposta}
        mapa={mapa}
        recarregar={recarregar}
        remover={remover}
      />
    </div>
  );
}

function Conteudo({
  estado,
  resposta,
  mapa,
  recarregar,
  remover,
}: Pick<ReturnType<typeof useSalvos>, "estado" | "resposta" | "mapa" | "recarregar" | "remover">) {
  if (!resposta) {
    if (estado === "falhou") {
      return (
        <div className="flex flex-col items-start gap-3 rounded-painel bg-cartao p-6 shadow-cartao">
          <p className="text-tinta-900">Não deu para carregar seus salvos agora.</p>
          <Botao variante="secundario" tamanho="md" type="button" onClick={() => void recarregar()}>
            Tentar de novo
          </Botao>
        </div>
      );
    }
    return <p className="text-sm text-tinta-600">Carregando seus salvos…</p>;
  }

  const itens = resposta.itens.filter((item) => mapa.has(item.concurso.slug));
  const semDado = resposta.semDado.filter((slug) => mapa.has(slug));

  if (itens.length === 0 && semDado.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-painel bg-cartao p-6 shadow-cartao">
        <p className="text-tinta-900">Você ainda não salvou nenhum concurso.</p>
        <Link href="/concursos" className="font-semibold text-verde-texto underline">
          Buscar concursos
        </Link>
      </div>
    );
  }

  return (
    <>
      {itens.length > 0 && (
        <ListaDeConcursos
          itens={itens.map((item) => item.concurso)}
          hoje={hojeCivilEmSaoPaulo()}
          extra={(concurso) => <InterruptorDeLembrete slug={concurso.slug} />}
        />
      )}
      {semDado.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-titulo text-xl font-bold text-tinta-900">Não estão mais na lista</h2>
          <p className="text-sm text-tinta-600">
            Estes concursos saíram do acervo. Você pode tirá-los dos salvos.
          </p>
          <ul className="flex flex-col gap-2">
            {semDado.map((slug) => (
              <li
                key={slug}
                className="flex items-center justify-between gap-3 rounded-controle bg-cartao px-4 py-3 shadow-cartao"
              >
                <span className="min-w-0 truncate text-sm text-tinta-900">{slug}</span>
                <Botao variante="secundario" tamanho="sm" type="button" onClick={() => void remover(slug)}>
                  Remover
                </Botao>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/**
 * Os lembretes só saem para endereço confirmado (spec de lembretes, §6). O
 * reenvio é o mesmo do login (`/v1/auth/verify-email/resend`), que responde
 * igual exista ou não conta pendente.
 */
function AvisoDeEmailNaoConfirmado({ email }: { email: string }) {
  const [enviado, setEnviado] = useState(false);
  const [pendente, setPendente] = useState(false);

  async function reenviar() {
    setPendente(true);
    try {
      await authApi.resendVerification(email);
      setEnviado(true);
    } finally {
      setPendente(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-painel bg-ouro-fundo p-5 text-ouro-sinal-texto">
      <p className="text-sm">
        Confirme seu e-mail para receber os lembretes. Eles só saem depois que você confirmar o endereço.
      </p>
      {enviado ? (
        <p className="text-sm font-semibold">Enviamos um novo link para {email}.</p>
      ) : (
        <Botao variante="secundario" tamanho="sm" type="button" disabled={pendente} onClick={() => void reenviar()}>
          Reenviar o link de confirmação
        </Botao>
      )}
    </div>
  );
}
