// src/components/crm/AutomationHub.jsx
// "Ritmo de Salón" — Visual automation dashboard
import React, { useState, useMemo } from 'react';
import {
  Rocket, Clock, Zap, AlertTriangle, CheckCircle, XCircle,
  Calendar, BarChart2, Users, Ghost, RefreshCw, ChevronRight,
  TrendingUp, Send, Shield
} from 'lucide-react';
import { useAutomation, SCHEDULE_CONFIG, distributeSlots, checkCopyDiversity } from '../../hooks/useAutomation';

// ─── DAY LABELS ───
const DOW_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ─── HEAT MAP COLORS ───
function getHeatColor(rate) {
  if (rate === 0) return '#f1f5f9';
  if (rate < 10) return '#dcfce7';
  if (rate < 20) return '#86efac';
  if (rate < 35) return '#22c55e';
  if (rate < 50) return '#16a34a';
  return '#15803d';
}

function getHeatTextColor(rate) {
  return rate >= 20 ? '#fff' : '#374151';
}

// ─── BLOCK CARD ───
function BlockCard({ block, dayLabel, scheduledInBlock }) {
  const pct = Math.min((scheduledInBlock / block.maxMessages) * 100, 100);
  const remaining = block.maxMessages - scheduledInBlock;
  const isFull = scheduledInBlock >= block.maxMessages;
  const isGolden = block.start === '14:00'; // afternoon golden window

  return (
    <div className={`relative rounded-2xl border p-4 transition-all ${
      isGolden
        ? 'bg-amber-50 border-amber-200 shadow-amber-100 shadow-md'
        : isFull
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-white border-slate-100'
    }`}>
      {isGolden && (
        <span className="absolute -top-2 left-4 text-[9px] font-black uppercase tracking-widest bg-amber-400 text-white px-2 py-0.5 rounded-full">
          ✨ Ventana de Oro
        </span>
      )}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={13} className={isGolden ? 'text-amber-600' : 'text-slate-400'} />
          <span className={`text-xs font-black ${isGolden ? 'text-amber-700' : 'text-slate-700'}`}>
            {block.start} — {block.end}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {scheduledInBlock}/{block.maxMessages}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isFull ? 'bg-emerald-500' : isGolden ? 'bg-amber-400' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[10px] text-slate-400 font-medium">
        {isFull
          ? '✅ Bloque completo'
          : `${remaining} slots disponibles`}
      </p>
    </div>
  );
}

// ─── DAY COLUMN ───
function DayColumn({ dayIndex, config, scheduledToday, isToday }) {
  const totalScheduled = scheduledToday.length;

  return (
    <div className={`flex flex-col gap-2 min-w-[160px] sm:min-w-0 ${
      isToday ? 'ring-2 ring-primary/20 rounded-2xl p-2 bg-primary/5' : ''
    }`}>
      <div className="flex items-center justify-between px-1">
        <div>
          <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-slate-600'}`}>
            {isToday ? '📍 ' : ''}{config.label}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: config.badgeColor + '20', color: config.badgeColor }}
            >
              {config.badge}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-400">{config.total}msgs</span>
      </div>

      {config.blocks.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
          <span className="text-2xl">😴</span>
          <p className="text-[9px] font-bold text-slate-400 mt-1">Día OFF</p>
        </div>
      ) : (
        config.blocks.map((block, i) => (
          <BlockCard
            key={i}
            block={block}
            dayLabel={config.label}
            scheduledInBlock={
              scheduledToday.filter(l => {
                if (!l.scheduled_at) return false;
                const h = new Date(l.scheduled_at).getHours();
                const [sh] = block.start.split(':').map(Number);
                const [eh] = block.end.split(':').map(Number);
                return h >= sh && h <= eh;
              }).length
            }
          />
        ))
      )}
    </div>
  );
}

