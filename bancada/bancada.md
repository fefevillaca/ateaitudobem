# bancada

O teste de fogo da leitura de prints. Ela gera telas de WhatsApp falsas, com uma conversa inventada,
sobre papéis de parede difíceis, lê cada uma com o leitor do app e compara com o que está de fato na
tela. Nasceu em 21/10/2026, quando um print real com papel de parede de céu não foi lido.

## O que tem aqui

- `conversa.js`: a conversa inventada, em três lotes que cabem numa tela cada, com os casos que mais
  derrubam a leitura (balão de uma palavra, balão longo, resposta citada, separador de dia).
- `tela.html`: a tela de WhatsApp em tamanho de iPhone, no modo escuro ou claro, com o papel de
  parede escolhido. Os fundos `ceu`, `folhas`, `grao` e `por-do-sol` são desenhados na hora; `liso`
  é o papel de cor única; `foto1` a `foto5` são fotos de verdade.
- `gerar.sh`: tira os prints de todas as combinações com o Chrome sem janela, mais a versão
  comprimida que o WhatsApp manda adiante (`-zap.jpg`) e os quadros de uma rolagem sobre a foto
  parada, que fazem as vezes de vídeo.
- `bancada.js`: lê os prints e dá a nota de cada um e por fundo.

As fotos, os prints e os quadros ficam fora do git. O `gerar.sh` refaz tudo.

## Como rodar

```
node servidor-local.mjs
sh bancada/gerar.sh
```

Depois, no console de http://localhost:4747/ateaitudobem/:

```
const b = await import("/ateaitudobem/bancada/bancada.js?v=" + Date.now())
await b.rodar(b.todos())
b.resumo(); b.porFundo()
```

São 120 prints e uns dez minutos de leitura.

## O que ela mediu

Em 21/10/2026, antes da leitura aprender papel de foto, saíam 18 das 160 mensagens de uma rodada
com um print de cada fundo, e só o papel liso funcionava. Depois, na rodada inteira, o resultado
está em [`app.md`](../app.md), na parte de como a leitura foi testada.
