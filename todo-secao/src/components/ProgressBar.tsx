import type { Task } from '../types';

export default function ProgressBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === 'concluida').length;
  const andamento = tasks.filter((t) => t.status === 'em_andamento').length;
  const pendentes = total - concluidas - andamento;

  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-headline font-bold text-sm text-slate-900">Progresso</h2>
        <span className="text-xs font-semibold text-slate-500">
          {concluidas} de {total} concluída{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct(concluidas)}%` }} />
        <div className="h-full bg-sky-400 transition-all" style={{ width: `${pct(andamento)}%` }} />
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300" /> {pendentes} pendente{pendentes === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-400" /> {andamento} em andamento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> {concluidas} concluída{concluidas === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
}
