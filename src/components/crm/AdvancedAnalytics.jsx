import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, Download, ArrowUpRight, 
  Users, MessageSquare, Target, CheckCircle, Clock,
  BarChart2
} from 'lucide-react';

// ─── SVG Area Chart ───────────────────────────────────────────────────────────
function AreaChart({ data, keys, colors, height = 220 }) {
  const width = 600;
  const padX = 40;
  const padY = 20;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1);

  const getX = (i) => padX + (i / (data.length - 1 || 1)) * w;
  const getY = (v) => padY + h - (v / maxVal) * h;

  const buildPath = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] || 0)}`).join(' ');

  const buildArea = (key) =>
    `${buildPath(key)} L ${getX(data.length - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;

  // X axis labels — show every Nth label to avoid overflow
  const labelStep = Math.ceil(data.length / 8);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        {keys.map((k, i) => (
          <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity={0.2} />
            <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line
          key={t}
          x1={padX} y1={padY + h * (1 - t)}
          x2={padX + w} y2={padY + h * (1 - t)}
          stroke="#f1f5f9" strokeWidth={1}
        />
      ))}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map(t => (
        <text
          key={t}
          x={padX - 6}
          y={padY + h * (1 - t) + 4}
          textAnchor="end"
          fontSize={9}
          fill="#94a3b8"
          fontWeight={700}
        >
          {Math.round(maxVal * t)}
        </text>
      ))}

      {/* Areas */}
      {keys.map((k, i) => (
        <path key={`area-${k}`} d={buildArea(k)} fill={`url(#grad-${k})`} />
      ))}

      {/* Lines */}
      {keys.map((k, i) => (
        <path
          key={`line-${k}`}
          d={buildPath(k)}
          fill="none"
          stroke={colors[i]}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) =>
        i % labelStep === 0 ? (
          <text
            key={i}
            x={getX(i)}
            y={height - 2}
            textAnchor="middle"
            fontSize={8}
            fill="#94a3b8"
            fontWeight={700}
          >
            {d.date}
          </text>
        ) : null
      )}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const AdvancedAnalytics = ({ leads }) => {
  const [timeWindow, setTimeWindow] = useState(30);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - timeWindow);
      const { data, error } = await supabase
        .from('leads_events')
        .select('*')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });
      if (!error && data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, [timeWindow]);

  const chartData = useMemo(() => {
    const dailyData = {};
    for (let i = timeWindow; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      dailyData[dateStr] = { date: dateStr, sent: 0, responded: 0 };
    }
    events.forEach(event => {
      const date = new Date(event.created_at);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      if (dailyData[dateStr]) {
        if (event.event_type === 'sent') dailyData[dateStr].sent++;
        if (event.event_type === 'responded') dailyData[dateStr].responded++;
      }
    });
    return Object.values(dailyData);
  }, [events, timeWindow]);

  const stats = useMemo(() => {
    const totalSent = events.filter(e => e.event_type === 'sent').length;
    const totalResponded = events.filter(e => e.event_type === 'responded').length;
    const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;
    const ghosted = events.filter(e => e.event_type === 'ghosted').length;
    const stages = {
      apertura: events.filter(e => e.stage === 'apertura' && e.event_type === 'responded').length,
      activador: events.filter(e => e.stage === 'activador' && e.event_type === 'responded').length,
      video: events.filter(e => e.stage === 'video' && e.event_type === 'responded').length,
    };
    return { totalSent, totalResponded, responseRate, ghosted, stages };
  }, [events]);

  const StatCard = ({ title, value, subValue, icon: Icon, colorClass }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon size={18} />
        </div>
        {subValue && (
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-black">
            <ArrowUpRight size={11} /> {subValue}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{title}</p>
    </div>
  );

  const stageList = [
    { label: 'Apertura', value: stats.stages.apertura, color: '#6366f1' },
    { label: 'Activador', value: stats.stages.activador, color: '#f59e0b' },
    { label: 'Video', value: stats.stages.video, color: '#3b82f6' },
  ];
  const maxStage = Math.max(...stageList.map(s => s.value), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900">Radar PRO — Analítica Histórica</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Conversión en tiempo real · Tabla <code className="text-primary">leads_events</code></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setTimeWindow(d)}
                className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${
                  timeWindow === d ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {d === 7 ? 'Semana' : d === 30 ? 'Mes' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!loading && events.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
            <BarChart2 size={28} className="text-slate-300" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-700">Sin datos aún</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Los datos aparecerán aquí una vez que agregues los nodos <strong>Log Evento</strong> en tus flujos de n8n y se procesen envíos o respuestas.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Mensajes Enviados" value={stats.totalSent} icon={MessageSquare} colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Respuestas Totales" value={stats.totalResponded} subValue={`${stats.responseRate}% tasa`} icon={TrendingUp} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Leads Activos" value={leads.length} icon={Users} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Ghosting" value={stats.ghosted} icon={Clock} colorClass="bg-rose-50 text-rose-500" />
      </div>

      {/* Charts */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Tendencia de Mensajería</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Últimos {timeWindow} días</p>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Enviados</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Respuestas</span>
                </div>
              </div>
            </div>
            <AreaChart
              data={chartData}
              keys={['sent', 'responded']}
              colors={['#6366f1', '#10b981']}
              height={230}
            />
          </div>

          {/* Funnel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Eficiencia por Etapa</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Respuestas recibidas</p>
              </div>
            </div>
            <div className="space-y-5 mt-4">
              {stageList.map((s) => {
                const pct = Math.round((s.value / maxStage) * 100);
                return (
                  <div key={s.label}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{s.label}</span>
                      <span className="text-sm font-black text-slate-900">{s.value}</span>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Consejo PRO</p>
              <p className="text-[11px] font-black text-slate-700 leading-snug">
                La etapa con más respuestas es{' '}
                <span style={{ color: stageList.sort((a, b) => b.value - a.value)[0].color }}>
                  {stageList.sort((a, b) => b.value - a.value)[0].label}
                </span>
                . Analiza ese mensaje para replicar su éxito.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
