import { CheckCircle2, ClipboardList, LogIn, Shield, Users } from 'lucide-react';
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
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-[46%] xl:w-2/5 relative bg-[#012d1d] text-white flex-col justify-between p-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <ClipboardList size={20} />
          </div>
          <span className="font-headline font-bold text-sm tracking-wide">TAREFAS DA SEÇÃO</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="font-headline font-bold text-3xl xl:text-4xl leading-tight">
            Organize a rotina<br />da sua seção.
          </h1>
          <ul className="space-y-3 text-sm text-emerald-100/90">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> Cada membro acompanha suas próprias tarefas
            </li>
            <li className="flex items-center gap-2.5">
              <Users size={16} className="text-emerald-400 shrink-0" /> Administrador distribui e acompanha tudo
            </li>
            <li className="flex items-center gap-2.5">
              <Shield size={16} className="text-emerald-400 shrink-0" /> Acesso individual por nome de guerra
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-emerald-100/50">Intendência · ESAO 2026</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-[#012d1d] text-emerald-300 rounded-xl">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="font-headline font-bold text-lg text-slate-900">Tarefas da Seção</h1>
              <p className="text-xs text-slate-500">Intendência · ESAO 2026</p>
            </div>
          </div>

          <h2 className="font-headline font-bold text-xl text-slate-900 mb-1">Entrar</h2>
          <p className="text-sm text-slate-500 mb-6">Use seu nome de guerra e senha da seção.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
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
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition"
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
    </div>
  );
}
