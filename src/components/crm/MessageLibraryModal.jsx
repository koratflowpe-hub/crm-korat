import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit3, Trash2, Save, BookOpen, Send, ThumbsUp,
  Target, Zap, History, HeartPulse, Clock, Star, Megaphone,
  ChevronRight, ChevronLeft, PlayCircle, Sparkles, Check
} from 'lucide-react';
import { useTemplates } from '../../hooks/useTemplates';
import { getTemplateRating } from '../../utils/crmHelpers';

// ─── Mobile view: 'categories' | 'list' | 'editor'
const MessageLibraryModal = ({ isOpen, onClose, initialTab = 'apertura' }) => {
  const { templates, createTemplate, updateTemplate, deleteTemplate, incrementSuccessCount, isLoading } = useTemplates();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingId, setEditingId] = useState(null);
  const [mobileView, setMobileView] = useState('categories'); // mobile step
  const [formData, setFormData] = useState({ nombre: '', contenido: '', etapa: initialTab });
  const [saved, setSaved] = useState(false);

  const CORE_ITEMS = [
    { id: 'apertura',   label: '01. Apertura',   icon: <Target className="w-5 h-5" />,     color: 'indigo',  bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200' },
    { id: 'activador',  label: '02. Activador',  icon: <Zap className="w-5 h-5" />,        color: 'amber',   bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200'  },
    { id: 'video_pilar',label: '03. Video Pilar',icon: <PlayCircle className="w-5 h-5" />, color: 'rose',    bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200'   },
    { id: 'cierre',     label: '04. Cierre',     icon: <Sparkles className="w-5 h-5" />,   color: 'purple',  bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200' },
  ];

  const EXTENDED_GROUPS = [
    {
      label: 'Protocolo de Rescate',
      items: [
        { id: 'rescate_35', label: 'Ausente: 35 días', icon: <History className="w-5 h-5" />, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'rescate_60', label: 'Ausente: 60 días', icon: <History className="w-5 h-5" />, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'rescate_90', label: 'Ausente: 90 días', icon: <HeartPulse className="w-5 h-5" />, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
      ]
    },
    {
      label: 'Recordatorios y Fidelización',
      items: [
        { id: 'rec_24h',   label: 'Recordatorio 24h',  icon: <Clock className="w-5 h-5" />,     bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'rec_3h',    label: 'Recordatorio 3h',   icon: <Clock className="w-5 h-5" />,     bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'post_cita', label: 'Encuesta Post-Cita',icon: <Star className="w-5 h-5" />,      bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'marketing', label: 'Marketing / Otros', icon: <Megaphone className="w-5 h-5" />, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
      ]
    },
  ];

  const ALL_ITEMS = [...CORE_ITEMS, ...EXTENDED_GROUPS.flatMap(g => g.items)];

  useEffect(() => {
    if (isOpen) {
      const isExtended = EXTENDED_GROUPS.flatMap(g => g.items).some(i => i.id === initialTab);
      const validStages = ALL_ITEMS.map(i => i.id);
      const tab = (validStages.includes(initialTab) && initialTab !== 'seguimiento') ? initialTab : 'apertura';
      setActiveTab(tab);
      setFormData({ nombre: '', contenido: '', etapa: tab });
      setEditingId(null);
      setMobileView('categories');
    }
  }, [isOpen, initialTab]);

  const activeInfo = ALL_ITEMS.find(i => i.id === activeTab);

  const filteredTemplates = templates
    .filter(t => t.etapa === activeTab)
    .sort((a, b) => {
      const rA = a.sent_count ? (a.success_count / a.sent_count) : 0;
      const rB = b.sent_count ? (b.success_count / b.sent_count) : 0;
      return rB - rA;
    });

  const getWinRate = (sent, success) => !sent ? 0 : Math.round((success / sent) * 100);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setFormData(prev => ({ ...prev, etapa: id }));
    setEditingId(null);
    setMobileView('list');
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setFormData({ nombre: t.nombre, contenido: t.contenido, etapa: t.etapa });
    setMobileView('editor');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: '', contenido: '', etapa: activeTab });
    setMobileView('list');
  };

  const handleSave = () => {
    if (!formData.nombre.trim() || !formData.contenido.trim()) return;
    if (editingId) updateTemplate(editingId, formData);
    else createTemplate(formData);
    setSaved(true);
    setTimeout(() => { setSaved(false); cancelEdit(); }, 1200);
  };

  if (!isOpen) return null;

  // ─────────────────────────────── RENDER ────────────────────────────────
  return (
    <div className="fixed inset-0 bg-white flex flex-col z-[200]">
      {/* Full-screen container — no padding, no max-width, no backdrop */}
      <div className="w-full h-full flex flex-col">

        {/* ── HEADER ── */}
        <div className="flex-none px-5 sm:px-8 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3 bg-white shadow-sm">
          {/* Back button — shown only on mobile when not on categories */}
          {mobileView !== 'categories' && (
            <button
              onClick={() => { setMobileView(mobileView === 'editor' && !editingId ? 'list' : mobileView === 'editor' ? 'list' : 'categories'); if (editingId && mobileView === 'editor') cancelEdit(); }}
              className="sm:hidden p-2 -ml-1 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl flex-none">
            <BookOpen size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {mobileView === 'categories' && 'Biblioteca de Mensajes'}
              {mobileView === 'list' && (activeInfo?.label || 'Scripts')}
              {mobileView === 'editor' && (editingId ? 'Editar Script' : 'Nuevo Script')}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {mobileView === 'categories' && 'Selecciona una categoría'}
              {mobileView === 'list' && `${filteredTemplates.length} plantillas guardadas`}
              {mobileView === 'editor' && 'Personaliza el mensaje'}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex-none">
            <X size={20} />
          </button>
        </div>

        {/* ── DESKTOP: 3-column layout  /  MOBILE: step-by-step ── */}
        <div className="flex-1 overflow-hidden flex">

          {/* ── PANEL 1: Categories (always visible on desktop, step 1 on mobile) ── */}
          <div className={`
            flex-none w-full sm:w-72 lg:w-80 sm:border-r border-slate-100 overflow-y-auto bg-slate-50/40
            ${mobileView !== 'categories' ? 'hidden sm:flex sm:flex-col' : 'flex flex-col'}
            p-5 gap-6
          `}>
            {/* Core scripts */}
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.18em] px-1 mb-2">🚀 Scripts de Venta</p>
              <div className="space-y-1.5">
                {CORE_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                      activeTab === item.id
                        ? `${item.bg} ${item.text} ${item.border} border shadow-sm`
                        : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent'
                    }`}
                  >
                    <span className={activeTab === item.id ? item.text : 'text-slate-400'}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight size={15} className="opacity-40" />
                  </button>
                ))}
              </div>
            </div>

            {/* Extended groups */}
            {EXTENDED_GROUPS.map(group => (
              <div key={group.label}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-1 mb-2">{group.label}</p>
                <div className="space-y-1.5">
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                        activeTab === item.id
                          ? 'bg-white text-indigo-600 border border-indigo-200 shadow-sm'
                          : 'text-slate-500 hover:bg-white hover:shadow-sm border border-transparent'
                      }`}
                    >
                      <span className={activeTab === item.id ? 'text-indigo-500' : 'text-slate-400'}>{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight size={15} className="opacity-40" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── PANEL 2: Template list (step 2 on mobile) ── */}
          <div className={`
            flex-none sm:flex-none w-full sm:w-80 lg:w-96 border-r border-slate-100 overflow-y-auto bg-white
            ${mobileView !== 'list' ? 'hidden sm:flex sm:flex-col' : 'flex flex-col'}
            p-5 gap-4
          `}>
            {/* Add new button */}
            <button
              onClick={() => { setEditingId(null); setFormData({ nombre: '', contenido: '', etapa: activeTab }); setMobileView('editor'); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 text-sm font-black hover:bg-indigo-50 active:scale-[0.98] transition-all"
            >
              <Plus size={16} /> Nuevo Script
            </button>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-16 text-slate-300">
                <div className="animate-spin text-3xl">⏳</div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">✍️</div>
                <p className="text-slate-500 font-bold text-sm">Sin plantillas aún</p>
                <p className="text-slate-400 text-xs mt-1">Crea tu primer script arriba</p>
              </div>
            ) : (
              filteredTemplates.map(t => {
                const winRate = getWinRate(t.sent_count, t.success_count);
                const rateColor = winRate >= 15
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : winRate > 0 ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-slate-400 bg-slate-100 border-slate-200';
                return (
                  <div
                    key={t.id}
                    onClick={() => handleEdit(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
                      editingId === t.id
                        ? 'bg-indigo-50 border-indigo-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-500 text-[11px] font-bold mb-0.5">{getTemplateRating(t.sent_count, t.success_count)}</p>
                        <h4 className="font-black text-slate-900 text-sm leading-snug">{t.nombre}</h4>
                      </div>
                      <div className="flex gap-1 flex-none">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{t.contenido}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Send size={9} /> {t.sent_count || 0}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${rateColor}`}>
                          {winRate}%
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); incrementSuccessCount(t.id, t.success_count || 0); }}
                        className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-xl border border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                      >
                        <ThumbsUp size={10} /> +1
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── PANEL 3: Editor (step 3 on mobile) ── */}
          <div className={`
            flex-1 overflow-hidden bg-white
            ${mobileView !== 'editor' ? 'hidden sm:flex sm:flex-col' : 'flex flex-col'}
          `}>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-16 flex flex-col gap-6 max-w-4xl w-full mx-auto">

            {/* Nombre */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Script</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full text-xl font-bold p-5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                placeholder="Ej: Apertura — Opción B"
              />
            </div>

            {/* Etapa */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Etapa / Categoría</label>
              <select
                value={formData.etapa}
                onChange={e => setFormData({ ...formData, etapa: e.target.value })}
                className="w-full text-base font-bold p-5 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <optgroup label="Scripts Principales">
                  {CORE_ITEMS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </optgroup>
                {EXTENDED_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Mensaje */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Contenido del Mensaje</label>
                <div className="flex gap-1.5">
                  {['{{nombre_salon}}', '{{direccion}}'].map(v => (
                    <button
                      key={v}
                      onClick={() => setFormData({ ...formData, contenido: formData.contenido + v })}
                      className="text-[9px] font-black px-2 py-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    >
                      {v === '{{nombre_salon}}' ? '+Nombre' : '+Dirección'}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={formData.contenido}
                onChange={e => setFormData({ ...formData, contenido: e.target.value })}
                className="w-full text-lg leading-relaxed font-medium p-6 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none bg-slate-50/30"
                style={{ minHeight: '260px' }}
                placeholder="Escribe el mensaje aquí... ✨&#10;&#10;Usa emojis y saltos de línea para hacerlo más legible."
              />
              <p className="text-right text-[10px] text-slate-300 font-bold mt-1">{formData.contenido.length} caracteres</p>
            </div>

            {/* Desktop-only action buttons (inside scroll area) */}
            <div className="hidden sm:flex gap-3 pt-2">
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-base font-black rounded-2xl transition-all active:scale-95"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!formData.nombre.trim() || !formData.contenido.trim()}
                className={`flex-[2] flex items-center justify-center gap-2.5 py-5 text-white text-base font-black rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
                  saved ? 'bg-emerald-500 shadow-emerald-100' : editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                }`}
              >
                {saved ? <><Check size={20} /> ¡Guardado!</> : <><Save size={20} /> {editingId ? 'Guardar Cambios' : 'Crear Script'}</>}
              </button>
            </div>

            </div>{/* end scrollable */}
          </div>

        </div>

        {/* ── EDITOR: Scrollable content + pinned actions footer ── */}
        {/* Rendered outside the 3-col flex so it can overlay properly on mobile */}

        {/* ── MOBILE bottom nav indicator (step dots) ── */}
        <div className="flex-none sm:hidden flex justify-center gap-2 py-4 bg-white border-t border-slate-100">
          {['categories', 'list', 'editor'].map((step) => (
            <div key={step} className={`h-1.5 rounded-full transition-all ${mobileView === step ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        {/* ── MOBILE: Pinned action buttons (always above bottom nav) ── */}
        {mobileView === 'editor' && (
          <div className="flex-none sm:hidden flex gap-3 px-5 pt-3 pb-5 bg-white border-t border-slate-100"
               style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
            {editingId && (
              <button
                onClick={cancelEdit}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-base font-black rounded-2xl transition-all active:scale-95"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!formData.nombre.trim() || !formData.contenido.trim()}
              className={`flex-[2] flex items-center justify-center gap-2.5 py-4 text-white text-base font-black rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-40 ${
                saved ? 'bg-emerald-500 shadow-emerald-100' : editingId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              {saved ? <><Check size={20} /> ¡Guardado!</> : <><Save size={20} /> {editingId ? 'Guardar Cambios' : 'Crear Script'}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageLibraryModal;
