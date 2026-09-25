"use client";

import { useId, useRef, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAtalhoDeBusca } from "@/components/busca/useAtalhoDeBusca";
import { Botao } from "@/components/ui/Botao";
import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import type { Escolaridade } from "@/lib/dominio";
import { UFS } from "@/lib/dominio";
import { CONSULTA_VAZIA, urlDaBusca } from "@/lib/parametros";
import { ROTULO_ESCOLARIDADE, NOME_UF } from "@/lib/rotulos";
import { assinarUfLembrada, ufLembrada, ufLembradaNoServidor } from "@/lib/ufLembrada";

const ESCOLARIDADES_VALIDAS = Object.keys(ROTULO_ESCOLARIDADE) as Escolaridade[];

/**
 * O destino da busca do herói: o mesmo que `destinoDoFormulario`
 * (`src/lib/parametros.ts`) usa para a barra do cabeçalho, com a
 * escolaridade do herói somada por cima quando escolhida.
 *
 * Função pura (sem `useRouter`) de propósito: é o que o teste consegue
 * conferir sem montar componente nenhum, e é o que `aoEnviar` chama antes de
 * `router.push`.
 */
export function destinoDaBuscaDoHero(q: string, uf: string, escolaridade: string): string {
  return urlDaBusca(CONSULTA_VAZIA, {
    q: q.trim() || undefined,
    uf: (UFS as readonly string[]).includes(uf) ? (uf as (typeof UFS)[number]) : undefined,
    escolaridades: ESCOLARIDADES_VALIDAS.includes(escolaridade as Escolaridade)
      ? [escolaridade as Escolaridade]
      : [],
  });
}

/**
 * O seletor do herói: um `<select>` de verdade, com a cara do botão do
 * protótipo (ícone, rótulo, seta). No celular vira uma caixa (`bg-rebaixada`,
 * `rounded-controle`, 46px); no desktop é só o texto dentro da cápsula da
 * busca, 52px, sem fundo próprio (`Main.dc.html:64-66`).
 *
 * **`lg:w-[148px]` é largura fixa, medida, não capricho.** Sem largura
 * própria, o navegador calcula a largura "automática" do `<select>` pela
 * opção mais larga ("Distrito Federal", "Fundamental incompleto"), não pela
 * selecionada, e esse valor não encolhe no `flex` como o resto da barra
 * encolheria: com os dois seletores mais o botão de busca somando mais que
 * a cápsula, a soma ultrapassava os 700px da coluna, e o que sobrava
 * invadia a área do mosaico, que vem depois no HTML e pinta por cima. O
 * botão "Buscar" ficava ali, no DOM, clicável até, mas literalmente
 * pintado embaixo do cartão flutuante, sem erro nenhum no console.
 *
 * O valor 148px não é arredondado: medi (screenshot + varredura de pixel)
 * o texto de cada rótulo padrão ("Todo o Brasil",
 * "Escolaridade") no tamanho real do herói (`Public Sans` 500, 15px), que dá
 * ~89px para o mais largo dos dois, e somei ícone + vão + texto + vão + seta
 * + o `px-1` da caixa, com uma folga pequena. Cabe os dois rótulos padrão
 * inteiros e ainda deixa o botão "Buscar" (com a seta) inteiro dentro dos
 * 700px; para isso também apertei os vãos do formulário (`gap-2` em vez de
 * `gap-3`) e o vão entre os dois seletores e o botão
 * (`lg:mr-[-8px]` no grupo). `truncate` cobre só o que passa disso: um
 * estado, ou uma escolaridade, mais longa que o rótulo padrão.
 */
function SeletorDoHero({
  id,
  nome,
  icone,
  rotulo,
  defaultValue,
  children,
}: {
  id: string;
  nome: string;
  icone: NomeDoIcone;
  rotulo: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-controle bg-rebaixada px-2 text-sm font-medium text-tinta-900 lg:h-[52px] lg:w-[148px] lg:justify-start lg:gap-1.5 lg:bg-transparent lg:px-1 lg:text-[15px]">
      <Icone nome={icone} tamanho={18} className="shrink-0 text-verde-texto" />
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <select
        id={id}
        name={nome}
        defaultValue={defaultValue}
        autoComplete="off"
        className="h-full min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent outline-none"
      >
        {children}
      </select>
      <Icone
        nome="abaixo"
        tamanho={16}
        className="pointer-events-none shrink-0 text-tinta-500"
      />
    </div>
  );
}