// ─── HEAT MAP ───
function ResponseHeatMap({ heatMapData }) {
  const maxResponses = Math.max(...heatMapData.map(h => h.responses), 1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={16} className="text-primary" />
        <h3 className="text-sm font-black text-slate-800">Radar de Respuesta</h3>
        <span className="text-[10px] text-slate-400 font-medium">— cuándo te contestan</span>
      </div>
      <div className="flex gap-1.5 items-end">
        {heatMapData.map(h => (
          <div key={h.hour} className="flex flex-col items-center gap-1 flex-1">
            <span className={`text-[8px] font-black ${h.responses > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
              {h.responses > 0 ? h.responses : ''}
            </span>
            <div
              className="w-full rounded-md transition-all duration-500 relative group cursor-pointer"
              style={{
                height: `${Math.max((h.responses / maxResponses) * 60, 8)}px`,
                background: getHeatColor(h.rate),
              }}
              title={`${h.hour}h: ${h.responses} respuestas / ${h.sent} enviados (${h.rate}%)`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {h.rate}% respuesta
              </div>
            </div>
            <span className="text-[8px] text-slate-400 font-medium">{h.hour}h</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[10px] text-slate-400 font-bold">Intensidad:</span>
        {[0, 10, 20, 35, 50].map(rate => (
          <div key={rate} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: getHeatColor(rate) }} />
            <span className="text-[9px] text-slate-500">{rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DAILY SUMMARY ───
function DailySummary({ todayStats, yesterdayStats }) {
  const [view, setView] = useState('today');
  const stats = view === 'today' ? todayStats : yesterdayStats;

  const StatItem = ({ label, value, subValue, color, icon: Icon }) => (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
      <div className={`p-2 rounded-xl bg-${color}-50 mb-2`}>
        <Icon size={14} className={`text-${color}-500`} />
      </div>
      <span className="text-xl font-black text-slate-800">{value}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
      {subValue && <span className="text-[9px] font-black text-emerald-500 mt-1">{subValue}</span>}
    </div>
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <h3 className="text-sm font-black text-slate-800">Resumen de Desempeño</h3>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setView('today')}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
              view === 'today' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setView('yesterday')}
            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
              view === 'yesterday' ? 'bg-white text-primary shadow-sm' : 'text-slate-400'
            }`}
          >
            Ayer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatItem 
          label="Mensajes Enviados" 
          value={stats.totalSent} 
          color="blue" 
          icon={Send} 
        />
        <StatItem 
          label="Respuestas Totales" 
          value={stats.totalResponded} 
          subValue={stats.totalSent > 0 ? `${Math.round((stats.totalResponded / stats.totalSent) * 100)}% tasa` : null}
          color="emerald" 
          icon={TrendingUp} 
        />
        <StatItem 
          label="Conversión Apertura" 
          value={stats.respondedApertura} 
          color="primary" 
          icon={Rocket} 
        />
        <StatItem 
          label="Interés Activador" 
          value={stats.respondedActivador} 
          color="amber" 
          icon={Zap} 
        />
      </div>

      {/* Secondary metrics (Video/Cierre) */}
      {(stats.respondedVideo > 0 || stats.respondedCierre > 0) && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Vieron Video</span>
            <span className="text-sm font-black text-slate-700">{stats.respondedVideo}</span>
          </div>
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Respondieron Cierre</span>
            <span className="text-sm font-black text-slate-700">{stats.respondedCierre}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DIVERSITY METER ───
function DiversityMeter({ diversityCheck, stagedCount, ignoreDiversity, setIgnoreDiversity }) {
  const { isHealthy, diversity, warnings } = diversityCheck;

  return (
    <div className={`rounded-2xl border p-4 ${isHealthy || ignoreDiversity ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className={isHealthy ? 'text-emerald-500' : 'text-rose-500'} />
          <span className="text-xs font-black text-slate-700">Anti-Ban: Diversidad</span>
        </div>
        <span className={`text-sm font-black ${isHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
          {diversity}%
        </span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            diversity >= 70 ? 'bg-emerald-500' : diversity >= 40 ? 'bg-amber-400' : 'bg-rose-500'
          }`}
          style={{ width: `${Math.min(diversity, 100)}%` }}
        />
      </div>

      {warnings.length > 0 ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Advertencias</span>
            <button 
              onClick={() => setIgnoreDiversity(!ignoreDiversity)}
              className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all ${
                ignoreDiversity ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
              }`}
            >
              {ignoreDiversity ? 'Bypass Activo' : 'Omitir Bloqueo'}
            </button>
          </div>
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-rose-500 shrink-0" />
              <p className="text-[9px] font-bold text-rose-600">
                "{w.message}" — {w.count}x (límite: 8)
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-emerald-600 font-bold">
          {stagedCount === 0 ? 'Sin mensajes preparados aún' : '✅ Distribución saludable'}
        </p>
      )}
    </div>
  );
}

// ─── GHOSTING PANEL ───
function GhostingPanel({ ghostingLeads, leads }) {
  if (ghostingLeads.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Ghost size={15} className="text-slate-400" />
        <span className="text-xs font-black text-slate-700">Ghosting</span>
        <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
          {ghostingLeads.length} sin respuesta
        </span>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {ghostingLeads.slice(0, 5).map(gl => {
          const lead = leads.find(l => l.id === gl.id);
          const hoursAgo = Math.floor((Date.now() - new Date(gl.enviado_at)) / (1000 * 60 * 60));
          return (
            <div key={gl.id} className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-600 truncate max-w-[60%]">
                {lead?.nombre_salon || 'Lead'}
              </span>
              <span className="text-slate-400 font-medium">{hoursAgo}h sin respuesta</span>
            </div>
          );
        })}
        {ghostingLeads.length > 5 && (
          <p className="text-[9px] text-slate-400 font-bold">+{ghostingLeads.length - 5} más</p>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───
export default function AutomationHub({ leads = [] }) {
  const {
    stagedLeads, analyticsLeads, stagedCount, queuedCount,
    ghostingLeads, heatMapData, diversityCheck,
    todayStats, yesterdayStats,
    scheduleBatch, isScheduling, scheduleError,
    unstage, SCHEDULE_CONFIG: config,
  } = useAutomation();

  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [scheduleResult, setScheduleResult] = useState(null);
  const [activeTab, setActiveTab] = useState('bloques');
  const [isDispatching, setIsDispatching] = useState(false);
  const [ignoreDiversity, setIgnoreDiversity] = useState(false);

  const handleDispatch = async () => {
    setIsDispatching(true);
    try {
      // Usamos ruta relativa para pasar por el proxy de Vite (local) y Vercel (producción)
      // y evitar errores de CORS al llamar directamente al webhook de n8n
      const res = await fetch('/api/dispatch/webhook/lanzar-despacho', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`n8n respondió con status ${res.status}`);
      alert('🚀 Despacho iniciado con éxito. n8n procesará los mensajes programados.');
    } catch (e) {
      console.error('Error dispatching:', e);
      alert(`❌ Error al conectar con n8n: ${e.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const todayDow = new Date().getDay();
  const selectedDow = new Date(targetDate + 'T12:00:00').getDay();

  const staged = stagedLeads.filter(l => l.automation_status === 'staged');
  const queued = stagedLeads.filter(l => l.automation_status === 'queued');

  const canSchedule = staged.length > 0 && (diversityCheck.isHealthy || ignoreDiversity);

  const handleSchedule = async () => {
    try {
      const result = await scheduleBatch(staged, new Date(targetDate + 'T12:00:00'));
      setScheduleResult(result);
    } catch (e) {
      console.error('Error scheduling:', e);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* ── HEADER ── */}
      <div className="px-5 sm:px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Rocket size={18} className="text-primary" />
              <h2 className="text-base font-black text-white tracking-tight">Central de Despacho</h2>
              <span className="text-[9px] font-black text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Ritmo de Salón
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Prepara → Programa → Despega con horario inteligente
            </p>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <Zap size={11} className="text-amber-400" />
              <span className="text-xs font-black text-amber-300">{stagedCount} listos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-xl">
              <Clock size={11} className="text-primary" />
              <span className="text-xs font-black text-blue-300">{queuedCount} en cola</span>
            </div>
            {ghostingLeads.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-600 border border-slate-500 px-3 py-1.5 rounded-xl">
                <Ghost size={11} className="text-slate-300" />
                <span className="text-xs font-black text-slate-300">{ghostingLeads.length} ghost</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {[
          { id: 'bloques', icon: Calendar, label: 'Bloques' },
          { id: 'cola', icon: Send, label: `Cola (${stagedCount + queuedCount})` },
          { id: 'radar', icon: BarChart2, label: 'Radar' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black transition-all whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: BLOQUES ── */}
      {activeTab === 'bloques' && (
        <div className="p-5 sm:p-6">
          {/* Date picker + Schedule button */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={targetDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setTargetDate(e.target.value)}
                className="flex-1 text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
              />
            </div>
            <button
              onClick={handleSchedule}
              disabled={!canSchedule || isScheduling}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                canSchedule && !isScheduling
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isScheduling ? (
                <><RefreshCw size={13} className="animate-spin" /> Programando...</>
              ) : (
                <><Calendar size={13} /> Programar {stagedCount} msgs</>
              )}
            </button>

            {/* NEW MANUAL DISPATCH BUTTON */}
            <button
              onClick={handleDispatch}
              disabled={isDispatching || queuedCount === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                !isDispatching && queuedCount > 0
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-black'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isDispatching ? (
                <><RefreshCw size={13} className="animate-spin" /> Lanzando...</>
              ) : (
                <><Rocket size={13} className="text-primary" /> Lanzar Despacho</>
              )}
            </button>
          </div>

          {/* Warning if diversity is bad */}
          {!diversityCheck.isHealthy && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold text-rose-700">
                  ⚠️ Diversidad insuficiente. Usa variantes de la biblioteca para evitar bloqueos de WhatsApp.
                </p>
              </div>
              <button 
                onClick={() => setIgnoreDiversity(!ignoreDiversity)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all active:scale-95 ${
                  ignoreDiversity 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                    : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
              >
                {ignoreDiversity ? 'Omitir: ON' : 'Omitir Bloqueo'}
              </button>
            </div>
          )}

          {/* Schedule result */}
          {scheduleResult && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <p className="text-[11px] font-bold text-emerald-700">
                ✅ {scheduleResult.scheduled} mensajes programados.
                {scheduleResult.unscheduled > 0 && ` ${scheduleResult.unscheduled} quedaron sin slot para hoy.`}
              </p>
            </div>
          )}

          {/* Schedule config for selected day */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="text-[9px] font-black px-2.5 py-1 rounded-full"
                style={{
                  background: (config[selectedDow]?.badgeColor || '#6b7280') + '20',
                  color: config[selectedDow]?.badgeColor || '#6b7280',
                }}
              >
                {config[selectedDow]?.badge}
              </div>
              <span className="text-xs font-bold text-slate-500">
                {config[selectedDow]?.label} — máx. {config[selectedDow]?.total} mensajes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(config[selectedDow]?.blocks || []).map((block, i) => (
                <BlockCard
                  key={i}
                  block={block}
                  dayLabel={config[selectedDow]?.label}
                  scheduledInBlock={queued.filter(l => {
                    if (!l.scheduled_at) return false;
                    const h = new Date(l.scheduled_at).getHours();
                    const [sh] = block.start.split(':').map(Number);
                    const [eh] = block.end.split(':').map(Number);
                    return h >= sh && h <= eh;
                  }).length}
                />
              ))}
              {(config[selectedDow]?.blocks || []).length === 0 && (
                <div className="col-span-3 p-6 text-center bg-slate-50 rounded-2xl">
                  <p className="text-2xl mb-2">😴</p>
                  <p className="text-xs font-bold text-slate-500">
                    {config[selectedDow]?.badge === 'Día OFF'
                      ? 'Sábado es el día más caótico del salón — sin envíos.'
                      : 'Sin bloques configurados para este día.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly overview */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vista Semanal</h3>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {Object.entries(config).map(([day, cfg]) => {
                  const dow = parseInt(day);
                  return (
                    <div
                      key={day}
                      className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        dow === todayDow ? 'scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => {
                        const next = new Date();
                        const diff = (dow - next.getDay() + 7) % 7;
                        next.setDate(next.getDate() + diff);
                        setTargetDate(next.toISOString().split('T')[0]);
                      }}
                    >
                      <span className={`text-[9px] font-black ${dow === todayDow ? 'text-primary' : 'text-slate-400'}`}>
                        {DOW_LABELS[dow]}
                      </span>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black"
                        style={{ background: cfg.badgeColor + '20', color: cfg.badgeColor }}
                      >
                        {cfg.total}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: COLA ── */}
      {activeTab === 'cola' && (
        <div className="p-5 sm:p-6">
          <DiversityMeter 
            diversityCheck={diversityCheck} 
            stagedCount={stagedCount} 
            ignoreDiversity={ignoreDiversity}
            setIgnoreDiversity={setIgnoreDiversity}
          />
          <GhostingPanel ghostingLeads={ghostingLeads} leads={leads} />

          {staged.length === 0 && queued.length === 0 ? (
            <div className="py-12 text-center">
              <Rocket size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400">
                No hay mensajes preparados aún.
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                En cada lead, usa "✨ Preparar" para añadir aquí.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {staged.length > 0 ? `${staged.length} Preparados` : ''} {queued.length > 0 ? `· ${queued.length} En Cola` : ''}
              </h3>
              {[...staged, ...queued].map(lead => (
                <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    lead.automation_status === 'queued' ? 'bg-primary animate-pulse' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-700 truncate">
                      {leads.find(l => l.id === lead.id)?.nombre_salon || lead.id.slice(0, 8)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        lead.staged_etapa === 'apertura' ? 'bg-primary/10 text-primary' :
                        lead.staged_etapa === 'activador' ? 'bg-amber-100 text-amber-600' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {lead.staged_etapa}
                      </span>
                      {lead.scheduled_at && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(lead.scheduled_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => unstage(lead.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RADAR ── */}
      {activeTab === 'radar' && (
        <div className="p-5 sm:p-6">
          <DailySummary todayStats={todayStats} yesterdayStats={yesterdayStats} />
          
          <div className="border-t border-slate-100 pt-6 mt-2">
            <ResponseHeatMap heatMapData={heatMapData} />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              {
                label: 'Tasa Respuesta',
                value: analyticsLeads.length > 0
                  ? `${Math.round((analyticsLeads.filter(l => l.respondido_at).length / analyticsLeads.length) * 100)}%`
                  : 'N/A',
                color: 'emerald',
                icon: TrendingUp,
              },
              {
                label: 'Total Enviados',
                value: analyticsLeads.length,
                color: 'blue',
                icon: Send,
              },
              {
                label: 'Ghosting',
                value: ghostingLeads.length,
                color: 'slate',
                icon: Ghost,
              },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                <stat.icon size={16} className={`text-${stat.color}-500 mx-auto mb-2`} />
                <p className={`text-lg font-black text-${stat.color}-600`}>{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
