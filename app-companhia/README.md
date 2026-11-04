# Sistema da 1ª Companhia – 11º D Sup (Google Planilhas + Apps Script)

Aplicativo web da subunidade para **escala de serviço**, **aditamentos**, **efetivo (tripão, plano de chamada e plano de férias)**, **missões** e **material (inventário, cautelas, relação carga e pedidos)**, usando uma **Planilha Google como base de dados**. Não precisa de servidor nem de mensalidade: roda dentro da conta Google e abre no computador e no celular.

Já vem configurado para o **11º Depósito de Suprimento, Brasília-DF, 1ª Companhia**. Tudo isso se ajusta em Configurações → Documentos.

## O que o sistema faz

| Módulo | Funções |
|---|---|
| **Painel** | Efetivo pronto/impedido, serviço de hoje e de amanhã, missões da semana, cautelas vencidas. |
| **Efetivo** | Cadastro dos militares com os dados do **tripão** (nascimento, Idt, CPF, Prec-CP, tipo sanguíneo, peso, contatos, endereço, contato de emergência, CNH, motorista militar, veículo). Telas de **Tripão**, **Plano de chamada** e **Plano de férias** (por ano de referência, em parcelas), e demais afastamentos. Férias e afastamentos tiram o militar da escala automaticamente. |
| **Escala de serviço** | Uma coluna por tipo de serviço, cada um marcado como **externo ou interno** e com os dias em que ocorre (todos, só preta ou só vermelha, como o Cmt Gda e o Cb Dia). **Escala preta** (dias úteis) e **vermelha** (sáb, dom e feriados), geradas pela **maior folga** na cor do dia (empate: o mais moderno), sem escalar quem está afastado ou em missão e sem dias seguidos. Troca manual na grade, com alerta ⚠ de conflito. **Troca de serviço** (controle interno, pela opção "⇄ Troca de serviço…" da célula): o aditamento sai com quem tirou, sem observação, e o quadro de folgas continua contando para o escalado; a aba **Trocas de serviço** lista as trocas do mês com o motivo. **Mais de um militar no mesmo serviço**: fixo no cadastro ("Militares por dia") ou só num dia, pelo **+** da célula (ex.: dois sentinelas). **Em branco**: vaga sem ninguém de propósito; a pré-montagem não preenche e o serviço não sai no aditamento. **Escala de folga compartilhada**: Sentinela e Permanência dividem a folga ("Soldados"), assim como Cabo da Guarda e Cabo de Dia ("Cabos"); quem tirou um conta como de serviço para o outro. O botão **Pré-montar pela folga** completa as vagas vazias a partir do que você já lançou, escolhendo período, **postos/graduações**, serviços e **quantos por dia** (ex.: a quantidade de cabos e soldados recebida na semana anterior). **Desfazer pré-montagem** tira o que ela lançou e mantém suas trocas manuais. A folga pode ser **por cor** (preta e vermelha) ou **corrida** (todos os dias). **Quadro de folgas** no mesmo formato da planilha (militares × dias, 0 no dia do serviço) e importação do histórico da planilha antiga. |
| **Aditamentos** | No modelo da Cia: brasão e cabeçalho; "QUARTEL EM BRASÍLIA-DF, data (DIA)"; "ADITAMENTO Nº … DA 1ª CIA, AO BOLETIM Nº … DO 11º D SUP". A **1ª parte** traz uma tabela por dia, com **Serviços Externos** e **Serviços Internos**, do dia seguinte até o próximo dia útil (na sexta: sábado, domingo e segunda). A 3ª parte é preenchida com afastamentos, retornos, missões e cautelas. Ao publicar, a 1ª parte fica congelada e o PDF é arquivado. |
| **Missões** | Missão, período, local, comandante, pessoal, viaturas, material e anexo. Quem está em missão sai da escala. Ordem de missão com a relação de pessoal. |
| **Sargenteação** | **Controles da Sargenteação**: os 23 itens da orientação técnica (mapa da força, plano de chamada, FATD, banco de dados, visita médica, SAT, alterações, fichas disciplinares, aditamentos, pernoite, QCP…), cada um com responsável, prazo, situação (em dia / melhorar / fazer) e atalho para a tela que resolve. **Mapa da Força** na data escolhida (previsto no QCP × existente, prontos, férias, dispensas, missão, curso, punição), para conferir e lançar no SUCEMNet. **QCP** (cargos, P/G previsto, ocupante, vagos). **Férias, recompensa e instalação** por militar e ano (quem já tirou os 30 dias). Foto do militar na ficha disciplinar. |
| **Saúde** (Sargenteação, planilha reservada) | **Livro de visita médica** (a dispensa médica vira afastamento sozinha, sem o motivo), **inspeções de saúde** com validade, **acidentes** com AO/ISO, prazo e sindicância, e **adidos em LTSP** com comparecimentos e prorrogações. O resumo mostra quem está dispensado hoje e os prazos vencidos e dos próximos 30 dias. |
| **SAT e pernoite** | **Auxílio-transporte** (Sargenteação → SAT): quem recebe e, no mês, os dias úteis, os dias afastados (férias, dispensas, licenças, cursos, punição; missão opcional) e o valor proporcional. **Folha de pernoite** (Escala → Folha de pernoite): sai da escala do dia, com os militares de outra SU e as assinaturas. |
| **Tempo de serviço** (Sargenteação) | Temporários (marcados no cadastro, ou Cb e Sd sem vínculo informado) com data de praça, tempo de serviço, **término do tempo atual** (último engajamento/prorrogação deferido; Sd EV = 12 meses da praça) e **aviso** com antecedência configurável (padrão 90 dias, também no Painel). Cada processo de engajamento, reengajamento ou prorrogação guarda requerimento, IS, novo período e BI. |
| **Sindicâncias** (Justiça e Disciplina) | Nº, portaria, objeto, encarregado, envolvido, **prazo** (30 dias da portaria, alterável), situação e **BI da solução**; aparece na ficha do militar envolvido. |
| **Alterações** (Sargenteante) | **Folha de alterações semestral** no modelo (1ª parte mês a mês com "Sem Alteração", 2ª parte com TC, TNC, TSCMM, TSNR e TTES calculados em meses de 30 dias e corrigíveis). **Importação do BI do SISBOL (PDF):** o sistema acha os militares da Cia pelo nome completo (ou posto + nome de guerra, para conferir) e sugere a transcrição de cada um. Afastamentos, punições e elogios lançados no sistema entram sozinhos. |
| **Áreas** | O menu é dividido em **Sargenteante** (efetivo, escala, missões, aditamentos, alterações), **Encarregado de Material**, **Furriel** (arranchamento, em construção) e **Justiça e Disciplina**. No cadastro do usuário, o admin marca as áreas em que ele pode lançar e alterar (nenhuma marcada = todas). |
| **Justiça e disciplina** (só quem tem a marcação: oficiais e Sgte) | **FATD** em etapas (fato, ciência com prazo de defesa de 3 dias úteis, defesa, decisão, publicação), **punições** (detenção e prisão em cumprimento tiram o militar da escala), **elogios**, **Boca Podre** (anotações que podem virar FATD) e **ficha do militar** com comportamento sugerido para cabos e soldados. A 4ª parte do aditamento é preenchida com as punições e elogios a publicar. |
| **Material** | Material carga com nome, tipo (permanente, uso duradouro, consumo), Nr ficha, cód. material, conta contábil, acervo, quantidade, valor, dependência e **Nr patrimoniais**. **Relação de material carga** no formato SISCOFIS, por dependência. **Cautelas com vários itens** no modelo da Cia (texto do art. 24 da Portaria nº 008-SEF, itens com numeração e destino, quadro do militar responsável e, no fim, as assinaturas do Cmt Pel e do Chefe do Depósito), com busca no inventário e patrimônios livres, e devolução. **Pedidos de material** em dois sentidos: **recebidos dos Pel / Seç** (Atender dá baixa no estoque e registra o que faltou) e **enviados ao Fisc Adm / S4** (Dar entrada soma no inventário). O **pedido de reposição** já vem preenchido com o que faltou entregar aos pelotões e com o material de consumo abaixo do **estoque mínimo**, descontando o que já foi pedido e não chegou. Modelo com AUTORIZO / VISTO e recibo. Os itens do pedido ao S4 vêm do **cadastro de material** (botão Cadastrar abre o cadastro por cima do pedido), e o sistema avisa nome parecido ("Vassoura" × "Vassouras") para não duplicar. **Locais** (Enc Mat, Furriel, Sargenteação…) escolhidos numa lista, com "+ Adicionar local…" e ordem ajustável. Todas as listas ordenam ao clicar no título da coluna. |
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
| Material → Importar → *Relação do SISCOFIS (PDF)* | Lê o PDF da relação carga gerado pelo SISCOFIS: material permanente (com os Nr patrimoniais) e de uso duradouro, Nr ficha, cód. material, conta contábil, quantidade e valor. Mostra a lista para você **marcar o que entra** e corrigir antes de gravar; avisa os itens que já estão no inventário (pode atualizá-los). |
| Material → Importar → *Pedido de material (PDF)* | Lê a tabela do pedido (especificação, quantidade, unidade, obs), mesmo com a especificação em duas linhas. Você **escolhe os itens** e o destino: **pedido enviado ao Fisc Adm / S4**, **pedido recebido de Pel / Seç** ou **lançar no inventário** como material de consumo (soma a quantidade se o item já existir). |

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
6. **Dê acesso aos outros militares** (veja "Usuários e acesso" abaixo). Mande o link do sistema para a pessoa: ela abre, vê o próprio e-mail e toca em **Pedir acesso** ou manda o e-mail pelo WhatsApp. Você aprova em **Configurações → Usuários**.

