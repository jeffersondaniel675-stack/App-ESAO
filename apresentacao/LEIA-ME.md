# Apresentação de congresso — TCC

**Transformação digital da gestão do material aeroterrestre**
Evidências sobre IoT, *Big Data* e Inteligência Artificial no B DOMPSA
Cap Jefferson Daniel Ferreira Martins · EsAO, Curso de Logística · 2026

Arquivo único, offline, para projetar no navegador: **`congresso.html`**.
São **28 slides**, cronometrados para fechar em 28 minutos dentro dos trinta previstos.

O roteiro de fala slide a slide, com a cronometragem e as perguntas prováveis, está
em **`ROTEIRO-FALA.md`**.

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

**Nada de figura escaneada do TCC:** os gráficos do formulário são nativos do deck,
e os organogramas e figuras de apoio do trabalho não seriam legíveis projetados. O
recorte em IoT, *Big Data* e IA é justificado por texto, na etiqueta do slide 10:
das dez tecnologias que a literatura associa à Logística 4.0, o estudo recorta três.

**Esquemas:** o slide 24 abre a proposta com um antes e depois do caminho do dado,
hoje item → livro e ficha → planilha → decisão só quando alguém consolida; com o POP
item etiquetado → leitura na etapa → ficha digital única → painel do comando no mesmo
instante. E os três cartões do slide 10 trazem um diagrama em SVG cada um,
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

**O encerramento** é um slide só: o **8º Mandamento do Especialista DOMPSA**, e
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
| 5 · O B DOMPSA e o Mat Aet | `deposito-prateleiras.jpg` | quadro 4:3 na coluna esquerda |
| 12 · Dois depósitos | `deposito-automatizado.jpg` · `deposito-prateleiras.jpg` | dois quadros 16:9 lado a lado |
| 20 · Instrumentos e análise | `dobragem-mesa.jpg` | quadro 4:3 na coluna esquerda |
| 28 · O controle é uma prancheta | `plataforma-prancheta.jpg` | quadro 16:9, meia tela |
| 35 · Evidências de campo | `inspecao-paraquedas.jpg` · `preparo-carga.jpg` · `interior-aeronave.jpg` | galeria de três |
| 3 · Divisor Introdução | `visita-deposito.jpg` | fundo, sob véu preto |
| 10 · Divisor Referencial | `capa-c295-lancamento.jpg` | fundo, sob véu preto |
| 16 · Divisor Metodologia | `dobragem-mesa.jpg` | fundo, sob véu preto |
| 21 · Divisor Resultados | `deposito-prateleiras.jpg` | fundo, sob véu preto |
| 37 · Divisor Conclusão | `paraquedista-salto.jpg` | fundo, sob véu preto |
| 44 · Encerramento | `capa-c295-lancamento.jpg` | tela cheia, atrás do mandamento e do contato |

**Para trocar uma foto:** copie a nova para `fotos/` e me avise, ou substitua o
`src` da tag `<img>` correspondente por `fotos/nome-do-arquivo.jpg` (aí o arquivo
passa a depender da pasta ao lado).

**Fotos de fundo (divisores e encerramento):** esses seis quadros não trazem imagem
própria — eles **clonam** uma foto já embutida em outro slide, indicada no atributo
`data-from`. É o que evita repetir 60 KB de base64 seis vezes. Arrastar uma foto por
cima de qualquer um deles troca só aquele fundo; `Alt + clique` desfaz.

## O vídeo do depósito

O **slide 23** abre o bloco de resultados com um vídeo do depósito, antes dos
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
| 3–7 | Introdução | Divisor · Objeto do estudo · Como o material é controlado hoje · O problema · As quatro perguntas |
| 8–11 | Referencial | Divisor · Da Indústria 4.0 à Logística 4.0 · As três tecnologias · Antecedentes no Exército e a lacuna |
| 12–13 | Metodologia | Divisor · Formulário, entrevistas e análise documental |
| 14–21 | Resultados | Divisor · O depósito (vídeo) · As quatro médias · Problemas relatados · Potencial das tecnologias · Barreiras · Entrevistas · **O conhecimento produzido** |
| 22–27 | Conclusão | Divisor · **Resposta ao problema, com a aplicabilidade ao Exército** · POP em doze etapas · Estudo de viabilidade · Limitações · Continuidade |
| 28 | Encerramento | 8º Mandamento, nome e contato |

