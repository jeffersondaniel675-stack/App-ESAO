import { AlertTriangle, CalendarClock, Download, Printer, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildIcsCalendar, downloadFile } from '../lib/calendar';
import { exportBackup } from '../lib/backup';
import { PRIORIDADE_LABEL, type Prioridade, type Task, type User } from '../types';
import { PILL_BUTTON_SECONDARY } from '../ui';

const DAY = 86400000;
const todayStart = () => new Date(new Date().toDateString());

function daysAgoLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function StatTile({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="bg-canvas border border-hairline p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${tone || 'text-ink'}`}>{value}</p>
    </div>
  );
}

const PRIO_ORDER: Prioridade[] = ['baixa', 'media', 'alta'];
const PRIO_COLOR: Record<Prioridade, string> = { baixa: 'bg-hairline', media: 'bg-stone', alta: 'bg-sale' };

function PriorityChart({ tasks }: { tasks: Task[] }) {
  const counts = useMemo(() => {
    const c: Record<Prioridade, number> = { baixa: 0, media: 0, alta: 0 };
    for (const t of tasks) c[t.prioridade]++;
    return c;
  }, [tasks]);
  const max = Math.max(1, ...PRIO_ORDER.map((p) => counts[p]));

  return (
    <div className="bg-canvas border border-hairline p-5 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink mb-4">Tarefas por prioridade</h3>
      <div className="space-y-3">
        {PRIO_ORDER.map((p) => (
          <div key={p} className="flex items-center gap-3">
            <span className="text-xs font-medium text-mute w-12 shrink-0">{PRIORIDADE_LABEL[p]}</span>
            <div className="flex-1 h-5 bg-soft-cloud relative">
              <div
                className={`h-full rounded-r-[4px] ${PRIO_COLOR[p]} transition-all`}
                style={{ width: `${(counts[p] / max) * 100}%`, minWidth: counts[p] > 0 ? '4px' : 0 }}
              />
            </div>
            <span className="text-xs font-semibold text-ink w-5 text-right shrink-0">{counts[p]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompletionHistory({ tasks }: { tasks: Task[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const days = useMemo(() => {
    const buckets: { date: Date; key: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(todayStart().getTime() - i * DAY);
      buckets.push({ date, key: date.toISOString().slice(0, 10), count: 0 });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    for (const t of tasks) {
      if (t.status !== 'concluida') continue;
      const key = t.atualizadoEm.slice(0, 10);
      const bucket = byKey.get(key);
      if (bucket) bucket.count++;
    }
    return buckets;
  }, [tasks]);

  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="bg-canvas border border-hairline p-5 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink mb-4">Conclusões nos últimos 14 dias</h3>
      <div className="relative flex items-end gap-1 h-28 border-b border-hairline">
        {days.map((d, i) => (
          <div
            key={d.key}
            className="flex-1 h-full flex items-end relative"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          >
            {hover === i && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-on-ink text-[11px] font-medium px-2 py-1 whitespace-nowrap z-10 rounded-sm">
                {d.count} em {daysAgoLabel(d.date)}
              </div>
            )}
            <div
              className={`w-full rounded-t-[4px] transition-all ${d.count > 0 ? 'bg-success' : 'bg-hairline-soft'} ${
                hover === i ? 'opacity-80' : ''
              }`}
              style={{ height: d.count > 0 ? `${(d.count / max) * 100}%` : '2px' }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-stone">
        <span>{daysAgoLabel(days[0].date)}</span>
        <span>{daysAgoLabel(days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}

function DeadlineGroups({ tasks, isAdmin }: { tasks: Task[]; isAdmin: boolean }) {
  const groups = useMemo(() => {
    const today = todayStart();
    const in7 = new Date(today.getTime() + 7 * DAY);
    const open = tasks.filter((t) => t.status !== 'concluida' && t.prazo);
    const atrasadas = open.filter((t) => new Date(t.prazo! + 'T00:00:00') < today);
    const hoje = open.filter((t) => {
      const d = new Date(t.prazo! + 'T00:00:00');
      return d.getTime() === today.getTime();
    });
    const semana = open.filter((t) => {
      const d = new Date(t.prazo! + 'T00:00:00');
      return d > today && d <= in7;
    });
    return { atrasadas, hoje, semana };
  }, [tasks]);

  const nearest = [...groups.atrasadas, ...groups.hoje, ...groups.semana]
    .sort((a, b) => (a.prazo! < b.prazo! ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="bg-canvas border border-hairline p-5 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink mb-4 flex items-center gap-2">
        <CalendarClock size={14} /> Prazos
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-sale">{groups.atrasadas.length}</p>
          <p className="text-[11px] text-mute">Atrasadas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-ink">{groups.hoje.length}</p>
          <p className="text-[11px] text-mute">Hoje</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-ink">{groups.semana.length}</p>
          <p className="text-[11px] text-mute">Próx. 7 dias</p>
        </div>
      </div>

      {nearest.length === 0 ? (
        <p className="text-xs text-stone text-center py-3">Nenhum prazo em aberto.</p>
      ) : (
        <ul className="divide-y divide-hairline-soft">
          {nearest.map((t) => {
            const overdue = new Date(t.prazo! + 'T00:00:00') < todayStart();
            return (
              <li key={t.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-ink font-medium truncate">{t.titulo}</span>
                <span className={`shrink-0 flex items-center gap-1 font-semibold ${overdue ? 'text-sale' : 'text-mute'}`}>
                  {overdue && <AlertTriangle size={11} />}
                  {isAdmin ? `${t.responsavel} · ` : ''}
                  {new Date(t.prazo! + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard({ tasks, members, isAdmin }: { tasks: Task[]; members: User[]; isAdmin: boolean }) {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === 'concluida').length;
  const pct = total === 0 ? 0 : Math.round((concluidas / total) * 100);

  function handlePrint() {
    window.print();
  }

  function handleExportAgenda() {
    const ics = buildIcsCalendar(tasks);
    downloadFile('tarefas-secao.ics', ics, 'text/calendar');
  }

  function handleBackup() {
    exportBackup(tasks, members);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={handlePrint} className={PILL_BUTTON_SECONDARY}>
          <Printer size={12} /> Imprimir obrigações
        </button>
        <button onClick={handleExportAgenda} className={PILL_BUTTON_SECONDARY}>
          <CalendarClock size={12} /> Exportar agenda (.ics)
        </button>
        {isAdmin && (
          <button onClick={handleBackup} className={PILL_BUTTON_SECONDARY}>
            <Save size={12} /> Exportar backup
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total de tarefas" value={total} />
        <StatTile label="Concluídas" value={`${pct}%`} tone="text-success" />
        <StatTile label="Em andamento" value={tasks.filter((t) => t.status === 'em_andamento').length} tone="text-info" />
        <StatTile
          label="Atrasadas"
          value={tasks.filter((t) => t.status !== 'concluida' && t.prazo && new Date(t.prazo + 'T00:00:00') < todayStart()).length}
          tone="text-sale"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PriorityChart tasks={tasks} />
        <DeadlineGroups tasks={tasks} isAdmin={isAdmin} />
      </div>

      <CompletionHistory tasks={tasks} />

      <p className="text-[11px] text-stone flex items-center gap-1.5">
        <Download size={11} /> O arquivo .ics pode ser importado no Google Agenda, Outlook ou Apple Calendar (Configurações → Importar).
      </p>
    </div>
  );
}
