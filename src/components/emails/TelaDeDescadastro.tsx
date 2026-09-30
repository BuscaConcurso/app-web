"use client";

import { useState } from "react";
import { emailsApi } from "@/lib/auth/api";
import { useTokenDaUrl } from "@/lib/useTokenDaUrl";
import {
  criarDescadastro,
  tipoDoLink,
  type EstadoDoDescadastro,
} from "@/lib/preferenciasDeEmail";
import { VistaDeDescadastro } from "./VistaDeDescadastro";

/**
 * Liga a `VistaDeDescadastro` à api. Nada roda ao montar: o `POST` só sai
 * no clique (ver `criarDescadastro`).
 */
export function TelaDeDescadastro({ token: tokenDaUrl, tipo }: { token?: string; tipo?: string }) {
  const token = useTokenDaUrl(tokenDaUrl);
  const [estado, setEstado] = useState<EstadoDoDescadastro>("pergunta");
  const [descadastro] = useState(() =>
    criarDescadastro({
      api: {
        descadastrar: (valor, qual) => emailsApi.descadastrar(valor, qual),
        religar: (valor, qual) => emailsApi.preferenciaPorLink({ token: valor, tipo: qual, ligado: true }),
      },
      token: token ?? null,
      tipo: tipoDoLink(tipo),
      mudou: setEstado,
    }),
  );

  return (
    <VistaDeDescadastro
      // Link sem token ou com tipo desconhecido já nasce inválido.
      estado={descadastro.estado() === "invalido" ? "invalido" : estado}
      aoConfirmar={() => void descadastro.confirmar()}
      aoDesfazer={() => void descadastro.desfazer()}
    />
  );
}
