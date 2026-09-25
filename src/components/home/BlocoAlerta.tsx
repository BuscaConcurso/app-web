"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { AvisoFlutuante } from "@/components/ui/EmBreve";
import { Icone } from "@/components/ui/Icone";
import type { AvisoDoAcervo } from "@/lib/concursos";
import { RECURSOS_EM_BREVE } from "@/lib/emBreve";
import { numero } from "@/lib/formato";
import { acervoIncompletoEmPartes } from "@/lib/rotulos";

/**
 * O parágrafo de aviso da lista de resultados e da página de órgão
 * (`components/busca/ListaDeResultados.tsx`, `app/orgaos/[slug]/page.tsx`):
 * o que a lista não está mostrando, dito em voz baixa.
 *
 * **Continua aqui, sem mudar.** A home trocou este parágrafo pela faixa
 * inteira de `ComoFunciona` (que reaproveita a mesma
 * `acervoIncompletoEmPartes` para as três caixas coloridas), mas a lista de
 * resultados e a página de órgão ainda precisam do parágrafo curto, e não
 * têm o desenho de três passos ao redor dele para virar `ComoFunciona`.
 * Apagar este export quebraria as duas, fora do escopo desta task, então
 * ele fica.
 */
export function AcervoIncompleto({ aviso }: { aviso: AvisoDoAcervo }) {
  const partes = acervoIncompletoEmPartes(aviso);
  return (
    <p className="rounded-cartao bg-cartao px-6 py-5 text-sm leading-6 text-tinta-600">
      Outros{" "}
      <strong className="numero font-medium text-tinta-900">
        {numero(aviso.semDado)}
      </strong>{" "}
      dos {numero(aviso.total)} concursos do acervo estão fora desta lista
      {partes.length === 0 ? (
        <>
          : não temos cargo nem cronograma deles. Nem todos vão entrar: parte
          dos atos é retificação ou anexo, que não abre concurso.
        </>
      ) : partes.length === 1 && partes[0].quantos === aviso.semDado ? (
        <>, e {partes[0].texto}</>
      ) : (
        <>
          .
          {partes.map((parte) => (
            <Fragment key={parte.texto}>
              {" "}
              <strong className="numero font-medium text-tinta-900">
                {numero(parte.quantos)}
              </strong>{" "}
              {parte.texto}
            </Fragment>
          ))}
        </>
      )}
    </p>
  );
}

/**
 * As nove células decorativas do lado direito do alerta (`Main.dc.html:396-406`):
 * um fundo e um círculo por célula, cada um deslocado para um canto. Puramente
 * decorativo (`aria-hidden`), e some no celular: `Mobile.dc.html:112-114` usa
 * só duas bolhas soltas, não a grade inteira.
 *
 * As cores do protótipo viram token: `#0E5C35`, o único hex sem par exato no
 * tema, cai no `acao` mais próximo (a mesma família de verde).
 */
const CELULAS = [
  { fundo: "bg-ouro", circulo: "bg-acao", tamanho: 226, posicao: { left: 0, top: 0 } },
  { fundo: "bg-anil", circulo: "bg-cartao", tamanho: 57, posicao: { left: 28, top: 28 } },
  { fundo: "bg-pagina", circulo: "bg-ouro", tamanho: 226, posicao: { left: -113, top: -113 } },
  { fundo: "bg-acao", circulo: "bg-cartao", tamanho: 113, posicao: { left: 0, top: -57 } },
  { fundo: "bg-ouro", circulo: "bg-anil", tamanho: 226, posicao: { left: -113, top: 0 } },
  { fundo: "bg-acao", circulo: "bg-ouro", tamanho: 113, posicao: { left: 0, top: 57 } },
  { fundo: "bg-anil", circulo: "bg-ouro", tamanho: 226, posicao: { left: 0, top: -113 } },
  { fundo: "bg-pagina", circulo: "bg-acao", tamanho: 226, posicao: { left: 0, top: 0 } },
  { fundo: "bg-acao", circulo: "bg-ouro", tamanho: 41, posicao: { left: 36, top: 36 } },
] as const;

const GARANTIAS = ["Sem custo", "No máximo 1 e-mail por dia", "Só quando houver novidade"];

/**
 * "Receba o edital no dia em que ele sair." (`Main.dc.html:380-407` e o fim de
 * `Mobile.dc.html`): a única chamada em amarelo da home.
 *
 * **O formulário é visual.** Não existe endpoint de alerta ainda (nenhuma
 * rota `/api` nem tabela cuida disso), então o envio, em vez de fingir que
 * cria um alerta, mostra o mesmo aviso "Em breve" de `BotaoEmBreve`, só que
 * disparado no `onSubmit` do formulário, e não no clique de um botão solto,
 * porque aqui o campo de e-mail é parte do gesto.
 */
