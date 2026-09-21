import { KeyRound, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { User } from '../types';

export default function MembersPanel({
  members,
  currentUser,
  onChanged,
}: {
  members: User[];
  currentUser: User;
  onChanged: () => void;
}) {
  const [nomeGuerra, setNomeGuerra] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState<'admin' | 'membro'>('membro');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function addMember(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createUser({ nomeGuerra: nomeGuerra.trim(), senha, tipoAcesso });
      setNomeGuerra('');
      setSenha('');
      setTipoAcesso('membro');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível adicionar o membro.');
    } finally {
      setSaving(false);
    }
  }

  async function resetSenha(member: User) {
    const nova = prompt(`Nova senha para ${member.nomeGuerra}:`);
    if (!nova) return;
    await api.updateUser(member.id, { senha: nova });
    alert('Senha atualizada.');
  }

  async function toggleAdmin(member: User) {
    await api.updateUser(member.id, { tipoAcesso: member.tipoAcesso === 'admin' ? 'membro' : 'admin' });
    onChanged();
  }

  async function removeMember(member: User) {
    if (!confirm(`Remover ${member.nomeGuerra} da seção? As tarefas dele(a) continuarão registradas.`)) return;
    try {
      await api.deleteUser(member.id);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Não foi possível remover.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
        <h2 className="font-headline font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <UserPlus size={16} className="text-emerald-700" /> Adicionar membro à seção
        </h2>
        <form onSubmit={addMember} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nome de guerra</label>
            <input
              type="text"
              value={nomeGuerra}
              onChange={(e) => setNomeGuerra(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Senha inicial</label>
            <input
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tipo de acesso</label>
            <select
              value={tipoAcesso}
              onChange={(e) => setTipoAcesso(e.target.value as 'admin' | 'membro')}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
            >
              <option value="membro">Membro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {error && (
            <p className="sm:col-span-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-[#012d1d] hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition active:scale-[0.98]"
            >
              <UserPlus size={15} /> Adicionar membro
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
        <h2 className="font-headline font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
          <Users size={16} className="text-emerald-700" /> Membros da seção ({members.length})
        </h2>
        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-semibold text-slate-900">{m.nomeGuerra}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {m.tipoAcesso === 'admin' && <ShieldCheck size={11} className="text-emerald-600" />}
                  {m.tipoAcesso === 'admin' ? 'Administrador' : 'Membro'}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => resetSenha(m)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  <KeyRound size={12} /> Redefinir senha
                </button>
                <button
                  onClick={() => toggleAdmin(m)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  <ShieldCheck size={12} /> {m.tipoAcesso === 'admin' ? 'Tornar membro' : 'Tornar admin'}
                </button>
                {m.id !== currentUser.id && (
                  <button
                    onClick={() => removeMember(m)}
                    className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Trash2 size={12} /> Remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
