#!/usr/bin/env node
/* global WebSocket */
/**
 * Verificação no navegador de verdade: Chrome headless por CDP.
 *
 * Confere o que teste de unidade não alcança: a gaveta que fecha e devolve a
 * página depois de navegar, a busca do cabeçalho que muda a URL sem
 * recarregar, nenhuma rolagem lateral a 360, 375 e 390px nas páginas
 * principais, a página 404 com o cabeçalho, o clique de filtro em
 * /busca/<termo> sem pedido de RSC, e os redirects e o cache da busca pelo
 * HTTP.
 *
 * Sem dependência: o `WebSocket` é o global do Node, e o Chrome sobe com
 * perfil próprio numa pasta temporária, apagada no fim.
 *
 * Uso, contra o build de produção:
 *   BC_API_URL=https://api.buscaconcurso.com.br/v1 \
 *   NEXT_PUBLIC_BC_API_URL=https://api.buscaconcurso.com.br pnpm build
 *   (mesmas variáveis) pnpm start
 *   node scripts/verificar-navegador.mjs http://localhost:3000
 *
 * **`next.config.ts` tem `output: "standalone"`, e `pnpm start` (= `next
 * start`) não suporta essa configuração** (aviso do próprio Next.js: "next
 * start does not work with output: standalone configuration. Use node
 * .next/standalone/server.js instead"). Depois de alguns rebuilds seguidos
 * sem limpar `.next`, o HTML servido por `next start` passou a referenciar
 * um hash de CSS que não existia mais em `.next/static/chunks/`: o `<link>`
 * dava 404, nenhuma classe Tailwind daquele chunk se aplicava, e isso
 * quebrou silenciosamente `.hidden` (uma seção "escondida" abaixo de um
 * breakpoint ficava visível e estourava a largura da página) e o clique num
 * link dentro de um `<details>` que devia estar oculto. Para não repetir o
 * falso positivo, use sempre o servidor standalone:
 *   rm -rf .next
 *   (mesmas variáveis) pnpm build
 *   cp -r .next/static .next/standalone/.next/static
 *   cp -r public .next/standalone/public
 *   (mesmas variáveis) PORT=3100 HOSTNAME=0.0.0.0 node .next/standalone/server.js
 *   node scripts/verificar-navegador.mjs http://localhost:3100
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const CHROME = process.env.CHROME ?? "/usr/bin/google-chrome";
const PORTA = 9333;
const LARGURAS = [360, 375, 390, 1440];
const PASTA_SCRIPT = dirname(fileURLToPath(import.meta.url));
const PASTA_SCREENSHOTS = join(PASTA_SCRIPT, "..", "docs/superpowers/verificacao/2026-09-25-redesign");
/** Caminho garantido sem rota: prova a 404 sem depender de nenhum dado do acervo. */
const CAMINHO_404 = "/pagina-que-nunca-existe-0000";

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const falhas = [];
function conferir(ok, descricao, detalhe = "") {
  console.log(`${ok ? "ok   " : "FALHA"} ${descricao}${detalhe ? `: ${detalhe}` : ""}`);
  if (!ok) falhas.push(descricao);
}

async function abrirChrome() {
  const perfil = mkdtempSync(join(tmpdir(), "bc-chrome-"));
  const processo = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORTA}`,
      `--user-data-dir=${perfil}`,
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  for (let tentativa = 0; tentativa < 100; tentativa += 1) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORTA}/json/version`)).ok) break;
    } catch {
      // O Chrome ainda está subindo.
    }
    await esperar(100);
  }
  // `/json/new` só aceita PUT desde o Chrome 111.
  const alvo = await (
    await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: "PUT" })
  ).json();
  return { processo, perfil, endereco: alvo.webSocketDebuggerUrl };
}

