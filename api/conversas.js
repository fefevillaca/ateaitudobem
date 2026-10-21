// /api/conversas
//   POST   { dados, prazo }  guarda a conversa trancada e devolve { id, token, expiraEm }
//   GET    ?id=              devolve { dados, expiraEm }
//   GET    ?id=&so=prazo     devolve só { expiraEm }, para conferir se a conversa ainda existe
//   DELETE ?id=  x-dona:      apaga a conversa e os comentários antes do prazo
// O servidor nunca vê a chave, então "dados" é ilegível para ele.

import { redis, PRAZOS, novoId, novoToken, resumo, idValido, responder, lerCorpo, OPTIONS } from "./_lib/armazem.js";

export { OPTIONS };

const LIMITE = 4_000_000;

export async function POST(request) {
  const { corpo, erro } = await lerCorpo(request, LIMITE + 1000);
  if (erro === "grande") return responder({ erro: "a conversa ficou grande demais pra um link. escolhe um pedaço menor." }, 413);
  if (erro) return responder({ erro: "a gente não entendeu o pedido. recarrega a página e tenta de novo." }, 400);
  const { dados, prazo } = corpo || {};
  if (typeof dados !== "string" || !dados) return responder({ erro: "não tem mensagem nesse pedaço. aumenta o período." }, 400);
  if (!PRAZOS.includes(prazo)) return responder({ erro: "esse prazo não existe aqui. escolhe 1 hora, 24 horas, 3 dias ou 7 dias." }, 400);

  const id = novoId(), token = novoToken(), expiraEm = Date.now() + prazo * 1000;
  await redis("SET", `c:${id}`, JSON.stringify({ dados, expiraEm, dona: resumo(token) }), "EX", prazo);
  return responder({ id, token, expiraEm }, 201);
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  const bruto = idValido(id) ? await redis("GET", `c:${id}`) : null;
  if (!bruto) return responder({ erro: "essa conversa já sumiu." }, 404);
  const { dados, expiraEm } = JSON.parse(bruto);
  if (new URL(request.url).searchParams.get("so") === "prazo") return responder({ expiraEm });
  return responder({ dados, expiraEm });
}

export async function DELETE(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!idValido(id)) return responder({ ok: true });
  const bruto = await redis("GET", `c:${id}`);
  if (!bruto) return responder({ ok: true });
  if (JSON.parse(bruto).dona !== resumo(request.headers.get("x-dona") || "")) {
    return responder({ erro: "só o link de dona apaga a conversa." }, 403);
  }
  await redis("DEL", `c:${id}`, `k:${id}`);
  return responder({ ok: true });
}
