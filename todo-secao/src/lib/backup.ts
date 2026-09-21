import type { Task, User } from '../types';
import { downloadFile } from './calendar';

export function exportBackup(tasks: Task[], users: User[]) {
  const payload = {
    exportadoEm: new Date().toISOString(),
    tarefas: tasks,
    membros: users,
  };
  const filename = `tarefas-secao-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(filename, JSON.stringify(payload, null, 2), 'application/json');
}