## O QR do slide 28

Ao lado do contato, no slide de fecho, há um QR Code com a legenda
**"Resumo e infográfico"**.

**Um QR Code não comporta um arquivo.** O limite físico do formato é de 2.953
bytes, e o PNG do infográfico tem 4,9 MB, quase mil e setecentas vezes mais.
Então o código não carrega o arquivo: ele leva a uma página que mostra o
infográfico em tamanho real e traz o resumo escrito da pesquisa embaixo.

Endereço codificado:

    https://claude.ai/code/artifact/65752676-3cad-4251-aaeb-982875da7688

**Falta um passo, e ele é seu.** A página nasce privada. Abra o endereço acima,
use o menu de compartilhamento e marque **"qualquer pessoa com o link"**.
Enquanto isso não for feito, quem escanear o QR esbarra numa tela de acesso.
Vale testar com o seu próprio celular, fora da sua conta, antes do congresso.

**O que a página tem:** o infográfico com um botão de tamanho real e arraste
para percorrer o quadro, as quatro médias do modelo atual, o potencial das três
tecnologias, a conclusão com a ressalva de Arora, Bhatia e Sidharth, as quatro
fases do POP, o 8º Mandamento e o seu contato. Quem quiser guardar o infográfico
toca e segura a imagem.

**A contrapartida:** agora o QR depende de internet no celular de quem lê. Até a
versão anterior ele carregava o resumo em texto dentro de si e funcionava sem
rede, mas texto puro não comporta o infográfico. Se preferir voltar ao resumo
offline, é só dizer.

**Como usar na hora.** Antes de abrir para perguntas, diga que o resumo e o
infográfico estão no QR e deixe o slide 28 na tela durante todo o debate. É
enquanto se responde que a plateia fotografa. Quem estiver longe fotografa o
slide e escaneia a foto depois, que funciona igual.

**O que foi conferido.** O código foi lido de volta por decodificador de
referência em cinco tamanhos, do slide em tela cheia até uma janela de 640
pixels de largura, dentro do HTML e dentro do PowerPoint, e o endereço voltou
idêntico em todos. Como o endereço é só ASCII, some também o risco de
codificação que apareceu antes: com o resumo em português, o gerador escolhia
sozinho o **modo kanji** por causa dos acentos, e o texto era lido em japonês.

No backup em PowerPoint há um cuidado a mais: cada slide vira uma imagem JPEG, e
a compressão borrava os quadradinhos a ponto de o código não abrir. O gerador do
pptx sobrepõe o QR em PNG nítido, na posição exata, por cima do JPEG do slide 28.

**O infográfico está guardado** em `dados/infografico-log40.png`, no tamanho
original de 2752 por 1536.

## O 8º Mandamento (slide 28)

O deck fecha num slide só, preto, com o **8º Mandamento do Especialista DOMPSA**
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

O slide 28 traz, abaixo do mandamento:

- **Cap Jefferson Daniel Ferreira Martins**
- `jefferson.daniel675@gmail.com`
- `(21) 97920-3803`
- o QR do resumo e do infográfico, à direita

Vale conferir os dois antes de projetar: um telefone errado num slide de congresso
é o tipo de coisa que só se descobre depois.

## As recomendações do General (09/09, após a videoconferência)

Foram seis, e todas estão atendidas no deck. O que mudou:

| Recomendação | O que foi feito |
|---|---|
| Cumprir o tempo previsto | Saíram dois slides, "Referência de mercado" e "Referências". O deck foi de 30 para **28 slides**, e o roteiro de fala fecha em 28 minutos, com folga de dois. |
| Conhecimento produzido com a referida síntese | O slide da síntese passou a se chamar **"O conhecimento produzido"** e ganhou uma linha que declara o que o trabalho produz: um encadeamento verificável entre problema medido, base doutrinária, tecnologia aplicável e contribuição esperada. É o slide 21. |
| Conclusão com referência e aplicabilidade para o Exército | O slide 23 ganhou um parágrafo de aplicabilidade, ancorado em **Arora, Bhatia e Sidharth (2025)**: em depósito militar a prontidão tecnológica depende de maturidade organizacional e capacitação, não só de equipamento. Fecha com o alinhamento aos **OEE 5 e 6**. |
| Ser objetivo | Uma ideia por slide. Os objetivos específicos e o tamanho da amostra continuam fora da tela, nas notas de fala. |
| Parcimônia ao comentar o Batalhão | Ver abaixo. |
| Haverá civis na plateia | Siglas abertas por extenso no slide 4, glosa de "dobragem" no corpo do slide, e as notas marcam onde parar para explicar. |