> **Primeiro acesso de cada usuário:** o Google mostra "O Google não verificou este app" (porque o app é seu, não publicado na loja). Clique em **Avançado → Acessar (nome do projeto)** e autorize. Só acontece uma vez.

> **Ao alterar o código depois**, use **Implantar → Gerenciar implantações → editar (lápis) → Versão: nova versão**, assim o link continua o mesmo.

## Justiça e Disciplina: planilha reservada

FATD, punições, elogios e Boca Podre ficam numa **planilha separada** ("Reservado - Justiça e Disciplina"), no Drive do administrador e **fora da pasta do sistema**, compartilhada só com os admins e com quem tem a marcação **Justiça e Disciplina** no cadastro do usuário. Os PDFs e Docs dessa parte vão para a pasta reservada, também fora da pasta compartilhada. Assim, quem não tem a marcação não vê esses dados nem abrindo a planilha direto no Google Sheets.

Depois de instalar esta versão, **o administrador abre a Justiça e Disciplina uma vez**: o sistema cria a planilha reservada e leva para ela o que já estava lançado. Em seguida, marque "Justiça e Disciplina: Sim" no cadastro dos oficiais e do Sgte.

Quem cumpre detenção ou prisão aparece para todos só como afastamento "Cumprindo punição" (sem o motivo), para a escala não escalar a pessoa.

