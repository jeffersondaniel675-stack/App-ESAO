const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
};

const STATUS_LABEL = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída' };
const PRIO_LABEL = { baixa: 'Baixa', media: 'Média', alta: 'Alta' };

const state = {
  user: null,
  tasks: [],
  users: [],
  tab: 'tarefas',
  filterStatus: '',
  filterResponsavel: '',
  editingId: null,
};

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

async function boot() {
  try {
    const { user } = await api('/me');
    state.user = user;
    await loadAll();
  } catch {
    state.user = null;
  }
  render();
}

async function loadAll() {
  const { tasks } = await api('/tasks');
  state.tasks = tasks;
  if (state.user.tipoAcesso === 'admin') {
    const { users } = await api('/users');
    state.users = users;
  }
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  root.append(state.user ? renderMain() : renderLogin());
}

// ---------- Login ----------

function renderLogin() {
  let errorMsg = '';
  const errorNode = el('div', { class: 'error-msg' });

  const nomeInput = el('input', { type: 'text', placeholder: 'ex: Silva', autocomplete: 'username' });
  const senhaInput = el('input', { type: 'password', placeholder: '••••••', autocomplete: 'current-password' });

  const submit = async (e) => {
    e.preventDefault();
    errorNode.textContent = '';
    try {
      const { user } = await api('/login', {
        method: 'POST',
        body: { nomeGuerra: nomeInput.value.trim(), senha: senhaInput.value },
      });
      state.user = user;
      await loadAll();
      render();
    } catch (err) {
      errorNode.textContent = err.message;
    }
  };

  const form = el('form', { class: 'login-screen', onsubmit: submit }, [
    el('h1', {}, 'Tarefas da Seção'),
    el('p', { class: 'subtitle' }, 'Entre com seu nome de guerra e senha.'),
    el('label', {}, 'Nome de guerra'),
    nomeInput,
    el('label', {}, 'Senha'),
    senhaInput,
    errorNode,
    el('div', { style: 'margin-top:16px; display:flex;' }, [
      el('button', { type: 'submit', class: 'btn-primary', style: 'width:100%;' }, 'Entrar'),
    ]),
  ]);
  return form;
}

// ---------- Main ----------

function renderMain() {
  const container = el('div');
  const isAdmin = state.user.tipoAcesso === 'admin';

  const logout = async () => {
    await api('/logout', { method: 'POST' }).catch(() => {});
    state.user = null;
    state.tasks = [];
    state.users = [];
    render();
  };

  container.append(
    el('div', { class: 'topbar' }, [
      el('div', {}, [
        el('h1', {}, 'Tarefas da Seção'),
        el('div', { class: 'who' }, [
          'Logado como ',
          el('b', {}, state.user.nomeGuerra),
          isAdmin ? ' · Administrador' : ' · Membro',
        ]),
      ]),
      el('button', { class: 'btn-secondary', onclick: logout }, 'Sair'),
    ])
  );

  if (isAdmin) {
    const tabs = el('div', { class: 'tabs' }, [
      el('button', {
        class: state.tab === 'tarefas' ? 'active' : '',
        onclick: () => { state.tab = 'tarefas'; render(); },
      }, 'Tarefas da seção'),
      el('button', {
        class: state.tab === 'membros' ? 'active' : '',
        onclick: () => { state.tab = 'membros'; render(); },
      }, 'Membros'),
    ]);
    container.append(tabs);
  }

  if (!isAdmin || state.tab === 'tarefas') {
    container.append(renderTaskForm());
    container.append(renderTaskList());
  } else {
    container.append(renderMembers());
  }

  return container;
}

// ---------- Task form ----------

