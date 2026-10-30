# Sistema da 1ª Companhia – 11º D Sup (Google Planilhas + Apps Script)

Aplicativo web da subunidade para **escala de serviço**, **aditamentos**, **efetivo (tripão, plano de chamada e plano de férias)**, **missões** e **material (inventário, cautelas, relação carga e pedidos)**, usando uma **Planilha Google como base de dados**. Não precisa de servidor nem de mensalidade: roda dentro da conta Google e abre no computador e no celular.

Já vem configurado para o **11º Depósito de Suprimento, Brasília-DF, 1ª Companhia**. Tudo isso se ajusta em Configurações → Documentos.

## O que o sistema faz

| Módulo | Funções |
|---|---|
| **Painel** | Efetivo pronto/impedido, serviço de hoje e de amanhã, missões da semana, cautelas vencidas. |
| **Efetivo** | Cadastro dos militares com os dados do **tripão** (nascimento, Idt, CPF, Prec-CP, tipo sanguíneo, peso, contatos, endereço, contato de emergência, CNH, motorista militar, veículo). Telas de **Tripão**, **Plano de chamada** e **Plano de férias** (por ano de referência, em parcelas), e demais afastamentos. Férias e afastamentos tiram o militar da escala automaticamente. |
| **Escala de serviço** | Uma coluna por tipo de serviço, cada um marcado como **externo ou interno** e com os dias em que ocorre (todos, só preta ou só vermelha, como o Cmt Gda e o Cb Dia). **Escala preta** (dias úteis) e **vermelha** (sáb, dom e feriados), geradas pela **maior folga** na cor do dia (empate: o mais moderno), sem escalar quem está afastado ou em missão e sem dias seguidos. Troca manual na grade, com alerta ⚠ de conflito. **Quadro de folgas** no mesmo formato da planilha (militares × dias, 0 no dia do serviço) e importação do histórico da planilha antiga. |
| **Aditamentos** | No modelo da Cia: brasão e cabeçalho; "QUARTEL EM BRASÍLIA-DF, data (DIA)"; "ADITAMENTO Nº … DA 1ª CIA, AO BOLETIM Nº … DO 11º D SUP". A **1ª parte** traz uma tabela por dia, com **Serviços Externos** e **Serviços Internos**, do dia seguinte até o próximo dia útil (na sexta: sábado, domingo e segunda). A 3ª parte é preenchida com afastamentos, retornos, missões e cautelas. Ao publicar, a 1ª parte fica congelada e o PDF é arquivado. |
| **Missões** | Missão, período, local, comandante, pessoal, viaturas, material e anexo. Quem está em missão sai da escala. Ordem de missão com a relação de pessoal. |
| **Material** | Material carga com nome, tipo (permanente, uso duradouro, consumo), Nr ficha, cód. material, conta contábil, acervo, quantidade, valor, dependência e **Nr patrimoniais**. **Relação de material carga** no formato SISCOFIS, por dependência. **Cautelas com vários itens** no modelo da Cia (assinaturas do Cmt Pel e do Chefe do Depósito, texto do art. 24 da Portaria nº 008-SEF, itens com numeração e destino, quadro do militar responsável) e devolução. **Pedido de material** com itens, AUTORIZO / VISTO e recibo. |
| **Arquivo** | Todos os PDFs e documentos editáveis gerados, por tipo e ano, com busca. |
| **Configurações** | Tipos de serviço, feriados (os nacionais do ano com um clique), identificação, assinaturas, brasão, usuários e backup. |

## Exportar e importar

Todo documento (aditamento, escala, quadro de folgas, ordem de missão, cautela, relação carga, pedido, tripão, plano de chamada e plano de férias) tem os botões:

- **Imprimir**: abre a impressão do navegador. Dá para escolher "Salvar como PDF" ali mesmo.
- **PDF**: gera o PDF e **arquiva no Drive** (`PDFs/<tipo>/<ano>`).
- **Editável (Doc/Word)**: cria um **Google Doc** com o mesmo conteúdo (brasão, tabelas e assinaturas), em `Google Docs/<tipo>/<ano>`. No Docs: **Arquivo → Fazer download → Microsoft Word (.docx)** para editar no Word, ou **→ PDF** depois de ajustar.

As listas (tripão, plano de chamada, plano de férias, escala do mês, quadro de folgas, relação carga) também saem em **Excel**.

