import { KeyRound, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { User } from '../types';
import { INPUT_CLASS, PILL_BUTTON_PRIMARY, PILL_BUTTON_SECONDARY } from '../ui';
import Avatar from './Avatar';

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
      <div className="bg-canvas border border-hairline p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink mb-4 flex items-center gap-2">
          <UserPlus size={14} /> Adicionar membro à seção
        </h2>
        <form onSubmit={addMember} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Nome de guerra</label>
            <input type="text" value={nomeGuerra} onChange={(e) => setNomeGuerra(e.target.value)} className={INPUT_CLASS} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Senha inicial</label>
            <input type="text" value={senha} onChange={(e) => setSenha(e.target.value)} className={INPUT_CLASS} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Tipo de acesso</label>
            <select value={tipoAcesso} onChange={(e) => setTipoAcesso(e.target.value as 'admin' | 'membro')} className={INPUT_CLASS}>
              <option value="membro">Membro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {error && <p className="sm:col-span-3 text-xs font-medium text-sale bg-soft-cloud px-3 py-2">{error}</p>}

          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" disabled={saving} className={PILL_BUTTON_PRIMARY}>
              <UserPlus size={15} /> Adicionar membro
            </button>
          </div>
        </form>
      </div>

      <div className="bg-canvas border border-hairline p-5 sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink mb-4 flex items-center gap-2">
          <Users size={14} /> Membros da seção ({members.length})
        </h2>
        <div className="divide-y divide-hairline-soft">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Avatar name={m.nomeGuerra} />
                <div>
                  <p className="text-sm font-semibold text-ink">{m.nomeGuerra}</p>
                  <p className="text-xs text-mute flex items-center gap-1">
                    {m.tipoAcesso === 'admin' && <ShieldCheck size={11} />}
                    {m.tipoAcesso === 'admin' ? 'Administrador' : 'Membro'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => resetSenha(m)} className={PILL_BUTTON_SECONDARY}>
                  <KeyRound size={12} /> Redefinir senha
                </button>
                <button onClick={() => toggleAdmin(m)} className={PILL_BUTTON_SECONDARY}>
                  <ShieldCheck size={12} /> {m.tipoAcesso === 'admin' ? 'Tornar membro' : 'Tornar admin'}
                </button>
                {m.id !== currentUser.id && (
                  <button onClick={() => removeMember(m)} className={`${PILL_BUTTON_SECONDARY} !text-sale hover:!bg-soft-cloud`}>
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