function renderTaskForm() {
  const isAdmin = state.user.tipoAcesso === 'admin';
  const editing = state.editingId ? state.tasks.find((t) => t.id === state.editingId) : null;

  const tituloInput = el('input', { type: 'text', placeholder: 'Ex: Entregar relatório', required: 'true' });
  const descInput = el('textarea', { placeholder: 'Detalhes (opcional)' });
  const prioSelect = el('select', {}, [
    el('option', { value: 'baixa' }, 'Baixa'),
    el('option', { value: 'media', selected: 'true' }, 'Média'),
    el('option', { value: 'alta' }, 'Alta'),
  ]);
  const prazoInput = el('input', { type: 'date' });
  let responsavelSelect = null;

  if (editing) {
    tituloInput.value = editing.titulo;
    descInput.value = editing.descricao || '';
    prioSelect.value = editing.prioridade;
    prazoInput.value = editing.prazo || '';
  }

  if (isAdmin) {
    responsavelSelect = el(
      'select',
      {},
      state.users.map((u) =>
        el('option', { value: u.nomeGuerra, selected: (editing?.responsavel || state.user.nomeGuerra) === u.nomeGuerra ? 'true' : undefined }, u.nomeGuerra)
      )
    );
  }

  const errorNode = el('div', { class: 'error-msg' });

  const cancelEdit = () => { state.editingId = null; render(); };

  const submit = async (e) => {
    e.preventDefault();
    errorNode.textContent = '';
    const payload = {
      titulo: tituloInput.value.trim(),
      descricao: descInput.value.trim(),
      prioridade: prioSelect.value,
      prazo: prazoInput.value || null,
    };
    if (isAdmin && responsavelSelect) payload.responsavel = responsavelSelect.value;

    try {
      if (editing) {
        await api(`/tasks/${editing.id}`, { method: 'PATCH', body: payload });
        state.editingId = null;
      } else {
        await api('/tasks', { method: 'POST', body: payload });
      }
      await loadAll();
      render();
    } catch (err) {
      errorNode.textContent = err.message;
    }
  };

  const fields = [
    el('label', { class: 'span-2' }, 'Título'),
    (() => { const w = el('div', { class: 'span-2' }); w.append(tituloInput); return w; })(),
    el('label', { class: 'span-2' }, 'Descrição'),
    (() => { const w = el('div', { class: 'span-2' }); w.append(descInput); return w; })(),
    el('label', {}, 'Prioridade'),
    isAdmin ? el('label', {}, 'Responsável') : null,
    prioSelect,
    isAdmin ? responsavelSelect : null,
    el('label', {}, 'Prazo (opcional)'),
    null,
    prazoInput,
    null,
  ].filter((x) => x !== null);

  const form = el('form', { class: 'task-form', onsubmit: submit }, fields);
  form.append(el('div', { class: 'span-2' }, errorNode));
  const actions = el('div', { class: 'actions' });
  if (editing) actions.append(el('button', { type: 'button', class: 'btn-ghost', onclick: cancelEdit }, 'Cancelar'));
  actions.append(el('button', { type: 'submit', class: 'btn-primary' }, editing ? 'Salvar alterações' : 'Adicionar tarefa'));
  form.append(actions);

  return el('div', { class: 'card' }, [
    el('h3', {}, editing ? 'Editar tarefa' : 'Nova tarefa'),
    form,
  ]);
}

// ---------- Task list ----------

function renderTaskList() {
  const isAdmin = state.user.tipoAcesso === 'admin';
  let tasks = [...state.tasks];

  const wrapper = el('div');

  if (isAdmin) {
    const statusFilter = el(
      'select',
      { onchange: (e) => { state.filterStatus = e.target.value; render(); } },
      [
        el('option', { value: '' }, 'Todos os status'),
        ...Object.entries(STATUS_LABEL).map(([v, l]) => el('option', { value: v, selected: state.filterStatus === v ? 'true' : undefined }, l)),
      ]
    );
    const respFilter = el(
      'select',
      { onchange: (e) => { state.filterResponsavel = e.target.value; render(); } },
      [
        el('option', { value: '' }, 'Todos os membros'),
        ...state.users.map((u) => el('option', { value: u.nomeGuerra, selected: state.filterResponsavel === u.nomeGuerra ? 'true' : undefined }, u.nomeGuerra)),
      ]
    );
    wrapper.append(el('div', { class: 'filters' }, [statusFilter, respFilter]));

    if (state.filterStatus) tasks = tasks.filter((t) => t.status === state.filterStatus);
    if (state.filterResponsavel) tasks = tasks.filter((t) => t.responsavel === state.filterResponsavel);
  }

  tasks.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'concluida' ? 1 : -1;
    return (a.prazo || '9999') < (b.prazo || '9999') ? -1 : 1;
  });

  if (tasks.length === 0) {
    wrapper.append(el('div', { class: 'empty-state' }, 'Nenhuma tarefa por aqui.'));
    return wrapper;
  }

  const list = el('div', { class: 'task-list' });
  tasks.forEach((t) => list.append(renderTaskItem(t, isAdmin)));
  wrapper.append(list);
  return wrapper;
}

