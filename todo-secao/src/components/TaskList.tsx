import { AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { STATUS_LABEL, type Status, type Task, type User } from '../types';
import TaskItem from './TaskItem';

const COLUMNS: { status: Status; dot: string; accent: string }[] = [
  { status: 'pendente', dot: 'bg-slate-400', accent: 'bg-slate-50/60 border-slate-200/70' },
  { status: 'em_andamento', dot: 'bg-sky-400', accent: 'bg-sky-50/50 border-sky-100' },
  { status: 'concluida', dot: 'bg-emerald-500', accent: 'bg-emerald-50/50 border-emerald-100' },
];

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
  const [responsavelFilter, setResponsavelFilter] = useState('');

  const filtered = useMemo(
    () => (responsavelFilter ? tasks.filter((t) => t.responsavel === responsavelFilter) : tasks),
    [tasks, responsavelFilter]
  );

  const byStatus = useMemo(() => {
    const grouped: Record<Status, Task[]> = { pendente: [], em_andamento: [], concluida: [] };
    for (const task of filtered) grouped[task.status].push(task);
    for (const status of Object.keys(grouped) as Status[]) {
      grouped[status].sort((a, b) => (a.prazo || '9999-99-99') < (b.prazo || '9999-99-99') ? -1 : 1);
    }
    return grouped;
  }, [filtered]);

  return (
    <div className="space-y-3">
      {isAdmin && members.length > 0 && (
        <div className="flex justify-end">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLUMNS.map(({ status, dot, accent }) => (
          <div key={status} className={`rounded-2xl border p-3 ${accent}`}>
            <div className="flex items-center gap-2 px-1.5 py-1 mb-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <h3 className="font-headline font-bold text-xs uppercase tracking-wide text-slate-600">
                {STATUS_LABEL[status]}
              </h3>
              <span className="text-xs font-semibold text-slate-400 ml-auto">{byStatus[status].length}</span>
            </div>

            <div className="space-y-2 min-h-[3rem]">
              <AnimatePresence initial={false}>
                {byStatus[status].map((task) => (
                  <TaskItem key={task.id} task={task} isAdmin={isAdmin} onChanged={onChanged} onEdit={() => onEdit(task)} />
                ))}
              </AnimatePresence>
              {byStatus[status].length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Nenhuma tarefa</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
