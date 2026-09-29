/** O `id` do `<main>` do layout, para onde o atalho leva. */
export const ID_DO_CONTEUDO = "conteudo";

/**
 * "Pular para o conteúdo": o primeiro Tab da página cai aqui, e o Enter leva
 * o foco para o `<main>`, sem passar pela barra, pelo cabeçalho e pelo menu.
 * Fica escondido (`sr-only-foco`) até receber foco, e aí aparece no canto de
 * cima, por cima de tudo, com o contorno de foco do site.
 */
export function PularParaConteudo() {
  return (
    <a
      href={`#${ID_DO_CONTEUDO}`}
      className="sr-only-foco fixed top-2 left-2 z-50 rounded-controle bg-cartao px-4 py-3 text-sm font-bold text-tinta-900 shadow-flutuante"
    >
      Pular para o conteúdo
    </a>
  );
}
