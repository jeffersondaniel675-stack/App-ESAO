import type { Task } from '../types';

function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/** Google Calendar "render" URL — opens the event pre-filled, no OAuth/API key needed. */
export function googleCalendarUrl(task: Task): string {
  if (!task.prazo) return '';
  const start = toIcsDate(task.prazo);
  const end = toIcsDate(new Date(new Date(task.prazo + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10));
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.titulo,
    dates: `${start}/${end}`,
    details: [task.descricao, `Responsável: ${task.responsavel}`].filter(Boolean).join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

/** Builds a standard .ics file (importable into Google Agenda, Outlook, Apple Calendar, etc). */
export function buildIcsCalendar(tasks: Task[]): string {
  const withDeadline = tasks.filter((t) => t.prazo);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const events = withDeadline.map((task) => {
    const start = toIcsDate(task.prazo!);
    const end = toIcsDate(new Date(new Date(task.prazo + 'T00:00:00').getTime() + 86400000).toISOString().slice(0, 10));
    return [
      'BEGIN:VEVENT',
      `UID:${task.id}@tarefas-secao`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcs(task.titulo)}`,
      `DESCRIPTION:${escapeIcs([task.descricao, `Responsável: ${task.responsavel}`].filter(Boolean).join('\n'))}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tarefas da Seção//PT-BR',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