**A parcimônia, em detalhe.** O comandante do B DOMPSA estará na plateia, e três
pontos do deck foram reescritos por causa disso:

1. **Saiu o slide "Referência de mercado"**, que comparava o depósito do Batalhão a
   um depósito automatizado. Mesmo com a ressalva escrita, um slide de comparação
   lado a lado lido por quem comanda a unidade é uma crítica, não uma ilustração.
2. **O slide 5 mudou de tom.** Saíram "e só quando alguém a faz" e "nenhum deles
   conversa com o seguinte". Entrou, no lugar, a frase que define o alcance do
   achado: *o controle é rigoroso e normatizado; a limitação que a pesquisa
   identifica é de instrumento de registro, não de execução.* A nota de fala manda
   você dizer isso em voz alta, antes de comentar as fotos.
3. **O slide 15 amenizou a prancheta.** Era "o sistema de controle é uma prancheta";
   passou a ser a constatação factual de que o registro, no vídeo e na rotina, é
   feito em prancheta e ficha.

No slide 25, o do estudo de viabilidade, a nota agora orienta a apresentar o estudo
como conquista da unidade, e não como consequência da pesquisa. O Batalhão não
esperou por este trabalho, e dizer isso em voz alta com o comandante na sala vale
mais do que qualquer gráfico.

## O que saiu na revisão de 08/09

O deck tinha 44 slides e 2.151 palavras em tela. Ficou com **31 slides e 1.681
palavras**. O corte foi feito com olho de revisor: nada foi eliminado por ser
ruim, e sim por repetir algo que já estava dito.

**Fundidos**

| Virou | O que era |
|---|---|
| Questões e objetivo | Questões de estudo + Objetivos, que diziam a mesma coisa em dois formatos |
| Como a pesquisa foi feita | Delineamento + Amostra e coleta + Perfil da amostra + Instrumentos |
| Os especialistas | Um slide por entrevistado, três no total |
| Continuidade da pesquisa | Prova de conceito + Por que o modelo erra |

**Removidos**

- **Contexto · Logística 4.0**: dizia, no bloco de introdução, o que a linha do
  tempo do referencial já diz melhor.
- **Justificativa**: repetia o slide do Mat Aet crítico; o OEE nº 24 foi para a
  nota do slide de questões.
- **O recorte do estudo**: virou a etiqueta do slide das três tecnologias.
- **Base doutrinária**: a tabela normativa reaparece inteira na síntese
  interpretativa.
- **Diagnóstico do modelo atual**: as mesmas quatro médias do painel de números.
- **Etapas críticas**: mesmo achado do slide de problemas recorrentes.
- **Aspectos mais beneficiados**: mesmo achado do potencial percebido.

**O tamanho da amostra saiu da tela.** Não aparece mais "29 respondentes" em
nenhum slide, só percentuais. O número continua na **nota de fala** da
metodologia, com a taxa de retorno de 67,4%, para você responder se perguntarem.
Vale saber que num artigo escrito isso não passaria: em texto, o n é
obrigatório. Numa apresentação de trinta minutos, percentual sem contagem é
prática comum.

**O que entrou no lugar:** a escala real do objeto. O slide do Mat Aet passou a
dizer **29.345 dobragens por ano**, número que vem da mediana 2022-2026 da
Bda Inf Pqdt, do COPESP e da 3ª Cia Fesp, registrada no estudo de viabilidade.
Esse número faz pelo estudo o que a contagem de respondentes não fazia.

## O slide do estudo de viabilidade (slide 25)

Entra logo depois da proposta de POP e muda o peso da apresentação: mostra que
a pesquisa não propõe uma hipótese de gabinete, ela chega junto com um plano
institucional em execução. A linha do tempo vai de **2009**, o SISPQD
embrionário, a **2030**, com o B DOMPSA consolidado como Órgão Provedor.

**Os valores estão na tela**, em três números, e a frase que os amarra:

