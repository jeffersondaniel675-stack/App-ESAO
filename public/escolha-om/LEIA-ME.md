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

Cada escolha confirmada mostra no telão, por alguns segundos, o nome do oficial e
a OM escolhida, e some do quadro de vagas.

## Depois

A aba **Resultado** entrega três documentos, todos prontos para impressão:

- **Quadro final** — classificação × OM de destino;
- **Relação para o DCEM** — no formato de alterações de oficiais, com OM de
  origem, OM de destino e espaço de assinatura;
- **Por OM** — quem foi para cada Organização Militar.

Também dá para baixar em CSV e em Excel.

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
| `dados.js`   | base de concludentes e modelos de quadro de vagas            |
| `fotos/`     | retratos                                                     |
| `brasoes/`   | brasões da EsAO e do C Log                                   |
