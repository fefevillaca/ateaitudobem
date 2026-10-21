// A conversa inventada dos prints de teste. Cada lote cabe numa tela só e junta os casos que mais
// derrubam a leitura: balão de uma palavra, balão longo de várias linhas, resposta citada, sequência
// do mesmo lado e separador de dia.
// [lado, texto, hora, citação?]   lado: "e" é quem tem o celular, "o" é a outra parte
export const LOTES = [
  [
    ["dia", "21 de outubro de 2026"],
    ["o", "Mano do céu", "10:53"],
    ["o", "Kkkk", "10:53"],
    ["o", "Precisava mesmo falar disso no jantar", "10:53"],
    ["e", "eu sei que ficou chato pra vc", "11:14"],
    ["e", "Mas era aniversário dela, todo mundo animado, ninguém tava prestando atenção na conversa", "11:15"],
    ["o", "?", "11:15"],
    ["e", "Achei que vcs já tinham conversado sobre isso antes, juro", "11:15"],
    ["o", "Não é sobre isso", "11:33", ["Você", "Achei que vcs já tinham conversado sobre isso antes"]],
  ],
  [
    ["o", "acho que o problema é o mapa", "00:22"],
    ["e", "pq a rua não aparece no app", "00:24"],
    ["o", "simmmmmm", "00:24", ["Você", "pq a rua não aparece no app"]],
    ["e", "e o endereço tá escrito errado", "00:24"],
    ["o", "vou mandar o print pro moço amanhã", "00:24"],
    ["e", "boa", "00:24"],
    ["o", "com a foto da fachada assim:", "00:25"],
    ["e", "manda tb o número do pedido", "00:25"],
    ["e", "ja resolve", "00:25"],
  ],
  [
    ["dia", "Ontem"],
    ["o", "oi, tá livre amanhã?", "19:02"],
    ["e", "tô sim! a gente ia no aniversário da Bia, lembra?", "19:05"],
    ["o", "ah verdade", "19:40"],
    ["o", "então, sobre isso", "19:41"],
    ["e", "?", "19:41"],
    ["o", "esquece, depois a gente fala", "19:58"],
    ["e", "como assim depois? você que puxou o assunto", "20:03"],
    ["dia", "Hoje"],
    ["o", "desculpa sumir ontem, fiquei sem bateria", "11:18"],
  ],
];
