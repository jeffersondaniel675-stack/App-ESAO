import { ClipboardList, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api';
import type { User } from '../types';

export default function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [nomeGuerra, setNomeGuerra] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await api.login(nomeGuerra.trim(), senha);
      onLogin(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden"
      >
        <div className="p-6 pb-0 flex items-center gap-3">
          <div className="p-2.5 bg-[#012d1d] text-emerald-300 rounded-xl">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg text-slate-900">Tarefas da Seção</h1>
            <p className="text-xs text-slate-500">Intendência · ESAO 2026</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="nomeGuerra">
              Nome de guerra
            </label>
            <input
              id="nomeGuerra"
              type="text"
              autoComplete="username"
              value={nomeGuerra}
              onChange={(e) => setNomeGuerra(e.target.value)}
              placeholder="ex: Silva"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
              required
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#012d1d] hover:bg-emerald-900 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl shadow-sm transition active:scale-[0.98]"
          >
            <LogIn size={16} />
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
