/**
 * `POST /api/avaliacao`: onde o clique de "gostei / não gostei" chega.
 *
 * **Esta rota existe no lugar da Server Action que estava aqui até então, e a
 * troca é decisão do parceiro humano**: "gostei/não gostei precisa ser client
 * side". O que se perdeu com ela está escrito no componente.
 *
 * O que ela resolve foi medido com a API do engine atrás de um proxy que conta
 * as chamadas, e o número grande é o do servidor de desenvolvimento. Em
 * `next dev`, a Server Action re-renderiza a árvore de servidor da rota a cada
 * clique, e nesta página o `layout` chama `origemDoAcervo()`, que puxa
 * `GET /acervo`: 3,6 MB do engine, 640 a 830 ms (dois deles por clique) para
 * gravar um "gostei" de 152 bytes. O POST inteiro levava 816 a 838 ms no
 * navegador. Pela rota, o mesmo clique custa 17 a 20 ms e uma requisição só ao
 * engine, porque nenhum componente de servidor é renderizado de novo.
 *
 * **Em `next build` a conta era outra, e vale registrar**: no build de
 * produção a Server Action não re-renderizava a rota (resposta de 537 B em 17
 * a 27 ms), então o que se ganha lá não é tempo de servidor: é o botão mudar
 * no clique, sem esperar a viagem, e a resposta cair de 537 para 284 bytes.
 * Os 800 ms são reais e são do dia a dia de quem desenvolve; quem for medir de
 * novo, meça nos dois modos, porque eles não concordam.
 *
 * **O que a rota preserva, e é o motivo de ela existir em vez de o navegador
 * falar direto com o engine**: `BC_API_URL` continua só no servidor. A API do
 * engine não tem autenticação nenhuma e amarra em `127.0.0.1` de propósito:
 * publicar o endereço dela no navegador é o que não pode acontecer, e
 * continua não podendo. Quem lê `BC_API_URL` é `registrarAvaliacao`
 * (`lib/avaliacao.ts`), importada daqui e de mais lugar nenhum.
 *
 * O corpo é `FormData` e não JSON porque `lerPedido` já lê `FormData` e já tem
 * teste; ver `formularioDoPedido`, do outro lado.
 */
import { cookies } from "next/headers";
import {
  lerPedido,
  novoAvaliador,
  registrarAvaliacao,
  type ResultadoDaAvaliacao,
} from "@/lib/avaliacao";

/** O nome do cookie do token anônimo. Ver `novoAvaliador`. */
const COOKIE = "bc_avaliador";
/** Um ano: tempo de sobra para a mesma pessoa voltar e mudar de ideia. */
const DURACAO = 60 * 60 * 24 * 365;

/**
 * O status HTTP de cada desfecho.
 *
 * O corpo é que manda: o cliente lê `resultado` e é ele que vira a frase na
 * tela (ver `resultadoDaResposta`). O status existe para que um proxy, um log
 * ou um `curl` no meio do caminho não vejam "200 OK" em cima de um clique que
 * não foi gravado.
 */
const STATUS: Record<ResultadoDaAvaliacao | "pedido-invalido", number> = {
  gravada: 200,
  // O pedido chegou torto: sem slug, ou com voto que não é sim nem não.
  "pedido-invalido": 400,
  // Esta instância não tem serviço de avaliação (`BC_API_URL` ausente).
  "sem-api": 501,
  // A API estava configurada e não gravou.
  falhou: 502,
};

export async function POST(request: Request): Promise<Response> {
  const pedido = lerPedido(await request.formData());
  if (!pedido) {
    return Response.json(
      { resultado: "pedido-invalido" },
      { status: STATUS["pedido-invalido"] },
    );
  }

  // O token nasce no primeiro clique e não antes: quem só lê a página não
  // ganha cookie nenhum. `httpOnly` porque script nenhum precisa dele: nem
  // agora que o clique sai do navegador, já que quem manda o token para o
  // engine é esta rota, do lado de cá. E `lax` porque ele só é lido em
  // requisição do próprio site.
  const cookiesDaPessoa = await cookies();
  let avaliador = cookiesDaPessoa.get(COOKIE)?.value;
  if (!avaliador || avaliador.length < 8) {
    avaliador = novoAvaliador();
    cookiesDaPessoa.set(COOKIE, avaliador, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: DURACAO,
    });
  }

  // `registrarAvaliacao` nunca levanta: um "não gostei" que derruba a página
  // de quem clicou seria a pior resposta possível a alguém dizendo que a
  // página está errada. Falha vira `"falhou"`, e a tela diz que não deu.
  const resultado = await registrarAvaliacao(pedido, avaliador);
  return Response.json({ resultado }, { status: STATUS[resultado] });
}
