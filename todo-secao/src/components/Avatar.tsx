const PALETTE = [
  'bg-ink text-on-ink',
  'bg-accent-teal text-on-ink',
  'bg-info text-on-ink',
  'bg-accent-pink text-on-ink',
  'bg-success text-on-ink',
  'bg-charcoal text-on-ink',
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
      className={`inline-flex items-center justify-center shrink-0 rounded-full font-bold ring-2 ring-canvas ${dims} ${toneFor(name)}`}
    >
      {initials}
    </span>
  );
}
