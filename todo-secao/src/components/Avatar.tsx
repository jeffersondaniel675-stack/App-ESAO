const PALETTE = [
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-indigo-100 text-indigo-800',
  'bg-violet-100 text-violet-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
];

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.trim().slice(0, 2).toUpperCase();
  const dims = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-[11px]';

  return (
    <span
      title={name}
      className={`inline-flex items-center justify-center shrink-0 rounded-full font-bold ring-2 ring-white ${dims} ${toneFor(name)}`}
    >
      {initials}
    </span>
  );
}
