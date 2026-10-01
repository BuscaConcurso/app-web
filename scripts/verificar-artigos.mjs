import assert from "node:assert/strict";

// Executar contra um servidor de produção já iniciado, nunca contra next dev.
const base = (process.argv[2] ?? "http://127.0.0.1:3107").replace(/\/+$/, "");
for (const userAgent of ["BuscaConcursoSmokeTest", "Googlebot-News"]) {
  for (const caminho of ["/artigos/verificacao-ausente-000000000", "/artigos?pagina=999999999", "/artigos/busca?pagina=999999999"]) {
    const resposta = await fetch(`${base}${caminho}`, { headers: { "User-Agent": userAgent } });
    assert.equal(resposta.status, 404, `${userAgent} ${caminho}: não iniciar streaming antes de notFound`);
  }
}
const busca = await fetch(`${base}/artigos/busca?q=verificacao`);
assert.equal(busca.status, 200);
const html = await busca.text();
assert.match(html, /<meta name="robots" content="noindex, follow"/);
assert.doesNotMatch(html, /<link rel="canonical"/);
for (const caminho of ["/sitemap-artigos.xml", "/sitemap-noticias.xml"]) {
  const resposta = await fetch(`${base}${caminho}`);
  assert.equal(resposta.status, 200, caminho);
  assert.match(resposta.headers.get("content-type"), /application\/xml/);
  const xml = await resposta.text();
  assert.match(xml, /<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
  if (caminho.includes("noticias")) assert.ok((xml.match(/<news:news>/g) ?? []).length <= 1000);
}
console.log("Artigos: status 404, busca noindex e sitemaps verificados por HTTP.");
