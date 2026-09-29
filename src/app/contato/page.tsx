import type { Metadata } from "next";
import Link from "next/link";
import { PaginaDeTexto } from "@/components/ui/PaginaDeTexto";
import { PAGINAS_INSTITUCIONAIS } from "@/lib/institucionais";
import { EMAIL_CONTATO } from "@/lib/site";

const { titulo, href } = PAGINAS_INSTITUCIONAIS.contato;

export const metadata: Metadata = {
  title: titulo,
  description:
    `Fale com a equipe do BuscaConcurso pelo e-mail ${EMAIL_CONTATO}: ` +
    "erro de leitura num concurso, problema de acessibilidade ou dúvida sobre a conta.",
  alternates: { canonical: href },
};

/**
 * Um e-mail, e para que escrever nele. Sem formulário: o spec deixa o
 * formulário de fora, e um `mailto:` funciona sem nada do nosso lado no ar.
 */
export default function Contato() {
  return (
    <PaginaDeTexto
      titulo={titulo}
      href={href}
      abertura="Para falar com a equipe do BuscaConcurso, escreva para o nosso e-mail. Quem lê é quem faz o site."
    >
      <p className="text-[1.25rem] font-semibold">
        <a href={`mailto:${EMAIL_CONTATO}`}>{EMAIL_CONTATO}</a>
      </p>

      <h2>Para que escrever</h2>
      <ul>
        <li>
          <strong>Erro num concurso.</strong> Uma data, um salário, um cargo ou
          um órgão diferente do que está no edital. Mande o link da página do
          concurso no BuscaConcurso e diga o que está errado. Se puder, diga
          também onde o edital traz o dado certo.
        </li>
        <li>
          <strong>Problema de acessibilidade.</strong> Diga a página, o
          navegador e, se usar, a tecnologia assistiva (leitor de tela,
          ampliador, navegação por voz). Veja o que o site já tem na página de{" "}
          <Link href={PAGINAS_INSTITUCIONAIS.acessibilidade.href}>acessibilidade</Link>.
        </li>
        <li>
          <strong>Dúvida sobre a sua conta.</strong> Escreva do e-mail com que
          você se cadastrou, para acharmos a conta.
        </li>
      </ul>

      <p>
        Na página de cada concurso há também a pergunta &quot;Esta página está
        certa?&quot;. Clicar em &quot;Não, tem erro&quot; ali é o jeito mais
        rápido de avisar um erro daquele concurso, e dá para dizer qual parte
        está errada.
      </p>

      <h2>O que não respondemos</h2>
      <p>
        Dúvida sobre as regras de um edital: quem pode se inscrever, como pedir
        isenção, o que cai na prova. Quem responde é a banca organizadora ou o
        órgão, pelos canais que o próprio edital indica. O BuscaConcurso não
        organiza concursos, e o edital publicado sempre vale mais do que o que
        está aqui.
      </p>
    </PaginaDeTexto>
  );
}
