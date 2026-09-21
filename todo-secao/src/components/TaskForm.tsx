import { ArrowRight, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { Prioridade, Task, User } from '../types';
import { INPUT_CLASS, PILL_BUTTON_PRIMARY } from '../ui';

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
    <div className="bg-canvas border border-hairline p-5 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink mb-4">
        {editingTask ? 'Editar tarefa' : 'Nova tarefa'}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink mb-1.5">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Entregar relatório de intendência"
            className={INPUT_CLASS}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-ink mb-1.5">Descrição (opcional)</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes da tarefa…"
            rows={2}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Prioridade</label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)} className={INPUT_CLASS}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1.5">Prazo (opcional)</label>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} className={INPUT_CLASS} />
        </div>

        {isAdmin && (
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Responsável</label>
            <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={INPUT_CLASS}>
              {members.map((m) => (
                <option key={m.id} value={m.nomeGuerra}>
                  {m.nomeGuerra}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="sm:col-span-2 text-xs font-medium text-sale bg-soft-cloud px-3 py-2">{error}</p>}

        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          {editingTask && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex items-center gap-1.5 text-sm font-medium text-mute hover:text-ink px-3 py-2 rounded-full transition"
            >
              <X size={14} /> Cancelar
            </button>
          )}
          <button type="submit" disabled={saving} className={PILL_BUTTON_PRIMARY}>
            {editingTask ? 'Salvar alterações' : 'Adicionar tarefa'}
            <ArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
