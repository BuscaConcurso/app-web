import Link from "next/link";
import { Icone } from "@/components/ui/Icone";
import type { DiaDoFeed } from "@/lib/diarioOficial";
import { estiloDoAto } from "@/lib/estiloDoAto";
import { nomeCurtoDoOrgao } from "@/lib/orgaos";
import { tituloDoAto, tituloSemOrgao } from "@/lib/rotulos";

/**
 * Os atos do Diário em blocos por dia. Cada linha: o ícone do status do
 * concurso (o mesmo de "Saiu no DOU" na home, `estiloDoAto`), a sigla do
 * órgão com o título do ato, o concurso e o link para ler o ato no DOU
 * quando a listagem guardou o endereço. Sem endereço, sem link: um "Ler no
 * DOU" que não leva a lugar nenhum é texto com cara de link.
 */
export function FeedDoDiario({ dias }: { dias: DiaDoFeed[] }) {
  return (
    <div className="flex flex-col gap-4">
      {dias.map((dia) => (
        <section key={dia.data} className="rounded-[20px] bg-cartao p-5 shadow-cartao md:p-7">
          <h2 className="font-titulo text-[1.25rem] leading-[1.1] font-bold tracking-[-0.02em] md:text-[1.5rem]">
            <time dateTime={dia.data}>{dia.rotulo}</time>
          </h2>
          <ul className="mt-3 flex flex-col">
            {dia.atos.map((ato, indice) => {
              const { concurso } = ato;
              const estilo = estiloDoAto(concurso.status);
              // Órgão vazio é o concurso sem órgão resolvido (`resumo` da API).
              const sigla = concurso.orgao.nome ? nomeCurtoDoOrgao(concurso.orgao) : null;
              const titulo = tituloDoAto(ato.titulo?.trim() || concurso.titulo);
              const doConcurso = tituloDoAto(tituloSemOrgao(concurso.titulo, concurso.orgao)) || concurso.titulo;
              return (
                // O índice entra na chave: o mesmo concurso tem vários atos no
                // mesmo dia, e a API não expõe o id do ato.
                <li
                  key={`${concurso.slug}-${indice}`}
                  className="flex items-start gap-3.5 border-t border-linha-fraca py-3.5"
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${estilo.classe}`}>
                    <Icone nome={estilo.icone} tamanho={18} />
                  </span>
                  <div className="min-w-0 flex-grow">
                    <p className="text-[0.9375rem] font-bold break-words text-tinta-900">
                      {sigla ? `${sigla} · ${titulo}` : titulo}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8125rem]">
                      <Link
                        href={`/concursos/${concurso.slug}`}
                        className="min-w-0 max-w-full truncate text-tinta-600 underline-offset-4 hover:text-tinta-900 hover:underline"
                      >
                        {doConcurso}
                      </Link>
                      {ato.url && (
                        <a
                          href={ato.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex shrink-0 items-center gap-1 font-semibold text-tinta-900 hover:text-verde-texto"
                        >
                          Ler no DOU
                          <Icone nome="externo" tamanho={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
