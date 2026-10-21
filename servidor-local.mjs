// Roda o app no computador, sem Vercel: serve a pasta public/ e as rotas de api/.
// Sem Redis configurado, as conversas ficam na memória e somem quando o servidor para.
//   node servidor-local.mjs   →   http://localhost:4747/ateaitudobem/

import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const publico = path.join(aqui, "public");
const porta = +process.env.PORT || 4747;
const rotas = {
  "/api/conversas": () => import("./api/conversas.js"),
  "/api/comentarios": () => import("./api/comentarios.js")
};
const tipos = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".ico": "image/x-icon"
};

function lerCorpo(req) {
  return new Promise(ok => { const partes = []; req.on("data", p => partes.push(p)); req.on("end", () => ok(Buffer.concat(partes))); });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${porta}`);
  // no ar, as páginas moram em fefe.garden/ateaitudobem; aqui o mesmo caminho funciona
  if (url.pathname === "/ateaitudobem") { res.writeHead(301, { location: "/ateaitudobem/" }); return res.end(); }
  if (url.pathname.startsWith("/ateaitudobem/")) url.pathname = url.pathname.slice("/ateaitudobem".length);
  try {
    if (rotas[url.pathname]) {
      const modulo = await rotas[url.pathname]();
      const funcao = modulo[req.method];
      if (!funcao) { res.writeHead(405); return res.end(); }
      const headers = {};
      for (const h of ["content-type", "x-dona"]) if (req.headers[h]) headers[h] = req.headers[h];
      const corpo = ["GET", "HEAD"].includes(req.method) ? undefined : await lerCorpo(req);
      const resposta = await funcao(new Request(url, { method: req.method, headers, body: corpo }));
      res.writeHead(resposta.status, Object.fromEntries(resposta.headers));
      return res.end(Buffer.from(await resposta.arrayBuffer()));
    }
    // a bancada de teste da leitura só existe aqui no computador; ela não vai para o ar
    const raiz = url.pathname.startsWith("/bancada/") ? aqui : publico;
    let arquivo = path.join(raiz, decodeURIComponent(url.pathname));
    if (!arquivo.startsWith(raiz)) { res.writeHead(403); return res.end(); }
    try { if ((await stat(arquivo)).isDirectory()) arquivo = path.join(arquivo, "index.html"); }
    catch { arquivo += ".html"; }
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { "content-type": tipos[path.extname(arquivo)] || "application/octet-stream" });
    res.end(conteudo);
  } catch (e) {
    if (e.code === "ENOENT") { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end("Não achei essa página."); }
    console.error(e);
    res.writeHead(500); res.end("erro");
  }
}).listen(porta, () => console.log(`simulador de conversa em http://localhost:${porta}`));
