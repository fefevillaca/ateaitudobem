#!/bin/sh
# Gera os prints de teste: cada papel de parede, no modo escuro e no claro, com os três lotes da
# conversa, em tamanho de iPhone (1170 × 2532) e na versão comprimida que o WhatsApp manda adiante.
# Precisa do servidor local rodando (node servidor-local.mjs) e do Google Chrome.
#
# As fotos de fundo ficam em fundos/foto1.jpg … foto5.jpg e não vão para o git. Na casa da Fernanda
# elas saem das fotos do Janela e do pomar; em outra máquina, qualquer foto serve.
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PERFIL="${TMPDIR:-/tmp}/bancada-chrome"
CASA="$(cd ../../../.. && pwd)"
mkdir -p fundos prints rolagem

i=0
for f in janela/marca/assets/foto/amostra-luz.jpg janela/marca/assets/grafismo/vidro.jpg \
         sistema/pomar/para-o-make/REFERENCIA-5-viveiro.jpg \
         janela/projetos/bazar/divulgacao/fotos/aberto_p8_0_2665x3998.jpg \
         janela/projetos/bazar/divulgacao/fotos/manual_p20_0_2563x1444.jpg; do
  i=$((i + 1))
  [ -f "fundos/foto$i.jpg" ] || { [ -f "$CASA/$f" ] && sips -Z 1400 "$CASA/$f" --out "fundos/foto$i.jpg" >/dev/null; }
done

tirar() { # nome, endereço
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$PERFIL" \
    --window-size=500,1082 --force-device-scale-factor=2.34 --virtual-time-budget=8000 \
    --screenshot="$1" "http://localhost:4747/ateaitudobem/bancada/tela.html?$2" >/dev/null 2>&1
}

for f in liso ceu folhas grao por-do-sol foto1 foto2 foto3 foto4 foto5; do
  for m in escuro claro; do
    for l in 0 1 2; do
      tirar "prints/$f-$m-$l.png" "fundo=$f&modo=$m&lote=$l"
      sips -Z 1280 -s format jpeg -s formatOptions 55 "prints/$f-$m-$l.png" --out "prints/$f-$m-$l-zap.jpg" >/dev/null
    done
  done
done

# a conversa inteira rolando sobre a foto parada, como os quadros de um vídeo
for f in ceu foto4; do
  for m in escuro claro; do
    for k in 0 1 2 3 4 5 6 7 8 9; do
      tirar "rolagem/$f-$m-$k.png" "fundo=$f&modo=$m&lote=todos&y=$((k * 140))"
      sips -Z 1280 -s format jpeg -s formatOptions 55 "rolagem/$f-$m-$k.png" --out "rolagem/$f-$m-$k.jpg" >/dev/null
      rm "rolagem/$f-$m-$k.png"
    done
  done
done
echo "$(ls prints | wc -l | tr -d ' ') prints e $(ls rolagem | wc -l | tr -d ' ') quadros de rolagem"