function conectar(endereco) {
  const socket = new WebSocket(endereco);
  let proximo = 0;
  const pendentes = new Map();
  const ouvintes = new Map();
  socket.addEventListener("message", (evento) => {
    const mensagem = JSON.parse(evento.data);
    if (mensagem.id !== undefined) {
      const pendente = pendentes.get(mensagem.id);
      pendentes.delete(mensagem.id);
      if (mensagem.error) pendente.rejeitar(new Error(mensagem.error.message));
      else pendente.resolver(mensagem.result);
      return;
    }
    for (const ouvinte of ouvintes.get(mensagem.method) ?? []) ouvinte(mensagem.params);
  });
  return {
    pronto: new Promise((resolver, rejeitar) => {
      socket.addEventListener("open", resolver);
      socket.addEventListener("error", rejeitar);
    }),
    enviar(method, params = {}) {
      const id = ++proximo;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolver, rejeitar) => pendentes.set(id, { resolver, rejeitar }));
    },
    uma(method, limite = 30000) {
      return new Promise((resolver, rejeitar) => {
        if (!ouvintes.has(method)) ouvintes.set(method, new Set());
        const lista = ouvintes.get(method);
        const relogio = setTimeout(() => {
          lista.delete(ouvinte);
          rejeitar(new Error(`${method} não chegou em ${limite}ms`));
        }, limite);
        const ouvinte = (params) => {
          clearTimeout(relogio);
          lista.delete(ouvinte);
          resolver(params);
        };
        lista.add(ouvinte);
      });
    },
    /**
     * Ouve `method` até quem chamou parar (a diferença para `uma` é não
     * resolver sozinho): usado para juntar todo pedido de rede num intervalo,
     * e não só o primeiro.
     */
    sempre(method, ouvinte) {
      if (!ouvintes.has(method)) ouvintes.set(method, new Set());
      ouvintes.get(method).add(ouvinte);
      return () => ouvintes.get(method)?.delete(ouvinte);
    },
    fechar() {
      socket.close();
    },
  };
}

async function avaliar(cdp, expressao) {
  const { result, exceptionDetails } = await cdp.enviar("Runtime.evaluate", {
    expression: expressao,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
  }
  return result.value;
}

async function ate(cdp, expressao, limite = 5000) {
  const fim = Date.now() + limite;
  while (Date.now() < fim) {
    if (await avaliar(cdp, expressao)) return true;
    await esperar(100);
  }
  return false;
}

async function largura(cdp, px) {
  await cdp.enviar("Emulation.setDeviceMetricsOverride", {
    width: px,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });
}

async function navegar(cdp, caminho) {
  const carga = cdp.uma("Page.loadEventFired");
  await cdp.enviar("Page.navigate", { url: BASE + caminho });
  await carga;
  await avaliar(cdp, "document.fonts.ready.then(() => true)");
  await esperar(400);
}

/** Clique de verdade, com `pointerdown`, no centro do elemento. */
async function clicar(cdp, seletor) {
  const ponto = await avaliar(
    cdp,
    `(() => {
      const el = document.querySelector(${JSON.stringify(seletor)});
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`,
  );
  if (!ponto) throw new Error(`nada casa com ${seletor}`);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await cdp.enviar("Input.dispatchMouseEvent", {
      type,
      x: ponto.x,
      y: ponto.y,
      button: "left",
      clickCount: 1,
    });
  }
}

