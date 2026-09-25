"use client";

import { useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useAtalhoDeBusca } from "@/components/busca/useAtalhoDeBusca";
import { Botao } from "@/components/ui/Botao";
import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import { UFS } from "@/lib/dominio";
import { ROTULO_ESCOLARIDADE, NOME_UF } from "@/lib/rotulos";
import { assinarUfLembrada, ufLembrada, ufLembradaNoServidor } from "@/lib/ufLembrada";

/**
 * O seletor do herói: um `<select>` de verdade, com a cara do botão do
 * protótipo (ícone, rótulo, seta). No celular vira uma caixa (`bg-rebaixada`,
 * `rounded-controle`, 46px); no desktop é só o texto dentro da cápsula da
 * busca, 52px, sem fundo próprio (`Main.dc.html:64-66`).
 *
 * **`md:w-[130px]` é largura fixa, não capricho.** Sem ela, o navegador
 * calcula a largura "automática" do `<select>` pela opção mais larga
 * ("Distrito Federal", "Fundamental incompleto"), não pela selecionada, e
 * esse valor não encolhe no `flex` como o resto da barra encolheria. Com os
 * dois seletores mais o botão de busca somando mais que a cápsula, a soma
 * ultrapassa os 700px da coluna, e o que sobra invade a área do mosaico, que
 * vem depois no HTML e pinta por cima: o botão "Buscar" ficava ali, no DOM,
 * clicável até, mas literalmente pintado embaixo do cartão flutuante, sem
 * erro nenhum no console. `truncate` (na classe do `<select>`) cobre o texto
 * que não cabe na largura fixa.
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
    <div className="flex h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-controle bg-rebaixada px-2 text-sm font-medium text-tinta-900 md:h-[52px] md:w-[130px] md:justify-start md:gap-2 md:bg-transparent md:px-1.5 md:text-[15px]">
      <Icone nome={icone} tamanho={18} className="text-verde shrink-0" />
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
 * **Sem `useRouter`.** `next/navigation` lança "invariant expected app
 * router to be mounted" quando chamado fora do `<AppRouterProvider>`
 * (`node_modules/next/dist/client/components/navigation.js`), inclusive no
 * teste deste componente (`Hero.test.ts` chama `renderToStaticMarkup` sem
 * provider nenhum, porque `Hero` é server component e o teste não monta uma
 * página inteira). O `<form action="/concursos" method="get">` nativo já
 * leva ao lugar certo com ou sem JavaScript: o servidor lê `q`, `uf` e
 * `escolaridade` da query string, e `proxy.ts` promove `/concursos?q=...`
 * para `/busca/<slug>` do mesmo jeito que faz pela barra do cabeçalho. Aqui
 * o JavaScript é só o atalho de teclado e a UF pré-marcada; a navegação em
 * si não precisa dele.
 */
export function BuscaDoHero() {
  const base = useId();
  const idCampo = `${base}-q`;
  const idUf = `${base}-uf`;
  const idEscolaridade = `${base}-escolaridade`;

  const campoDeTexto = useRef<HTMLInputElement>(null);
  useAtalhoDeBusca(campoDeTexto);

  const lembrada = useSyncExternalStore(assinarUfLembrada, ufLembrada, ufLembradaNoServidor);

  return (
    <form
      action="/concursos"
      method="get"
      role="search"
      className="mt-2 flex flex-col gap-2 rounded-cartao bg-cartao p-2 shadow-busca md:h-[72px] md:flex-row md:items-center md:gap-3 md:pl-5"
    >
      <div className="flex h-[52px] items-center gap-2.5 px-2.5 md:h-full md:flex-1 md:gap-3 md:px-0">
        <Icone nome="busca" tamanho={22} className="text-verde shrink-0" />
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
          className="hidden h-[26px] min-w-[26px] items-center justify-center rounded-[6px] bg-rebaixada px-1 text-[13px] font-semibold text-tinta-600 shadow-[inset_0_-1px_0_var(--color-contorno)] md:flex"
        >
          /
        </kbd>
      </div>

      <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-linha md:block" />

      <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0 md:items-center md:gap-3">
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

        <span aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-linha md:block" />

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
        className="w-full justify-center md:w-auto md:shrink-0"
      >
        <span className="md:hidden">Buscar concursos</span>
        <span className="hidden md:inline">Buscar</span>
      </Botao>
    </form>
  );
}
