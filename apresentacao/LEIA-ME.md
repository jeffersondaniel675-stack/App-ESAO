# Apresentação de congresso — TCC

**IoT, *Big Data* e inteligência artificial na gestão do material aeroterrestre no B DOMPSA**
Cap Jefferson Daniel Ferreira Martins · EsAO — Curso de Logística · 2026

Arquivo único, offline, para projetar no navegador: **`congresso.html`**.
São **38 slides** dimensionados para ~40 minutos (35 de exposição + 5 de perguntas).

O conteúdo foi montado a partir do próprio TCC (introdução, referencial, metodologia,
resultados e conclusão) e os gráficos usam os **dados reais do formulário** — as 29
respostas foram reconferidas contra o CSV original, e os números batem com o texto
defendido.

## Identidade visual

O deck segue o `DESIGN.md` da raiz do repositório (linguagem Mobbin, instalada com
`npx getdesign@latest add mobbin`): fundo branco de galeria, tipografia preta,
**um único azul** (`#0066ff`) reservado ao sinal que pede decisão — no deck ele
aparece só na barra "quanto maior, pior" do slide 22 e na legenda dela. Sem
sombras: a hierarquia vem de preenchimento e fios de 1px. Geometria de pílula nos
controles, cantos de 24px nos cartões, sem versalete e sem espacejamento nos títulos. Os divisores de bloco e o encerramento usam a inversão de
polaridade do sistema: fundo preto, texto branco.

**Tipografia:** **Geist** no texto e **Geist Mono** nas etiquetas e nos números
(entretítulos, rótulos de cartão, cabeçalhos de tabela, valores dos gráficos,
cronômetro e numeração dos slides). As duas estão **embutidas no arquivo** em
base64 — o deck não faz nenhuma requisição de rede, então renderiza idêntico no
auditório sem internet. Isso explica o arquivo ter ~200 KB.

Para voltar ao tema escuro anterior, basta trocar os tokens no bloco `:root` do
início do arquivo — todo o resto é derivado deles.

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
| `R` | zera o cronômetro (amarelo aos 35 min, vermelho aos 40) |

O rodapé mostra o bloco atual, o cronômetro e o número do slide.

## Colocando as fotos

Há **8 espaços de foto** prontos, marcados com moldura tracejada:

| Slide | Espaço | O que entra |
|---|---|---|
| 1 | `capa` | abertura em tela cheia — salto, dobragem ou depósito |
| 4 | `contexto` | ilustração da Logística 4.0 (pode ser a figura do próprio TCC) |
| 5 | `dompsa` | Cia Dobragem, depósito ou suprimento pelo ar |
| 19 | `coleta` | entrevista, visita técnica ou aplicação do formulário |
| 31 | `ev1` `ev2` `ev3` | galeria: controle manual · depósito · dobragem/inspeção |
| 38 | `fim` | encerramento em tela cheia |

Duas formas de preencher:

**1. Arrastando (rápido, para testar)** — arraste a imagem do seu computador para
cima da moldura. Ela entra na hora e fica guardada naquele navegador.
`Alt + clique` sobre a foto remove.

**2. No arquivo (definitivo, o que vai para o congresso)** — copie as imagens para
a pasta `fotos/` e troque o conteúdo da moldura por uma tag de imagem:

```html
<figure class="photo tall" data-photo="dompsa">
  <img src="fotos/dobragem.jpg" alt="Militares na dobragem de paraquedas">
</figure>
```

Se preferir, **me mande as fotos que eu faço essa parte** — ligo cada arquivo ao
seu quadro, ajusto o enquadramento e escrevo as legendas.

## Editando o conteúdo

Abra `congresso.html` em qualquer editor de texto.

- O que ainda depende de você aparece **sublinhado com pontinhos azuis** na tela e
  marcado com `class="ph-text"` no código: o nome do congresso (slide 1), as legendas
  das fotos (slide 31), o e-mail de contato (slide 38) e o fecho das referências.
- **Números dos gráficos**: cada barra tem `style="--v:55.2"` — o número é o
  comprimento da barra em porcentagem. Troque também o rótulo e o valor exibido ao lado.
- **Notas de fala**: o texto dentro de `<aside class="notes">` de cada slide.
- **Transição de um slide**: o atributo `data-transition` na tag `<section>`. Valores:
  `fade`, `slide`, `rise`, `zoom`, `flip`, `cube`, `blur`, `cover`, `swipe`, `iris`,
  `tilt`, `soft`.
- **Cores**: os tokens no bloco `:root` do início do arquivo (`--canvas`, `--ink`,
  `--accent`, `--canvas-soft`, `--hairline`) mudam o deck inteiro.
- **Inversão de polaridade**: a classe `invert` na tag `<section>` deixa o slide
  preto com texto branco. Está nos cinco divisores e no encerramento.

## Exportar em PDF (backup para levar no e-mail)

`Ctrl + P` (ou `Cmd + P`) → destino **Salvar como PDF** → layout **paisagem**,
margens **nenhuma**, marcar **"Gráficos de fundo"**. Sai um slide por página.

## Mapa dos slides

| # | Bloco | Slides |
|---|---|---|
| 1–2 | Abertura | Capa · Roteiro |
| 3–9 | Introdução | Divisor · Logística 4.0 · O B DOMPSA e o Mat Aet · Problema · Questões de estudo · Objetivos · Justificativa |
| 10–14 | Referencial | Divisor · Da Indústria 4.0 à Logística 4.0 · IoT, *Big Data* e IA · Base doutrinária · Lacuna |
| 15–19 | Metodologia | Divisor · Delineamento · Amostra e coleta · Perfil da amostra · Instrumentos e análise |
| 20–32 | Resultados | Divisor · Panorama · Diagnóstico · Etapas críticas · Problemas · Potencial percebido · Aspectos beneficiados · Barreiras · SisCAAeT · Cel Lana · Prof. Santos · Evidências de campo · Síntese |
| 33–37 | Conclusão | Divisor · Resposta à questão central · Proposta de POP · Limitações e trabalhos futuros · Referências |
| 38 | Encerramento | Perguntas |

## Dados usados nos gráficos

Todos vindos do formulário (n = 29, taxa de retorno 67,4%):

- **Médias 1–5:** registros manuais 4,17 · integração 3,28 · modelo de controle 3,21 · rastreabilidade 2,86
- **Potencial percebido:** IoT 4,69 · *Big Data* 4,62 · IA 4,62 · 75,9% deram nota máxima à contribuição geral
- **Etapas mais difíceis:** controle de estoque 55,2% · integração de informações 48,3% · inventário 37,9%
- **Problemas:** controles manuais 65,5% · erro humano 51,7% · lentidão 48,3% · rastreabilidade 44,8%
- **Mais beneficiados:** controle de estoque 92,6% · integração 85,2% · inventário 74,1% (n = 27)
- **Barreiras:** orçamento 79,3% · prioridade institucional 62,1% · infraestrutura 62,1%
