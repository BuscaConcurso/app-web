/**
 * O bloco de dados estruturados, com o escape escrito uma vez.
 *
 * O conteúdo de um `<script>` não é HTML: o navegador o encerra no primeiro
 * `</script` que encontrar, venha ele de onde vier. Um título de concurso com
 * um sinal de menor dentro sairia do bloco e viraria marcação na página, e é
 * por isso que `<`, `>` e `&` saem como `\u003c`, `\u003e` e `\u0026`,
 * escapes válidos de JSON: quem analisa o bloco recebe a mesma string, e quem
 * varre o HTML nunca encontra um fim de script (nem um `<!--`) que não seja o
 * nosso. U+2028 e U+2029 também saem escapados: são válidos em JSON mas
 * terminavam a linha em JavaScript antigo, e escapar não custa nada.
 *
 * O escape antigo escrevia `"\u003c"` dentro de uma string JavaScript, que é
 * o próprio `<`: a troca não trocava nada e um título com `</script>` fechava
 * o bloco. O teste agora prova pelo HTML renderizado.
 *
 * O componente existe para o escape ser escrito uma vez: `Trilha` passou a
 * emitir `BreadcrumbList` e precisava do mesmo escape, e copiá-lo pela quinta
 * vez é o jeito conhecido de a quinta cópia ser a errada, porque o
 * `dangerouslySetInnerHTML` não avisa quando o escape falta.
 */
const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/** JSON seguro para o corpo de um `<script>`: mesma string para quem analisa. */
export function jsonParaScript(dados: unknown): string {
  return JSON.stringify(dados).replace(/[<>&\u2028\u2029]/g, (c) => ESCAPES[c]);
}

export function DadosEstruturados({ dados }: { dados: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonParaScript(dados) }}
    />
  );
}
