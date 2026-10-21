// /api/comentarios
//   POST { id, dados }      acrescenta um comentário trancado, que vence junto com a conversa
//   GET  ?id=&desde=        devolve { itens, total } a partir da posição "desde"

import { redis, idValido, responder, lerCorpo, OPTIONS } from "./_lib/armazem.js";

export { OPTIONS };

const LIMITE = 2_500_000; // um áudio de dois minutos cabe com folga
const MAXIMO = 3000;

export async function POST(request) {
  const { corpo, erro } = await lerCorpo(request, LIMITE);
  if (erro === "grande") return responder({ erro: "esse comentário ficou grande demais. se for áudio, grava um mais curto." }, 413);
  if (erro) return responder({ erro: "a gente não entendeu o pedido. recarrega a página e tenta de novo." }, 400);
  const { id, dados } = corpo || {};
  if (!idValido(id) || typeof dados !== "string" || !dados) return responder({ erro: "a gente não entendeu o pedido. recarrega a página e tenta de novo." }, 400);

  const bruto = await redis("GET", `c:${id}`);
  if (!bruto) return responder({ erro: "essa conversa já sumiu." }, 404);
  const { expiraEm } = JSON.parse(bruto);
  if (await redis("LLEN", `k:${id}`) >= MAXIMO) return responder({ erro: "essa conversa chegou ao limite de 3 mil comentários." }, 429);

  const total = await redis("RPUSH", `k:${id}`, dados);
  await redis("EXPIREAT", `k:${id}`, Math.ceil(expiraEm / 1000));
  return responder({ total }, 201);
}

export async function GET(request) {
  const busca = new URL(request.url).searchParams;
  const id = busca.get("id");
  const desde = Math.max(0, parseInt(busca.get("desde"), 10) || 0);
  if (!idValido(id)) return responder({ itens: [], total: 0 });
  const itens = await redis("LRANGE", `k:${id}`, desde, -1);
  return responder({ itens, total: desde + itens.length });
}
