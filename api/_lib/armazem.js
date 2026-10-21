// O armazém guarda só o que chega trancado do navegador, sempre com prazo de validade.
// No ar, é um Redis da Upstash (o prazo é do próprio Redis, que apaga a chave sozinho).
// No computador, sem Redis configurado, vira uma memória que imita os mesmos comandos.

import { randomBytes, createHash } from "node:crypto";

const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_REDIS = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const memoria = new Map();
function vivo(chave) {
  const e = memoria.get(chave);
  if (!e) return null;
  if (e.expira && e.expira <= Date.now()) { memoria.delete(chave); return null; }
  return e;
}
function naMemoria([comando, chave, ...resto]) {
  switch (comando) {
    case "SET": {
      const ex = resto[1] === "EX" ? +resto[2] : null;
      memoria.set(chave, { valor: resto[0], expira: ex ? Date.now() + ex * 1000 : null });
      return "OK";
    }
    case "GET": return vivo(chave)?.valor ?? null;
    case "DEL": return [chave, ...resto].filter(c => memoria.delete(c)).length;
    case "RPUSH": {
      const e = vivo(chave) || { valor: [], expira: null };
      e.valor.push(...resto); memoria.set(chave, e);
      return e.valor.length;
    }
    case "LLEN": return vivo(chave)?.valor.length || 0;
    case "LRANGE": {
      const lista = vivo(chave)?.valor || [];
      const fim = +resto[1] === -1 ? undefined : +resto[1] + 1;
      return lista.slice(+resto[0], fim);
    }
    case "EXPIREAT": {
      const e = vivo(chave); if (!e) return 0;
      e.expira = +resto[0] * 1000; return 1;
    }
    default: throw new Error(`comando ${comando} não existe na memória local`);
  }
}

export async function redis(...comando) {
  if (!URL_REDIS) {
    if (process.env.VERCEL) throw new Error("O armazém não está configurado.");
    return naMemoria(comando);
  }
  const r = await fetch(URL_REDIS, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN_REDIS}` },
    body: JSON.stringify(comando)
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export const PRAZOS = [3600, 86400, 259200, 604800]; // 1 hora, 24 horas, 3 dias, 7 dias

export const novoId = () => randomBytes(12).toString("base64url");
export const novoToken = () => randomBytes(24).toString("base64url");
export const resumo = texto => createHash("sha256").update(String(texto)).digest("hex");
export const idValido = id => typeof id === "string" && /^[A-Za-z0-9_-]{16}$/.test(id);

// As páginas moram em fefe.garden e o cofre aqui. O cofre só guarda bloco trancado e não usa
// cookie nem login, então responder a qualquer origem não abre nada.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, x-dona",
  "access-control-max-age": "86400"
};

export function responder(corpo, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS }
  });
}

// o navegador pergunta antes de mandar POST com JSON ou o cabeçalho x-dona
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });

export async function lerCorpo(request, limite) {
  const texto = await request.text();
  if (texto.length > limite) return { erro: "grande" };
  try { return { corpo: JSON.parse(texto) }; } catch { return { erro: "invalido" }; }
}