| Número | O que é |
|---|---|
| R$ 194,5 mil | A 1ª fase do estudo: piloto no RZ-21, com 9 portais, 10 leitores e 1.500 etiquetas |
| R$ 467 mil | A TIC completa: R$ 319.045 de hardware e R$ 148.500 das 9.900 etiquetas |
| R$ 26 mi/ano | O material que o sistema controla: R$ 25 mi do PMAET e R$ 1 mi de insumos |

> Rastrear tudo custa menos de 2% de um ano do material que se pretende rastrear.

A conta é R$ 467,5 mil sobre R$ 26 milhões, ou 1,8%. Ao dizer isso em voz alta,
explique que um é **investimento único** em TIC e o outro é **gasto de um ano**
com o próprio material — a comparação é legítima, mas só se você a enunciar
assim. Se alguém tratar como se fossem grandezas equivalentes, corrija na hora.

Dois cuidados que ficam de pé:

1. **O "parecer pela viabilidade" é do próprio estudo**, não uma aprovação
   superior — o campo "Aprovado por" está em branco no documento. O slide diz
   exatamente isso, e vale repetir se a pergunta vier.
2. **Nenhum nome, telefone ou e-mail** da equipe do estudo foi para o deck.

O **2009 do SISPQD** veio de você, não do documento: o EVTEA cita o SISPQD como
o sistema a ser desenvolvido agora, sem mencionar a origem. Confira a data antes
de projetar.

## A revisão de 09/09: o roteiro novo

Vale ler junto com `ROTEIRO.md`, que traz a conferência dos dados e a lista
completa do que mudou.

**O que aconteceu com os slides**

- **Novo slide 5, "O controle atual do material".** Funde a prancheta com as
  evidências de campo numa galeria de quatro fotos que segue o fluxo real
  (registro na pista, conferência no depósito, preparo, embarque), com duas
  linhas factuais sobre livro, ficha e planilha.
- **Novo slide 12, "Antecedentes e lacuna".** Substitui o slide que só trazia a
  citação da lacuna. Agora traz três antecedentes reais: o SISCAET no COPESP,
  o piloto de RFID descontinuado no 21º Depósito de Suprimento, e o SISPQD
  embrionário no próprio Batalhão.
- **O gráfico de barreiras ganhou a sétima barra**, "Questões de segurança da
  informação", 13,8%, que estava sendo omitida.
- **Dez títulos e frases foram reescritos** para sair do molde de negação
  seguida de afirmação, que é o que dava cara de texto de máquina.

**Por que o 21º Depósito de Suprimento importa tanto**

Um projeto-piloto de RFID foi descontinuado lá, e o estudo do caso (EnANPAD,
2020) aponta três causas: a simplicidade percebida da tecnologia, o apoio da
alta administração e a pressão do ambiente. São praticamente as mesmas barreiras
que os seus respondentes elegeram: falta de prioridade institucional (62,1%),
resistência à mudança (48,3%) e falta de capacitação (34,5%).

Isso deixa de ser risco hipotético e passa a ser precedente documentado. Vale
dizer em voz alta quando chegar ao slide das barreiras. **Confira a referência
do EnANPAD antes de citar** — eu a localizei em busca, não abri o artigo.

**As quatro decisões, e o que eu assumi**

| Decisão | O que ficou |
|---|---|
| Questão 10, duas respostas em texto | Mantidos 4,17 e 79,3%, o critério do seu TCC. O tratamento está na nota de fala, para você responder se perguntarem. |
| Big Data e IA | Já estavam na tela, no slide de potencial. Nada a fazer. |
| Sétima barreira | Entrou. |
| O 43 e os 67,4% | Mantidos, vêm do TCC. O n continua fora da tela e dentro da nota. |

**Uma correção ao meu próprio roteiro:** eu escrevi 29 slides e não marquei o
slide de Referências para sair. Ele ficou, e agora traz as duas fontes novas, o
que faz o deck ter **30 slides**. Se preferir sem ele, é um corte de dois
segundos. *(Ele acabou saindo na revisão do mesmo dia, por causa do tempo. Ver a
seção das recomendações do General, acima.)*

## O que o artigo corrigiu no deck (09/09)

Com o artigo em mãos, conferi o deck contra ele. Três coisas estavam erradas ou
desalinhadas, e foram corrigidas:

