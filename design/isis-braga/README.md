# Flyer — Isis Braga · Formatação Acadêmica

Peça 4:5 para redes sociais, no vocabulário do International Typographic Style
(escola suíça): grid modular, composição assimétrica, sem ornamento, um único acento
cromático. O PNG é gerado a partir de `flyer.html` — o HTML é a fonte da verdade,
os PNGs são build.

Versões anteriores da peça, em outra direção estética, estão no histórico do git
(commit `91d0a00`).

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `flyer.html` | Fonte. Página de 1080×1350, gerada por script a partir de um grid declarado. |
| `flyer-1080x1350.png` | Versão para postagem. |
| `flyer-2160x2700.png` | Mesma arte em 2×. |
| `OBJECTIVE-FIELD.md` | Filosofia de design que guiou a peça. |
| `fonts/` | Instrument Sans (regular e bold) com a licença OFL. |

## O grid

Tudo deriva de quatro números, declarados uma vez:

```
margem      90px
área útil   900px
colunas     6, com medianiz de 24px  ->  coluna de 130px
```

As colunas caem em x = 90, 244, 398, 552, 706, 860, fechando exatamente em 990.
Os numeradores ficam na coluna 0, o texto dos serviços começa na coluna 1, e o campo
de barras da direita ocupa da coluna 3 até a margem. Nada é posicionado "no olho".

## Alinhamento óptico

As letras não são alinhadas pela caixa, e sim pela tinta. Os deslocamentos foram
medidos no raster e aplicados um a um:

| Elemento | Correção | Motivo |
| --- | --- | --- |
| `Isis Braga` | −5,5px | haste reta do I encosta no fio |
| `FORMATAÇÃO` / `ACADÊMICA` | −5,0px | haste reta do F encosta; o A diagonal sobra 2,5px |
| `Solicite seu orçamento` | −2,5px | o S redondo precisa sobrar ~1,5px |
| `TCC` | −1,5px | o T tem espacejamento lateral menor que o P |
| demais serviços | −4,0px | haste reta do P |

Depois da correção, as hastes retas caem em 90,0 e 244,0 exatos; as letras redondas
e diagonais sobram de propósito.

## Entrelinha do título

`line-height` de 1,15 não é estético, é obrigatório. Em 0,94 o circunflexo do Ê em
ACADÊMICA colide com a cedilha do Ç em FORMATAÇÃO. Em 1,06 o respiro cai para 7,5px
e fica sufocado. O valor atual deixa 18px de papel limpo entre as duas linhas — isso
foi medido no raster, não estimado. Quem mexer no corpo ou na entrelinha do título
precisa refazer essa verificação.

## Como regerar os PNGs

```sh
cd design/isis-braga
chromium --headless --no-sandbox --disable-gpu \
  --allow-file-access-from-files --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1080,1350 \
  --virtual-time-budget=5000 \
  --screenshot=flyer-2160x2700.png file://$PWD/flyer.html

python3 -c "from PIL import Image; im=Image.open('flyer-2160x2700.png'); \
  im.resize((1080,1350), Image.LANCZOS).save('flyer-1080x1350.png', optimize=True)"
```

Duas armadilhas conhecidas:

- Use o binário `headless_shell` ou `--headless=new`. O headless antigo do Chrome
  desconta a altura da barra do navegador da viewport e corta uns 70px do rodapé,
  sem dar erro.
- `--allow-file-access-from-files` é obrigatório, senão as `@font-face` não carregam
  e o texto cai para a fonte do sistema.

## Texto da peça

Conferido caractere a caractere. Qualquer edição precisa preservar os acentos:

- Nome: `Isis Braga`
- Título: `FORMATAÇÃO ACADÊMICA` (escrito em title case no HTML, convertido por
  `text-transform: uppercase`)
- Serviços: `TCC` · `Projeto Mário Travassos` · `Projeto de pesquisa de mestrado` ·
  `Projeto de pesquisa de TCC`
- Chamada: `Solicite seu orçamento`

As linhas de serviço usam `white-space: nowrap`. A mais longa hoje termina em x=895,
com 95px de folga até a margem. Texto mais longo que isso estoura sem avisar — confira
antes de publicar.

Não há telefone, e-mail, @, preço, prazo ou credencial na peça. Isso foi decidido,
não esquecido.

## Cor

Papel `#F4F2ED`, tinta `#16171A`, vermelho `#D6402A`. O vermelho aparece em três
lugares e só: a barra sob o título, os numeradores e o rótulo "Serviços". O campo de
barras da direita é uma página de texto reduzida a notação — mesma geometria dos fios
do resto da peça, sem virar ilustração.

## Licença da fonte

Instrument Sans é SIL Open Font License 1.1; o texto está em `fonts/InstrumentSans-OFL.txt`.
