import express from 'express';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PORT = process.env.TODO_PORT || 3001;

const STATUSES = ['pendente', 'em_andamento', 'concluida'];
const PRIORIDADES = ['baixa', 'media', 'alta'];

async function readDb() {
  const raw = await readFile(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// token -> userId
const sessions = new Map();

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function auth(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies.todo_token;
  const userId = token && sessions.get(token);
  if (!userId) return res.status(401).json({ error: 'Não autenticado.' });
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Sessão inválida.' });
  req.user = user;
  req.db = db;
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.tipoAcesso !== 'admin') {
    return res.status(403).json({ error: 'Apenas o administrador pode fazer isso.' });
  }
  next();
}

function publicUser(u) {
  return { id: u.id, nomeGuerra: u.nomeGuerra, tipoAcesso: u.tipoAcesso };
}

// ---- Auth ----

app.post('/api/login', async (req, res) => {
  const { nomeGuerra, senha } = req.body || {};
  if (!nomeGuerra || !senha) {
    return res.status(400).json({ error: 'Informe nome de guerra e senha.' });
  }
  const db = await readDb();
  const user = db.users.find(
    (u) => u.nomeGuerra.toLowerCase() === String(nomeGuerra).toLowerCase() && u.senha === senha
  );
  if (!user) return res.status(401).json({ error: 'Nome de guerra ou senha inválidos.' });

  const token = randomUUID();
  sessions.set(token, user.id);
  res.setHeader(
    'Set-Cookie',
    `todo_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
  );
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', auth, async (req, res) => {
  sessions.delete(req.token);
  res.setHeader('Set-Cookie', 'todo_token=; HttpOnly; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// ---- Users (seção) ----

app.get('/api/users', auth, requireAdmin, (req, res) => {
  res.json({ users: req.db.users.map(publicUser) });
});

app.post('/api/users', auth, requireAdmin, async (req, res) => {
  const { nomeGuerra, senha, tipoAcesso } = req.body || {};
  if (!nomeGuerra || !senha) {
    return res.status(400).json({ error: 'Informe nome de guerra e senha.' });
  }
  const db = req.db;
  if (db.users.some((u) => u.nomeGuerra.toLowerCase() === String(nomeGuerra).toLowerCase())) {
    return res.status(409).json({ error: 'Já existe um membro com esse nome de guerra.' });
  }
  const user = {
    id: randomUUID(),
    nomeGuerra: String(nomeGuerra).trim(),
    senha: String(senha),
    tipoAcesso: tipoAcesso === 'admin' ? 'admin' : 'membro',
  };
  db.users.push(user);
  await writeDb(db);
  res.status(201).json({ user: publicUser(user) });
});

app.patch('/api/users/:id', auth, requireAdmin, async (req, res) => {
  const db = req.db;
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Membro não encontrado.' });
  const { senha, tipoAcesso } = req.body || {};
  if (senha) user.senha = String(senha);
  if (tipoAcesso === 'admin' || tipoAcesso === 'membro') user.tipoAcesso = tipoAcesso;
  await writeDb(db);
  res.json({ user: publicUser(user) });
});

app.delete('/api/users/:id', auth, requireAdmin, async (req, res) => {
  const db = req.db;
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Você não pode remover seu próprio usuário.' });
  }
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== req.params.id);
  if (db.users.length === before) return res.status(404).json({ error: 'Membro não encontrado.' });
  await writeDb(db);
  res.json({ ok: true });
});

// ---- Tasks ----

app.get('/api/tasks', auth, (req, res) => {
  const db = req.db;
  const tasks =
    req.user.tipoAcesso === 'admin'
      ? db.tasks
      : db.tasks.filter((t) => t.responsavel === req.user.nomeGuerra);
  res.json({ tasks });
});

app.post('/api/tasks', auth, async (req, res) => {
  const db = req.db;
  const { titulo, descricao, responsavel, prioridade, prazo } = req.body || {};
  if (!titulo || !String(titulo).trim()) {
    return res.status(400).json({ error: 'Informe um título para a tarefa.' });
  }

  let responsavelFinal = req.user.nomeGuerra;
  if (req.user.tipoAcesso === 'admin' && responsavel) {
    const alvo = db.users.find((u) => u.nomeGuerra === responsavel);
    if (!alvo) return res.status(400).json({ error: 'Responsável não encontrado na seção.' });
    responsavelFinal = alvo.nomeGuerra;
  }

  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    titulo: String(titulo).trim(),
    descricao: descricao ? String(descricao).trim() : '',
    responsavel: responsavelFinal,
    criadoPor: req.user.nomeGuerra,
    prioridade: PRIORIDADES.includes(prioridade) ? prioridade : 'media',
    status: 'pendente',
    prazo: prazo || null,
    criadoEm: now,
    atualizadoEm: now,
  };
  db.tasks.push(task);
  await writeDb(db);
  res.status(201).json({ task });
});

app.patch('/api/tasks/:id', auth, async (req, res) => {
  const db = req.db;
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });

  const isOwner = task.responsavel === req.user.nomeGuerra;
  if (req.user.tipoAcesso !== 'admin' && !isOwner) {
    return res.status(403).json({ error: 'Você só pode editar suas próprias tarefas.' });
  }

  const { titulo, descricao, status, prioridade, prazo, responsavel } = req.body || {};
  if (titulo !== undefined) task.titulo = String(titulo).trim();
  if (descricao !== undefined) task.descricao = String(descricao).trim();
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
    task.status = status;
  }
  if (prioridade !== undefined) {
    if (!PRIORIDADES.includes(prioridade)) return res.status(400).json({ error: 'Prioridade inválida.' });
    task.prioridade = prioridade;
  }
  if (prazo !== undefined) task.prazo = prazo || null;
  if (responsavel !== undefined && req.user.tipoAcesso === 'admin') {
    const alvo = db.users.find((u) => u.nomeGuerra === responsavel);
    if (!alvo) return res.status(400).json({ error: 'Responsável não encontrado na seção.' });
    task.responsavel = alvo.nomeGuerra;
  }
  task.atualizadoEm = new Date().toISOString();
  await writeDb(db);
  res.json({ task });
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  const db = req.db;
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada.' });
  const isOwner = task.responsavel === req.user.nomeGuerra;
  if (req.user.tipoAcesso !== 'admin' && !isOwner) {
    return res.status(403).json({ error: 'Você só pode excluir suas próprias tarefas.' });
  }
  db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
  await writeDb(db);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Tarefas da Seção rodando em http://localhost:${PORT}`);
});
