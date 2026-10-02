import Link from "next/link";
import type { ConcursoCitado } from "@/lib/artigos";

function enderecoPublico(valor: string | null): string | null {
  if (!valor) return null;
  try { const url = new URL(valor); return ["https:", "http:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export function FontesDoArtigo({ concurso }: { concurso: ConcursoCitado | null }) {
  if (!concurso) return <p className="text-tinta-600">A fonte oficial não está disponível nesta leitura. Consulte a página do órgão ou da banca antes de se inscrever.</p>;
  const edital = enderecoPublico(concurso.editalCitadoUrl) ?? enderecoPublico(concurso.editalUrl);
  return <div className="space-y-4 text-base leading-relaxed">
    {edital ? <p><a href={edital} className="font-semibold text-link underline">Consultar o edital na fonte</a></p> : <p>O acervo não informa um endereço para o edital completo.</p>}
    {concurso.origens.map(origem => {
      const url = enderecoPublico(origem.url);
      return <div key={origem.chave} id={`ato-${origem.chave}`} className="scroll-mt-6 border-l-2 border-ouro-faixa pl-4"><p className="font-medium">{origem.titulo ?? "Ato publicado"}</p><p className="text-sm text-tinta-600">{origem.fonte ?? "Fonte não informada"}</p>{url ? <a href={url} className="text-link underline">Abrir a publicação oficial</a> : <p className="text-sm text-tinta-600">Endereço público não informado no acervo.</p>}<Link href={`/concursos/${concurso.slug}#ato-${origem.chave}`} className="mt-2 block text-sm text-link underline">Ver o ato na ficha do concurso</Link></div>;
    })}
    <p className="text-sm text-tinta-600">O ato do diário pode ser um extrato. Confira o edital completo e suas retificações.</p>
  </div>;
}
