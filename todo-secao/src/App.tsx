import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import LoginScreen from './components/LoginScreen';
import MembersPanel from './components/MembersPanel';
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
  }

  function refresh() {
    if (user) loadAll(user);
  }

  if (booting) return null;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar user={user} tab={tab} onTabChange={setTab} onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {!isAdmin || tab === 'tarefas' ? (
          <>
            <TaskForm
              currentUser={user}
              members={isAdmin ? members : [user]}
              editingTask={editingTask}
              onCancelEdit={() => setEditingTask(null)}
              onSaved={() => {
                setEditingTask(null);
                refresh();
              }}
            />
            <TaskList
              tasks={tasks}
              members={members}
              isAdmin={isAdmin}
              onChanged={refresh}
              onEdit={setEditingTask}
            />
          </>
        ) : (
          <MembersPanel members={members} currentUser={user} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}
