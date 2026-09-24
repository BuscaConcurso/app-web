import Link from "next/link";
import { BarraBuscaDoCabecalho } from "@/components/busca/BarraBusca";
import { Logo } from "@/components/marca/Logo";
import type { DimensoesDoAcervo } from "@/lib/concursos";
import { MenuConta } from "./MenuConta";

/**
 * O gatilho do menu.
 *
 * Era uma silhueta de pessoa, e virou o traço de menu a pedido do parceiro
 * humano. A troca fecha um problema que a silhueta tinha: **avatar é, por
 * convenção, o sinal de que existe uma conta**, e não existe autenticação
 * neste produto: "Entrar" e "Criar conta" apontam os dois para `/concursos`.
 * O símbolo prometia com mais força que os dois links que ele substituiu. O
 * traço de menu não promete nada: diz que há coisas ali dentro, que é
 * exatamente o que há.
 *
 * Traço e não preenchimento, como os três ícones do seletor de tema, para não
 * abrir uma segunda família de desenho num cabeçalho que tem um símbolo só.
 */
/**
 * Cabeçalho.
 *
 * **A barra de busca mora aqui, em toda página.** Pedido do usuário: buscar
 * não pode depender de voltar à home. A partir de `md` ela fica inline, entre
 * o logotipo e o menu; abaixo disso desce para uma linha própria, sempre
 * visível, sem nada para abrir antes. A grade de três colunas é o que faz a
 * troca sem duplicar a barra: no celular ela ocupa a segunda linha inteira
 * (`col-span-3`), e no desktop a coluna do meio. `minmax(0,1fr)` e `min-w-0`
 * são o que impede a barra de esticar a página no celular, porque item de
 * grade nasce com a largura mínima do conteúdo.
 *
 * **Um menu só, com entrar, criar conta e tema dentro.** Os três estavam
 * escritos duas vezes (na barra do desktop e, repetidos, no menu sanduíche do
 * celular), e agora estão num lugar só, que aparece nas duas larguras.
 *
 * **A navegação saiu inteira**, a pedido do parceiro humano. Três itens
 * foram removidos antes por prometerem feature que não existe, e o último,
 * "Concursos", saiu porque a barra de busca já leva à lista: um link de topo
 * para `/concursos` ao lado dela era um segundo caminho para o mesmo lugar.
 *
 * O rótulo do gatilho é "Entrar, criar conta e tema" e não "conta", "perfil"
 * ou "menu" porque é o que há dentro. Quem não vê o desenho ouve a lista, não
 * uma promessa.
 *
 * **O menu é `ui/Revelador`**, e não `<details>` escritos aqui: fechar com
 * Escape, fechar com clique fora, devolver o foco ao gatilho e animar estão
 * escritos uma vez só, em `components/ui/`. O `<details>` continua sendo o
 * mecanismo por baixo, então o menu continua abrindo sem script. E é
 * `Gaveta`, não `Menu`, a pedido do parceiro humano: a modalidade é o que faz
 * a escolha ser a única coisa na tela. A gaveta entra pela direita, que é
 * onde o gatilho está, na largura `estreita`.
 */
export function Cabecalho({ dimensoes }: { dimensoes: DimensoesDoAcervo }) {
  return (
    <header className="bg-cartao">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 md:gap-x-8">
        <Link
          href="/"
          aria-label="BuscaConcurso, página inicial"
          className="col-start-1 row-start-1 flex items-center"
        >
          <Logo tamanho={26} />
        </Link>
        <div className="col-span-3 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
          <BarraBuscaDoCabecalho dimensoes={dimensoes} />
        </div>
        <div className="col-start-3 row-start-1 flex items-center justify-self-end">
          <MenuConta />
        </div>
      </div>
    </header>
  );
}
