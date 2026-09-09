# Intendência - ESAO 2026

Sistema privado para lançamento e acompanhamento individual de notas da turma
Intendência - ESAO 2026.

- **Frontend:** React 19 + Vite 6 + Tailwind CSS 4 (`src/`)
- **Backend:** Express (`server.ts`) — API, cálculo de notas e persistência
- **Banco de dados:** arquivo JSON (`data/db.json`), sem servidor externo

O backend serve o frontend no **mesmo endereço e na mesma porta**, então basta um
único comando para subir tudo.

---

## 1. Rodando pela primeira vez

**Pré-requisito:** [Node.js](https://nodejs.org) **20 ou superior**
(confira com `node -v`).

```bash
npm install     # só na primeira vez, ou quando o package.json mudar
npm run dev
```

Depois abra **http://localhost:3000**.

Ao salvar um arquivo em `src/`, a tela recarrega sozinha (HMR ligado).
Para encerrar, pressione `Ctrl+C` no terminal.

### Atalho sem terminal

| Sistema | Arquivo | Como usar |
|---|---|---|
| Windows | `INICIAR.bat` | duplo clique |
| Linux / macOS | `iniciar.sh` | `./iniciar.sh` |

Os dois fazem o mesmo: checam o Node.js, rodam `npm install` se a pasta
`node_modules` não existir e sobem o sistema.

### Trocar a porta

```bash
PORT=8080 npm run dev            # Linux / macOS
$env:PORT=8080; npm run dev      # Windows PowerShell
```

---

## 2. Rodando no VS Code

1. Abra a pasta do projeto (`File → Open Folder`).
2. Aceite as extensões recomendadas quando o VS Code perguntar
   (definidas em `.vscode/extensions.json`).
3. Rode de uma destas formas:
   - **Terminal:** `npm install` e depois `npm run dev`.
   - **Tarefa:** `Ctrl+Shift+B` → *Rodar em desenvolvimento (npm run dev)*.
   - **Depuração:** aba *Run and Debug* (`Ctrl+Shift+D`) →
     *Depurar servidor (dev)* → `F5`. Os breakpoints funcionam no
     `server.ts`, e o navegador abre automaticamente quando o servidor sobe.

O projeto já vem com `.vscode/` configurado (tarefas, depuração, TypeScript do
próprio projeto e exclusões de busca), então não é preciso ajustar nada.

---

## 3. Build de produção

```bash
npm run build     # gera dist/ (frontend) e dist/server.cjs (backend)
npm run start     # sobe o que foi gerado
```

Em produção o Express serve os arquivos estáticos de `dist/` em vez de usar o
Vite. Defina `NODE_ENV=production` no servidor onde for hospedar.

---

## 4. Comandos disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | sobe backend + frontend em modo desenvolvimento |
| `npm run build` | build de produção do frontend e do backend |
| `npm run start` | roda o build de produção |
| `npm run lint` | verifica os tipos com `tsc --noEmit` |
| `npm run clean` | remove os artefatos de build |

---

## 5. Estrutura do projeto

```
├── src/
│   ├── App.tsx        interface (login, painel do aluno, painel administrativo)
│   ├── main.tsx       ponto de entrada do React
│   ├── index.css      estilos e tema (Tailwind)
│   └── types.ts       tipos compartilhados
│   └── components/
│       └── charts.tsx gráficos do painel do aluno e do administrativo (Recharts)
├── public/img/        imagens do sistema (brasão, fundo) — ver LEIA-ME.md lá dentro
├── server.ts          backend Express: API, cálculo de notas, persistência
├── server.py          mesmo backend em Python/Flask (alternativa; ver seção 7)
├── data/db.json       banco de dados (participantes, notas, configurações, histórico)
├── .vscode/           tarefas, depuração e preferências do VS Code
├── INICIAR.bat        atalho de inicialização no Windows
└── iniciar.sh         atalho de inicialização no Linux/macOS
```

---

## 6. Imagens

As imagens do sistema ficam em `public/img/`. Tudo o que está em `public/` é
copiado para a raiz do site, tanto em desenvolvimento quanto no build, então um
arquivo salvo como `public/img/brasao-esao.png` é acessível por
`/img/brasao-esao.png`.

Para trocar, edite a constante `IMAGENS`, no início de `src/App.tsx`:

```ts
const IMAGENS = {
  brasao: "/img/brasao-esao.png",
  fundoPortal: "/img/fundo-portal.jpg"
};
```

Os valores que vêm por padrão são endereços temporários herdados do Google AI
Studio: podem sair do ar sem aviso e não carregam sem internet. Ver
`public/img/LEIA-ME.md` para formatos e tamanhos recomendados.

---

## 7. Gráficos e painéis

O sistema usa [Recharts](https://recharts.org). Os componentes ficam em
`src/components/charts.tsx`, todos com a mesma linguagem visual do restante do
app e cientes do tema claro/escuro (o modo escuro do projeto é feito por CSS
sobre as classes do Tailwind, que não alcança SVG — por isso cada gráfico recebe
o tema por prop).

**Painel do aluno**

- *Perfil por módulo* (radar): a nota do participante em cada módulo contra a
  média da turma.
- *Você x turma, por módulo* (barras): onde ele está acima e abaixo da média.
- *Como sua nota final se forma*: quanto cada bloco (módulos 80%, lateral 10%,
  vertical 10%) contribuiu para a nota final. Blocos sem lançamento ficam fora e
  os pesos são redistribuídos, igual ao cálculo do backend.
- *Distribuição da turma* (aba Ranking): histograma das notas finais com a faixa
  do próprio participante destacada e as marcas de média e mediana.

**Painel administrativo** (aba Desempenho Anônimo)

- *Progresso dos lançamentos* (rosca): situação da ficha dos participantes ativos.
- *Média da turma por módulo*: para achar o módulo em que a turma foi pior.
- *Distribuição da turma*: histograma com média e mediana marcadas.
- *Participantes por quartil*.
- *Mapa de calor participante × módulo*: uma linha por participante, uma coluna
  por módulo.

Os gráficos do painel do aluno usam apenas agregados da turma (médias por
módulo, calculadas em `computeModuleAverages`, no backend) e a lista anônima de
`/api/anon-rankings`. Nenhuma nota nominal de terceiro é enviada ao portal do
aluno. Na aba de desempenho anônimo do administrador, o mapa de calor identifica
as linhas pelo nome sigiloso; quem ainda não criou um aparece mascarado.

---

## 8. Login de teste

- **Administrador:** `Cap Daniel` — senha `DOMPSA675`
- **Aluno:** nome de guerra em MAIÚSCULO e sem acento — senha inicial = número
  da matrícula

> A senha do administrador fica em `data/db.json`
> (`settings.adminPassword`). Troque-a antes de usar o sistema com a turma.

---

## 9. Backend alternativo em Python (opcional)

`server.py` é a mesma API reescrita em Flask. **Não é usado pelos scripts do
`package.json`** — serve apenas como alternativa. Ele lê e escreve o mesmo
`data/db.json` e espera encontrar o frontend já compilado em `dist/`:

```bash
pip install -r requirements.txt
npm run build
python3 server.py          # também aceita a variável PORT
```

> Atenção: o Node e o Python **não devem rodar ao mesmo tempo**, porque os dois
> escrevem no mesmo `data/db.json`.

---

## 10. Backup dos dados

Todos os dados vivem em `data/db.json`. O backend mantém cópias automáticas
(`data/db.json.bak` e uma cópia em pasta temporária) e o painel administrativo
tem exportação e restauração de backup completo em JSON.

Faça uma cópia de `data/db.json` antes de qualquer atualização importante.

### Persistência remota (opcional)

Em hospedagens cujo disco não sobrevive a reinícios, defina estas variáveis para
espelhar o banco num Redis (Upstash) via REST:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Sem essas variáveis o sistema funciona normalmente, usando apenas o arquivo
local.
