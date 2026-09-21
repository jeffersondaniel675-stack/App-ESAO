import { Plus, Save, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { Prioridade, Task, User } from '../types';

export default function TaskForm({
  currentUser,
  members,
  editingTask,
  onCancelEdit,
  onSaved,
}: {
  currentUser: User;
  members: User[];
  editingTask: Task | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const isAdmin = currentUser.tipoAcesso === 'admin';

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('media');
  const [prazo, setPrazo] = useState('');
  const [responsavel, setResponsavel] = useState(currentUser.nomeGuerra);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitulo(editingTask.titulo);
      setDescricao(editingTask.descricao);
      setPrioridade(editingTask.prioridade);
      setPrazo(editingTask.prazo || '');
      setResponsavel(editingTask.responsavel);
    } else {
      setTitulo('');
      setDescricao('');
      setPrioridade('media');
      setPrazo('');
      setResponsavel(currentUser.nomeGuerra);
    }
    setError('');
  }, [editingTask, currentUser.nomeGuerra]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      prioridade,
      prazo: prazo || null,
      ...(isAdmin ? { responsavel } : {}),
    };
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }
      onSaved();
      if (!editingTask) {
        setTitulo('');
        setDescricao('');
        setPrazo('');
        setPrioridade('media');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a tarefa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
      <h2 className="font-headline font-bold text-sm text-slate-900 mb-4">
        {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Entregar relatório de intendência"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descrição (opcional)</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes da tarefa…"
            rows={2}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prioridade</label>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as Prioridade)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prazo (opcional)</label>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
          />
        </div>

        {isAdmin && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Responsável</label>
            <select
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
            >
              {members.map((m) => (
                <option key={m.id} value={m.nomeGuerra}>
                  {m.nomeGuerra}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="sm:col-span-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          {editingTask && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg transition"
            >
              <X size={14} /> Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#012d1d] hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition active:scale-[0.98]"
          >
            {editingTask ? <Save size={15} /> : <Plus size={15} />}
            {editingTask ? 'Salvar alterações' : 'Adicionar tarefa'}
          </button>
        </div>
      </form>
    </div>
  );
}
