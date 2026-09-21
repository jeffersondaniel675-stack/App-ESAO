import { ClipboardList, LogOut, ShieldCheck, User as UserIcon, Users } from 'lucide-react';
import type { User } from '../types';

type Tab = 'tarefas' | 'membros';

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

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#012d1d] text-emerald-300 rounded-xl hidden sm:flex">
            <ClipboardList size={18} />
          </div>
          <div>
            <h1 className="font-headline font-bold text-base sm:text-lg text-slate-900 leading-tight">Tarefas da Seção</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              {isAdmin ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
              {user.nomeGuerra} · {isAdmin ? 'Administrador' : 'Membro'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <nav className="hidden sm:flex bg-slate-100 rounded-xl p-1 text-sm">
              <button
                onClick={() => onTabChange('tarefas')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  tab === 'tarefas' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ClipboardList size={14} /> Tarefas
              </button>
              <button
                onClick={() => onTabChange('membros')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  tab === 'membros' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users size={14} /> Membros
              </button>
            </nav>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="sm:hidden flex border-t border-slate-100">
          <button
            onClick={() => onTabChange('tarefas')}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
              tab === 'tarefas' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-500'
            }`}
          >
            <ClipboardList size={14} /> Tarefas
          </button>
          <button
            onClick={() => onTabChange('membros')}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 ${
              tab === 'membros' ? 'text-emerald-800 border-b-2 border-emerald-800' : 'text-slate-500'
            }`}
          >
            <Users size={14} /> Membros
          </button>
        </div>
      )}
    </header>
  );
}
