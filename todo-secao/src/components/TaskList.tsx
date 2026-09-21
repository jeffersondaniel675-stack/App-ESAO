import { ListChecks } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { STATUS_LABEL, type Task, type User } from '../types';
import TaskItem from './TaskItem';

export default function TaskList({
  tasks,
  members,
  isAdmin,
  onChanged,
  onEdit,
}: {
  tasks: Task[];
  members: User[];
  isAdmin: boolean;
  onChanged: () => void;
  onEdit: (task: Task) => void;
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [responsavelFilter, setResponsavelFilter] = useState('');

  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter) list = list.filter((t) => t.status === statusFilter);
    if (responsavelFilter) list = list.filter((t) => t.responsavel === responsavelFilter);
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'concluida' ? 1 : -1;
      return (a.prazo || '9999-99-99') < (b.prazo || '9999-99-99') ? -1 : 1;
    });
  }, [tasks, statusFilter, responsavelFilter]);

  return (
    <div className="space-y-3">
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={responsavelFilter}
            onChange={(e) => setResponsavelFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Todos os membros</option>
            {members.map((m) => (
              <option key={m.id} value={m.nomeGuerra}>
                {m.nomeGuerra}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ListChecks size={32} className="mx-auto mb-2 opacity-60" />
          <p className="text-sm">Nenhuma tarefa por aqui.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isAdmin={isAdmin}
                onChanged={onChanged}
                onEdit={() => onEdit(task)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
