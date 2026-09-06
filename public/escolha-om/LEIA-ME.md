# Cerimônia de Escolha de OM — CAO/Log

Aplicação para conduzir a escolha de Organização Militar em tempo real, com telão
para o auditório e painel de controle para o operador.

## Como abrir

**Pelo sistema** (recomendado): com o servidor no ar (`npm run dev` ou `npm run start`),
acesse `http://localhost:3000/escolha-om/index.html`. No painel administrativo há
também o botão **Escolha de OM**.

**Sem servidor**: dê duplo clique em `index.html`. Funciona igual, mas o telão em
janela separada depende de o navegador compartilhar o armazenamento entre as duas
janelas — se não sincronizar, use o botão **Apresentar aqui**.

Não precisa de internet: tudo (fotos, brasões, dados) está nesta pasta.

## A lógica da escolha

A cerimônia segue a regra de sempre, e é ela que o programa automatiza:

1. os concludentes são chamados **na ordem da classificação final**;
2. o chamado escolhe **uma das vagas ainda disponíveis** no quadro;
3. a vaga escolhida **sai do quadro** e a chamada passa ao próximo;
4. vaga com **reserva nominal** só pode ser tomada pelo oficial indicado;
5. ao final, a relação das escolhas vira a **Relação para o DCEM**.

O quadro de vagas é organizado por Comando Militar de Área. O C Mil A é deduzido
da RM (1ª e 4ª → CML; 2ª → CMSE; 3ª e 5ª → CMS; 6ª, 7ª e 10ª → CMNE; 8ª → CMN;
9ª → CMO; 11ª → CMP; 12ª → CMA) e pode ser corrigido à mão em qualquer linha.

## Antes da cerimônia

Na aba **Preparação**:

1. **Concludentes** — a base que acompanha o programa é a *prévia* de classificação
   da Intendência 2026 (56 oficiais, com as fotos do carômetro). Substitua pela
   classificação final: “Colar do Excel” troca a lista inteira, e quem já estiver
   cadastrado mantém foto, turma e demais dados. Preencha a coluna **Idt**, que é
   exigida no documento do DCEM e não veio nas planilhas de origem.
2. **Quadro de vagas** — o quadro que vem carregado é o **modelo de 2022** e serve
   só de exemplo. Cole o quadro oficial do ano (OM, Cidade-UF, RM, Qtd). Repetir a
   mesma OM em várias linhas soma as vagas. Se houver vaga nominal, escolha o
   oficial na coluna **Reserva**.
3. **Configuração** — título, data, tempo de escolha e o que aparece no telão.
   Exporte um backup da sessão antes de começar.

Para tirar nomes da relação: o **✕** da linha exclui um, ou marque as caixas à
esquerda e use **Excluir selecionados**. Quem sai leva junto a escolha que
tenha feito, e a vaga volta para o quadro.

### Prévias salvas

Na versão publicada da ferramenta há uma aba **Prévias salvas**: uma base
comum a todos que abrem o mesmo endereço. Cada prévia é um retrato completo
daquele momento — relação de concludentes, quadro de vagas, escolhas e
configuração — gravado com um nome, e qualquer um pode abrir, substituir ou
excluir. Serve para montar e comparar cenários antes da cerimônia sem passar
arquivo de mão em mão.

Rodando pelo sistema ou pela pasta essa base não existe (ela pertence à página
publicada); ali o equivalente é `Configuração → Exportar sessão`, que grava um
arquivo com o mesmo conteúdo.

O aviso no alto da aba de vagas compara o total de vagas com o de concludentes
presentes e avisa se estiver faltando vaga.

## Durante a cerimônia

Abra o **telão** na tela do projetor (`Abrir telão` manda para uma segunda janela;
`Apresentar aqui` ocupa esta mesma tela). As duas janelas ficam sincronizadas:
o que o operador confirma aparece no telão na hora.

No painel do operador:

- clique na vaga e depois em **Confirmar escolha** — ou dê duplo clique na vaga;
- **Enter** confirma, **Ctrl+Z** desfaz, **↑ ↓** navegam pela lista;
- a busca filtra por OM ou cidade; os botões filtram por C Mil A;
- **Adiar** joga o oficial para o fim da fila (chegou atrasado, está resolvendo
  alguma coisa) e **Ausente** o retira da chamada — dá para reativá-lo na
  Preparação, pelo botão ○ da linha dele.

