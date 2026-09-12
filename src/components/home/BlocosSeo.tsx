import Link from "next/link";
import { Rotulo } from "@/components/ui/Etiqueta";
import type { LinkDeFaceta } from "@/lib/concursos";

/**
 * Os links internos do rodapé da home.
 *
 * Cada linha aqui é uma âncora de verdade para uma URL de busca já filtrada.
 * É o que distribui autoridade da home, que ranqueia por termo genérico,
 * para as combinações de filtro, que ranqueiam por cauda longa. Um menu com
 * JavaScript no lugar disto teria a mesma aparência e nenhum dos efeitos.
 */
function Coluna({
  titulo,
  links,
}: {
  titulo: string;
  links: LinkDeFaceta[];
}) {
  return (
    <nav aria-label={titulo} className="rounded-caixa bg-cartao p-4">
      <Rotulo>{titulo}</Rotulo>
      <ul className="mt-3 flex flex-col">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-baseline justify-between gap-3 rounded-controle px-2 py-1.5 text-sm text-tinta-800 transition-colors hover:bg-rebaixada"
            >
              <span className="truncate">{link.rotulo}</span>
              <span className="numero shrink-0 text-xs text-tinta-500">
                {link.total}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BlocosSeo({
  ufs,
  bancas,
  orgaos,
}: {
  ufs: LinkDeFaceta[];
  bancas: LinkDeFaceta[];
  orgaos: LinkDeFaceta[];
}) {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6">
      <h2 className="font-titulo text-[18px] leading-7 font-semibold tracking-[-0.01em]">
        Onde procurar
      </h2>
      <p className="mt-1 max-w-[70ch] text-[12px] leading-5 text-tinta-600">
        Os recortes mais buscados do acervo. O número ao lado é quantos
        concursos estão com inscrição aberta agora em cada um.
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Coluna titulo="Por estado" links={ufs} />
        <Coluna titulo="Por órgão" links={orgaos} />
        <Coluna titulo="Por banca" links={bancas} />
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <div className="rounded-caixa bg-cartao p-5">
          <h3 className="font-titulo text-lg font-semibold">
            De onde vêm estes dados
          </h3>
          <p className="mt-2 text-sm leading-6 text-tinta-600">
            Um robô visita todos os dias as bancas organizadoras e os diários
            oficiais, baixa cada edital publicado e extrai dele o cargo, o
            número de vagas, a remuneração, a taxa e o cronograma. Cada campo
            que aparece nesta página guarda a referência do arquivo que o
            originou, então dá para conferir a informação no documento
            original em vez de acreditar na nossa palavra.
          </p>
        </div>
        <div className="rounded-caixa bg-cartao p-5">
          <h3 className="font-titulo text-lg font-semibold">
            Como usar a busca
          </h3>
          <p className="mt-2 text-sm leading-6 text-tinta-600">
            Digite o cargo que você quer, o nome do órgão ou a sigla da banca.
            Combine com o estado para ver só o que dá para prestar perto de
            casa, e use os filtros de escolaridade e salário para cortar o
            que não serve. Cada combinação vira um endereço próprio, que você
            pode salvar nos favoritos ou transformar em alerta por e-mail.
          </p>
        </div>
      </div>
    </section>
  );
}
