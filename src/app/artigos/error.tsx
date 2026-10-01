"use client";

import Link from "next/link";

export default function ErroDosArtigos({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <section className="conteudo space-y-5 py-16" role="alert">
    <h1 className="font-titulo text-3xl font-bold">Não foi possível carregar os artigos</h1>
    <p className="max-w-xl text-tinta-600">O serviço não respondeu. Tente novamente para consultar o conteúdo.</p>
    <div className="flex flex-wrap items-center gap-5"><button onClick={() => retry()} className="min-h-11 rounded-controle bg-acao px-5 font-semibold text-acao-texto">Tentar novamente</button><Link href="/artigos" className="text-link underline">Voltar aos artigos</Link></div>
  </section>;
}
