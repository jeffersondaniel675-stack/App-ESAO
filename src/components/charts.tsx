/**
 * Componentes de gráfico do sistema (Recharts).
 *
 * Todos seguem a mesma linguagem visual do resto do app (cartão branco,
 * cantos arredondados, rótulo mono em maiúsculas) e recebem o tema por
 * prop, porque o modo escuro do projeto é feito por CSS sobre as classes
 * do Tailwind (.dark-mode em src/index.css) e não alcança SVG.
 *
 * Nenhum gráfico aqui recebe nota nominal de outro participante: o painel
 * do aluno trabalha com agregados da turma e com a lista anônima.
 */
import React from "react";
import {
  Bar,
  BarChart,
  LabelList,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type Theme = "light" | "dark";

export interface ChartPalette {
  me: string;
  turma: string;
  grid: string;
  axis: string;
  cardBg: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  positive: string;
  negative: string;
  neutral: string;
  quartis: [string, string, string, string];
  status: Record<string, string>;
}

export function chartPalette(theme: Theme): ChartPalette {
  const dark = theme === "dark";
  return {
    me: dark ? "#34d399" : "#047857",
    turma: dark ? "#94a3b8" : "#94a3b8",
    grid: dark ? "#374151" : "#e2e8f0",
    axis: dark ? "#9ca3af" : "#64748b",
    cardBg: dark ? "#111827" : "#ffffff",
    tooltipBg: dark ? "#1f2937" : "#ffffff",
    tooltipBorder: dark ? "#374151" : "#e2e8f0",
    tooltipText: dark ? "#f3f4f6" : "#0f172a",
    positive: dark ? "#34d399" : "#059669",
    negative: dark ? "#fb7185" : "#e11d48",
    neutral: dark ? "#60a5fa" : "#2563eb",
    quartis: dark
      ? ["#34d399", "#60a5fa", "#fbbf24", "#fb7185"]
      : ["#059669", "#2563eb", "#d97706", "#e11d48"],
    status: {
      confirmado: dark ? "#34d399" : "#059669",
      corrigido: dark ? "#60a5fa" : "#2563eb",
      rascunho_salvo: dark ? "#fbbf24" : "#d97706",
      não_iniciado: dark ? "#6b7280" : "#94a3b8",
      bloqueado: dark ? "#fb7185" : "#e11d48"
    }
  };
}

const MODULE_LABELS: Record<string, string> = {
  ac3: "AC III",
  ac4: "AC IV",
  ac5: "AC V",
  ac6: "AC VI",
  idiomas: "Idiomas"
};

const MODULE_ORDER = ["ac3", "ac4", "ac5", "ac6", "idiomas"];

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/** Nota do módulo pela regra do regulamento: (AAT x 1 + AC x 9) / 10. */
function moduleNote(mod: any): number | null {
  const aat = toNum(mod?.aat);
  const ac = toNum(mod?.ac);
  if (aat === null || ac === null) return null;
  return (aat * 1 + ac * 9) / 10;
}

/** Idiomas não tem AAT/AC: vale a média entre os conceitos lateral e vertical. */
function idiomasNote(mod: any): number | null {
  const vals = [toNum(mod?.lateralIdiomas), toNum(mod?.verticalIdiomas)].filter(
    (n): n is number => n !== null
  );
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function studentModuleNotes(notas: any, modulesControl?: any): Array<{ key: string; label: string; value: number | null }> {
  const isOpen = (m: string) => !modulesControl || modulesControl[m] !== "fechado";
  return MODULE_ORDER.filter(isOpen).map(key => ({
    key,
    label: MODULE_LABELS[key],
    value: key === "idiomas" ? idiomasNote(notas?.idiomas) : moduleNote(notas?.[key])
  }));
}

// ---------------------------------------------------------------- cartão base

export function ChartCard({
  title,
  hint,
  children,
  className = "",
  empty
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  empty?: string;
}) {
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 ${className}`}>
      <div className="mb-4">
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">{title}</h4>
        {hint && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{hint}</p>}
      </div>
      {empty ? (
        <div className="h-[220px] flex items-center justify-center text-center px-4">
          <p className="text-xs text-slate-400 italic max-w-[28ch]">{empty}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function tooltipStyle(p: ChartPalette) {
  return {
    contentStyle: {
      backgroundColor: p.tooltipBg,
      border: `1px solid ${p.tooltipBorder}`,
      borderRadius: 12,
      fontSize: 12,
      color: p.tooltipText,
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    },
    labelStyle: { color: p.tooltipText, fontWeight: 700, marginBottom: 2 },
    itemStyle: { color: p.tooltipText }
  };
}

// ------------------------------------------------- 1. radar por módulo (aluno)

export function ModuleRadar({
  notas,
  moduleAverages,
  modulesControl,
  theme
}: {
  notas: any;
  moduleAverages?: any;
  modulesControl?: any;
  theme: Theme;
}) {
  const p = chartPalette(theme);
  const mine = studentModuleNotes(notas, modulesControl);
  const data = mine.map(m => ({
    modulo: m.label,
    Você: m.value,
    Turma: moduleAverages?.modules?.[m.key]?.average ?? null
  }));
  const hasAny = data.some(d => d["Você"] !== null);

  return (
    <ChartCard
      title="Perfil por módulo"
      hint="Sua nota em cada módulo comparada à média da turma. Quanto mais para fora, melhor."
      empty={hasAny ? undefined : "Seu perfil aparece aqui quando as notas dos módulos abertos forem lançadas."}
    >
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={p.grid} />
          <PolarAngleAxis dataKey="modulo" tick={{ fill: p.axis, fontSize: 11, fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} stroke={p.grid} />
          <Radar name="Turma" dataKey="Turma" stroke={p.turma} fill={p.turma} fillOpacity={0.18} strokeWidth={1.5} />
          <Radar name="Você" dataKey="Você" stroke={p.me} fill={p.me} fillOpacity={0.32} strokeWidth={2} />
          <Legend wrapperStyle={{ fontSize: 11, color: p.axis }} />
          <Tooltip formatter={(v: any) => fmt(v)} {...tooltipStyle(p)} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// -------------------------------------- 2. barras módulo a módulo vs a turma

export function ModuleComparisonBars({
  notas,
  moduleAverages,
  modulesControl,
  theme
}: {
  notas: any;
  moduleAverages?: any;
  modulesControl?: any;
  theme: Theme;
}) {
  const p = chartPalette(theme);
  const mine = studentModuleNotes(notas, modulesControl);
  const data = mine.map(m => ({
    modulo: m.label,
    Você: m.value,
    Turma: moduleAverages?.modules?.[m.key]?.average ?? null
  }));
  const hasAny = data.some(d => d["Você"] !== null);

  return (
    <ChartCard
      title="Você x turma, por módulo"
      hint="Onde você está acima e abaixo da média. A barra cinza é a média da turma no mesmo módulo."
      empty={hasAny ? undefined : "A comparação aparece quando houver nota lançada nos módulos abertos."}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
          <CartesianGrid stroke={p.grid} vertical={false} />
          <XAxis dataKey="modulo" tick={{ fill: p.axis, fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: p.grid }} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: p.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: any) => fmt(v)} {...tooltipStyle(p)} cursor={{ fill: p.grid, opacity: 0.3 }} />
          <Legend wrapperStyle={{ fontSize: 11, color: p.axis }} />
          <Bar dataKey="Turma" fill={p.turma} radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="Você" fill={p.me} radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------------------------- 3. composição da nota final (80/10/10)

export function GradeComposition({
  calcs,
  theme
}: {
  calcs: { mediaModules: number | null; mediaLateralGeral: number | null; mediaVerticalGeral: number | null; finalGrade: number | null } | null;
  theme: Theme;
}) {
  const p = chartPalette(theme);
  const parts = [
    { nome: "Módulos", peso: 0.8, valor: calcs?.mediaModules ?? null, cor: p.me },
    { nome: "Lateral", peso: 0.1, valor: calcs?.mediaLateralGeral ?? null, cor: p.neutral },
    { nome: "Vertical", peso: 0.1, valor: calcs?.mediaVerticalGeral ?? null, cor: p.quartis[2] }
  ].filter(x => x.valor !== null);

  const somaPesos = parts.reduce((a, b) => a + b.peso, 0);
  const data = parts.map(x => ({
    nome: x.nome,
    Contribuição: somaPesos > 0 ? ((x.valor as number) * x.peso) / somaPesos : 0,
    media: x.valor as number,
    peso: Math.round((x.peso / (somaPesos || 1)) * 100),
    cor: x.cor
  }));

  return (
    <ChartCard
      title="Como sua nota final se forma"
      hint="Quanto cada bloco contribuiu para a nota final. Blocos ainda sem lançamento ficam fora e os pesos são redistribuídos."
      empty={data.length === 0 ? "A composição aparece quando houver ao menos um bloco lançado." : undefined}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={p.grid} horizontal={false} />
          <XAxis type="number" domain={[0, 10]} tick={{ fill: p.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="nome" width={70} tick={{ fill: p.axis, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle(p)}
            cursor={{ fill: p.grid, opacity: 0.3 }}
            formatter={(v: any, _n: any, item: any) =>
              [`${fmt(v)} (média ${fmt(item?.payload?.media)}, peso ${item?.payload?.peso}%)`, "Contribuição"]
            }
          />
          <Bar dataKey="Contribuição" radius={[0, 6, 6, 0]} maxBarSize={26}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {calcs?.finalGrade !== null && calcs?.finalGrade !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nota final</span>
          <span className="text-lg font-bold" style={{ color: p.me }}>{fmt(calcs.finalGrade)}</span>
        </div>
      )}
    </ChartCard>
  );
}

// --------------------------------- 4. distribuição da turma (aluno e admin)

function buildHistogram(grades: number[], binSize = 0.5) {
  if (grades.length === 0) return [];
  const bins: Array<{ faixa: string; inicio: number; Participantes: number }> = [];
  for (let start = 0; start < 10; start += binSize) {
    bins.push({
      faixa: start.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      inicio: start,
      Participantes: 0
    });
  }
  for (const g of grades) {
    const clamped = Math.max(0, Math.min(9.999, g));
    const idx = Math.floor(clamped / binSize);
    if (bins[idx]) bins[idx].Participantes += 1;
  }
  // Corta as faixas vazias das pontas para o gráfico não ficar quase todo vazio
  let first = bins.findIndex(b => b.Participantes > 0);
  let last = bins.length - 1;
  while (last > 0 && bins[last].Participantes === 0) last--;
  if (first === -1) return [];
  first = Math.max(0, first - 1);
  last = Math.min(bins.length - 1, last + 1);
  return bins.slice(first, last + 1);
}

export function GradeDistribution({
  grades,
  myGrade,
  mean,
  median,
  theme,
  title = "Distribuição da turma",
  hint = "Quantos participantes caíram em cada faixa de nota final."
}: {
  grades: number[];
  myGrade?: number | null;
  mean?: number | null;
  median?: number | null;
  theme: Theme;
  title?: string;
  hint?: string;
}) {
  const p = chartPalette(theme);
  const data = buildHistogram(grades);
  const myBinStart = myGrade !== null && myGrade !== undefined ? Math.floor(Math.max(0, Math.min(9.999, myGrade)) / 0.5) * 0.5 : null;

  return (
    <ChartCard
      title={title}
      hint={hint}
      empty={data.length === 0 ? "A distribuição aparece quando houver lançamentos confirmados na turma." : undefined}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={p.grid} vertical={false} />
          <XAxis dataKey="faixa" tick={{ fill: p.axis, fontSize: 10 }} axisLine={{ stroke: p.grid }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: p.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle(p)}
            cursor={{ fill: p.grid, opacity: 0.3 }}
            labelFormatter={(l: any) => `Faixa ${l} a ${(parseFloat(String(l).replace(",", ".")) + 0.5).toLocaleString("pt-BR", { minimumFractionDigits: 1 })}`}
          />
          {mean !== null && mean !== undefined && (
            <ReferenceLine
              x={data.find(d => mean >= d.inicio && mean < d.inicio + 0.5)?.faixa}
              stroke={p.axis}
              strokeDasharray="4 3"
              label={{ value: "média", position: "insideTopLeft", fill: p.axis, fontSize: 10 }}
            />
          )}
          {median !== null && median !== undefined && (
            <ReferenceLine
              x={data.find(d => median >= d.inicio && median < d.inicio + 0.5)?.faixa}
              stroke={p.neutral}
              strokeDasharray="2 3"
              label={{ value: "mediana", position: "insideTopRight", fill: p.neutral, fontSize: 10 }}
            />
          )}
          <Bar dataKey="Participantes" radius={[4, 4, 0, 0]} maxBarSize={34}>
            {data.map((d, i) => (
              <Cell key={i} fill={myBinStart !== null && d.inicio === myBinStart ? p.me : p.turma} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {myBinStart !== null && (
        <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1.5" style={{ backgroundColor: p.me }} />
          A barra destacada é a faixa onde está a sua nota ({fmt(myGrade)}).
        </p>
      )}
    </ChartCard>
  );
}

// ---------------------------------------- 5. progresso dos lançamentos (admin)

const STATUS_LABELS: Record<string, string> = {
  confirmado: "Confirmado",
  corrigido: "Corrigido",
  rascunho_salvo: "Rascunho salvo",
  "não_iniciado": "Não iniciado",
  bloqueado: "Bloqueado"
};

export function LaunchStatusDonut({ students, theme }: { students: any[]; theme: Theme }) {
  const p = chartPalette(theme);
  const ativos = (students || []).filter(s => s.situacao === "ativo");
  const counts: Record<string, number> = {};
  for (const s of ativos) {
    const k = s.statusLancamento || "não_iniciado";
    counts[k] = (counts[k] || 0) + 1;
  }
  const data = Object.keys(STATUS_LABELS)
    .filter(k => counts[k])
    .map(k => ({ nome: STATUS_LABELS[k], valor: counts[k], cor: p.status[k] }));
  const total = ativos.length;

  return (
    <ChartCard
      title="Progresso dos lançamentos"
      hint={`Situação da ficha dos ${total} participantes ativos.`}
      empty={data.length === 0 ? "Nenhum participante ativo cadastrado." : undefined}
    >
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="nome" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke={p.cardBg} strokeWidth={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle(p)} formatter={(v: any, n: any) => [`${v} de ${total}`, n]} />
          <Legend wrapperStyle={{ fontSize: 11, color: p.axis }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ------------------------------------- 6. média da turma por módulo (admin)

export function ClassModuleAverages({
  moduleAverages,
  theme
}: {
  moduleAverages?: any;
  theme: Theme;
}) {
  const p = chartPalette(theme);
  const data = MODULE_ORDER.filter(k => moduleAverages?.modules?.[k])
    .map(k => ({
      modulo: MODULE_LABELS[k],
      Média: moduleAverages.modules[k].average,
      lancamentos: moduleAverages.modules[k].count
    }))
    .filter(d => d.Média !== null);

  const geral = data.length > 0 ? data.reduce((a, b) => a + (b.Média as number), 0) / data.length : null;

  return (
    <ChartCard
      title="Média da turma por módulo"
      hint="Serve para achar o módulo em que a turma foi pior. A linha tracejada é a média entre os módulos."
      empty={data.length === 0 ? "As médias por módulo aparecem quando houver lançamentos confirmados." : undefined}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={p.grid} vertical={false} />
          <XAxis dataKey="modulo" tick={{ fill: p.axis, fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: p.grid }} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: p.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            {...tooltipStyle(p)}
            cursor={{ fill: p.grid, opacity: 0.3 }}
            formatter={(v: any, _n: any, item: any) => [`${fmt(v)} (${item?.payload?.lancamentos} lançamentos)`, "Média"]}
          />
          {geral !== null && <ReferenceLine y={geral} stroke={p.axis} strokeDasharray="4 3" />}
          <Bar dataKey="Média" fill={p.me} radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList
              dataKey="Média"
              position="top"
              fill={p.axis}
              fontSize={10}
              fontWeight={700}
              formatter={(v: any) => (typeof v === "number" ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "")}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// -------------------------------------------- 7. quartis da turma (admin)

export function QuartileBars({ rankings, theme }: { rankings: any[]; theme: Theme }) {
  const p = chartPalette(theme);
  const counts = [1, 2, 3, 4].map(q => ({
    quartil: `${q}º quartil`,
    Participantes: (rankings || []).filter(r => r.quartil === q).length,
    cor: p.quartis[q - 1]
  }));
  const total = counts.reduce((a, b) => a + b.Participantes, 0);

  return (
    <ChartCard
      title="Participantes por quartil"
      hint="Distribuição da turma nos quatro quartis de desempenho."
      empty={total === 0 ? "Os quartis aparecem quando houver lançamentos válidos." : undefined}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={counts} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={p.grid} vertical={false} />
          <XAxis dataKey="quartil" tick={{ fill: p.axis, fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: p.grid }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: p.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle(p)} cursor={{ fill: p.grid, opacity: 0.3 }} formatter={(v: any) => [`${v} de ${total}`, "Participantes"]} />
          <Bar dataKey="Participantes" radius={[4, 4, 0, 0]} maxBarSize={44}>
            {counts.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// --------------------------- 8. mapa de calor aluno x módulo (admin)

export function ModuleHeatmap({
  students,
  modulesControl,
  theme,
  maxRows = 60
}: {
  students: any[];
  modulesControl?: any;
  theme: Theme;
  maxRows?: number;
}) {
  const p = chartPalette(theme);
  const isOpen = (m: string) => !modulesControl || modulesControl[m] !== "fechado";
  const cols = MODULE_ORDER.filter(isOpen);

  const rows = (students || [])
    .filter(s => s.situacao === "ativo" && s.notas)
    .map(s => ({
      rotulo: s.nomeSigiloso || `OF-${String(s.id).slice(-4)}`,
      valores: cols.map(k => (k === "idiomas" ? idiomasNote(s.notas?.idiomas) : moduleNote(s.notas?.[k])))
    }))
    .sort((a, b) => {
      const avg = (v: Array<number | null>) => {
        const ok = v.filter((n): n is number => n !== null);
        return ok.length ? ok.reduce((x, y) => x + y, 0) / ok.length : -1;
      };
      return avg(b.valores) - avg(a.valores);
    })
    .slice(0, maxRows);

  // Escala de cor: vermelho abaixo de 6, âmbar até 8, verde acima
  const cellColor = (v: number | null) => {
    if (v === null) return theme === "dark" ? "#1f2937" : "#f1f5f9";
    if (v < 6) return p.negative;
    if (v < 8) return p.quartis[2];
    return p.positive;
  };

  return (
    <ChartCard
      title="Mapa de calor: participante x módulo"
      hint="Cada linha é um participante (nome sigiloso), cada coluna um módulo. Vermelho abaixo de 6,000, âmbar até 8,000, verde acima."
      empty={rows.length === 0 ? "O mapa aparece quando houver notas lançadas." : undefined}
    >
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-separate" style={{ borderSpacing: "2px" }}>
          <thead>
            <tr>
              <th className="text-left font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold pb-1 pr-2">Participante</th>
              {cols.map(k => (
                <th key={k} className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold pb-1 px-1 text-center whitespace-nowrap">
                  {MODULE_LABELS[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="text-[11px] font-medium text-slate-600 pr-2 whitespace-nowrap max-w-[150px] truncate" title={r.rotulo}>
                  {r.rotulo}
                </td>
                {r.valores.map((v, j) => (
                  <td key={j} className="p-0">
                    <div
                      className="h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono text-white/95"
                      style={{ backgroundColor: cellColor(v) }}
                      title={`${r.rotulo} — ${MODULE_LABELS[cols[j]]}: ${fmt(v)}`}
                    >
                      {v === null ? "" : v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(students || []).filter(s => s.situacao === "ativo" && s.notas).length > maxRows && (
        <p className="mt-3 text-[11px] text-slate-400 italic">
          Mostrando os {maxRows} primeiros por média. Use a aba de participantes para a lista completa.
        </p>
      )}
    </ChartCard>
  );
}