/** Roda na página. Os cinco primeiros elementos que passam da borda direita. */
function medirTransbordo() {
  const raiz = document.documentElement;
  const limite = raiz.clientWidth;
  const culpados = [...document.querySelectorAll("body *")]
    .filter((el) => el.getBoundingClientRect().right > limite + 0.5)
    .slice(0, 5)
    .map((el) => {
      const classes = typeof el.className === "string" ? el.className.trim().split(/\s+/).slice(0, 4).join(".") : "";
      return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ""} até ${Math.round(el.getBoundingClientRect().right)}px`;
    });
  return { scroll: raiz.scrollWidth, cliente: limite, culpados };
}

async function verificarTransbordo(cdp, paginas) {
  for (const px of LARGURAS) {
    await largura(cdp, px);
    for (const caminho of paginas) {
      await navegar(cdp, caminho);
      const medida = await avaliar(cdp, `(${medirTransbordo})()`);
      conferir(
        medida.scroll <= medida.cliente,
        `sem rolagem lateral em ${caminho} a ${px}px`,
        medida.scroll > medida.cliente
          ? `${medida.scroll} > ${medida.cliente}; ${medida.culpados.join(" | ")}`
          : "",
      );
    }
  }
}

/** Screenshot de página inteira, além do que a viewport mostra (`captureBeyondViewport`). */
async function tirarScreenshot(cdp, caminhoArquivo) {
  const metrica = await cdp.enviar("Page.getLayoutMetrics");
  const tamanho = metrica.cssContentSize ?? metrica.contentSize;
  const resultado = await cdp.enviar("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: tamanho.width, height: tamanho.height, scale: 1 },
  });
  writeFileSync(caminhoArquivo, Buffer.from(resultado.data, "base64"));
}

/**
 * Task 16: por página fixa (mais o primeiro concurso aberto, lido de
 * `/concursos?situacao=abertas`) e largura (`LARGURAS`, agora até 1440px),
 * sem `console.error` nem exceção não tratada (`pageerror`). A 1440px a nav
 * `nav[aria-label="Principal"]` fica visível (na página do concurso ela é
 * `hidden` abaixo de `lg`) e, na home, o mapa por estado tem as 27 UFs
 * (`#estados [data-uf]`). No concurso a 390px, `[role="tablist"]` existe e
 * clicar a segunda aba ("Áreas") mostra o painel dela. Screenshot de página
 * inteira da home e do concurso a 390 e 1440px.
 */
async function verificarTask16(cdp, concurso) {
  const paginas = ["/", "/concursos", "/busca/professor", "/entrar", "/em-breve/salvos", concurso].filter(
    Boolean,
  );

  for (const px of LARGURAS) {
    await largura(cdp, px);
    for (const caminho of paginas) {
      const erros = [];
      const pararConsole = cdp.sempre("Runtime.consoleAPICalled", (parametros) => {
        if (parametros.type === "error") {
          erros.push(parametros.args.map((arg) => arg.value ?? arg.description ?? "?").join(" "));
        }
      });
      const pararExcecao = cdp.sempre("Runtime.exceptionThrown", (parametros) => {
        erros.push(parametros.exceptionDetails.exception?.description ?? parametros.exceptionDetails.text);
      });
      await navegar(cdp, caminho);
      const medida = await avaliar(cdp, `(${medirTransbordo})()`);
      pararConsole();
      pararExcecao();

      conferir(
        medida.scroll <= medida.cliente,
        `sem rolagem lateral em ${caminho} a ${px}px`,
        medida.scroll > medida.cliente
          ? `${medida.scroll} > ${medida.cliente}; ${medida.culpados.join(" | ")}`
          : "",
      );
      conferir(
        erros.length === 0,
        `sem console.error nem pageerror em ${caminho} a ${px}px`,
        erros.join(" | "),
      );

      if (px === 1440) {
        conferir(
          await avaliar(
            cdp,
            `(() => { const el = document.querySelector('nav[aria-label="Principal"]'); return !!el && el.offsetParent !== null; })()`,
          ),
          `a nav principal fica visível em ${caminho} a 1440px`,
        );
        if (caminho === "/") {
          conferir(
            (await avaliar(cdp, `document.querySelectorAll('#estados [data-uf]').length`)) === 27,
            "o mapa por estado tem as 27 UFs a 1440px",
          );
        }
      }

      if (caminho === concurso && px === 390) {
        const existeTablist = await avaliar(cdp, `!!document.querySelector('[role="tablist"]')`);
        conferir(existeTablist, "o concurso tem [role=\"tablist\"] a 390px");
        if (existeTablist) {
          await clicar(cdp, '[role="tablist"] button[role="tab"]:nth-of-type(2)');
          conferir(
            await ate(
              cdp,
              `(() => { const p = document.querySelectorAll('[role="tabpanel"]')[1]; return !!p && p.offsetParent !== null; })()`,
            ),
            "clicar a segunda aba do concurso mostra o painel de áreas",
          );
        }
      }

      if ((caminho === "/" || caminho === concurso) && (px === 390 || px === 1440)) {
        mkdirSync(PASTA_SCREENSHOTS, { recursive: true });
        const nome = caminho === "/" ? "home" : "concurso";
        await tirarScreenshot(cdp, join(PASTA_SCREENSHOTS, `${nome}-${px}.png`));
      }
    }
  }
}

async function verificarGaveta(cdp) {
  await largura(cdp, 375);
  await navegar(cdp, "/");
  await avaliar(cdp, "window.__semRecarga = true");
  const gaveta = 'header details[data-revelador="gaveta"]';
  await clicar(cdp, `${gaveta} > summary`);
  conferir(
    await ate(cdp, `!!document.querySelector('${gaveta}[open]') && document.querySelectorAll("[inert]").length > 0`),
    "o menu abre como gaveta modal",
  );
  await esperar(400);
  await clicar(cdp, `${gaveta} a[href="/entrar"]`);
  conferir(await ate(cdp, `location.pathname === "/entrar"`), "o link de dentro da gaveta navega");
  conferir(
    await ate(
      cdp,
      `!document.querySelector("details[data-revelador][open]") &&
       document.querySelectorAll("[inert]").length === 0 &&
       getComputedStyle(document.documentElement).overflow !== "hidden"`,
      2000,
    ),
    "a gaveta fecha e a página volta a ser interativa",
  );
  conferir(await avaliar(cdp, "window.__semRecarga === true"), "a navegação da gaveta não recarregou a página");
}

async function verificarBuscaDoCabecalho(cdp) {
  await largura(cdp, 375);
  // Na home o cabeçalho não tem busca (quem busca lá é o herói): a busca
  // compacta só existe nas páginas internas.
  await navegar(cdp, "/concursos");
  await avaliar(cdp, "window.__semRecarga = true");
  await clicar(cdp, 'header input[name="q"]');
  await cdp.enviar("Input.insertText", { text: "Analista Judiciário" });
  for (const type of ["keyDown", "keyUp"]) {
    await cdp.enviar("Input.dispatchKeyEvent", {
      type,
      key: "Enter",
      code: "Enter",
      windowsVirtualKeyCode: 13,
      ...(type === "keyDown" ? { text: "\r" } : {}),
    });
  }
  conferir(
    await ate(cdp, `location.pathname === "/busca/analista-judiciario"`, 8000),
    "a busca do cabeçalho leva a /busca/analista-judiciario",
    await avaliar(cdp, "location.href"),
  );
  conferir(await avaliar(cdp, "window.__semRecarga === true"), "a busca do cabeçalho não recarregou a página");
  conferir(
    await ate(cdp, `(document.querySelector("h1")?.textContent ?? "").includes("Analista")`),
    "o título da busca aparece",
  );
}

async function verificarCadastro(cdp) {
  await navegar(cdp, "/cadastrar");
  const texto = await avaliar(cdp, "document.body.innerText");
  conferir(
    texto.includes("Criar conta com Google") && texto.includes("Criar conta com LinkedIn"),
    "o cadastro oferece Google e LinkedIn",
  );
}

/** A 404 responde 404 pelo HTTP e ainda assim mostra o cabeçalho do site. */
async function verificar404(cdp) {
  const resposta = await fetch(BASE + CAMINHO_404, { redirect: "manual" });
  conferir(resposta.status === 404, "a 404 responde com status 404", String(resposta.status));

  await largura(cdp, 375);
  await navegar(cdp, CAMINHO_404);
  conferir(
    await avaliar(cdp, `!!document.querySelector("header")`),
    "a 404 renderiza o cabeçalho do site",
  );
}

/**
 * Clicar um filtro em `/busca/<termo>` troca a query por `pushState`
 * (`LinkDaConsulta`), sem pedir de novo o RSC do termo ao servidor. A coluna
 * de filtros só aparece sem a gaveta a partir do breakpoint `lg`, então a
 * largura aqui é de desktop, não de celular.
 */
async function verificarFiltroSemRsc(cdp, termo) {
  await largura(cdp, 1280);
  await navegar(cdp, termo);
  const pedidos = [];
  const parar = cdp.sempre("Network.requestWillBeSent", (params) => {
    pedidos.push(params.request.url);
  });
  await clicar(cdp, "aside a[aria-label]");
  conferir(
    await ate(cdp, `new URLSearchParams(location.search).toString() !== ""`, 2000),
    "o clique no filtro muda a query da URL",
  );
  await esperar(500);
  parar();
  // Só o pedido do PRÓPRIO termo importa aqui: outros links visíveis na tela
  // (cartão de resultado, "voltar" do cabeçalho) fazem prefetch de rota
  // deles mesmos por conta própria, e isso não tem nada a ver com o clique
  // no filtro nem com o custo que `LinkDaConsulta` evita.
  const comRsc = pedidos.filter((url) => {
    if (!url.includes("_rsc")) return false;
    try {
      return new URL(url).pathname === termo;
    } catch {
      return false;
    }
  });
  conferir(comRsc.length === 0, "clicar um filtro em /busca/<termo> não pede _rsc", comRsc.join(" | "));
}

/**
 * Nenhum texto visível pode ter o travessão (pedido do parceiro humano). Título de concurso e nome
 * de órgão já saem sem ele (`normalizarResumo`/`normalizarDetalhe`, em
 * `src/lib/concursos.ts`), mas isto aqui é a prova pelo HTML de verdade, e
 * não só pelas funções isoladas.
 *
 * A citação literal do FAQ e a do ato publicado ficam de fora da varredura:
 * as duas são o texto do Diário, palavra por palavra (`Faq.tsx`,
 * `AtosPublicados.tsx`), e o Diário pode ter travessão à vontade. A regra é
 * sobre o que o site escreve, não sobre o documento que ele cita. As duas
 * são o único lugar da página com as classes `wrap-anywhere` e
 * `text-tinta-800` juntas no mesmo `<p>`, então cortar por elas é cortar
 * exatamente as duas citações e nada mais.
 */
async function verificarSemTravessaoNoHtml(paginas) {
  const travessao = String.fromCharCode(8212);
  const citacaoLiteral = /<p class="[^"]*wrap-anywhere[^"]*text-tinta-800[^"]*">[\s\S]*?<\/p>/g;
  for (const caminho of paginas) {
    const html = await (await fetch(BASE + caminho)).text();
    const semCitacao = html.replace(citacaoLiteral, "");
    conferir(
      !semCitacao.includes(travessao),
      `${caminho} não tem travessão fora da citação literal`,
    );
  }
}

async function verificarRespostas(concurso) {
  const semSeguir = (caminho) => fetch(BASE + caminho, { redirect: "manual" });
  const destino = (resposta) => {
    const local = resposta.headers.get("location");
    if (!local) return null;
    const url = new URL(local, BASE);
    return url.pathname + url.search;
  };

  let resposta = await semSeguir("/concursos?q=Analista%20Judici%C3%A1rio&uf=SP");
  conferir(
    resposta.status === 308 && destino(resposta) === "/busca/analista-judiciario?uf=SP",
    "/concursos?q= redireciona permanente para /busca",
    `${resposta.status} ${destino(resposta)}`,
  );
  resposta = await semSeguir("/busca/Analista%20Judici%C3%A1rio");
  conferir(
    resposta.status === 308 && destino(resposta) === "/busca/analista-judiciario",
    "slug fora da forma canônica redireciona",
    `${resposta.status} ${destino(resposta)}`,
  );
  resposta = await semSeguir("/busca/---");
  conferir(resposta.status === 404, "slug vazio é 404", String(resposta.status));

  resposta = await fetch(`${BASE}/busca/zzqxw-nada-casa`);
  const html = await resposta.text();
  conferir(
    resposta.status === 200 && html.includes("Nenhum concurso") && /noindex/.test(html),
    "busca sem resultado responde 200, diz que não há e fica fora do índice",
    String(resposta.status),
  );

  await fetch(`${BASE}/busca/analista-judiciario`);
  resposta = await fetch(`${BASE}/busca/analista-judiciario`);
  conferir(
    ["HIT", "STALE"].includes(resposta.headers.get("x-nextjs-cache")),
    "/busca/<termo> sai do cache (ISR)",
    String(resposta.headers.get("x-nextjs-cache")),
  );

  resposta = await fetch(BASE + concurso);
  conferir(resposta.status === 200, "o detalhe do concurso responde 200", `${concurso} ${resposta.status}`);

  const mapa = await (await fetch(`${BASE}/sitemap.xml`)).text();
  conferir(mapa.includes("/busca/"), "o sitemap lista buscas por cargo");
}

async function principal() {
  const { processo, perfil, endereco } = await abrirChrome();
  const cdp = conectar(endereco);
  let concurso = null;
  let termo = null;
  try {
    await cdp.pronto;
    await cdp.enviar("Page.enable");
    await cdp.enviar("Runtime.enable");
    await cdp.enviar("Network.enable");
    // Localização negada: nenhuma conferência aqui clica em "Perto de mim",
    // e sem permissão nenhum prompt aparece por engano no meio do roteiro.
    await cdp.enviar("Browser.setPermission", {
      permission: { name: "geolocation" },
      setting: "denied",
      origin: BASE,
    });

    await largura(cdp, 375);
    await navegar(cdp, "/");
    const alvos = await avaliar(
      cdp,
      `(() => {
        const href = (seletor) => document.querySelector(seletor)?.getAttribute("href") ?? null;
        return {
          concurso: href('a[href^="/concursos/"]'),
          orgao: href('a[href^="/orgaos/"]'),
          termo: href('a[href^="/busca/"]'),
        };
      })()`,
    );
    conferir(
      Boolean(alvos.concurso && alvos.orgao && alvos.termo),
      "a home tem links de concurso, órgão e busca",
      JSON.stringify(alvos),
    );
    concurso = alvos.concurso;
    termo = alvos.termo;

    const paginas = [
      "/",
      alvos.termo,
      "/concursos",
      alvos.concurso,
      alvos.orgao,
      "/entrar",
      "/cadastrar",
      CAMINHO_404,
    ]
      .filter(Boolean)
      .map((href) => href.split("#")[0]);
    await verificarTransbordo(cdp, paginas);
    await verificarGaveta(cdp);
    await verificarBuscaDoCabecalho(cdp);
    await verificarCadastro(cdp);
    await verificar404(cdp);
    if (termo) await verificarFiltroSemRsc(cdp, termo);

    await navegar(cdp, "/concursos?situacao=abertas");
    const concursoAberto = await avaliar(
      cdp,
      `document.querySelector('a[href^="/concursos/"]')?.getAttribute("href") ?? null`,
    );
    await verificarTask16(cdp, concursoAberto);

    await navegar(cdp, "/concursos?q=Analista%20Judici%C3%A1rio");
    conferir(
      await avaliar(cdp, `location.pathname === "/busca/analista-judiciario"`),
      "o navegador que abre /concursos?q= termina em /busca",
    );
  } finally {
    cdp.fechar();
    processo.kill();
    await esperar(300);
    rmSync(perfil, { recursive: true, force: true });
  }

  if (concurso) await verificarRespostas(concurso);
  await verificarSemTravessaoNoHtml(["/", "/busca/professor", concurso].filter(Boolean));

  if (falhas.length > 0) {
    console.error(`\n${falhas.length} conferência(s) falharam.`);
    process.exit(1);
  }
  console.log("\nTudo conferido.");
}

await principal();