export function BlocoAlerta({
  totalAbertos,
  compacto = false,
  titulo,
}: {
  totalAbertos?: number;
  /**
   * A versão de 24px de padding da lateral do concurso
   * (`Concurso.dc.html:248-255`): cartão único, sem a grade de células do
   * desktop nem a linha de garantias, com o título vindo de fora (o
   * "Avise-me de novas {área ou cargo}" de `LateralDoConcurso`) em vez do
   * "Receba o edital..." fixo da home.
   */
  compacto?: boolean;
  /** Só em `compacto`: substitui "Receba o edital no dia em que ele sair.". */
  titulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAberto(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAberto(false), 4000);
  }

  if (compacto) {
    return (
      <section className="relative flex flex-col gap-3.5 overflow-hidden rounded-[22px] bg-faixa p-6 text-white">
        <span
          aria-hidden="true"
          className="absolute -top-9 -right-9 size-[72px] rounded-full bg-ouro"
        />
        <div className="relative flex items-center gap-2 text-[12px] font-bold tracking-[0.06em] text-ouro">
          <Icone nome="alerta" tamanho={16} />
          ALERTA GRÁTIS
        </div>
        <h2 className="relative font-titulo text-[22px] leading-[1.15] font-bold tracking-[-0.02em]">
          {titulo ?? "Receba o edital no dia em que ele sair."}
        </h2>
        <form onSubmit={aoEnviar} className="relative flex flex-col gap-2.5">
          <label htmlFor="alerta-email-compacto" className="sr-only">
            Seu e-mail
          </label>
          <input
            id="alerta-email-compacto"
            name="email"
            type="email"
            placeholder="seu@email.com"
            className="h-12 rounded-[12px] border-0 bg-cartao px-3.5 text-[15px] text-tinta-900 outline-none placeholder:text-tinta-500"
          />
          <button
            type="submit"
            className="h-12 rounded-[12px] bg-cartao font-bold text-verde-texto shadow-[inset_0_0_0_2px_var(--color-ouro)]"
          >
            Criar alerta
          </button>
        </form>
        {aberto && (
          <AvisoFlutuante>Em breve: {RECURSOS_EM_BREVE.alertas.titulo}</AvisoFlutuante>
        )}
      </section>
    );
  }

  return (
    <section
      id="alerta"
      className="mx-4 mt-12 overflow-hidden rounded-[22px] bg-faixa text-white md:mx-[112px] md:mt-24 lg:flex lg:h-[340px] lg:rounded-[28px]"
    >
      <div className="relative flex flex-col gap-4 overflow-hidden p-6 lg:flex-grow lg:justify-center lg:gap-[18px] lg:p-0 lg:pl-14">
        {/* Duas bolhas soltas no celular, no lugar da grade de 9 do desktop. */}
        <span
          aria-hidden="true"
          className="absolute -right-10 -bottom-10 size-[110px] rounded-full bg-anil lg:hidden"
        />
        <span
          aria-hidden="true"
          className="absolute right-10 -bottom-[30px] size-[60px] rounded-full bg-ouro lg:hidden"
        />

        <div className="relative flex items-center gap-2.5 text-[13px] font-bold tracking-[0.06em] text-ouro">
          <Icone nome="alerta" tamanho={18} />
          ALERTA GRÁTIS
        </div>
        <h2 className="relative font-titulo text-[26px] leading-[1.1] font-bold tracking-[-0.03em] lg:text-[44px] lg:leading-[1.05]">
          Receba o edital no dia em que ele sair.
        </h2>

        <form onSubmit={aoEnviar} className="relative flex flex-col gap-2 lg:max-w-[620px] lg:flex-row lg:gap-2">
          <label htmlFor="alerta-email" className="sr-only">
            Seu e-mail
          </label>
          <div className="flex h-[52px] items-center gap-2.5 rounded-[13px] bg-cartao px-4 lg:h-14 lg:flex-grow lg:rounded-[14px]">
            <Icone nome="email" tamanho={20} className="hidden text-tinta-500 lg:block" />
            <input
              id="alerta-email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              className="min-w-0 flex-grow border-0 bg-transparent text-base text-tinta-900 outline-none placeholder:text-tinta-500 lg:text-[17px]"
            />
          </div>
          <button
            type="submit"
            className="h-[52px] shrink-0 rounded-[13px] bg-ouro px-6 font-bold text-ouro-texto lg:h-14 lg:rounded-[14px] lg:text-base"
          >
            Criar alerta
          </button>
        </form>

        <div className="relative text-[13px] text-faixa-texto lg:flex lg:gap-6 lg:text-sm">
          <span className="lg:hidden">{GARANTIAS.join(" · ")}</span>
          {GARANTIAS.map((garantia) => (
            <span key={garantia} className="hidden items-center gap-1.5 lg:flex">
              <Icone nome="check" tamanho={16} className="text-ouro" />
              {garantia}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden w-[340px] shrink-0 grid-cols-3 grid-rows-3 lg:grid">
        {CELULAS.map((celula, indice) => (
          <div key={indice} className={`relative overflow-hidden ${celula.fundo}`}>
            <span
              aria-hidden="true"
              className={`absolute rounded-full ${celula.circulo}`}
              style={{
                left: celula.posicao.left,
                top: celula.posicao.top,
                width: celula.tamanho,
                height: celula.tamanho,
              }}
            />
          </div>
        ))}
      </div>

      {aberto && (
        <AvisoFlutuante>
          Em breve: {RECURSOS_EM_BREVE.alertas.titulo} (avisaríamos sobre os {numero(totalAbertos ?? 0)} concursos
          abertos)
        </AvisoFlutuante>
      )}
    </section>
  );
}
