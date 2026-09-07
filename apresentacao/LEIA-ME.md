# Apresentação de congresso — TCC

**IoT, *Big Data* e inteligência artificial na gestão do material aeroterrestre no B DOMPSA**
Cap Jefferson Daniel Ferreira Martins · EsAO — Curso de Logística · 2026

Arquivo único, offline, para projetar no navegador: **`congresso.html`**.
São **39 slides**.

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

**Tipografia:** **Montserrat** em todo o deck — texto, títulos, etiquetas e números.
Não há segunda família: a distinção entre etiqueta e texto vem do peso (600 contra
400) e da cor, não de uma fonte diferente. Os números dos gráficos usam algarismos
tabulares (`tnum`), então continuam alinhados em coluna.

A escala é grande de propósito — corpo em 22px sobre um palco de 1600px — porque o
deck é lido do fundo de um auditório. Como a Montserrat é mais larga e de altura-x
maior que as fontes anteriores, os corpos foram ajustados em 1 a 2px para baixo e o
espacejamento dos títulos ficou levemente negativo; o tamanho aparente é o mesmo.

A fonte está **embutida no arquivo** em base64, então o deck não faz nenhuma
requisição de rede e renderiza idêntico no auditório sem internet.

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
| `E` | liga/desliga o modo foco (tópicos um a um) |
| `T` | troca a transição de todo o deck |
| `R` | zera o cronômetro (amarelo aos 35 min, vermelho aos 40) |

O rodapé mostra o bloco atual, o tópico em que você está, o cronômetro e o número
do slide.

### Modo foco

Nos slides com tópicos — listas, cartões, etapas e a linha do tempo — a seta
avança **de tópico em tópico** antes de trocar de slide. Todos ficam na tela o
tempo todo: o atual em preto cheio, os que você já explicou apagados pela metade,
os que ainda vêm bem apagados. O rodapé mostra `2/4`, por exemplo.

Voltando com a seta esquerda, você retrocede tópico a tópico; ao sair do primeiro,
cai no **último tópico** do slide anterior, e não no começo dele.

São 16 slides com tópicos. Os demais — gráficos, tabelas, fotos e divisores —
passam inteiros, de uma vez.

`E` desliga o modo, e aí cada seta troca de slide direto, como antes.

## As fotos

As cinco fotos que você mandou já estão **dentro do arquivo**, em base64 — não
dependem da pasta `fotos/` para aparecer. Os originais ficaram em `fotos/` caso
você queira trocar alguma.

| Slide | Foto | Onde entrou |
|---|---|---|
| 1 · Capa | `capa-c295-lancamento.jpg` | tela cheia, atrás do título |
| 4 · Contextualização | `kc390-paraquedas-extracao.jpg` | quadro 16:9 na coluna direita |
| 5 · O B DOMPSA e o Mat Aet | `carga-plataforma-paraquedas.jpg` | quadro 4:3 na coluna esquerda |
| 19 · Instrumentos e análise | `recolhimento-pista.jpg` | quadro 4:3 na coluna esquerda |
| 32 · Evidências de campo | `paraquedista-salto.jpg` | quadro quadrado, com o texto ao lado |

**Falta a fonte de cada imagem.** As legendas terminam com "Fonte: informar",
sublinhado em pontilhado. Em trabalho acadêmico a figura precisa de crédito —
se as fotos são do B DOMPSA, da FAB ou de acervo pessoal, é isso que entra ali.

**Para trocar uma foto:** copie a nova para `fotos/` e me avise, ou substitua o
`src` da tag `<img>` correspondente por `fotos/nome-do-arquivo.jpg` (aí o arquivo
passa a depender da pasta ao lado).

**Para acrescentar mais fotos:** o slide 31 comporta uma galeria de três de novo,
e o encerramento (slide 38) pode voltar a ter foto de fundo. Hoje ele é preto
liso, de propósito — sem foto, funciona melhor do que com um espaço vazio.

## O vídeo do depósito

O **slide 21** abre o bloco de resultados com um vídeo do depósito, antes dos
números: prateleiras de conjuntos numerados um a um e um militar anotando em
prancheta na frente deles.

O clipe está **embutido no `congresso.html`** como os fotos e a fonte — 18 segundos,
sem som, recortados do `deposito-3.mov` e recomprimidos para 2,2 MB. **Não depende
da pasta `videos/`**: o arquivo HTML sozinho já toca o vídeo, inclusive pelo link do
artifact.

Ele toca sozinho ao chegar no slide e para no fim. Clicar no vídeo (ou a tecla `V`)
pausa e continua; trocando de slide, ele para e volta ao início. Se o navegador não
conseguir tocá-lo, aparece o quadro congelado da cena com um aviso — o slide nunca
fica vazio.

Os três originais continuam em `videos/`, apenas como fonte para novos cortes:
`deposito-1.mov` (25 s, entrada do depósito e recebimento), `deposito-2.mov` (40 s,
CSMMAet, dobragem e inspeção) e `deposito-3.mov` (40 s, o depósito — o que está em
uso). `deposito-slide.mp4` é o corte já pronto.

## Editando o conteúdo

Abra `congresso.html` em qualquer editor de texto.

- O que ainda depende de você aparece **sublinhado com pontinhos azuis** na tela e
  marcado com `class="ph-text"` no código: o nome do congresso (slide 1) e o fecho
  das referências (slide 38).
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
| 38 | Encerramento | Obrigado |

## Dados usados nos gráficos

Todos vindos do formulário (n = 29, taxa de retorno 67,4%):

- **Médias 1–5:** registros manuais 4,17 · integração 3,28 · modelo de controle 3,21 · rastreabilidade 2,86
- **Potencial percebido:** IoT 4,69 · *Big Data* 4,62 · IA 4,62 · 75,9% deram nota máxima à contribuição geral
- **Etapas mais difíceis:** controle de estoque 55,2% · integração de informações 48,3% · inventário 37,9%
- **Problemas:** controles manuais 65,5% · erro humano 51,7% · lentidão 48,3% · rastreabilidade 44,8%
- **Mais beneficiados:** controle de estoque 92,6% · integração 85,2% · inventário 74,1% (n = 27)
- **Barreiras:** orçamento 79,3% · prioridade institucional 62,1% · infraestrutura 62,1%