Se o chamado não tiver o que escolher — o quadro acabou, ou o que sobrou é
reserva nominal de outro —, um aviso toma o lugar do cronômetro no painel e no
telão, dizendo qual dos dois casos é e quantos ainda faltam.

Cada escolha confirmada mostra no telão, por alguns segundos, o nome do oficial e
a OM escolhida, e some do quadro de vagas.

## Depois

A aba **Resultado** entrega três documentos, todos prontos para impressão:

- **Quadro final** — classificação × OM de destino;
- **Relação para o DCEM** — reprodução da aba `Rel DCEM` da planilha da escolha;
- **Por OM** — quem foi para cada Organização Militar.

Também dá para baixar em CSV e em Excel — os três saem como `.xlsx` de
verdade, não como HTML de extensão trocada.

### A relação para o DCEM

Sai na mesma forma da aba `Rel DCEM` da planilha da escolha:

- título `ALTERAÇÕES DE OFICIAIS` com filete embaixo, mesclado de A a F;
- cabeçalho em duas linhas — POSTO / A / Q / S, IDT, NOME, OM ORIGEM /
  CIDADE-UF, OM DESTINO / CIDADE-UF, ASSINATURA;
- as duas linhas de enquadramento sem moldura (`- CLASSIFICAÇÃO POR CONCLUSÃO
  DE CURSO NO PAÍS` e a alínea do curso), editáveis em Configuração;
- um quadro de duas linhas por oficial — posto sobre A/Q/S, OM sobre cidade nas
  colunas de origem e de destino, e Idt, nome e assinatura mesclados nas duas —
  separados por um vão, com o número de ordem fora da moldura;
- Times New Roman 11, tudo centralizado, e as larguras de coluna do original
  (13 / 19,1 / 51,6 / 18,4 / 28,4 / 13).

**Baixar Excel** nessa aba gera um `.xlsx` de verdade, com as mesclagens, as
molduras, as larguras e a mesma configuração de impressão do original: A4
retrato a 64%, margens laterais de 1,3 cm e área de impressão de A até F — o
número de ordem fica de fora, como na planilha. **Imprimir** sai igual, com a
mesma redução, e nenhum quadro de oficial é partido entre duas folhas.

**Baixar PDF** desenha a folha diretamente, com a mesma geometria da impressão.
Serve quando a impressão do navegador não está disponível — é o caso da versão
publicada, onde a página não tem permissão de acionar a impressora — e também
quando se quer o arquivo pronto para anexar. As outras duas abas geram PDF em
paisagem. A biblioteca que desenha o PDF vem na própria pasta, então isso
também funciona sem internet.

A abreviatura do A/Q/S na relação é `Int` (o que está na planilha do DCEM), e
não `Sv Int` da tabela de concludentes — são documentos diferentes. Dá para
trocar em Configuração.

## Segurança da sessão

Tudo é gravado no navegador da máquina que está conduzindo (nada vai para
servidor). Exporte o backup em `Preparação → Configuração → Exportar sessão`
antes e durante a cerimônia: se a máquina falhar, é só importar o arquivo em
outro computador e continuar do ponto em que parou.

## Fotos

As fotos estão em `fotos/`, nomeadas pelo nome de guerra sem acento e com hífen
no lugar do espaço (`fernando-santos.webp`). Quem não tem foto aparece com as
iniciais. Para incluir uma que falte, salve o arquivo com esse padrão de nome e
preencha o campo correspondente — o programa procura `fotos/<nome do arquivo>`.

Nove oficiais estão sem foto porque as imagens correspondentes vieram
corrompidas no carômetro de origem: TROMPIERI, FIORENZA, CAVALIER, ESPINATO,
LEANDRO SILVA, SIMÕES, GUSTAVO NUNES, MENEZES e GÓES.

## Arquivos

| Arquivo      | Conteúdo                                                     |
|--------------|--------------------------------------------------------------|
| `index.html` | estrutura das telas                                          |
| `estilo.css` | aparência, inclusive o layout do telão e a folha de impressão |
| `app.js`     | regra da cerimônia, sincronização e relatórios               |
| `xlsx.js`    | gerador dos arquivos `.xlsx`                                 |
| `jspdf.umd.min.js` | biblioteca que desenha os PDF (vem junto, para funcionar sem rede) |
| `dados.js`   | base de concludentes e modelos de quadro de vagas            |
| `fotos/`     | retratos                                                     |
| `brasoes/`   | brasões da EsAO e do C Log                                   |
