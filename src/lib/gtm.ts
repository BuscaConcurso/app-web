/**
 * Google Tag Manager ligado por `NEXT_PUBLIC_GTM_ID`.
 *
 * O ID vai parar dentro de um `<script>` inline, então só passa o formato de
 * contêiner do GTM: qualquer outra coisa desliga a tag em vez de ser
 * interpolada. Vazio é o caso normal fora de produção.
 */
const FORMATO_DO_ID = /^GTM-[A-Z0-9]{4,12}$/;

export function idDoGtm(valor: string | undefined): string | null {
  const id = valor?.trim() ?? "";
  return FORMATO_DO_ID.test(id) ? id : null;
}

export function scriptDoGtm(id: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
}

export function urlDoNoscriptDoGtm(id: string): string {
  return `https://www.googletagmanager.com/ns.html?id=${id}`;
}
