import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Logo } from "@/components/marca/Logo";
import { LogoGvTechLab } from "@/components/marca/LogoGvTechLab";
import { urlDoCargo, type CargoMedido } from "@/lib/cargos";
import { cargosEscolhidos, facetas, type LinkDeFaceta } from "@/lib/concursos";
import { hrefEmBreve } from "@/lib/emBreve";
import { hojeCivilEmSaoPaulo } from "@/lib/formato";

const LIMITE_DE_CARGOS_NO_RODAPE = 8;
const LIMITE_DE_UFS_NO_RODAPE = 8;

const COLUNA_BUSCAR = [
  { rotulo: "Abertos", href: "/concursos?situacao=abertas" },
  { rotulo: "Previstos", href: "/concursos?situacao=previstos" },
  { rotulo: "Diário Oficial", href: hrefEmBreve("diario-oficial") },
  { rotulo: "Por área", href: hrefEmBreve("areas") },
];

const COLUNA_SOBRE = [
  { rotulo: "Como lemos os editais", href: hrefEmBreve("como-lemos") },
  { rotulo: "Design system", href: "/estilo" },
  { rotulo: "Acessibilidade", href: hrefEmBreve("acessibilidade") },
  { rotulo: "Contato", href: hrefEmBreve("contato") },
];

/**
 * Os 8 primeiros cargos mais buscados, ou lista vazia quando o acervo não
 * responde.
 *
 * O rodapé mora no layout raiz, em toda página, e o layout raiz não pode
 * lançar (ver `acervoDoLayout` em `src/app/layout.tsx`, e o porquê lá:
 * `error.tsx` não alcança o que o próprio `layout.tsx` renderiza
 * diretamente). Sob a regra R3 de `concursos.ts`, a API fora do ar sem
 * leitura boa guardada lança, e `cargosEscolhidos()` lê o mesmo acervo. Sem
 * este envoltório, uma falha aqui derrubaria o site inteiro pelo rodapé.
 */
async function cargosDoRodape(): Promise<CargoMedido[]> {
  try {
    return (await cargosEscolhidos()).slice(0, LIMITE_DE_CARGOS_NO_RODAPE);
  } catch (erro) {
    // Sinal do próprio Next (ver o mesmo comentário em `lerAcervoDaApi`,
    // `src/lib/concursos.ts`) não é falha do acervo e segue para cima, sem
    // virar `[]` nem log.
    unstable_rethrow(erro);
    console.error(
      "[rodape] acervo indisponível para medir os cargos mais buscados; a " +
        "coluna some.",
      erro,
    );
    return [];
  }
}

/**
 * As UFs com mais abertos, só para a linha "Por estado" do rodapé do
 * celular (ver `PorEstado.tsx`): com o mapa inteiro escondido a partir de
 * `md`, `BlocosSeo` removido levaria os links de UF junto, e é esse SEO que
 * esta linha substitui. O mesmo envoltório de `cargosDoRodape`, pelo mesmo
 * motivo: o rodapé mora no layout raiz e não pode derrubar o site inteiro
 * por causa de uma coluna a mais.
 */
async function ufsDoRodape(): Promise<LinkDeFaceta[]> {
  try {
    return (await facetas(hojeCivilEmSaoPaulo())).ufs.slice(0, LIMITE_DE_UFS_NO_RODAPE);
  } catch (erro) {
    unstable_rethrow(erro);
    console.error(
      "[rodape] acervo indisponível para os links de UF do celular; a linha some.",
      erro,
    );
    return [];
  }
}

const CLASSE_DO_TITULO = "text-[12px] font-bold tracking-[0.06em] text-tinta-500 uppercase";
const CLASSE_DO_LINK = "block text-[15px] break-words text-tinta-600 hover:text-tinta-900";

