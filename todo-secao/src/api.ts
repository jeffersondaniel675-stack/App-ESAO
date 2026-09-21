import type { Prioridade, Status, Task, User } from './types';

class ApiError extends Error {}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Erro inesperado.');
  return data as T;
}

export const api = {
  login: (nomeGuerra: string, senha: string) =>
    request<{ user: User }>('/login', { method: 'POST', body: { nomeGuerra, senha } }),
  logout: () => request<{ ok: true }>('/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/me'),

  listTasks: () => request<{ tasks: Task[] }>('/tasks'),
  createTask: (input: { titulo: string; descricao?: string; prioridade?: Prioridade; prazo?: string | null; responsavel?: string }) =>
    request<{ task: Task }>('/tasks', { method: 'POST', body: input }),
  updateTask: (id: string, input: Partial<{ titulo: string; descricao: string; status: Status; prioridade: Prioridade; prazo: string | null; responsavel: string }>) =>
    request<{ task: Task }>(`/tasks/${id}`, { method: 'PATCH', body: input }),
  deleteTask: (id: string) => request<{ ok: true }>(`/tasks/${id}`, { method: 'DELETE' }),

  listUsers: () => request<{ users: User[] }>('/users'),
  createUser: (input: { nomeGuerra: string; senha: string; tipoAcesso: 'admin' | 'membro' }) =>
    request<{ user: User }>('/users', { method: 'POST', body: input }),
  updateUser: (id: string, input: Partial<{ senha: string; tipoAcesso: 'admin' | 'membro' }>) =>
    request<{ user: User }>(`/users/${id}`, { method: 'PATCH', body: input }),
  deleteUser: (id: string) => request<{ ok: true }>(`/users/${id}`, { method: 'DELETE' }),
};

export { ApiError };
