import { AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { STATUS_LABEL, type Status, type Task, type User } from '../types';
import { INPUT_CLASS } from '../ui';
import TaskItem from './TaskItem';

const COLUMNS: { status: Status; dot: string }[] = [
  { status: 'pendente', dot: 'bg-stone' },
  { status: 'em_andamento', dot: 'bg-info' },
  { status: 'concluida', dot: 'bg-success' },
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
            className={`${INPUT_CLASS} w-auto py-2`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
        {COLUMNS.map(({ status, dot }) => (
          <div key={status} className="bg-soft-cloud p-3">
            <div className="flex items-center gap-2 px-1 py-1 mb-2">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">{STATUS_LABEL[status]}</h3>
              <span className="text-xs font-semibold text-stone ml-auto">{byStatus[status].length}</span>
            </div>

            <div className="space-y-2 min-h-[3rem]">
              <AnimatePresence initial={false}>
                {byStatus[status].map((task) => (
                  <TaskItem key={task.id} task={task} isAdmin={isAdmin} onChanged={onChanged} onEdit={() => onEdit(task)} />
                ))}
              </AnimatePresence>
              {byStatus[status].length === 0 && <p className="text-xs text-stone text-center py-4">Nenhuma tarefa</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