A **Saúde** segue a mesma regra, numa planilha reservada própria ("Reservado - Saúde"), compartilhada com os admins, os oficiais/Sgte e os editores da área Sargenteante. Abra a Saúde uma vez como admin depois de instalar.

## Pastas no Drive

Tudo fica na pasta do sistema, separado por tipo, ano e mês: `PDFs/<tipo>/<ano>/<mês>`, `Google Docs/<tipo>/<ano>/<mês>` e `Anexos/<tipo>/<ano>/<mês>` (ex.: `PDFs/Cautelas/2026/11 - Novembro`).

## Celular e tablet

É o mesmo sistema e o mesmo link (o `/exec` da implantação). Não precisa instalar nada nem publicar outra versão.

- **Celular:** a escala abre **por dia** (um cartão por dia, com os serviços um embaixo do outro) e o botão **Ir para hoje**. Para ver a grade completa, toque em **Ver: Grade**.
- **Tablet:** a escala abre em grade. Ao rolar para o lado, a coluna do dia fica fixa.
- As demais telas (efetivo, material, cautelas, pedidos, aditamentos) se ajustam à largura da tela.
- **Ícone na tela inicial**, para abrir como um aplicativo:
  - **Android (Chrome):** abra o link, toque em ⋮ → **Adicionar à tela inicial**.
  - **iPhone/iPad (Safari):** abra o link, toque em **Compartilhar** → **Adicionar à Tela de Início**.
- É preciso estar logado no Google com o e-mail cadastrado no sistema, como no computador.
- Em celular sem internet o sistema não abre, porque os dados ficam na planilha do Google.

## Usuários e acesso

Só o **admin** cadastra pessoas e muda perfis. Pode haver mais de um admin, por exemplo o Sgte ou o S1.

| Perfil | Pode |
|---|---|
| **admin** | Tudo, inclusive usuários, perfis e Configurações → Documentos. |
| **editor** | Lança e altera escala, aditamentos, efetivo, tripão, férias, missões, material, cautelas e pedidos; gera PDF e documento editável. |
| **leitor** | Só consulta. Não vê o tripão. |

