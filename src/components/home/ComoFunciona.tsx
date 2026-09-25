import { Rotulo } from "@/components/ui/Etiqueta";
import { Icone, type NomeDoIcone } from "@/components/ui/Icone";
import type { AvisoDoAcervo } from "@/lib/concursos";
import { numero } from "@/lib/formato";
import { acervoIncompletoEmPartes } from "@/lib/rotulos";

interface Passo {
  numero: string;
  icone: NomeDoIcone;
  classeDoIcone: string;
  titulo: string;
  corpo: string;
}

const PASSOS: Passo[] = [
  {
    numero: "01",
    icone: "globo",
    classeDoIcone: "bg-acao text-white",
    titulo: "Coletamos todo dia",
    corpo: "Um robô visita as bancas organizadoras e os diários oficiais e baixa cada ato publicado.",
  },
  {
    numero: "02",
    icone: "revisao",
    classeDoIcone: "bg-anil text-white",
    titulo: "Lemos o edital",
    corpo: "Extraímos cargo, vagas, remuneração, taxa e cronograma de cada documento.",
  },
  {
    numero: "03",
    icone: "corrente",
    classeDoIcone: "bg-ouro text-ouro-texto",
    titulo: "Você confere na fonte",
    corpo: "Cada campo guarda o link do arquivo que o originou. Não precisa acreditar na nossa palavra.",
  },
];

/**
 * As três caixas coloridas do rodapé de aviso, com rótulo curto próprio: o
 * texto de `acervoIncompletoEmPartes` é prosa feita para o parágrafo do
 * `BlocoAlerta` antigo (hoje `AcervoIncompleto`, removido), longa demais para
 * uma legenda de 14px ao lado de um número. Os três valores e a cor de cada
 * um são os mesmos, só o rótulo muda de forma.
 */
const CATEGORIAS_DA_LACUNA = [
  { chave: "naoAbreConcurso", icone: "documento" as const, curto: "retificações e anexos", cor: "text-tinta-500", barra: "bg-tinta-500" },
  { chave: "naFila", icone: "relogio" as const, curto: "na fila de leitura", cor: "text-anil", barra: "bg-anil" },
  { chave: "lacuna", icone: "ciclo" as const, curto: "leituras a refazer", cor: "text-urucum", barra: "bg-urucum" },
] as const;

/**
 * "Da fonte oficial para a sua tela" (`Main.dc.html:359-378`): os três passos
 * de sempre e, quando o acervo tem lacuna, a faixa que diz quantos atos
 * ficaram fora da lista e por quê.
 *
 * `acervoIncompletoEmPartes` é quem decide se a repartição é confiável (soma
 * bate com `aviso.semDado`); sem ela, a faixa mostra só a frase com os dois
 * totais, sem as três caixas coloridas. Some no celular, como em
 * `Mobile.dc.html`, que não repete este bloco.
 */
export function ComoFunciona({ aviso }: { aviso: AvisoDoAcervo | null }) {
  const partes = aviso ? acervoIncompletoEmPartes(aviso) : [];
  const categorias =
    aviso && partes.length > 0
      ? CATEGORIAS_DA_LACUNA.map((categoria) => ({ ...categoria, quantos: aviso[categoria.chave] })).filter(
          (categoria) => categoria.quantos > 0,
        )
      : [];

  return (
    <section className="conteudo mt-24 hidden flex-col gap-7 lg:flex">
      <div className="flex flex-col items-center text-center">
        <Rotulo icone="policia" tom="aberto">DADOS QUE VOCÊ PODE CONFERIR</Rotulo>
        <h2 className="mt-2.5 font-titulo text-[40px] leading-[1.05] font-bold tracking-[-0.03em]">
          Da fonte oficial para a sua tela
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {PASSOS.map((passo) => (
          <div key={passo.numero} className="flex flex-col gap-3.5 rounded-[20px] bg-cartao p-7 shadow-cartao">
            <div className="flex items-center justify-between">
              <span className={`flex size-14 items-center justify-center rounded-2xl ${passo.classeDoIcone}`}>
                <Icone nome={passo.icone} tamanho={28} />
              </span>
              <span className="font-titulo text-4xl font-bold text-linha">{passo.numero}</span>
            </div>
            <div className="text-[19px] font-bold">{passo.titulo}</div>
            <div className="text-[15px] leading-[1.55] text-tinta-600">{passo.corpo}</div>
          </div>
        ))}
      </div>

      {aviso && (
        <div className="flex items-center gap-8 rounded-[20px] bg-cartao p-7 shadow-cartao">
          <p className="w-[300px] shrink-0 text-[15px] leading-[1.5]">
            <strong>{numero(aviso.semDado)} atos</strong> dos {numero(aviso.total)} lidos ficaram fora desta
            lista, e dizemos por quê.
          </p>
          {categorias.length > 0 && (
            <div className="flex flex-grow flex-col gap-3">
              <div className="flex h-3 gap-[3px]">
                {categorias.map((categoria, indice) => (
                  <span
                    key={categoria.chave}
                    style={{ width: `${(categoria.quantos / aviso.semDado) * 100}%` }}
                    className={[
                      categoria.barra,
                      indice === 0 ? "rounded-l-md" : "",
                      indice === categorias.length - 1 ? "rounded-r-md" : "",
                    ].join(" ")}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-7 text-sm text-tinta-600">
                {categorias.map((categoria) => (
                  <span key={categoria.chave} className="flex items-center gap-2">
                    <Icone nome={categoria.icone} tamanho={16} className={categoria.cor} />
                    <strong className="text-tinta-900">{numero(categoria.quantos)}</strong>
                    {categoria.curto}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
