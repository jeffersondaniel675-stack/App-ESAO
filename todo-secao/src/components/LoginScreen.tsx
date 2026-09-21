import { ArrowRight, ClipboardList } from 'lucide-react';
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
    <div className="min-h-screen flex bg-canvas">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative bg-ink text-on-ink flex-col justify-between p-12 overflow-hidden">
        <div className="relative flex items-center gap-2.5">
          <ClipboardList size={20} />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase">Tarefas da Seção</span>
        </div>

        <h1 className="font-display uppercase leading-[0.9] text-[clamp(56px,7vw,112px)] tracking-tight">
          Organize
          <br />a rotina.
          <br />
          Cumpra a
          <br />
          missão.
        </h1>

        <p className="relative text-xs tracking-[0.15em] uppercase text-stone">Intendência · ESAO 2026</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="p-2.5 bg-ink text-on-ink rounded-full">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="font-display uppercase text-2xl leading-none text-ink">Tarefas da Seção</h1>
              <p className="text-xs text-mute mt-1">Intendência · ESAO 2026</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-ink mb-1">Entrar</h2>
          <p className="text-sm text-mute mb-7">Use seu nome de guerra e senha da seção.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5" htmlFor="nomeGuerra">
                Nome de guerra
              </label>
              <input
                id="nomeGuerra"
                type="text"
                autoComplete="username"
                value={nomeGuerra}
                onChange={(e) => setNomeGuerra(e.target.value)}
                placeholder="ex: Silva"
                className="w-full px-4 py-3 text-sm rounded-md border-0 bg-soft-cloud focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-ink transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 text-sm rounded-md border-0 bg-soft-cloud focus:bg-canvas focus:outline-none focus:ring-2 focus:ring-ink transition"
                required
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-sale bg-soft-cloud rounded-md px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ink hover:bg-charcoal disabled:opacity-50 text-on-ink font-semibold text-sm h-12 rounded-full transition active:scale-[0.97]"
            >
              {loading ? 'Entrando…' : 'Entrar'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
