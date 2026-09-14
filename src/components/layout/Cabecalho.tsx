import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { BotaoLink } from "@/components/ui/Botao";
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
 * Cabeçalho.
 *
 * No celular a navegação vira um `<details>`: é um elemento de revelar e
 * esconder que o navegador já sabe operar, com teclado e leitor de tela
 * incluídos, e que funciona sem uma linha de JavaScript. Trocá-lo por um
 * botão com estado só faria sentido se o menu precisasse animar ou fechar
 * sozinho, e ele não precisa.
 *
 * O corte entre as duas formas do cabeçalho é `md`, e é um só. Ele estava em
 * dois lugares diferentes: o menu sanduíche saía em `md` e a barra de ações
 * entrava em `sm`, então entre 640 e 768 px apareciam as duas formas ao mesmo
 * tempo — dois seletores de tema e dois pares de Entrar/Criar conta na mesma
 * linha. Com um corte só, os botões de dentro do menu também deixam de
 * precisar de marca própria: o `<details>` inteiro já some em `md`. Quem
 * mexer aqui precisa mover a navegação e a barra de ações juntas, senão
 * alguma faixa de largura volta a ficar com as duas formas ou com nenhuma.
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

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <SeletorDeTema className="mr-1" />
          <BotaoLink href="/concursos" variante="fantasma" tamanho="sm">
            Entrar
          </BotaoLink>
          <BotaoLink href="/concursos" variante="primario" tamanho="sm">
            Criar conta
          </BotaoLink>
        </div>

        <details className="group relative ml-auto md:hidden">
          <summary
            aria-label="Abrir menu"
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-controle bg-rebaixada text-tinta-900 hover:bg-tinta-200 [&::-webkit-details-marker]:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5">
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </summary>

          <nav
            aria-label="Principal"
            className="absolute right-0 z-10 mt-2 w-56 rounded-caixa bg-cartao p-2"
          >
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
              <li className="mt-1 flex items-center justify-between p-2">
                <span className="text-[13px] font-medium text-tinta-600">
                  Tema
                </span>
                <SeletorDeTema />
              </li>
              <li className="mt-1 flex gap-2 p-1">
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
              </li>
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
