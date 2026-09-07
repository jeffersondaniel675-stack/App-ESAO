# Apresentação de congresso — TCC

**IoT, *Big Data* e inteligência artificial na gestão do material aeroterrestre no B DOMPSA**
Cap Jefferson Daniel Ferreira Martins · EsAO — Curso de Logística · 2026

Arquivo único, offline, para projetar no navegador: **`congresso.html`**.
São **41 slides**.

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

**Continuidade:** o slide 39 anuncia o mestrado — predição de material aeroterrestre
por IA apoiada em pesquisa operacional — com um **esboço** de painel desenhado em SVG:
curva de consumo projetada com faixa de incerteza, reposição sugerida por item e a
faixa de restrições da pesquisa operacional. O desenho traz a etiqueta "esboço" e a
legenda diz que não representa sistema existente — importante, porque a plateia vai
olhar para ele com olho técnico.

**Figura do TCC:** o slide 12 usa a figura "A Logística 4.0" do próprio trabalho —
as dez tecnologias em torno do núcleo digital — para justificar o recorte em IoT,
*Big Data* e IA. É a única imagem aproveitada do TCC: os gráficos do formulário já
estão no deck como gráficos nativos, e os organogramas e as figuras de apoio não
seriam legíveis projetados.

**Esquemas:** o slide 36 abre a proposta com um antes e depois do caminho do dado —
hoje item → livro e ficha → planilha → decisão só quando alguém consolida; com o POP
item etiquetado → leitura na etapa → ficha digital única → painel do comando no mesmo
instante. E os três cartões do slide 12 trazem um diagrama em SVG cada um —
a etiqueta que transmite estado (IoT), os registros dispersos convergindo para uma
base única (*Big Data*) e o histórico projetando o limite de vida útil (IA). São
desenhos vetoriais, não fotos: escalam sem perder nitidez e não pesam no arquivo.

**Fundo:** cinza-azulado claro (`#eef1f6`), com os cartões em branco por cima —
eles agora se separam do fundo por preenchimento, não por um fio quase invisível.
Os divisores e o encerramento seguem pretos.

Sobre esse fundo claro correm duas camadas discretas: uma **malha de pontos** de
60 px e dois **halos suaves** — um azul no alto à direita, um cinza embaixo à
esquerda. É textura, não desenho: dá profundidade à tela cheia do projetor sem
disputar com gráficos e tabelas. Nos slides pretos a mesma malha aparece em branco.
Tudo vem de dois tokens no `:root` (`--bg-art` e `--bg-art-inv`); para voltar ao
fundo liso, basta apagá-los.

A **capa**, os **cinco divisores de bloco** e o **encerramento** têm foto de fundo,
desfocada e sob um véu que fecha no centro, exatamente onde o texto cai. Nos
divisores a foto fica quase apagada, porque ali quem manda é o título; no
encerramento ela aparece bem mais, é o lançamento de carga do C-105 que abre o
deck, de modo que a capa e o fecho fazem par.

**Tipografia:** **Montserrat** em todo o deck — texto, títulos, etiquetas e números.
Não há segunda família: a distinção entre etiqueta e texto vem do peso (600 contra
400) e da cor, não de uma fonte diferente. Os números dos gráficos usam algarismos
tabulares (`tnum`), então continuam alinhados em coluna.

A escala é grande de propósito — corpo em **28px** sobre um palco de 1600px — porque
o deck é lido do fundo de um auditório. Todo o texto corrido, as tabelas, as legendas
de gráfico e os rótulos subiram **2 pt (3px)** em relação à versão anterior; os
títulos ficaram como estavam, para a hierarquia não achatar. O espacejamento dos
títulos é levemente negativo, o que a Montserrat pede em corpo grande.

A fonte está **embutida no arquivo** em base64, então o deck não faz nenhuma
requisição de rede e renderiza idêntico no auditório sem internet.

Para voltar ao tema escuro anterior, basta trocar os tokens no bloco `:root` do
início do arquivo — todo o resto é derivado deles.

**Alinhamento:** os títulos e as etiquetas acima deles ficam **centralizados**, e o
conteúdo abaixo continua alinhado à esquerda, que é onde a leitura de tabela,
gráfico e lista funciona. Nos slides que são só título (capa, divisores e
encerramento) o bloco inteiro vai para o eixo central.

**Transição:** cada slide entra com a sua (`fade`, `rise`, `cover`, `zoom`, `tilt` e
por aí), e `T` força uma só para o deck inteiro quando você quiser uniformizar.

**O desfoque agora é do modo foco, não da troca de slide.** Ao passar de tópico em
tópico, o item da vez fica nítido, o que já passou fica levemente fora de foco e o
que ainda vem fica bem borrado. É o mesmo efeito de profundidade de campo de uma
lente: o olho da plateia vai direto para onde você está.

**O encerramento** é um slide só: o **8º Mandamento do Dobrador de Paraquedas**, e
embaixo dele o seu nome e o contato, sobre a foto do lançamento de carga. Não há a
palavra "Obrigado" na tela — o agradecimento é falado, e isso costuma soar melhor
do que lido.

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
| `T` | força uma transição só para todo o deck |
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
| 20 · Instrumentos e análise | `recolhimento-pista.jpg` | quadro 4:3 na coluna esquerda |
| 33 · Evidências de campo | `paraquedista-salto.jpg` | quadro quadrado, com o texto ao lado |
| 3 · Divisor Introdução | `kc390-paraquedas-extracao.jpg` | fundo, sob véu preto |
| 10 · Divisor Referencial | `capa-c295-lancamento.jpg` | fundo, sob véu preto |
| 16 · Divisor Metodologia | `recolhimento-pista.jpg` | fundo, sob véu preto |
| 21 · Divisor Resultados | `carga-plataforma-paraquedas.jpg` | fundo, sob véu preto |
| 35 · Divisor Conclusão | `paraquedista-salto.jpg` | fundo, sob véu preto |
| 41 · Encerramento | `capa-c295-lancamento.jpg` | tela cheia, atrás do mandamento e do contato |

