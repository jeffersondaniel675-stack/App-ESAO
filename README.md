# Intendência - ESAO 2026

Sistema privado para lançamento e acompanhamento individual de notas da turma Intendência - ESAO 2026.

## Rodando localmente

**Pré-requisito:** Node.js 20 ou superior.

1. Instale as dependências:
   ```
   npm install
   ```
2. Rode o sistema (frontend + backend juntos, em desenvolvimento):
   ```
   npm run dev
   ```
3. Acesse http://localhost:3000

No Windows, quem preferir não usar o terminal pode usar o `INICIAR.bat` incluído no pacote de distribuição, que faz os mesmos passos com duplo clique.

## Build de produção

```
npm run build
npm run start
```

## Estrutura

- `src/App.tsx` — interface (login, painel do aluno, painel administrativo).
- `server.ts` — backend (Express): API, cálculo de notas, persistência.
- `server.py` — implementação alternativa do mesmo backend em Python/Flask (não é usada pelos scripts do `package.json`).
- `data/db.json` — base de dados do sistema (participantes, notas, configurações, histórico).

## Login de teste

- **Administrador:** `Cap Daniel` / senha `DOMPSA675`
- **Aluno:** nome de guerra em maiúsculo / senha inicial = matrícula

## Sistema da Companhia

A pasta [`app-companhia/`](app-companhia/) contém um sistema separado, para a subunidade (escala de serviço, missões, aditamentos e controle de material) usando Google Planilhas como base de dados. Veja o [passo a passo de instalação](app-companhia/README.md).
