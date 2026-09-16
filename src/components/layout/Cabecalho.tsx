import Link from "next/link";
import { Logo } from "@/components/marca/Logo";
import { MenuConta } from "./MenuConta";

/**
 * O gatilho do menu.
 *
 * Era uma silhueta de pessoa, e virou o traço de menu a pedido do parceiro
 * humano. A troca fecha um problema que a silhueta tinha: **avatar é, por
 * convenção, o sinal de que existe uma conta**, e não existe autenticação
 * neste produto — "Entrar" e "Criar conta" apontam os dois para `/concursos`.
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
 * **Um menu só, com entrar, criar conta e tema dentro.** Os três estavam
 * escritos duas vezes — na barra do desktop e, repetidos, dentro do menu
 * sanduíche do celular —, e agora estão num lugar só, que aparece nas duas
 * larguras.
 *
 * **A navegação saiu inteira**, a pedido do parceiro humano, e com ela o menu
 * sanduíche que existia só para carregá-la. Eram quatro itens; três foram
 * removidos antes por prometerem feature que não existe ("Meus alertas",
 * "Notícias", "Planos" apontavam para `/concursos` com filtros diferentes), e
 * o último, "Concursos", saiu agora. O logotipo continua levando à home, e a
 * busca é o corpo da própria home — um link de topo para `/concursos` ao lado
 * dele era um segundo caminho para o mesmo lugar.
 *
 * O rótulo do gatilho é "Entrar, criar conta e tema" e não "conta", "perfil"
 * ou "menu" porque é o que há dentro. Quem não vê o desenho ouve a lista, não
 * uma promessa: não existe autenticação neste produto, e "Entrar" e "Criar
 * conta" apontam os dois para `/concursos`.
 *
 * **O menu é `ui/Revelador`**, e não `<details>` escritos aqui. Era
 * `<details>` cru até esta linha, e funcionava: abre e fecha sem JavaScript,
 * com teclado e leitor de tela incluídos. O que ele não fazia era fechar com
 * Escape, fechar com clique fora, devolver o foco ao gatilho e animar — e
 * essas quatro coisas passaram a existir escritas uma vez só, em
 * `components/ui/`. O `<details>` continua sendo o mecanismo por baixo, então
 * o menu continua abrindo sem script.
 *
 * **E é `Gaveta`, não `Menu`**, a pedido do parceiro humano. As duas formas
 * dividem o mesmo miolo, então a troca não custou comportamento nenhum: o que
 * mudou é o contrato. `Menu` não é modal de propósito — não trava a rolagem
 * nem apaga o resto da página —, e `Gaveta` é as duas coisas. Para um painel
 * que carrega entrar, criar conta e o tema, e que a pessoa abre para escolher
 * uma coisa, a modalidade é o que faz a escolha ser a única coisa na tela.
 *
 * A gaveta entra pela direita, que é onde o gatilho está — uma segunda direção
 * dobraria as regras de movimento em `globals.css` para não mudar nada do que
 * a pessoa vê. E vai na largura `estreita`: medido, o conteúdo daqui pede
 * 197px, e numa gaveta de 40rem estes três itens ficariam perdidos.
 *
 * **A barra de topo diz "Entrar, criar conta e tema"** — a mesma frase que já
 * era o rótulo do gatilho, e não "Menu". "Menu" descreve o desenho, e o
 * parceiro humano já recusou esse tipo de nome quando o avatar saiu: quem lê
 * (ou ouve) tem de receber a lista do que há dentro, não o nome da caixa.
 * Como a frase serve às duas caras, ela vai em `titulo` e em `nome`, e o
 * diálogo e o botão passam a se chamar a mesma coisa.
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
        <Link
          href="/"
          aria-label="BuscaConcurso, página inicial"
          className="flex items-center"
        >
          <Logo tamanho={26} />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* A conta e o tema, nas duas larguras. A ordem de dentro é a mesma
              que a barra do desktop tinha: tema, entrar, criar conta. */}
          <MenuConta />
        </div>
      </div>
    </header>
  );
}