| Estava | Passou a ser | Por quê |
|---|---|---|
| 75,9% atribuíram nível máximo | **79,3%** | O artigo publica 79,3% (23 de 29). O 75,9% saía de contar só quem marcou "5" numérico, sem a resposta "Sim". |
| SisCAAeT | **SISCAET** | O artigo grafa SISCAET, Sistema de Controle Aeroterrestre, sete vezes. |
| Prof. Victor Santos · AMAN | **Prof. Victor Santos** | O artigo o descreve como docente de Logística 4.0, sem vincular à AMAN. |

**A conclusão principal do artigo não estava no deck.** O artigo diz, com todas as
letras: "a transformação não deve começar pela IA". O caminho é mapeamento e
padronização, identificação digital, base integrada, auditoria e indicadores, e só
então análise preditiva. Isso agora fecha o slide da resposta às questões, no lugar
de uma frase genérica sobre modelo de gestão.

**As referências passaram a ser as do artigo**, em ABNT completa: Arora, Ballou,
Christopher, Oztemel e Gursev, Pinto, Radivojević e Milosavljević, Rosário, Santos
et al. e os dois manuais. Saíram as entradas aproximadas que estavam ali (LUO e
SINGH, que não constam do artigo). As duas fontes de RFID que eu havia acrescentado
seguem marcadas para você completar a autoria — e, se ficarem no deck, precisam
entrar também no artigo.

## Uma inconsistência dentro do próprio artigo

Vale corrigir antes de submeter, porque é o tipo de coisa que um parecerista pega.

O artigo declara a regra de padronização assim: *"Sim" ou "Sim, muito" correspondeu
ao nível 5; "Parcialmente" ou "Sim, em parte", ao nível 4.*

Essa regra reproduz exatamente os números publicados de duas questões: dependência
de registros manuais (média 4,17, com 79,3% nos níveis 4 e 5) e contribuição geral
das tecnologias (79,3% no nível máximo). O texto diz "em duas questões", então
provavelmente são essas.

Mas há uma terceira questão com resposta textual: integração entre setores, com duas
respostas "Parcialmente". Se a regra fosse aplicada ali, a média sairia **3,34**. O
artigo publica **3,28**, que é o valor obtido tratando "Parcialmente" como nível 3.

Ou seja: ou a regra vale para as três questões e o 3,28 precisa virar 3,34, ou a
regra vale só para duas e convém dizer quais. Recalculei tudo a partir do CSV bruto,
então os dois valores estão confirmados. É um ajuste de uma linha no texto.

## Duas conferências que dependem de você

**O título** passou a ser o do artigo. A capa traz agora o título principal em
destaque e o subtítulo logo abaixo, como manda a estrutura ABNT:

> **Transformação digital da gestão do material aeroterrestre**
> Evidências sobre IoT, *Big Data* e Inteligência Artificial no B DOMPSA.

A aba do navegador acompanhou. **Repare que a linha do orientador continua na
capa** — o artigo é assinado só por você, então, se a apresentação é do artigo,
essa linha talvez deva sair. Diga e eu tiro.

**As fotos novas entraram** pelo zip. Duas foram para os divisores: o pôr do sol na
rampa fecha o bloco de Conclusão, e o KC-390 com o saltador abre o Referencial. As
outras quatro ficaram em `fotos/`, prontas para uso, com o mapa em
`fotos/LEIA-ME.md`.

A das duas velas com carga tem o crédito "Agência Força Aérea / ©Sgt Batista"
gravado na imagem. Ela não serve para divisor, porque ali a foto é escurecida e
desfocada e o crédito sumiria — o que na prática é remover a atribuição. Se quiser
usá-la, tem de ser num quadro claro.

## Dados usados nos gráficos

Todos vindos do formulário (n = 29, taxa de retorno 67,4%):

- **Médias 1–5:** registros manuais 4,17 · integração 3,28 · modelo de controle 3,21 · rastreabilidade 2,86
- **Potencial percebido:** IoT 4,69 · *Big Data* 4,62 · IA 4,62 · 79,3% deram nota máxima à contribuição geral
- **Etapas mais difíceis:** controle de estoque 55,2% · integração de informações 48,3% · inventário 37,9%
- **Problemas:** controles manuais 65,5% · erro humano 51,7% · lentidão 48,3% · rastreabilidade 44,8%
- **Mais beneficiados:** controle de estoque 92,6% · integração 85,2% · inventário 74,1% (n = 27)
- **Barreiras:** orçamento 79,3% · prioridade institucional 62,1% · infraestrutura 62,1%