**Como a pessoa entra:**
1. Ela abre o link do sistema com a conta Google dela. Se ainda não estiver cadastrada, vê **"Você ainda não tem acesso"**, com o e-mail dela, um botão **Pedir acesso** e outro para **Enviar pelo WhatsApp**.
2. O pedido aparece para o admin no **Painel** ("pedido(s) de acesso aguardando") e em **Configurações → Usuários → Pedidos de acesso**.
3. O admin clica em **Aprovar…**, escolhe o perfil e salva. Também dá para cadastrar direto em **+ Usuário**, só com o e-mail.

**Ao salvar, o próprio sistema compartilha a planilha e a pasta "Arquivos - …" do Drive**: admin e editor como *Editor*, leitor como *Leitor*. O Google avisa a pessoa por e-mail. Ao mudar o perfil o compartilhamento é ajustado, e ao **Excluir** é retirado.

Se a pessoa ainda não tem acesso nem à planilha, o botão "Pedir acesso" não funciona, porque não há onde gravar o pedido. Nesse caso a tela mostra o e-mail para ela mandar pelo WhatsApp, e o admin cadastra em **+ Usuário**.

**Proteção:** as abas `Usuarios`, `Acessos` e `Config` ficam protegidas na planilha, e só os admins editam. Assim ninguém muda o próprio perfil abrindo a planilha direto. O sistema não deixa ficar sem administrador e não deixa o admin excluir a si mesmo.

> Quem já tinha instalado antes desta versão: depois de colar o código novo, rode `setup` mais uma vez no editor para criar a aba `Acessos` e proteger as abas.

## Se aparecer "e-mail não identificado"

A implantação está como **Executar como: Eu**. Nesse modo o Google não informa ao sistema quem está acessando, e ninguém além do administrador consegue entrar. Corrija em **Implantar → Gerenciar implantações → ✏️ editar**:
- *Executar como:* **Usuário que acessa o app da Web**;
- *Quem pode acessar:* **Qualquer pessoa com Conta do Google**;
- **Versão: Nova versão** → **Implantar**. O link `/exec` continua o mesmo.

No primeiro acesso, cada pessoa autoriza o sistema uma vez. Aparece "O Google não verificou este app": toque em **Avançado → Acessar Sistema da Companhia (não seguro) → Permitir**.

## Se a página ficar parada em "Carregando…"

O sistema mostra na tela o que aconteceu:
- **"O arquivo Index está incompleto no Apps Script"**: a colagem parou no meio. Abra o `Index.html` no Bloco de Notas, **Ctrl+A** e **Ctrl+C**. No editor do Apps Script, clique dentro do arquivo **Index**, **Ctrl+A**, **Delete** e **Ctrl+V**. Aperte **Ctrl+End** e confira que a última linha é `</html>`, com cerca de 2.200 linhas no total. Salve com **Ctrl+S**.
- **"O sistema encontrou um erro ao carregar"**: mande um print da mensagem.

Depois de corrigir o código, **publique uma nova versão** (Implantar → Gerenciar implantações → ✏️ → Versão: Nova versão → Implantar). O link `/exec` só mostra a última versão *publicada*. Para testar sem publicar, use **Implantar → Testar implantações**: esse link termina em `/dev` e sempre usa o código salvo.

> **Para quem for editar o código:** o Apps Script apaga tudo o que vem depois de `//` numa linha, inclusive dentro de textos. Não use barra dupla nem barra-asterisco dentro de textos no `Index.html`: monte endereços com `HTTPS + '...'` e guarde imagens em base64url com `imagemPng(...)`.

## Primeiros passos dentro do sistema

1. **Configurações → Documentos:** confira o cabeçalho (MINISTÉRIO DA DEFESA / EXÉRCITO BRASILEIRO / 11º DEPÓSITO DE SUPRIMENTO / 1ª COMPANHIA), acrescente a linha do escalão superior se a OM usa, e preencha o nome do Cmt Cia, o setor da cautela, as assinaturas e o detentor do material carga. O Brasão da República já vem como padrão nos documentos, e o **distintivo do 11º D Sup** aparece no topo do sistema. Os dois podem ser trocados ali mesmo.
2. **Configurações → Feriados:** "Incluir feriados nacionais do ano" e acrescente os locais.
3. **Configurações → Tipos de serviço:** os serviços da 1ª Cia já vêm prontos:

   | Serviço | Concorrem | Grupo no aditamento |
   |---|---|---|
   | Oficial de Dia | 1º Ten, 2º Ten | Externo |
   | Adjunto | 1º Sgt, 2º Sgt | Externo |
   | Sargento de Dia | 3º Sgt | Interno |
   | Comandante da Guarda | 3º Sgt | Externo |
   | Cabo da Guarda | Cb | Externo |
   | Cabo de Dia | Cb | Interno |
   | Sentinela | Sd EP, Sd EV, Sd | Externo |
   | Permanência | Sd EP, Sd EV, Sd | Interno |

   Ao criar ou editar um serviço, **marque as caixinhas** dos postos e graduações que concorrem, escolha se é externo ou interno e em que dias ocorre (todos, só dias úteis ou só sábado, domingo e feriado). O botão **Restaurar serviços padrão** volta a esta lista.