function ColunaDeLinks({
  titulo,
  links,
}: {
  titulo: string;
  links: { rotulo: string; href: string }[];
}) {
  return (
    <nav aria-label={titulo} className="min-w-0">
      <p className={CLASSE_DO_TITULO}>{titulo}</p>
      <ul className="mt-3 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.rotulo} className="min-w-0">
            <Link href={link.href} className={CLASSE_DO_LINK}>
              {link.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * `async` por causa dos cargos, que saem de uma medição do acervo (ver
 * `cargosDoRodape()`).
 *
 * `bg-cartao` e não um token de rodapé próprio: o rodapé do desenho novo é
 * branco (`Main.dc.html:412` usa `#EFECE3` só na faixa final; o corpo é o
 * mesmo papel de cartão do resto da página), então ele lê os tokens comuns
 * de superfície e texto, como qualquer outro bloco.
 *
 * `atualizadoEm` chega pronto de `src/app/layout.tsx`, a mesma regra da
 * `BarraUtilitaria`: `dataCurta(hojeEmSaoPaulo())` quando o acervo veio da
 * API, `null` quando não. Sem isso, "Acervo atualizado em hoje" seria uma
 * data que o mock não sustenta.
 */
export async function Rodape({
  atualizadoEm,
}: {
  atualizadoEm: string | null;
}) {
  const [cargos, ufs] = await Promise.all([cargosDoRodape(), ufsDoRodape()]);
  const cargosLinks = cargos.map((cargo) => ({
    rotulo: cargo.rotulo,
    href: urlDoCargo(cargo),
  }));

  return (
    <footer className="mt-24 border-t border-linha bg-cartao">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-14 md:px-[112px]">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="flex max-w-[360px] flex-col gap-3.5">
            <Logo tamanho={32} />
            <p className="text-[15px] leading-[1.55] text-tinta-600">
              Concursos públicos abertos no Brasil, lidos direto do edital.
              Feito no Brasil.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10 md:gap-[72px]">
            <ColunaDeLinks titulo="Buscar" links={COLUNA_BUSCAR} />
            {cargos.length > 0 && (
              <ColunaDeLinks titulo="Cargos mais buscados" links={cargosLinks} />
            )}
            <ColunaDeLinks titulo="Sobre" links={COLUNA_SOBRE} />
          </div>
        </div>

        {/* Só no celular: o mapa de `PorEstado` (`components/home/PorEstado.tsx`)
            some a partir de `md`, e `BlocosSeo` (removido nesta task) levava
            os links de UF junto. Esta linha é o que sobra deles no rodapé do
            celular, para o SEO por estado não desaparecer. */}
        {ufs.length > 0 && (
          <nav aria-label="Por estado" className="min-w-0 sm:hidden">
            <p className={CLASSE_DO_TITULO}>Por estado</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ufs.map((uf) => (
                <li key={uf.href}>
                  <Link
                    href={uf.href}
                    className="flex items-center gap-1.5 rounded-full bg-rebaixada px-3 py-1.5 text-[13px] text-tinta-900"
                  >
                    {uf.rotulo}
                    <span className="numero text-tinta-500">{uf.total}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* O aviso legal e o crédito, de volta depois da revisão (R14): a
            versão anterior deste rodapé já tinha os dois, e o desenho novo
            só não veio com um artboard que os mostrasse. Restilizados nos
            tokens do canvas novo (`text-tinta-600`, pequeno), mas a palavra
            é a mesma de antes (`git show 2b91305:src/components/layout/Rodape.tsx`). */}
        <div className="flex flex-col gap-4 border-t border-linha pt-6 text-[13px] text-tinta-600">
          <p>
            BuscaConcurso não organiza concursos. Confira sempre o edital
            original no diário oficial ou no site da banca antes de se
            inscrever.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <span>
              © 2026 BuscaConcurso
              {atualizadoEm !== null && ` · Acervo atualizado em ${atualizadoEm}`}
            </span>

            {/* Quem responde pelo site. Os dados são os do cadastro público
                do CNPJ na Receita Federal (situação ativa em 14/09/2026);
                mudou o endereço lá, muda aqui. */}
            <div>
              <a
                href="https://gvtechlab.com.br/"
                className="inline-flex items-center gap-2 font-semibold hover:text-tinta-900"
              >
                <LogoGvTechLab tamanho={18} />
                Desenvolvido por GV Tech Lab
              </a>
              <address className="mt-2 text-xs leading-5 not-italic">
                GV TECH LAB LTDA · CNPJ 50.810.346/0001-23
                <br />
                Av. Brig. Faria Lima, 1811, Sala 1119 · Jardim Paulistano · São
                Paulo/SP · CEP 01452-001
                <br />
                <a
                  href="mailto:contato@gvtechlab.com.br"
                  className="hover:text-tinta-900"
                >
                  contato@gvtechlab.com.br
                </a>
              </address>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
