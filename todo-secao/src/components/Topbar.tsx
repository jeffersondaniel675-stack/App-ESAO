import { ClipboardList, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import type { User } from '../types';
import Avatar from './Avatar';

export type Tab = 'painel' | 'tarefas' | 'membros';

const TABS: { tab: Tab; label: string; icon: typeof ClipboardList; adminOnly?: boolean }[] = [
  { tab: 'painel', label: 'Painel', icon: LayoutDashboard },
  { tab: 'tarefas', label: 'Tarefas', icon: ClipboardList },
  { tab: 'membros', label: 'Membros', icon: Users, adminOnly: true },
];

export default function Topbar({
  user,
  tab,
  onTabChange,
  onLogout,
}: {
  user: User;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
}) {
  const isAdmin = user.tipoAcesso === 'admin';
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <header className="bg-canvas border-b border-hairline sticky top-0 z-10 no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ink text-on-ink rounded-full hidden sm:flex">
            <ClipboardList size={18} />
          </div>
          <div>
            <h1 className="font-display uppercase text-lg sm:text-xl leading-none text-ink">Tarefas da Seção</h1>
            <p className="text-xs text-mute">Intendência · ESAO 2026</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 mr-auto ml-6 pl-6 border-l border-hairline">
          <Avatar name={user.nomeGuerra} size="sm" />
          <div>
            <p className="text-xs font-semibold text-ink leading-tight">{user.nomeGuerra}</p>
            <p className="text-[11px] text-mute flex items-center gap-1">
              {isAdmin && <ShieldCheck size={10} />}
              {isAdmin ? 'Administrador' : 'Membro'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex bg-soft-cloud rounded-full p-1 text-sm">
            {visibleTabs.map(({ tab: t, label, icon: Icon }) => (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 ${
                  tab === t ? 'bg-ink text-on-ink' : 'text-mute hover:text-ink'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink bg-soft-cloud hover:bg-hairline-soft px-3.5 py-1.5 rounded-full transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      <div className="sm:hidden flex border-t border-hairline">
        {visibleTabs.map(({ tab: t, label, icon: Icon }) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
              tab === t ? 'text-ink border-b-2 border-ink' : 'text-mute'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
    </header>
  );
}
