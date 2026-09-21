import type { ReactNode } from 'react';

const TONES = {
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
} as const;

export default function Badge({ tone = 'slate', icon, children }: { tone?: keyof typeof TONES; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
