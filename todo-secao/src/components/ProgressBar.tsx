import type { Task } from '../types';

export default function ProgressBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === 'concluida').length;
  const andamento = tasks.filter((t) => t.status === 'em_andamento').length;
  const pendentes = total - concluidas - andamento;

  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="bg-canvas border border-hairline p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Progresso</h2>
        <span className="text-xs font-semibold text-mute">
          {concluidas} de {total} concluída{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="h-1.5 w-full bg-soft-cloud overflow-hidden flex">
        <div className="h-full bg-success transition-all" style={{ width: `${pct(concluidas)}%` }} />
        <div className="h-full bg-info transition-all" style={{ width: `${pct(andamento)}%` }} />
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-mute">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-stone" /> {pendentes} pendente{pendentes === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-info" /> {andamento} em andamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" /> {concluidas} concluída{concluidas === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}
