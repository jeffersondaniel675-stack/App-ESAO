import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import LoginScreen from './components/LoginScreen';
import MembersPanel from './components/MembersPanel';
import ProgressBar from './components/ProgressBar';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Topbar from './components/Topbar';
import type { Task, User } from './types';

type Tab = 'tarefas' | 'membros';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<Tab>('tarefas');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const isAdmin = user?.tipoAcesso === 'admin';

  const loadAll = useCallback(async (loggedUser: User) => {
    const { tasks } = await api.listTasks();
    setTasks(tasks);
    if (loggedUser.tipoAcesso === 'admin') {
      const { users } = await api.listUsers();
      setMembers(users);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.me();
        setUser(user);
        await loadAll(user);
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [loadAll]);

  async function handleLogin(loggedUser: User) {
    setUser(loggedUser);
    await loadAll(loggedUser);
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    setUser(null);
    setTasks([]);
    setMembers([]);
    setTab('tarefas');
    setFormOpen(false);
    setEditingTask(null);
  }

  function refresh() {
    if (user) loadAll(user);
  }

  function startEdit(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTask(null);
  }

  if (booting) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar user={user} tab={tab} onTabChange={setTab} onLogout={handleLogout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {!isAdmin || tab === 'tarefas' ? (
          <>
            <ProgressBar tasks={tasks} />

            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-base text-slate-900">Quadro de tarefas</h2>
              {!formOpen && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="flex items-center gap-1.5 bg-[#012d1d] hover:bg-emerald-900 text-white font-semibold text-sm px-3.5 py-2 rounded-xl shadow-sm transition active:scale-[0.98]"
                >
                  <Plus size={15} /> Nova tarefa
                </button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {formOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <TaskForm
                    currentUser={user}
                    members={isAdmin ? members : [user]}
                    editingTask={editingTask}
                    onCancelEdit={closeForm}
                    onSaved={() => {
                      if (editingTask) closeForm();
                      refresh();
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <TaskList tasks={tasks} members={members} isAdmin={isAdmin} onChanged={refresh} onEdit={startEdit} />
          </>
        ) : (
          <MembersPanel members={members} currentUser={user} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}
