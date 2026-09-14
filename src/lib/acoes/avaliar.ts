"use server";

/**
 * A Server Action do "gostei / não gostei".
 *
 * Arquivo separado porque `"use server"` só pode exportar função assíncrona —
 * as regras, os tipos e o `fetch` moram em `lib/avaliacao.ts`, que por isso
 * tem teste sem precisar de servidor.
 *
 * É Server Action, e não `fetch` do navegador, por duas razões: o endereço da
 * API (`BC_API_URL`) nunca chega ao cliente, e o formulário funciona sem
 * JavaScript — o clique registra do mesmo jeito. O modal de comentário é a
 * única parte que depende de script, e ele é enfeite: o "não gostei" já foi
 * gravado quando ele abre.
 */
import { cookies } from "next/headers";
import {
  ESTADO_INICIAL,
  lerPedido,
  novoAvaliador,
  registrarAvaliacao,
  type EstadoDaAvaliacao,
} from "@/lib/avaliacao";

/** O nome do cookie do token anônimo. Ver `novoAvaliador`. */
const COOKIE = "bc_avaliador";
/** Um ano: tempo de sobra para a mesma pessoa voltar e mudar de ideia. */
const DURACAO = 60 * 60 * 24 * 365;

export async function avaliar(
  _anterior: EstadoDaAvaliacao,
  dados: FormData,
): Promise<EstadoDaAvaliacao> {
  const pedido = lerPedido(dados);
  if (!pedido) {
    return { ...ESTADO_INICIAL, resultado: "pedido-invalido", envio: Date.now() };
  }

  // O token nasce no primeiro clique e não antes: quem só lê a página não
  // ganha cookie nenhum. `httpOnly` porque script nenhum precisa dele, e
  // `lax` porque ele só é lido em requisição do próprio site.
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

  return {
    resultado: await registrarAvaliacao(pedido, avaliador),
    gostei: pedido.gostei,
    comentou: pedido.comentario !== null,
    envio: Date.now(),
  };
}
