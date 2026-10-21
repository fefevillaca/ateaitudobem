// Bancada dos prints com papel de parede de foto: lê cada print com o leitor do app e compara com
// a conversa que está de fato na tela. Rodar no console da página:
//   const b = await import("/ateaitudobem/bancada/bancada.js?v=" + Date.now()); await b.rodar(b.todos())
import { LOTES } from "./conversa.js";

const limpo = s => (s || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9?]/g, "");
function parecido(a, b) {
  a = limpo(a); b = limpo(b);
  if (!a || !b) return a === b;
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[m][n] / Math.max(m, n);
}

export function comparar(nome, itens) {
  const lote = +nome.match(/-(\d)(?:-zap)?\./)[1];
  const verdade = LOTES[lote].filter(m => m[0] !== "dia").map(([lado, texto, hora]) => ({ lado: lado === "e" ? "eu" : "outro", texto, hora }));
  const lidas = itens.filter(i => i.tipo === "msg");
  let k = 0, achadas = 0, ladoErrado = 0, horaCerta = 0, textoMedio = 0;
  const usadas = new Set();
  for (const v of verdade) {
    let melhor = -1, nota = 0.6;
    for (let j = k; j < lidas.length; j++) { const p = parecido(v.texto, lidas[j].texto); if (p > nota) { nota = p; melhor = j; } }
    if (melhor < 0) continue;
    usadas.add(melhor); k = melhor + 1; achadas++; textoMedio += nota;
    if (lidas[melhor].lado !== v.lado) ladoErrado++;
    if (lidas[melhor].hora === v.hora) horaCerta++;
  }
  return { nome, total: verdade.length, achadas, ladoErrado, horaCerta, sobra: lidas.length - usadas.size, texto: achadas ? +(textoMedio / achadas).toFixed(2) : 0 };
}

export async function rodar(nomes, { nomes: pessoas = { dona: "eu", outros: ["Rafa"] } } = {}) {
  const ocr = await import("/ateaitudobem/js/ocr.js?v=" + Date.now());
  window.resultado = [];
  for (const nome of nomes) {
    const blob = await (await fetch("/ateaitudobem/bancada/prints/" + nome)).blob();
    try {
      const r = await ocr.lerImagens([blob], { nomes: pessoas });
      window.resultado.push(comparar(nome, r.itens));
    } catch (e) {
      window.resultado.push({ nome, erro: e.message });
    }
  }
  window.resultadoPronto = true;
  return window.resultado;
}

export function resumo(res = window.resultado) {
  const ok = res.filter(r => !r.erro);
  const soma = c => ok.reduce((s, r) => s + r[c], 0);
  return {
    prints: res.length, erros: res.filter(r => r.erro).length,
    mensagens: `${soma("achadas")} de ${soma("total")}`, ladoErrado: soma("ladoErrado"),
    horaCerta: `${soma("horaCerta")} de ${soma("achadas")}`, sobras: soma("sobra"),
    piores: [...res].sort((a, b) => (a.achadas ?? -1) / (a.total || 1) - (b.achadas ?? -1) / (b.total || 1)).slice(0, 12).map(r => `${r.nome}: ${r.erro || `${r.achadas}/${r.total} lado✗${r.ladoErrado} sobra${r.sobra}`}`)
  };
}

// todos os prints que o gerar.sh faz: cada fundo, nos dois modos, nos três lotes, cru e comprimido
export const FUNDOS = ["liso", "ceu", "folhas", "grao", "por-do-sol", "foto1", "foto2", "foto3", "foto4", "foto5"];
export const todos = () => FUNDOS.flatMap(f => ["escuro", "claro"].flatMap(m => [0, 1, 2].flatMap(l => [`${f}-${m}-${l}.png`, `${f}-${m}-${l}-zap.jpg`])));

// a nota por fundo, para achar onde a leitura ainda tropeça
export function porFundo(res = window.resultado) {
  const g = {};
  for (const x of res) { const k = x.nome.replace(/-\d(-zap)?\.(png|jpg)/, "$1"); g[k] = g[k] || [0, 0]; g[k][0] += x.achadas || 0; g[k][1] += x.total || 0; }
  return Object.entries(g).map(([k, v]) => `${k} ${v[0]}/${v[1]}`).join(" · ");
}
