# Tarefas da Seção

Mini-app independente de gerenciamento de tarefas (to-do) para a seção/turma. Não depende do
sistema de notas (`server.ts`) nem compartilha dados com ele — tem seu próprio backend, login e
base de dados (`todo-secao/data/db.json`).

Frontend em React + TypeScript + Tailwind CSS (v4) + [lucide-react](https://lucide.dev/) +
[motion](https://motion.dev/), usando as mesmas ferramentas já presentes no restante do projeto —
mesmo padrão visual (fontes, cores, cards) do sistema de notas.

## Como rodar (desenvolvimento)

```
npm run todo
```

Acesse http://localhost:3001 (porta configurável via `TODO_PORT`). Um único processo serve API
(Express) e frontend (Vite em modo middleware, com hot reload), igual ao `npm run dev` do sistema
de notas.

## Build de produção

```
npm run todo:build
NODE_ENV=production npx tsx todo-secao/server.ts
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

## Estrutura

- `server.ts` — backend Express: API REST, autenticação por cookie de sessão, persistência.
- `src/` — frontend React (App.tsx + components/).
- `data/db.json` — base de dados isolada deste app (usuários e tarefas).

## Observações

- Dados persistidos em `todo-secao/data/db.json` (senhas em texto simples, mesmo padrão de
  simplicidade do restante do projeto — não use senhas sensíveis).