O caminho inverso, de planilha para o sistema, aceita **.xlsx, .xls, .ods, .csv ou um link do Google Planilhas**:

| Onde | O que importa |
|---|---|
| Efetivo → Importar planilha → *Militares, tripão ou plano de chamada* | Reconhece as colunas do seu tripão e do plano de chamada (P/G, nome completo, nome de guerra, Idt, CPF, Prec-CP, tipo sanguíneo, telefone, endereço, contato de emergência, CNH…). As colunas de paraquedismo ficam de fora. Quem já existe é atualizado (por Idt ou nome de guerra), e célula vazia não apaga dado. |
| Efetivo → Importar planilha → *Plano de férias* | Lê a coluna "Dia/mês", seja uma data de início com o "Período" ("30 dias"), sejam parcelas escritas ("- 10 a 19 FEV 27", "01 DEZ a 15 JAN 27"). Avisa os nomes que não encontrar no efetivo. |
| Escala → Importar planilha antiga | Lê a planilha de escala no formato de colunas por dia (Sgt Dia, Cabo de Dia…): cada **0 é um dia de serviço**. Recria o histórico, então as folgas continuam de onde estavam. Cadastra os militares que faltarem. |
| Material → Importar planilha | Relação de material (nome, Nr ficha, cód. material, conta contábil, quantidade, valor, Nr patrimoniais, dependência…). |

## Instalação (uns 10 minutos)

