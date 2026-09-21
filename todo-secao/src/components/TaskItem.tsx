import { AlertTriangle, Calendar, CheckCircle2, Circle, Pencil, Trash2, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { api, ApiError } from '../api';
import { PRIORIDADE_LABEL, STATUS_LABEL, type Prioridade, type Status, type Task } from '../types';
import Badge from './Badge';

const PRIO_TONE: Record<Prioridade, 'red' | 'amber' | 'emerald'> = {
  alta: 'red',
  media: 'amber',
  baixa: 'emerald',
};

const STATUS_TONE: Record<Status, 'slate' | 'sky' | 'emerald'> = {
  pendente: 'slate',
  em_andamento: 'sky',
  concluida: 'emerald',
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className={`bg-white border rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 transition ${
        isDone ? 'border-slate-100 opacity-70' : 'border-slate-200/80 shadow-sm'
      }`}
    >
      <button
        onClick={toggleDone}
        className={`mt-0.5 shrink-0 transition ${isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-500'}`}
        aria-label={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
      >
        {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
          {task.titulo}
        </p>
        {task.descricao && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{task.descricao}</p>}

        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <Badge tone={PRIO_TONE[task.prioridade]}>{PRIORIDADE_LABEL[task.prioridade]}</Badge>
          <Badge tone={STATUS_TONE[task.status]}>{STATUS_LABEL[task.status]}</Badge>
          {task.prazo && (
            <Badge tone={overdue ? 'red' : 'slate'} icon={overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}>
              {new Date(task.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
            </Badge>
          )}
          {isAdmin && (
            <Badge tone="indigo" icon={<UserRound size={11} />}>
              {task.responsavel}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <select
          value={task.status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Editar tarefa"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={remove}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            aria-label="Excluir tarefa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
