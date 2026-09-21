import { PRIORIDADE_LABEL, STATUS_LABEL, type Task } from '../types';

export default function PrintableTasks({ tasks }: { tasks: Task[] }) {
  const abertas = tasks.filter((t) => t.status !== 'concluida');
  const porResponsavel = new Map<string, Task[]>();
  for (const t of abertas) {
    if (!porResponsavel.has(t.responsavel)) porResponsavel.set(t.responsavel, []);
    porResponsavel.get(t.responsavel)!.push(t);
  }
  for (const list of porResponsavel.values()) {
    list.sort((a, b) => (a.prazo || '9999-99-99') < (b.prazo || '9999-99-99') ? -1 : 1);
  }

  return (
    <div className="print-only p-10">
      <h1 className="text-2xl font-bold text-black">Obrigações — Tarefas da Seção</h1>
      <p className="text-sm text-black mb-6">
        Intendência · ESAO 2026 · Gerado em {new Date().toLocaleDateString('pt-BR')} às{' '}
        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>

      {[...porResponsavel.entries()].map(([responsavel, list]) => (
        <div key={responsavel} className="mb-6" style={{ pageBreakInside: 'avoid' }}>
          <h2 className="text-base font-bold text-black border-b-2 border-black pb-1 mb-2">{responsavel}</h2>
          <table className="w-full text-sm text-black" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="text-left border border-black px-2 py-1">Tarefa</th>
                <th className="text-left border border-black px-2 py-1 w-28">Prioridade</th>
                <th className="text-left border border-black px-2 py-1 w-28">Status</th>
                <th className="text-left border border-black px-2 py-1 w-24">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="border border-black px-2 py-1">{t.titulo}</td>
                  <td className="border border-black px-2 py-1">{PRIORIDADE_LABEL[t.prioridade]}</td>
                  <td className="border border-black px-2 py-1">{STATUS_LABEL[t.status]}</td>
                  <td className="border border-black px-2 py-1">
                    {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {abertas.length === 0 && <p className="text-sm text-black">Nenhuma obrigação em aberto.</p>}
    </div>
  );
}