4. **Efetivo → Importar planilha:** primeiro o **tripão**, depois o **plano de férias**. Preencha a **antiguidade** (1 = mais antigo) para o desempate da escala.
5. **Escala → Importar planilha antiga:** traga a planilha de escala atual para manter as folgas.
6. **Material → Importar → Relação do SISCOFIS (PDF)** com a relação carga.
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

O botão **Atalhos** reúne as ações mais usadas (nova missão, novo aditamento, nova cautela, lançar afastamento, gerar e salvar a escala do mês). O tema é **claro (branco)** por padrão. O botão 🌙 no topo liga o **tema preto**, e cada aparelho lembra a escolha. O botão ⛶ deixa em **tela cheia** e faz o conteúdo usar a largura toda, bom para a escala e o quadro de folgas. As duas opções também estão no menu do usuário. Impressões e PDFs saem sempre em preto no branco.

## Como os dados ficam na planilha

Cada aba é uma tabela, com a linha 1 de cabeçalho: `Militares` (com o tripão), `Impedimentos` (férias e afastamentos), `TiposServico`, `Escala`, `Feriados`, `Missoes`, `Aditamentos`, `Material`, `Cautelas` (uma linha por item; o número agrupa a cautela), `Pedidos`, `Usuarios`, `Acessos` (pedidos de acesso), `Config`, `Documentos` (PDFs e editáveis) e `Log` (registro de quem alterou o quê). Dá para consultar e filtrar direto na planilha, mas **prefira editar pelo sistema** para não quebrar os vínculos (ids). O histórico de versões do Google Planilhas (Arquivo → Histórico de versões) serve como backup; há também "Configurações → Backup" para baixar tudo em JSON.

Anexos (termos de cautela digitalizados, fotos, ordens de missão) e os Google Docs dos aditamentos ficam na pasta **"Arquivos - (nome da planilha)"** do Drive.

## Testar sem instalar

Abra o `Index.html` direto no navegador: ele entra em **modo demonstração**, com dados fictícios guardados só naquele navegador. Serve para conhecer as telas antes de instalar.

## Limites a conhecer

- Feito para o tamanho de uma subunidade (centenas de militares e alguns milhares de lançamentos). Cada abertura carrega todos os dados de uma vez, então **a planilha não pode crescer sem fim**.
- **Arquivo anual:** uma vez por ano (ex.: em janeiro), em **Configurações → Geral → Arquivo anual**, arquive o que terminou antes de uma data (sugestão: 1º de janeiro do ano anterior). Saem da planilha principal os serviços antigos da escala (fica o último de cada militar, para a folga não mudar), aditamentos publicados, afastamentos encerrados, missões concluídas, cautelas devolvidas, pedidos encerrados, registros de documentos e o log. Tudo vai para outra planilha na pasta do sistema (*Arquivo de dados*) e continua consultável lá. Assim o sistema abre com a mesma velocidade em todos os anos.
- Cotas do Google Apps Script (conta Gmail comum): cada ação pode durar até 6 minutos e há limite de uso por dia, folgado para uma Cia. Como o sistema roda como **Usuário que acessa o app da Web**, a cota é contada por pessoa, não só na conta do administrador.
- Arquivos anexados: até 25 MB cada.
- Não guarde no sistema informação classificada (sigilosa): a planilha fica em conta Google comum.
- **Dados pessoais (LGPD):** o tripão tem CPF, endereço e telefones. Só `admin` e `editor` veem a aba Tripão no sistema. Ainda assim, quem tem acesso à planilha (inclusive o leitor, como Leitor) consegue abrir as abas direto no Google Sheets, então cadastre só quem precisa. O perfil `leitor` vê o plano de chamada, que é para acionamento.
