import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { BotaoLink } from "@/components/ui/Botao";
import { Menu } from "@/components/ui/Revelador";
import { SeletorDeTema } from "./SeletorDeTema";

/**
 * Só entra aqui o que existe.
 *
 * Havia mais três itens — "Meus alertas", "Notícias" e "Planos" —, e os três
 * apontavam para `/concursos` com um filtro diferente, porque a feature não
 * existe. Um menu que promete alerta e entrega uma busca filtrada é a mesma
 * falha que este projeto passou o dia consertando do lado do dado: afirmar o
 * que não se tem. Custa mais que um link morto, porque quem clicou uma vez
 * aprende a não clicar de novo.
 *
 * Quando alguma delas existir, volta — com o endereço dela, não com um
 * filtro fingindo ser ela.
 */
const NAVEGACAO = [{ rotulo: "Concursos", href: "/concursos" }];

/**
 * O gatilho do menu da conta.
 *
 * Traço e não preenchimento, como os três ícones do seletor de tema, para não
 * abrir uma segunda família de desenho num cabeçalho que tem um símbolo só.
 */
function Avatar() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <circle cx="10" cy="7" r="3.1" />
      <path d="M3.9 16.5a6.4 6.4 0 0 1 12.2 0" />
    </svg>
  );
}

/**
 * Cabeçalho.
 *
 * **Entrar, criar conta e tema saíram da barra e viraram um menu de avatar**,
 * a pedido do parceiro humano. Os três estavam escritos duas vezes — na barra
 * do desktop e, repetidos, dentro do menu sanduíche do celular —, e agora
 * estão num lugar só, que aparece nas duas larguras. O sanduíche fica com o
 * que é dele: a navegação.
 *
 * O rótulo do gatilho é "Entrar, criar conta e tema" e não "conta" ou "perfil"
 * porque é o que há dentro. Quem não vê o desenho ouve a lista, não uma
 * promessa: não existe autenticação neste produto, e "Entrar" e "Criar conta"
 * apontam os dois para `/concursos`.
 *
 * **Os dois menus são `ui/Revelador`**, e não `<details>` escritos aqui. Era
 * `<details>` cru até esta linha, e funcionava: abre e fecha sem JavaScript,
 * com teclado e leitor de tela incluídos. O que ele não fazia era fechar com
 * Escape, fechar com clique fora, devolver o foco ao gatilho e animar — e
 * essas quatro coisas passaram a existir escritas uma vez só, em
 * `components/ui/`. O `<details>` continua sendo o mecanismo por baixo, então
 * o menu continua abrindo sem script.
 *
 * O corte entre as duas formas do cabeçalho é `md`, e é um só. Ele estava em
 * dois lugares diferentes: o menu sanduíche saía em `md` e a barra de ações
 * entrava em `sm`, então entre 640 e 768 px apareciam as duas formas ao mesmo
 * tempo — dois seletores de tema e dois pares de Entrar/Criar conta na mesma
 * linha. Com o menu da conta único nas duas larguras, esse empate não tem mais
 * como voltar: só a navegação troca de forma em `md`.
 */
export function Cabecalho() {
  return (
    <header className="bg-cartao">
      <div className="mx-auto flex max-w-[1240px] items-center gap-x-8 px-4 py-2.5 sm:px-6">
        <Link href="/" aria-label="BuscaConcurso, página inicial">
          <Logo tamanho={26} />
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {NAVEGACAO.map((item) => (
              <li key={item.rotulo}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-tinta-600 hover:text-tinta-900"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* A navegação do celular. Some em `md`, onde ela já está na barra. */}
          <Menu
            className="md:hidden"
            rotulo="Abrir menu"
            gatilhoClassName="size-10 justify-center rounded-controle bg-rebaixada text-tinta-900 transition-colors hover:bg-tinta-200"
            painelClassName="w-56"
            gatilho={
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            }
          >
            <nav aria-label="Principal">
              <ul className="flex flex-col">
                {NAVEGACAO.map((item) => (
                  <li key={item.rotulo}>
                    <Link
                      href={item.href}
                      className="block rounded-controle px-3 py-2 text-sm font-medium text-tinta-800 hover:bg-rebaixada"
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Menu>

          {/* A conta e o tema, nas duas larguras. A ordem de dentro é a mesma
              que a barra do desktop tinha: tema, entrar, criar conta. */}
          <Menu
            rotulo="Entrar, criar conta e tema"
            gatilhoClassName="size-10 justify-center rounded-full bg-rebaixada text-tinta-800 transition-colors hover:bg-tinta-200"
            painelClassName="w-56"
            gatilho={<Avatar />}
          >
            <div className="flex items-center justify-between p-2">
              <span className="text-[13px] font-medium text-tinta-600">
                Tema
              </span>
              <SeletorDeTema />
            </div>
            <div className="mt-1 flex gap-2 p-1">
              <BotaoLink
                href="/concursos"
                variante="secundario"
                tamanho="sm"
                className="flex-1"
              >
                Entrar
              </BotaoLink>
              <BotaoLink
                href="/concursos"
                variante="primario"
                tamanho="sm"
                className="flex-1"
              >
                Criar conta
              </BotaoLink>
            </div>
          </Menu>
        </div>
      </div>
    </header>
  );
}