/**
 * A busca do herói: `Main.dc.html:60-70` no desktop, o começo de
 * `Mobile.dc.html` no celular (campo, depois UF e escolaridade lado a lado,
 * depois o botão de largura total).
 *
 * A busca em todo o site é navegação SPA (`docs/superpowers/specs/
 * 2026-09-24-busca-e-home-design.md`), a mesma regra de
 * `BarraBusca.tsx`: o `onSubmit` chama `router.push`, sem recarregar a
 * página. `action`/`method` continuam no `<form>` como o esqueleto sem
 * JavaScript (mesma filosofia da barra do cabeçalho): com JavaScript
 * desligado, o navegador ainda submete para `/concursos?q=...`, e
 * `proxy.ts` promove para `/busca/<slug>`.
 *
 * `Hero` continua server component: `Hero.test.ts` mocka `next/navigation`
 * para este componente cliente poder chamar `useRouter()` num
 * `renderToStaticMarkup` sem `<AppRouterProvider>` nenhum.
 */
export function BuscaDoHero() {
  const router = useRouter();
  const base = useId();
  const idCampo = `${base}-q`;
  const idUf = `${base}-uf`;
  const idEscolaridade = `${base}-escolaridade`;

  const campoDeTexto = useRef<HTMLInputElement>(null);
  useAtalhoDeBusca(campoDeTexto);

  const lembrada = useSyncExternalStore(assinarUfLembrada, ufLembrada, ufLembradaNoServidor);

  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    router.push(
      destinoDaBuscaDoHero(
        String(dados.get("q") ?? ""),
        String(dados.get("uf") ?? ""),
        String(dados.get("escolaridade") ?? ""),
      ),
    );
  };

  return (
    <form
      action="/concursos"
      method="get"
      role="search"
      onSubmit={aoEnviar}
      className="mt-2 flex flex-col gap-2 rounded-cartao bg-cartao p-2 shadow-busca lg:h-[72px] lg:flex-row lg:items-center lg:gap-2 lg:pl-5"
    >
      <div className="flex h-[52px] min-w-0 items-center gap-2.5 px-2.5 lg:h-full lg:flex-1 lg:gap-3 lg:px-0">
        <Icone nome="busca" tamanho={22} className="shrink-0 text-verde-texto" />
        <label htmlFor={idCampo} className="sr-only">
          Cargo, órgão ou banca
        </label>
        <input
          ref={campoDeTexto}
          id={idCampo}
          name="q"
          type="text"
          placeholder="Cargo, órgão ou banca"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-lg text-tinta-900 outline-none placeholder:text-tinta-500"
        />
        <kbd
          aria-hidden="true"
          className="hidden h-[26px] min-w-[26px] items-center justify-center rounded-[6px] bg-rebaixada px-1 text-[13px] font-semibold text-tinta-600 shadow-[inset_0_-1px_0_var(--color-contorno)] lg:flex"
        >
          /
        </kbd>
      </div>

      <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-linha lg:block" />

      <div className="grid grid-cols-2 gap-2 lg:mr-[-8px] lg:flex lg:shrink-0 lg:items-center lg:gap-2">
        <SeletorDoHero
          id={idUf}
          nome="uf"
          icone="local"
          rotulo="Estado"
          defaultValue={lembrada ?? ""}
        >
          <option value="">Todo o Brasil</option>
          {UFS.map((sigla) => (
            <option key={sigla} value={sigla}>
              {NOME_UF[sigla]}
            </option>
          ))}
        </SeletorDoHero>

        <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-linha lg:block" />

        <SeletorDoHero
          id={idEscolaridade}
          nome="escolaridade"
          icone="educacao"
          rotulo="Escolaridade"
          defaultValue=""
        >
          <option value="">Escolaridade</option>
          {Object.entries(ROTULO_ESCOLARIDADE).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </SeletorDoHero>
      </div>

      <Botao
        type="submit"
        variante="chamada"
        tamanho="xl"
        iconeDepois="seta"
        className="w-full justify-center lg:w-auto lg:shrink-0"
      >
        <span className="lg:hidden">Buscar concursos</span>
        <span className="hidden lg:inline">Buscar</span>
      </Botao>
    </form>
  );
}
