/**
 * O bloco de dados estruturados, com o escape escrito uma vez.
 *
 * O conteúdo de um `<script>` não é HTML: o navegador o encerra no primeiro
 * `</script` que encontrar, venha ele de onde vier. Um título de concurso com
 * um sinal de menor dentro sairia do bloco e viraria marcação na página, e é
 * por isso que todo sinal de menor sai como `\u003c` — escape válido de JSON,
 * então quem analisa o bloco recebe a mesma string, e quem varre o HTML nunca
 * encontra um fim de script que não seja o nosso.
 *
 * Estava certo nos quatro lugares onde era escrito à mão, e não há defeito
 * registrado aqui. O que este componente resolve é o quinto: `Trilha` passou
 * a emitir `BreadcrumbList` e precisava do mesmo escape, e copiá-lo pela
 * quinta vez é o jeito conhecido de a quinta cópia ser a errada — o
 * `dangerouslySetInnerHTML` não avisa quando o escape falta.
 */
export function DadosEstruturados({ dados }: { dados: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replace(/</g, "\u003c"),
      }}
    />
  );
}