1. **Crie a planilha.** Em [sheets.new](https://sheets.new), crie uma planilha vazia e dê um nome (ex.: `Sistema 1ª Cia`).
2. **Abra o editor de script.** Menu **Extensões → Apps Script**.
3. **Copie os arquivos.**
   - Apague o conteúdo de `Código.gs` e cole o conteúdo de [`Code.gs`](Code.gs).
   - Clique em **+ → HTML**, dê o nome `Index` (exatamente assim) e cole o conteúdo de [`Index.html`](Index.html).
   - (Opcional) Em **Configurações do projeto**, marque "Mostrar arquivo de manifesto" e cole [`appsscript.json`](appsscript.json).
   - Salve (Ctrl+S).
4. **Rode a configuração inicial.** No topo do editor escolha a função `setup` e clique em **Executar**. Autorize o acesso quando o Google pedir. Isso cria as abas, a pasta "Arquivos - …" no seu Drive e cadastra **você como administrador**.
5. **Publique.** **Implantar → Nova implantação → tipo "App da Web"**:
   - *Executar como:* **Usuário que acessa o app da Web**
   - *Quem pode acessar:* **Qualquer pessoa com uma Conta do Google**
   - Clique em **Implantar** e copie o link `https://script.google.com/macros/s/…/exec`. Esse é o endereço do sistema; salve nos favoritos ou na tela inicial do celular.
6. **Dê acesso aos outros militares.**
   - Compartilhe a **planilha** e a **pasta "Arquivos - …"** do Drive com o e-mail Google de cada um (como *Editor*).
   - No sistema, em **Configurações → Usuários**, cadastre o e-mail e o perfil:
     - `admin`: tudo, inclusive usuários e configurações;
     - `editor`: lança escala, missões, aditamentos e material;
     - `leitor`: só consulta.
   - Quem não estiver na lista não entra no sistema.

> **Primeiro acesso de cada usuário:** o Google mostra "O Google não verificou este app" (porque o app é seu, não publicado na loja). Clique em **Avançado → Acessar (nome do projeto)** e autorize. Só acontece uma vez.

> **Ao alterar o código depois**, use **Implantar → Gerenciar implantações → editar (lápis) → Versão: nova versão**, assim o link continua o mesmo.

## Primeiros passos dentro do sistema

1. **Configurações → Documentos:** confira o cabeçalho (MINISTÉRIO DA DEFESA / EXÉRCITO BRASILEIRO / 11º DEPÓSITO DE SUPRIMENTO / 1ª COMPANHIA), acrescente a linha do escalão superior se a OM usa, e preencha o nome do Cmt Cia, o setor da cautela, as assinaturas e o detentor do material carga. O Brasão da República já vem como padrão.
2. **Configurações → Feriados:** "Incluir feriados nacionais do ano" e acrescente os locais.
3. **Configurações → Tipos de serviço:** ajuste os serviços (vêm Adj Of Dia, Cmt Gda, Cb Gda e Sd Gda como externos; Cb Dia, Plantão e Permanência como internos), os dias de cada um e quem concorre.
4. **Efetivo → Importar planilha:** primeiro o **tripão**, depois o **plano de férias**. Preencha a **antiguidade** (1 = mais antigo) para o desempate da escala.
5. **Escala → Importar planilha antiga:** traga a planilha de escala atual para manter as folgas.
6. **Material → Importar planilha** com a relação carga.
7. **Escala → Gerar dias vazios.**

## Arquivo de PDFs (backup dos documentos)

Os PDFs ficam na pasta do sistema no Drive, assim:

```
Arquivos - Sistema 1ª Cia/
├── PDFs/
│   ├── Aditamentos/2026/ADT 202 30 OUT 26 - sexta-feira.pdf
│   ├── Escalas/2026/Escala de servico 2026-11.pdf
│   ├── Cautelas/2026/Cautela 012-2026 - … .pdf
│   ├── Material/2026/Relacao material carga 1ª Cia 2026-10-30.pdf
│   ├── Pedidos/2026/Pedido de material 001-2026.pdf
│   └── Efetivo/2026/Plano de chamada 1ª Cia … .pdf
└── Google Docs/   (as versões editáveis, na mesma organização)
```

Cada arquivo gerado também fica registrado na aba `Documentos` (data, tipo, título, formato, quem gerou e link). Gerar de novo o mesmo documento cria uma nova versão e mantém a anterior.

Para ter uma cópia **fora do Google** (num computador ou pendrive da SU), instale o [Google Drive para computador](https://www.google.com/drive/download/) e sincronize a pasta `PDFs`. Assim os arquivos ficam gravados no computador automaticamente.

Quem já tinha o sistema instalado não precisa fazer nada na planilha: abas e colunas novas (`Documentos`, `Pedidos`, campos do tripão etc.) são criadas sozinhas no primeiro uso. Basta colar o código novo e publicar uma nova versão.

## Layout

A interface segue o **Padrão Digital de Governo (gov.br Design System)**:
- cabeçalho branco com a identificação da OM e faixa amarela;
- botão ☰ que abre o menu em duas colunas (módulos e, ao lado, as páginas de cada um);
- trilha de navegação ("você está aqui");
- busca geral ("O que você procura?") em militares, material, missões, aditamentos e PDFs;
- botões arredondados e paleta azul institucional.

O botão **Atalhos** reúne as ações mais usadas (nova missão, novo aditamento, nova cautela, lançar afastamento, gerar e salvar a escala do mês). O sistema acompanha o tema claro ou escuro do aparelho.

## Como os dados ficam na planilha

Cada aba é uma tabela, com a linha 1 de cabeçalho: `Militares` (com o tripão), `Impedimentos` (férias e afastamentos), `TiposServico`, `Escala`, `Feriados`, `Missoes`, `Aditamentos`, `Material`, `Cautelas` (uma linha por item; o número agrupa a cautela), `Pedidos`, `Usuarios`, `Config`, `Documentos` (PDFs e editáveis) e `Log` (registro de quem alterou o quê). Dá para consultar e filtrar direto na planilha, mas **prefira editar pelo sistema** para não quebrar os vínculos (ids). O histórico de versões do Google Planilhas (Arquivo → Histórico de versões) serve como backup; há também "Configurações → Backup" para baixar tudo em JSON.

Anexos (termos de cautela digitalizados, fotos, ordens de missão) e os Google Docs dos aditamentos ficam na pasta **"Arquivos - (nome da planilha)"** do Drive.

## Testar sem instalar

Abra o `Index.html` direto no navegador: ele entra em **modo demonstração**, com dados fictícios guardados só naquele navegador. Serve para conhecer as telas antes de instalar.

## Limites a conhecer

- Feito para o tamanho de uma subunidade (centenas de militares e alguns milhares de lançamentos). Cada abertura carrega todos os dados de uma vez.
- Arquivos anexados: até 25 MB cada.
- Não guarde no sistema informação classificada (sigilosa): a planilha fica em conta Google comum.
- **Dados pessoais (LGPD):** o tripão tem CPF, endereço e telefones. Só `admin` e `editor` veem a aba Tripão. Ainda assim, quem tem acesso à planilha vê tudo, então compartilhe a planilha só com quem precisa. O perfil `leitor` vê o plano de chamada, que é para acionamento.
