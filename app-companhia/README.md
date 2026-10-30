# Sistema da Companhia (Google Planilhas + Apps Script)

Aplicativo web para a subunidade controlar **escala de serviço**, **missões**, **aditamentos ao BI** e **material (inventário e cautelas)**, usando uma **Planilha Google como base de dados**. Não precisa de servidor nem de mensalidade: roda dentro da conta Google e abre no computador e no celular.

## O que o sistema faz

| Módulo | Funções |
|---|---|
| **Painel** | Efetivo pronto/impedido, serviço de hoje e de amanhã, missões da semana, cautelas vencidas. |
| **Efetivo** | Cadastro dos militares (posto/grad, nº, nome de guerra, antiguidade, pelotão…) e afastamentos (férias, dispensa, curso…). Importa a relação de uma planilha. |
| **Escala de serviço** | Uma coluna por tipo de serviço (Of Dia, Sgt Dia, Cb Gda, Plantão… configuráveis). **Escala preta** (dias úteis) e **vermelha** (sáb, dom e feriados). Geração automática pela **maior folga** na cor do dia (empate: o mais moderno), sem escalar quem está afastado ou em missão e sem serviço em dias seguidos. Troca manual na própria grade, com alerta ⚠ de conflito. Quadro de folgas e impressão do mês. |
| **Missões** | Missão, período, local, comandante, pessoal, viaturas, material e anexo. Quem está em missão sai automaticamente da escala. Impressão da ordem de missão com a relação de pessoal. |
| **Aditamentos** | Numeração automática por ano. A 1ª parte (serviços diários) é preenchida pela escala; a 3ª parte (afastamentos, retornos, missões e cautelas) pelos lançamentos do período. Texto editável, impressão/PDF e geração de **Google Doc** na pasta do sistema. |
| **Material** | Inventário com patrimônio, categoria, quantidade, local, estado e data da última conferência; cautelas com saída, devolução, controle de quantidade disponível, termo de cautela para impressão e anexo do termo assinado (digitalizado) no Drive. Importa sua planilha de material atual (.xlsx, .csv ou Google Planilhas). |
| **Arquivo PDF** | Todo documento (aditamento, escala do mês, ordem de missão, termo de cautela, relação de material) tem o botão **Salvar PDF**: o sistema gera o PDF e guarda no Drive, organizado por tipo e ano, pronto para imprimir. Ao **publicar** um aditamento, o PDF é arquivado automaticamente. A tela lista tudo o que foi arquivado, com busca e filtro. |
| **Configurações** | Tipos de serviço, feriados (inclui os nacionais do ano com um clique), cabeçalho dos documentos, usuários e backup. |

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

1. **Configurações → Documentos:** sigla (aparece no canto superior esquerdo, no lugar do logotipo), nome do sistema, cabeçalho (MINISTÉRIO DA DEFESA / EXÉRCITO BRASILEIRO / OM / SU), local e assinatura do comandante.
2. **Configurações → Feriados:** "Incluir feriados nacionais do ano" e acrescente os locais.
3. **Configurações → Tipos de serviço:** ajuste os serviços e quais postos/graduações concorrem a cada um.
4. **Efetivo → Importar planilha** (ou cadastre um a um). Preencha a **antiguidade** (1 = mais antigo) para o desempate da escala.
5. **Material → Importar planilha** com a sua relação atual. O sistema reconhece colunas como *Patrimônio, Nomenclatura/Descrição, Qtde, Local, Estado* e permite ajustar a associação antes de importar.
6. **Escala → Gerar dias vazios.**

## Arquivo de PDFs (backup dos documentos)

Os PDFs ficam na pasta do sistema no Drive, assim:

```
Arquivos - Sistema 1ª Cia/
└── PDFs/
    ├── Aditamentos/2026/Aditamento 012 - 2026-10-30.pdf
    ├── Escalas/2026/Escala de servico 2026-11.pdf
    ├── Missoes/2026/Ordem de missao - … .pdf
    ├── Cautelas/2026/Termo de cautela - … .pdf
    └── Material/2026/Relacao de material 2026-10-30.pdf
```

Cada PDF gerado também fica registrado na aba `Documentos` (data, tipo, título, quem gerou e link). Gerar de novo o mesmo documento cria uma nova versão e mantém a anterior.

Para ter uma cópia **fora do Google** (num computador ou pendrive da SU), instale o [Google Drive para computador](https://www.google.com/drive/download/) e sincronize a pasta `PDFs`. Assim os arquivos ficam gravados no computador automaticamente.

Quem já tinha o sistema instalado não precisa fazer nada na planilha: a aba `Documentos` e a coluna `pdfUrl` são criadas sozinhas no primeiro uso. Basta colar o código novo e publicar uma nova versão.

## Layout

A interface segue o **Padrão Digital de Governo (gov.br Design System)**:
- cabeçalho branco com a identificação da OM e faixa amarela;
- botão ☰ que abre o menu em duas colunas (módulos e, ao lado, as páginas de cada um);
- trilha de navegação ("você está aqui");
- busca geral ("O que você procura?") em militares, material, missões, aditamentos e PDFs;
- botões arredondados e paleta azul institucional.

O botão **Atalhos** reúne as ações mais usadas (nova missão, novo aditamento, nova cautela, lançar afastamento, gerar e salvar a escala do mês). O sistema acompanha o tema claro ou escuro do aparelho.

## Como os dados ficam na planilha

Cada aba é uma tabela, com a linha 1 de cabeçalho: `Militares`, `Impedimentos`, `TiposServico`, `Escala`, `Feriados`, `Missoes`, `Aditamentos`, `Material`, `Cautelas`, `Usuarios`, `Config`, `Documentos` (PDFs arquivados) e `Log` (registro de quem alterou o quê). Dá para consultar e filtrar direto na planilha, mas **prefira editar pelo sistema** para não quebrar os vínculos (ids). O histórico de versões do Google Planilhas (Arquivo → Histórico de versões) serve como backup; há também "Configurações → Backup" para baixar tudo em JSON.

Anexos (termos de cautela digitalizados, fotos, ordens de missão) e os Google Docs dos aditamentos ficam na pasta **"Arquivos - (nome da planilha)"** do Drive.

## Testar sem instalar

Abra o `Index.html` direto no navegador: ele entra em **modo demonstração**, com dados fictícios guardados só naquele navegador. Serve para conhecer as telas antes de instalar.

## Limites a conhecer

- Feito para o tamanho de uma subunidade (centenas de militares e alguns milhares de lançamentos). Cada abertura carrega todos os dados de uma vez.
- Arquivos anexados: até 25 MB cada.
- Não guarde no sistema informação classificada (sigilosa): a planilha fica em conta Google comum.
