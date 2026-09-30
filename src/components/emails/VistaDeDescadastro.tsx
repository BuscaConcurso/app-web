import Link from "next/link";
import type { ReactNode } from "react";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { TEXTOS_DO_DESCADASTRO, type EstadoDoDescadastro, type TipoDeEmail } from "@/lib/preferenciasDeEmail";

/**
 * A página de descadastro por link, estado a estado (artboard `Descadastro`
 * do canvas "E-mails BuscaConcurso"). Só apresentação: quem decide o estado
 * é `criarDescadastro` (`lib/preferenciasDeEmail.ts`), pela
 * `TelaDeDescadastro`. Sem e-mail da pessoa em lugar nenhum: a api não o
 * devolve pelo token, de propósito. Os textos mudam com o tipo do link
 * (`TEXTOS_DO_DESCADASTRO`); link sem tipo conhecido já é `invalido`.
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
  tipo,
  aoConfirmar,
  aoDesfazer,
}: {
  estado: EstadoDoDescadastro;
  tipo: TipoDeEmail;
  aoConfirmar: () => void;
  aoDesfazer: () => void;
}) {
  const textos = TEXTOS_DO_DESCADASTRO[tipo];
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
        <h1 className={TITULO}>{textos.reativado}</h1>
        <p className={TEXTO}>{textos.reativadoApoio}</p>
        <BotaoLink href="/concursos" tamanho="md" className="self-start">
          Ver concursos abertos
        </BotaoLink>
      </div>
    );
  }

  if (estado === "religarNaConta") {
    // O "Desfazer" pelo link não vale mais: religar o resumo é adesão, e
    // adesão é na conta (o token vai também em e-mails que podem ser
    // encaminhados).
    return (
      <div role="status" className="flex flex-col gap-4">
        <h1 className={TITULO}>{textos.pronto}</h1>
        <p className={TEXTO}>Para voltar a receber o resumo, entre na sua conta.</p>
        <BotaoLink href="/entrar?retorno=%2Fconta%23avisos" tamanho="md" className="self-start">
          Entrar para religar
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
        <h1 className={TITULO}>{textos.pronto}</h1>
        <p className={TEXTO}>{textos.prontoApoio}</p>
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
      <h1 className={TITULO}>{textos.pergunta}</h1>
      <p className={TEXTO}>{textos.explicacao}</p>
      {estado === "falhou" && <Falha>{textos.falhou}</Falha>}
      <Botao type="button" tamanho="md" disabled={estado === "enviando"} onClick={aoConfirmar}>
        {estado === "enviando" ? textos.enviando : textos.botao}
      </Botao>
      <Link href="/conta#avisos" className={LINK}>
        Ajustar todas as preferências
      </Link>
    </>
  );
}

export function VistaDeDescadastro(props: {
  estado: EstadoDoDescadastro;
  tipo: TipoDeEmail;
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
