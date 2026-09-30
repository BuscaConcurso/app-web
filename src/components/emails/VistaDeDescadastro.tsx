import Link from "next/link";
import type { ReactNode } from "react";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import type { EstadoDoDescadastro } from "@/lib/preferenciasDeEmail";

/**
 * A página de descadastro por link, estado a estado (artboard `Descadastro`
 * do canvas "E-mails BuscaConcurso"). Só apresentação: quem decide o estado
 * é `criarDescadastro` (`lib/preferenciasDeEmail.ts`), pela
 * `TelaDeDescadastro`. Sem e-mail da pessoa em lugar nenhum: a api não o
 * devolve pelo token, de propósito.
 */

const TITULO = "font-titulo text-[1.6875rem] leading-[1.1] font-extrabold tracking-[-0.025em] text-tinta-900";
const TEXTO = "text-[0.9375rem] leading-[1.6] text-tinta-600";
const LINK = "inline-flex min-h-11 items-center self-center text-[0.9375rem] font-bold text-link underline";

function Falha({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-controle bg-urucum-fundo px-4 py-3 text-sm text-urucum-texto">
      {children}
    </p>
  );
}

function Conteudo({
  estado,
  aoConfirmar,
  aoDesfazer,
}: {
  estado: EstadoDoDescadastro;
  aoConfirmar: () => void;
  aoDesfazer: () => void;
}) {
  if (estado === "invalido") {
    return (
      <>
        <h1 className={TITULO}>Este link não vale mais.</h1>
        <p className={TEXTO}>Entre na sua conta para escolher o que recebe por e-mail.</p>
        <BotaoLink href="/entrar?retorno=%2Fconta%23avisos" tamanho="md" className="self-start">
          Entrar na conta
        </BotaoLink>
      </>
    );
  }

  if (estado === "reativado") {
    return (
      <div role="status" className="flex flex-col gap-4">
        <h1 className={TITULO}>Lembretes de volta.</h1>
        <p className={TEXTO}>Os avisos dos concursos salvos voltam a chegar, como antes.</p>
        <BotaoLink href="/concursos" tamanho="md" className="self-start">
          Ver concursos abertos
        </BotaoLink>
      </div>
    );
  }

  if (estado === "pronto" || estado === "desfazendo" || estado === "falhouAoDesfazer") {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="flex size-[3.25rem] items-center justify-center rounded-[14px] bg-verde-fundo text-verde-texto">
          <Icone nome="check" tamanho={26} />
        </span>
        <h1 className={TITULO}>Pronto: os lembretes por e-mail não chegam mais.</h1>
        <p className={TEXTO}>Os e-mails da conta continuam.</p>
        {estado === "falhouAoDesfazer" && <Falha>Não deu para desfazer agora. Tente de novo.</Falha>}
        <Botao
          type="button"
          variante="secundario"
          tamanho="md"
          disabled={estado === "desfazendo"}
          onClick={aoDesfazer}
          className="font-bold"
        >
          {estado === "desfazendo" ? "Desfazendo…" : "Desfazer, quero continuar recebendo"}
        </Botao>
        <Link href="/conta#avisos" className={LINK}>
          Ajustar todas as preferências
        </Link>
      </div>
    );
  }

  // `pergunta`, `enviando` e `falhou`: nada mudou ainda.
  return (
    <>
      <span className="flex size-[3.25rem] items-center justify-center rounded-[14px] bg-verde-fundo text-verde-texto">
        <Icone nome="email" tamanho={26} />
      </span>
      <h1 className={TITULO}>Parar os lembretes por e-mail?</h1>
      <p className={TEXTO}>
        Você deixa de receber os avisos de abertura e de véspera dos concursos salvos. Os e-mails
        da conta continuam.
      </p>
      {estado === "falhou" && <Falha>Não deu para parar agora. Tente de novo.</Falha>}
      <Botao type="button" tamanho="md" disabled={estado === "enviando"} onClick={aoConfirmar}>
        {estado === "enviando" ? "Parando…" : "Parar os lembretes"}
      </Botao>
      <Link href="/conta#avisos" className={LINK}>
        Ajustar todas as preferências
      </Link>
    </>
  );
}

export function VistaDeDescadastro(props: {
  estado: EstadoDoDescadastro;
  aoConfirmar: () => void;
  aoDesfazer: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[30rem] flex-col gap-5 px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-4 rounded-painel bg-cartao p-6 shadow-cartao sm:p-7">
        <Conteudo {...props} />
      </div>
      <p className="text-center text-[0.8125rem] leading-[1.6] text-tinta-600">
        Esta página abre pelo link do e-mail, sem precisar entrar na conta.
      </p>
    </div>
  );
}
