import { AlertTriangle, Calendar, Check, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { api, ApiError } from '../api';
import { PRIORIDADE_LABEL, type Prioridade, type Status, type Task } from '../types';
import Avatar from './Avatar';

const PRIO_DOT: Record<Prioridade, string> = {
  alta: 'bg-sale',
  media: 'bg-stone',
  baixa: 'bg-hairline',
};

export default function TaskItem({
  task,
  isAdmin,
  onChanged,
  onEdit,
}: {
  task: Task;
  isAdmin: boolean;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const isDone = task.status === 'concluida';

  async function setStatus(status: Status) {
    await api.updateTask(task.id, { status });
    onChanged();
  }

  async function toggleDone() {
    await setStatus(isDone ? 'pendente' : 'concluida');
  }

  async function remove() {
    if (!confirm(`Excluir a tarefa "${task.titulo}"?`)) return;
    try {
      await api.deleteTask(task.id);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Não foi possível excluir.');
    }
  }

  const overdue = !isDone && task.prazo && new Date(task.prazo) < new Date(new Date().toDateString());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="group bg-canvas border border-hairline p-3.5 hover:border-ink transition"
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={toggleDone}
          className={`mt-0.5 shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition ${
            isDone ? 'bg-success border-success text-on-ink' : 'border-hairline hover:border-ink'
          }`}
          aria-label={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
        >
          {isDone && <Check size={12} strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold text-ink leading-snug ${isDone ? 'line-through text-stone' : ''}`}>
            {task.titulo}
          </p>
          {task.descricao && <p className="text-xs text-mute mt-0.5 line-clamp-2 leading-snug">{task.descricao}</p>}
        </div>

        <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
          <button
            onClick={onEdit}
            className="p-1 text-stone hover:text-ink hover:bg-soft-cloud rounded-full transition"
            aria-label="Editar tarefa"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={remove}
            className="p-1 text-stone hover:text-sale hover:bg-soft-cloud rounded-full transition"
            aria-label="Excluir tarefa"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5 pl-[26px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-[11px] font-medium text-mute shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${PRIO_DOT[task.prioridade]}`} />
            {PRIORIDADE_LABEL[task.prioridade]}
          </span>
          {task.prazo && (
            <span
              className={`flex items-center gap-1 text-[11px] font-medium shrink-0 ${overdue ? 'text-sale' : 'text-mute'}`}
            >
              {overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
              {new Date(task.prazo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && <Avatar name={task.responsavel} size="sm" />}
          <select
            value={task.status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="text-[11px] font-medium border-0 bg-transparent text-stone hover:text-ink focus:outline-none cursor-pointer"
            aria-label="Mover tarefa"
          >
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}
