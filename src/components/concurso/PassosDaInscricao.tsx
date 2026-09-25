"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Icone } from "@/components/ui/Icone";
import type { Passo } from "@/lib/inscricao";

function chave(slug: string): string {
  return `buscaconcurso.passos.${slug}`;
}

/** `try/catch` na leitura: modo privado, cota estourada ou sem `localStorage`
 * não podem derrubar a lista, só deixá-la sem nada marcado. */
function lerBruto(slug: string): string | null {
  try {
    return window.localStorage.getItem(chave(slug));
  } catch {
    return null;
  }
}

function interpretar(bruto: string | null): number[] {
  if (!bruto) return [];
  try {
    const valores: unknown = JSON.parse(bruto);
    return Array.isArray(valores) ? valores.filter((v): v is number => typeof v === "number") : [];
  } catch {
    return [];
  }
}

/**
 * O "estado externo" que `useSyncExternalStore` observa: um por `slug`, com
 * um pequeno cache para devolver a MESMA referência de array quando o
 * `localStorage` não mudou desde a última leitura: sem isso, `getSnapshot`
 * devolveria um array novo a cada render e `useSyncExternalStore` entraria
 * num loop, achando a cada vez que a loja tinha mudado.
 */
const ouvintesPorSlug = new Map<string, Set<() => void>>();
const cachePorSlug = new Map<string, { bruto: string | null; valor: number[] }>();

function ouvintesDoSlug(slug: string): Set<() => void> {
  let conjunto = ouvintesPorSlug.get(slug);
  if (!conjunto) {
    conjunto = new Set();
    ouvintesPorSlug.set(slug, conjunto);
  }
  return conjunto;
}

function instantaneo(slug: string): number[] {
  const bruto = lerBruto(slug);
  const cache = cachePorSlug.get(slug);
  if (cache && cache.bruto === bruto) return cache.valor;
  const valor = interpretar(bruto);
  cachePorSlug.set(slug, { bruto, valor });
  return valor;
}

/** No servidor não há `localStorage`: tudo sai desmarcado, sempre a mesma referência. */
const SEM_MARCADOS: number[] = [];
function instantaneoNoServidor(): number[] {
  return SEM_MARCADOS;
}

function alternarNoStorage(slug: string, indice: number): void {
  const atual = instantaneo(slug);
  const proximo = atual.includes(indice) ? atual.filter((i) => i !== indice) : [...atual, indice];
  const bruto = JSON.stringify(proximo);
  try {
    window.localStorage.setItem(chave(slug), bruto);
  } catch {
    // Sem `localStorage` (modo privado, cota estourada): o passo continua
    // marcável na sessão (o cache abaixo guarda o valor), só não sobrevive a
    // um recarregamento.
  }
  cachePorSlug.set(slug, { bruto, valor: proximo });
  for (const ouvir of ouvintesDoSlug(slug)) ouvir();
}

/**
 * "PARA SE INSCREVER", `Concurso.dc.html:225-233`: um passo por linha, cada
 * um um botão que alterna marcado/desmarcado. O estado é só do navegador
 * (não muda nada no servidor, não é progresso de inscrição de verdade), e por
 * isso mora inteiro em `localStorage`, por concurso (a chave leva o `slug`).
 *
 * `useSyncExternalStore`, não `useState` + `useEffect`: o mesmo problema que
 * `SeletorDeTema` já resolve para o tema (`lib/tema.ts`), ler o
 * `localStorage` teria que esperar a hidratação para não divergir do HTML do
 * servidor (que não tem acesso a ele), e `useSyncExternalStore` é o hook que
 * faz essa troca sem o efeito colateral de chamar `setState` de dentro de um
 * `useEffect`.
 */
export function PassosDaInscricao({
  slug,
  passos,
}: {
  slug: string;
  passos: Passo[];
}) {
  const assinar = useCallback(
    (ouvir: () => void) => {
      const conjunto = ouvintesDoSlug(slug);
      conjunto.add(ouvir);
      return () => conjunto.delete(ouvir);
    },
    [slug],
  );
  const marcados = useSyncExternalStore(
    assinar,
    () => instantaneo(slug),
    instantaneoNoServidor,
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-1.5 text-[12px] font-bold tracking-[0.05em] text-tinta-500">
        PARA SE INSCREVER
      </div>
      {passos.map((passo, indice) => {
        const feito = marcados.includes(indice);
        return (
          <button
            key={indice}
            type="button"
            aria-pressed={feito}
            onClick={() => alternarNoStorage(slug, indice)}
            className="flex items-start gap-3 py-2 text-left"
          >
            <span
              aria-hidden="true"
              className={`flex size-6 shrink-0 items-center justify-center rounded-[7px] border-2 ${
                feito ? "border-acao bg-acao text-acao-texto" : "border-contorno bg-cartao text-tinta-900"
              }`}
            >
              {feito && <Icone nome="check" tamanho={13} traco={3} />}
            </span>
            <span
              className={`text-sm leading-[1.45] ${
                feito ? "text-tinta-600 line-through" : "text-tinta-900"
              }`}
            >
              <strong className="font-semibold">{passo.titulo}</strong> {passo.detalhe}
            </span>
          </button>
        );
      })}
    </div>
  );
}