**Para trocar uma foto:** copie a nova para `fotos/` e me avise, ou substitua o
`src` da tag `<img>` correspondente por `fotos/nome-do-arquivo.jpg` (aí o arquivo
passa a depender da pasta ao lado).

**Fotos de fundo (divisores e encerramento):** esses seis quadros não trazem imagem
própria — eles **clonam** uma foto já embutida em outro slide, indicada no atributo
`data-from`. É o que evita repetir 60 KB de base64 seis vezes. Arrastar uma foto por
cima de qualquer um deles troca só aquele fundo; `Alt + clique` desfaz.

## O vídeo do depósito

O **slide 22** abre o bloco de resultados com um vídeo do depósito, antes dos
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
  marcado com `class="ph-text"` no código: hoje, só o fecho das referências.
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

## Backup em PowerPoint

`congresso-backup.pptx` é o plano B: os mesmos 39 slides, cada um como imagem em
alta resolução num arquivo 16:9, com **as notas de fala em cada slide** (aba
"Anotações" do PowerPoint) e o **vídeo do depósito embutido** no slide 21.

Abre em qualquer PowerPoint, sem depender de navegador. O que ele não tem: as
transições, o modo foco e os atalhos — é uma cópia congelada, para o caso de o
computador do auditório não cooperar com o HTML.

Cada slide tem **transição**, traduzida da versão HTML para o equivalente nativo do
PowerPoint: `fade`, `push`, `cover`, `wipe`, `zoom`, `dissolve` e `circle`. Os
divisores de bloco entram com `cover`, os slides de dado com `push`, e assim por
diante, de modo que o ritmo do deck original se mantém. O desfoque do modo foco não
existe no PowerPoint: lá cada slide aparece com todos os tópicos nítidos.

O texto não é editável (cada slide é uma imagem). Se precisar corrigir algo,
corrija no `congresso.html` e me peça o .pptx de novo.

## Exportar em PDF (backup para levar no e-mail)

`Ctrl + P` (ou `Cmd + P`) → destino **Salvar como PDF** → layout **paisagem**,
margens **nenhuma**, marcar **"Gráficos de fundo"**. Sai um slide por página.

## Mapa dos slides

| # | Bloco | Slides |
|---|---|---|
| 1–2 | Abertura | Capa · Roteiro |
| 3–9 | Introdução | Divisor · Contexto · Logística 4.0 · O B DOMPSA e o Mat Aet · Problema · Questões de estudo · Objetivos · Justificativa |
| 10–15 | Referencial | Divisor · Da Indústria 4.0 à Logística 4.0 · O recorte do estudo · IoT, *Big Data* e IA · Base doutrinária · Lacuna |
| 16–20 | Metodologia | Divisor · Delineamento · Amostra e coleta · Perfil da amostra · Instrumentos e análise |
| 21–34 | Resultados | Divisor · O depósito (vídeo) · Panorama · Diagnóstico · Etapas críticas · Problemas · Potencial percebido · Aspectos beneficiados · Barreiras · SisCAAeT · Cel Lana · Prof. Santos · Evidências de campo · Síntese |
| 35–40 | Conclusão | Divisor · Resposta à questão central · Proposta de POP · Limitações e trabalhos futuros · Continuidade da pesquisa · Referências |
| 41 | Encerramento | 8º Mandamento, nome e contato |

## O 8º Mandamento (slide 41)

O deck fecha num slide só, preto, com o **8º Mandamento do Dobrador de Paraquedas**
no alto e o seu nome e contato embaixo:

> Verificarei tudo duas vezes. O "mais ou menos" me fará um criminoso em potencial.
> Um dobrador relapso ensaia o mais vil dos crimes: assassinato pelas costas.

Ele não está ali como enfeite. Numa plateia de congresso de logística quase
ninguém conhece esse texto, e ele explica em três linhas o que nenhum gráfico
explica: por que rastreabilidade de Mat Aet não é assunto administrativo. Não há
comentário escrito ao lado, de propósito — a ligação com a pesquisa é você quem
faz, falando.

Vale ler o mandamento devagar e deixar o silêncio trabalhar. É a última coisa que
a plateia lê, então é ela que fica.

## Contato no slide final

O slide 41 traz, abaixo do mandamento:

- **Cap Jefferson Daniel Ferreira Martins**
- `jefferson.daniel675@gmail.com`
- `(21) 97920-3803`

Vale conferir os dois antes de projetar: um telefone errado num slide de congresso
é o tipo de coisa que só se descobre depois.

## Dados usados nos gráficos

Todos vindos do formulário (n = 29, taxa de retorno 67,4%):

- **Médias 1–5:** registros manuais 4,17 · integração 3,28 · modelo de controle 3,21 · rastreabilidade 2,86
- **Potencial percebido:** IoT 4,69 · *Big Data* 4,62 · IA 4,62 · 75,9% deram nota máxima à contribuição geral
- **Etapas mais difíceis:** controle de estoque 55,2% · integração de informações 48,3% · inventário 37,9%
- **Problemas:** controles manuais 65,5% · erro humano 51,7% · lentidão 48,3% · rastreabilidade 44,8%
- **Mais beneficiados:** controle de estoque 92,6% · integração 85,2% · inventário 74,1% (n = 27)
- **Barreiras:** orçamento 79,3% · prioridade institucional 62,1% · infraestrutura 62,1%
