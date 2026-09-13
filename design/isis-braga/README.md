# Flyer — Isis Braga · Formatação Acadêmica

Peça 4:5 para redes sociais. O PNG é gerado a partir de `flyer.html`; o HTML é a
fonte da verdade, os PNGs são build.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `flyer.html` | Fonte. Página de 1080×1350 com as fontes embutidas via `@font-face`. |
| `flyer-1080x1350.png` | Versão para postagem. |
| `flyer-2160x2700.png` | Mesma arte em 2×, para impressão ou recorte. |
| `VELLUM-ORDER.md` | Filosofia de design que guiou a peça. |
| `fonts/` | As quatro fontes usadas, com as licenças OFL disponíveis. |

## Como regerar os PNGs

Precisa de um Chromium headless e do Pillow:

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
  deixando de fora o fio da moldura sem dar erro.
- `--allow-file-access-from-files` é obrigatório, senão as `@font-face` não carregam
  e o texto cai para a fonte do sistema.

## Texto da peça

O conteúdo é fixo e foi conferido caractere a caractere. Qualquer edição precisa
preservar os acentos:

- Nome: `Isis Braga`
- Título: `FORMATAÇÃO ACADÊMICA` (escrito em title case no HTML, convertido por
  `text-transform: uppercase`)
- Serviços: `TCC` · `Projeto Mário Travassos` · `Projeto de pesquisa de mestrado` ·
  `Projeto de pesquisa de TCC`
- Chamada: `Solicite seu orçamento`

As quatro linhas de serviço usam `white-space: nowrap` de propósito. Se alguma for
alterada para um texto mais longo, confira se ainda cabe na largura útil de 888px
antes de publicar — a mais longa hoje ocupa cerca de 75%.

Não há telefone, e-mail, @, preço, prazo ou credencial na peça. Isso foi decidido,
não esquecido.

## Tipografia e cor

- Nome: Gloock
- Título e serviços: Work Sans
- Numeradores e rótulo de seção: IBM Plex Mono
- Chamada: Instrument Serif Italic

Papel `#F2EDE1`, tinta `#191714`, um único acento terracota `#7B3B2E` usado só nos
numeradores, no losango, nas marcas de canto e numa linha da ilustração.

A ilustração do livro aberto é SVG gerado por script: as linhas de texto são
amostras da mesma curva de Bézier das bordas da página, e as linhas curtas terminam
do lado certo em cada página — perto da lombada na página esquerda, perto da margem
externa na direita.

## Licenças das fontes

Gloock, IBM Plex Mono e Work Sans vêm com o texto da OFL em `fonts/`. Instrument
Serif também é SIL Open Font License 1.1, mas a cópia de origem não trazia o arquivo
de licença; o texto está em https://fonts.google.com/specimen/Instrument+Serif/license
