import { Azulejos, FAIXA_MARCA } from "@/components/marca/Azulejos";
import { Logo } from "@/components/marca/Logo";
import { DESCRICAO_SITE } from "@/lib/site";

/**
 * O envelope das telas públicas de autenticação (entrar, cadastrar, recuperar
 * senha e as de confirmação por token).
 *
 * `grid lg:grid-cols-[1fr_520px]`: a coluna da marca cresce, a do formulário
 * é fixa. Só do desktop em diante (`hidden lg:flex`): no celular fica só o
 * cartão, e a coluna de marca é decoração que não cabe no espaço de uma tela
 * de formulário pequena.
 *
 * A coluna da marca é sólida `bg-faixa`, com o `Logo` empilhado `tom="claro"`
 * e a frase do produto centralizados, e a faixa de azulejos como rodapé da
 * coluna: texto e logo ficam sobre a cor sólida (o par `faixa-texto`/`faixa`
 * já é medido em `contraste.test.ts`), e os azulejos não competem com a
 * leitura por trás de letra nenhuma.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 lg:grid-cols-[1fr_520px]">
      <div className="hidden flex-col bg-faixa lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-14 text-center">
          <Logo variante="empilhado" tom="claro" tamanho={64} />
          <p className="max-w-[360px] text-[17px] leading-[1.55] text-faixa-texto">
            {DESCRICAO_SITE.split(".")[0]}.
          </p>
        </div>
        <Azulejos ladrilhos={FAIXA_MARCA} colunas={6} />
      </div>
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="w-full max-w-[420px] rounded-painel bg-cartao p-8 shadow-cartao">
          {children}
        </div>
      </div>
    </div>
  );
}
