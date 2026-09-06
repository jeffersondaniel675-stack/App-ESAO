# Apresentação de congresso — TCC

Arquivo único, offline, para projetar no navegador: **`congresso.html`**.
São **33 slides** desenhados para ~40 minutos (35 de exposição + 5 de perguntas).

## Como abrir

Duplo clique em `congresso.html`. Abre em qualquer navegador (Chrome, Edge, Firefox),
sem internet e sem instalar nada. Aperte **F** para tela cheia e comece.

> Leve o **pen drive com a pasta inteira** (`congresso.html` + pasta `fotos/`).
> Se o computador do auditório não tiver internet, o deck funciona igual — só as
> fontes tipográficas caem para a fonte do sistema, e o layout continua idêntico.

## Atalhos durante a apresentação

| Tecla | Ação |
|---|---|
| `→` `↓` `Espaço` `PgDn` | próximo slide |
| `←` `↑` `PgUp` | slide anterior |
| número + `Enter` | pula direto para o slide (útil nas perguntas) |
| `O` | índice completo, clicável |
| `N` | roteiro de fala (as notas de cada slide) |
| `B` | tela preta, para pausar sem desligar o projetor |
| `F` | tela cheia |
| `T` | troca a transição de todo o deck |
| `R` | zera o cronômetro (ele avisa em amarelo aos 35 min e em vermelho aos 40) |

O rodapé mostra o bloco atual, o cronômetro e o número do slide.

## Colocando as fotos

Há **7 espaços de foto** prontos, marcados com moldura tracejada:

| Slide | Espaço | O que entra |
|---|---|---|
| 1 | `capa` | foto de abertura, tela cheia |
| 4 | `contexto` | ambiente, seção ou equipe estudada |
| 19 | `coleta` | entrevista, visita, aplicação do questionário |
| 26 | `ev1` `ev2` `ev3` | galeria de evidências de campo |
| 33 | `fim` | foto de encerramento, tela cheia |

Duas formas de preencher:

**1. Arrastando (rápido, para testar)** — arraste a imagem do seu computador para
cima da moldura. Ela entra na hora e fica guardada naquele navegador.
`Alt + clique` sobre a foto remove.

**2. No arquivo (definitivo, o que vai para o congresso)** — copie as imagens para
a pasta `fotos/` e troque o conteúdo da moldura por uma tag de imagem:

```html
<figure class="photo tall" data-photo="contexto">
  <img src="fotos/contexto.jpg" alt="Seção de suprimento durante o expediente">
</figure>
```

Se preferir, **me mande as fotos que eu faço essa parte** — ligo cada arquivo ao
seu quadro, ajusto enquadramento e escrevo as legendas.

## Editando o conteúdo

Abra `congresso.html` em qualquer editor de texto. Tudo que precisa ser trocado
está **sublinhado com pontinhos azuis** na tela e marcado com `class="ph-text"`
no código — é o seu roteiro de preenchimento.

- **Texto**: escreva por cima e apague a classe `ph-text`.
- **Números dos cartões (KPI)**: troque o número dentro de `<div class="v">`.
- **Barras dos gráficos**: cada barra tem `style="--v:72"` — esse número é a altura
  em porcentagem (0 a 100). Troque também o rótulo e o valor exibido.
- **Notas de fala**: o texto dentro de `<aside class="notes">` de cada slide.
- **Transição de um slide**: o atributo `data-transition` na tag `<section>`.
  Valores possíveis: `fade`, `slide`, `rise`, `zoom`, `flip`, `cube`, `blur`,
  `cover`, `swipe`, `iris`, `tilt`, `soft`.
- **Cor de acento**: a variável `--accent` no início do arquivo. Trocar essa linha
  muda o deck inteiro.

## Exportar em PDF (backup para levar no e-mail)

`Ctrl + P` (ou `Cmd + P`) → destino **Salvar como PDF** → layout **paisagem**,
margens **nenhuma**, marcar **"Gráficos de fundo"**. Sai um slide por página.

## Mapa dos slides

| # | Bloco | Slide |
|---|---|---|
| 1–2 | Abertura | Capa · Roteiro |
| 3–9 | Introdução | Divisor · Contextualização · Problema · Questões · Objetivos · Justificativa · Delimitação |
| 10–15 | Referencial | Divisor · Marcos · Conceitos · Modelo de análise · Trabalhos correlatos · Lacuna |
| 16–20 | Metodologia | Divisor · Classificação · Desenho · Instrumentos · Universo e amostra |
| 21–27 | Resultados | Divisor · Panorama · Resultado 1 · Resultado 2 · Resultado 3 · Evidências · Discussão |
| 28–32 | Conclusão | Divisor · Respostas · Contribuições · Limitações · Referências |
| 33 | Encerramento | Perguntas |
