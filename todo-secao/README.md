# Tarefas da Seção

Mini-app independente de gerenciamento de tarefas (to-do) para a seção/turma. Não depende do
sistema de notas (`server.ts`) nem compartilha dados com ele — tem seu próprio backend, login e
base de dados (`todo-secao/data/db.json`).

## Como rodar

```
node todo-secao/server.js
```

Acesse http://localhost:3001 (porta configurável via `TODO_PORT`).

Ou, a partir da raiz do projeto:

```
npm run todo
```

## Login de teste

- **Administrador:** `Administrador` / senha `admin123`
- **Membros de exemplo:** `Silva` / `123456`, `Santos` / `123456`

## Funcionalidades

- **Membro:** cria, edita e acompanha suas próprias tarefas (título, descrição, prioridade,
  prazo, status: pendente / em andamento / concluída).
- **Administrador:** vê e filtra as tarefas de toda a seção (por status e por responsável), cria
  e atribui tarefas para qualquer membro, e gerencia a lista de membros (adicionar, redefinir
  senha, promover a admin, remover).

## Observações

- Dados persistidos em `todo-secao/data/db.json` (senhas em texto simples, mesmo padrão de
  simplicidade do restante do projeto — não use senhas sensíveis).
- Sem etapa de build: frontend é HTML/CSS/JS puro servido estaticamente pelo próprio Express.