function renderTaskItem(task, isAdmin) {
  const setStatus = async (status) => {
    await api(`/tasks/${task.id}`, { method: 'PATCH', body: { status } });
    await loadAll();
    render();
  };
  const remove = async () => {
    if (!confirm(`Excluir a tarefa "${task.titulo}"?`)) return;
    await api(`/tasks/${task.id}`, { method: 'DELETE' });
    await loadAll();
    render();
  };
  const edit = () => { state.editingId = task.id; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const statusSelect = el(
    'select',
    { onchange: (e) => setStatus(e.target.value) },
    Object.entries(STATUS_LABEL).map(([v, l]) => el('option', { value: v, selected: task.status === v ? 'true' : undefined }, l))
  );

  const meta = [
    el('span', { class: `badge prio-${task.prioridade}` }, PRIO_LABEL[task.prioridade]),
    el('span', { class: `badge status-${task.status}` }, STATUS_LABEL[task.status]),
    task.prazo ? el('span', { class: 'badge' }, `Prazo: ${task.prazo}`) : null,
    isAdmin ? el('span', { class: 'badge' }, `Resp: ${task.responsavel}`) : null,
  ].filter(Boolean);

  return el('div', { class: `task-item ${task.status}` }, [
    el('div', { class: 'task-main' }, [
      el('div', { class: 'task-title' }, task.titulo),
      task.descricao ? el('div', { class: 'task-desc' }, task.descricao) : null,
      el('div', { class: 'task-meta' }, meta),
    ]),
    el('div', { class: 'task-actions' }, [
      statusSelect,
      el('div', { class: 'row' }, [
        el('button', { class: 'icon-btn', onclick: edit }, 'Editar'),
        el('button', { class: 'icon-btn', onclick: remove }, 'Excluir'),
      ]),
    ]),
  ].filter(Boolean));
}

// ---------- Members (admin) ----------

function renderMembers() {
  const container = el('div');

  const nomeInput = el('input', { type: 'text', placeholder: 'Nome de guerra' });
  const senhaInput = el('input', { type: 'text', placeholder: 'Senha inicial' });
  const tipoSelect = el('select', {}, [
    el('option', { value: 'membro' }, 'Membro'),
    el('option', { value: 'admin' }, 'Administrador'),
  ]);
  const errorNode = el('div', { class: 'error-msg' });

  const addMember = async (e) => {
    e.preventDefault();
    errorNode.textContent = '';
    try {
      await api('/users', {
        method: 'POST',
        body: { nomeGuerra: nomeInput.value.trim(), senha: senhaInput.value, tipoAcesso: tipoSelect.value },
      });
      nomeInput.value = '';
      senhaInput.value = '';
      await loadAll();
      render();
    } catch (err) {
      errorNode.textContent = err.message;
    }
  };

  const form = el('form', { class: 'task-form', onsubmit: addMember }, [
    el('label', {}, 'Nome de guerra'),
    el('label', {}, 'Senha inicial'),
    nomeInput,
    senhaInput,
    el('label', {}, 'Tipo de acesso'),
    null,
    tipoSelect,
    null,
    (() => { const w = el('div', { class: 'span-2' }); w.append(errorNode); return w; })(),
    el('div', { class: 'actions' }, [el('button', { type: 'submit', class: 'btn-primary' }, 'Adicionar membro')]),
  ].filter((x) => x !== null));

  container.append(el('div', { class: 'card' }, [el('h3', {}, 'Adicionar membro à seção'), form]));

  const rows = state.users.map((u) => {
    const resetSenha = async () => {
      const nova = prompt(`Nova senha para ${u.nomeGuerra}:`);
      if (!nova) return;
      await api(`/users/${u.id}`, { method: 'PATCH', body: { senha: nova } });
      alert('Senha atualizada.');
    };
    const toggleAdmin = async () => {
      const novoTipo = u.tipoAcesso === 'admin' ? 'membro' : 'admin';
      await api(`/users/${u.id}`, { method: 'PATCH', body: { tipoAcesso: novoTipo } });
      await loadAll();
      render();
    };
    const remove = async () => {
      if (!confirm(`Remover ${u.nomeGuerra} da seção? As tarefas dele(a) continuarão registradas.`)) return;
      try {
        await api(`/users/${u.id}`, { method: 'DELETE' });
        await loadAll();
        render();
      } catch (err) {
        alert(err.message);
      }
    };
    return el('tr', {}, [
      el('td', {}, u.nomeGuerra),
      el('td', {}, u.tipoAcesso === 'admin' ? 'Administrador' : 'Membro'),
      el('td', {}, [
        el('button', { class: 'icon-btn', onclick: resetSenha }, 'Redefinir senha'),
        ' ',
        el('button', { class: 'icon-btn', onclick: toggleAdmin }, u.tipoAcesso === 'admin' ? 'Tornar membro' : 'Tornar admin'),
        ' ',
        u.id !== state.user.id ? el('button', { class: 'icon-btn', onclick: remove }, 'Remover') : null,
      ].filter(Boolean)),
    ]);
  });

  const table = el('table', { class: 'users-table' }, [
    el('thead', {}, el('tr', {}, [el('th', {}, 'Nome de guerra'), el('th', {}, 'Tipo'), el('th', {}, 'Ações')])),
    el('tbody', {}, rows),
  ]);

  container.append(el('div', { class: 'card' }, [el('h3', {}, `Membros da seção (${state.users.length})`), table]));

  return container;
}

boot();
