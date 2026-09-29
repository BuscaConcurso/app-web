import type { Metadata } from "next";
import Link from "next/link";
import { PaginaDeTexto } from "@/components/ui/PaginaDeTexto";
import { PAGINAS_INSTITUCIONAIS } from "@/lib/institucionais";
import { EMAIL_CONTATO } from "@/lib/site";

const { titulo, href } = PAGINAS_INSTITUCIONAIS.acessibilidade;

export const metadata: Metadata = {
  title: titulo,
  description:
    "O que o BuscaConcurso tem hoje para funcionar com teclado, leitor de tela e zoom, " +
    "o que ainda falta e como avisar um problema.",
  alternates: { canonical: href },
};

/**
 * Só o que existe de fato, conferido no código:
 *
 * - alto contraste e fonte: `ControlesDeAcessibilidade.tsx`, guardados em
 *   `localStorage` por `src/lib/acessibilidade.ts`, cinco degraus de 87,5%
 *   a 137,5%;
 * - contraste medido: `src/lib/contraste.test.ts` (4,5:1 no normal, 7:1 no
 *   alto contraste);
 * - foco visível: `:focus-visible` em `globals.css`;
 * - regiões vivas: `AvisoFlutuante` (`EmBreve.tsx`), o recibo da avaliação
 *   (`Avaliacao.tsx`), os erros dos formulários de conta (`AuthUi.tsx`);
 * - movimento reduzido: `prefers-reduced-motion` em `globals.css`.
 *
 * Mudou uma dessas coisas, muda esta página.
 */
export default function Acessibilidade() {
  return (
    <PaginaDeTexto
      titulo={titulo}
      href={href}
      abertura="Queremos que qualquer pessoa consiga achar e ler um concurso aqui, com mouse, teclado, leitor de tela ou zoom. Esta página diz o que o site já tem, o que ainda falta e como nos avisar de um problema."
    >
      <h2>O que o site tem hoje</h2>
      <ul>
        <li>
          <strong>Alto contraste.</strong> O botão &quot;Alto contraste&quot;
          fica na faixa escura do alto da página, no computador, e no menu, no
          celular. Ele deixa o texto preto sobre branco, troca as linhas
          suaves por linhas pretas, sublinha os links e engrossa a marca de
          foco.
        </li>
        <li>
          <strong>Tamanho da fonte.</strong> Os botões A− e A+, no mesmo lugar,
          diminuem um degrau ou aumentam até três, de 87,5% a 137,5% do
          tamanho normal. O texto do site inteiro acompanha.
        </li>
        <li>
          <strong>A escolha fica guardada.</strong> O contraste e a fonte ficam
          salvos neste navegador e voltam na próxima visita. Não vão para a
          sua conta nem para nós: em outro navegador ou aparelho, é preciso
          escolher de novo.
        </li>
        <li>
          <strong>Cores com contraste medido.</strong> Cada par de cor de texto
          e fundo é conferido por um teste automático: pelo menos 4,5 para 1
          no modo normal e 7 para 1 no alto contraste.
        </li>
        <li>
          <strong>Teclado.</strong> Links, botões e campos são alcançados com a
          tecla Tab, e o elemento em foco ganha um contorno visível.
        </li>
        <li>
          <strong>Leitor de tela.</strong> A página é marcada em português. Os
          ícones que só enfeitam ficam escondidos do leitor, e os botões que só
          têm ícone têm nome, como &quot;Voltar&quot; e
          &quot;Compartilhar&quot;. Os avisos que aparecem sozinhos, como
          &quot;Link copiado&quot; e a resposta da avaliação da página, são
          lidos em voz alta sem tirar você do lugar. Erros nos formulários de
          conta também são anunciados.
        </li>
        <li>
          <strong>Zoom.</strong> Dá para ampliar a página até 200% no navegador
          sem perder conteúdo e sem rolar para os lados.
        </li>
        <li>
          <strong>Menos movimento.</strong> Se o seu sistema pede para reduzir
          animações, o menu abre e fecha sem deslizar.
        </li>
      </ul>

      <h2>O que ainda não tem</h2>
      <ul>
        <li>
          Um atalho para pular o menu e ir direto ao conteúdo. Hoje, com o
          teclado, é preciso passar pelos links do topo.
        </li>
        <li>
          Tema escuro. O site só tem o tema claro, com o alto contraste como
          opção.
        </li>
        <li>
          Alguns controles só funcionam com JavaScript ligado: o alto
          contraste, o tamanho da fonte e a pergunta &quot;Esta página está
          certa?&quot;.
        </li>
        <li>
          O edital em si não é nosso. O arquivo é publicado pela banca ou pelo
          órgão, e muitos são PDFs difíceis de ler com leitor de tela. Isso
          não conseguimos consertar.
        </li>
      </ul>

      <h2>Como avisar um problema</h2>
      <p>
        Escreva para <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>.
        Para acharmos o problema, diga:
      </p>
      <ul>
        <li>a página em que ele aconteceu (o link ajuda);</li>
        <li>o navegador e o aparelho;</li>
        <li>
          a tecnologia assistiva, se usar: leitor de tela, ampliador,
          navegação por voz ou outra.
        </li>
      </ul>
      <p>
        Outros assuntos estão na página de{" "}
        <Link href={PAGINAS_INSTITUCIONAIS.contato.href}>contato</Link>.
      </p>
    </PaginaDeTexto>
  );
}
