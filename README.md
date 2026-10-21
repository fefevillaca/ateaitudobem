# até aí tudo bem

A conversa que chegou em print, aberta como no celular de quem mandou, com espaço pro grupo
comentar cada mensagem. No ar em https://fefe.garden/ateaitudobem.

As páginas (`public/`) moram no fefe.garden e o cofre (`api/`), que guarda a conversa trancada e
apaga no prazo, roda na Vercel com um Redis da Upstash. A chave que tranca a conversa nasce no
navegador e viaja só no pedaço do link depois do `#`, que nunca chega a servidor nenhum.

## Como rodar no computador

```
node servidor-local.mjs
```

Abre em http://localhost:4747. Sem Redis configurado, as conversas ficam na memória e somem
quando o servidor para. O app abre em http://localhost:4747/ateaitudobem/.

## O que mora onde

- `public/` é o que o navegador recebe.
  - `index.html` + `js/criar.js`: a página de montar. Escolhe a fonte, confere a leitura,
    recorta o período, cria o link e baixa a conversa.
  - `c.html` + `js/ver.js`: a página de quem recebe o link. Destranca, mostra, mantém os
    comentários vivos (busca novos a cada 4 segundos) e apaga para quem tem o link de dona.
  - `sobre.html`: como funciona e o que fica guardado.
  - `js/celular.js`: a tela do celular, usada nas duas páginas, com a barra de comentar e a
    gravação de áudio (até 2 minutos).
  - `js/leitura.js`: lê o texto exportado ou copiado do WhatsApp (iPhone e Android).
  - `js/ocr.js`: lê prints e vídeo no navegador com o Tesseract. As regras estão no topo do
    arquivo.
  - `js/cripto.js`: tranca e destranca com AES-GCM de 256 bits.
  - `js/local.js`: o que o navegador lembra (nome no grupo, links de dona) e o download.
- `api/` é o servidor, em funções da Vercel.
  - `conversas.js`: guarda, entrega e apaga a conversa trancada.
  - `comentarios.js`: guarda e entrega os comentários trancados.
  - `_lib/armazem.js`: o Redis da Upstash no ar, a memória no computador.
- `servidor-local.mjs`: roda tudo isso no computador, sem Vercel.

## O link

`/c#id.chave` para mandar e `/c#id.chave.token` para a dona. O `#` é o que garante a promessa:
o navegador nunca manda essa parte para o servidor. O token de dona é guardado no servidor só
como resumo (sha-256), então nem ele dá para ler de lá.

## Limites

- Prazos aceitos: 1 hora, 24 horas, 3 dias, 7 dias. Outro valor é recusado.
- Conversa trancada até 4 MB (dá dezenas de milhares de mensagens; o recorte de período resolve
  o que passar disso).
- Comentário até 2,5 MB, 3000 por conversa.
- Vídeo: um quadro a cada 0,15 segundo, até 700 quadros. Vídeo mais longo espaça os quadros.

## Como a leitura de prints e vídeo funciona

As regras estão no topo de `public/js/ocr.js`. Em resumo, a leitura acha cada balão pelo formato
antes de ler qualquer letra, porque ler a tela inteira de uma vez não aguenta vídeo comprimido:

- **Os nomes vêm antes.** Quem gravou e com quem é a conversa (em grupo, os nomes separados por
  vírgula). Os nomes decidem de quem é cada citação e, em grupo, cada balão.
- **Balão é região cheia fora da cor do papel de parede.** O desenho do papel e o ruído da
  compressão ficam de fora porque a conta olha a vizinhança de cada ponto. Dois balões colados se
  separam onde a força e a largura da linha caem juntas.
- **No vídeo, os balões inteiros votam em quanto a tela rolou** de um quadro para o outro. Cada
  balão ganha um lugar fixo na conversa e é lido uma vez, nas até três versões mais paradas.
- **O horário é lido à parte**, no canto, por um leitor que só aceita números, e depois conferido
  contra a ordem da conversa.
- **A citação é achada pela barrinha colorida** à esquerda dela.
- **O separador de dia de verdade anda com a conversa**; o que flutua no topo enquanto ela rola
  fica de fora.

## Como foi testada

Com dois vídeos de tela reais (iPhone, modo escuro, 384 × 832 depois de passar pelo WhatsApp,
com citações e o separador flutuante) e com prints gerados de uma tela falsa em tamanho de
iPhone, claros e escuros, sobrepostos e recortados. Nos vídeos reais, de 40 e 24 mensagens, a
leitura acertou lado, ordem, citação e horário de todas, com erro de uma letra em poucas e um resto
ilegível por vídeo, que se apaga na revisão. Emoji ainda vira letra solta (🥹 sai como "&").

Para conferir à mão o que a leitura enxerga num quadro, `analisarQuadro(canvas)` devolve os
balões achados, e `depuracao.registro = []` antes de ler guarda a rolagem decidida em cada quadro.
