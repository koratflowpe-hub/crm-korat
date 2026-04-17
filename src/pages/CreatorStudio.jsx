import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { 
  Target, Plus, Search, ChevronRight, ChevronDown, MoreVertical, 
  Zap, Clock, Layout, Layers, Palette, X, Check, AlertCircle, Trash2, Edit, Info, Sparkles,
  TrendingUp, Video, MousePointerClick, Calendar, Filter, ArrowUpRight, BarChart3,
  RefreshCw, Layers2, ShieldCheck, Gem, Hash, BookOpen, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BrandSwitcher from '../components/BrandSwitcher';
import ScriptEditorModal from '../components/ScriptEditorModal';
import ConfirmModal from '../components/ConfirmModal';
import HooksManager from '../components/HooksManager';
import CtasManager from '../components/CtasManager';
import BulkImportModal from '../components/BulkImportModal';
import { n8nService } from '../services/n8nService';
import { useThemeStore } from '../store/themeStore';

const STATUS_CONFIG = {
  idea:             { label: 'Incubación',      color: 'bg-cyan-500',      icon: <Sparkles size={14} /> },
  writing:          { label: 'Guionización',    color: 'bg-violet-500',    icon: <Edit size={14} /> },
  ready:            { label: 'Listo 🎥',        color: 'bg-emerald-500',   icon: <Check size={14} /> },
  recorded:         { label: 'Grabado',         color: 'bg-rose-500',      icon: <Video size={14} /> },
  published:        { label: 'Publicado',       color: 'bg-slate-500',     icon: <ShieldCheck size={14} /> },
};

const COLUMN_ORDER = ['idea', 'writing', 'ready', 'recorded', 'published'];

const PILLAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
];

// ─── Modal: Pillar ────────────────────────────────────────────────────────────
function PillarModal({ pillar, brand, onClose, onSave }) {
  const [form, setForm] = useState({
    name: pillar?.name || '',
    hex_color: pillar?.hex_color || PILLAR_COLORS[0],
    description: pillar?.description || '',
    objective: pillar?.objective || '',
    keywords: pillar?.keywords?.join(', ') || ''
  });
  const [saving, setSaving]   = useState(false);
  const [brainstorming, setBrainstorming] = useState(false);
  const [error, setError]     = useState(null);

  const handleBrainstorm = async () => {
    try {
      setBrainstorming(true);
      setError(null);
      const res = await n8nService.triggerPillarAi({
        brand_name: brand?.name,
        brand_description: brand?.description || '',
        current_pillar_name: form.name
      });
      if (res) {
        setForm(prev => ({
          ...prev,
          name: res.name || prev.name,
          description: res.description || prev.description,
          objective: res.objective || prev.objective,
          keywords: Array.isArray(res.keywords) ? res.keywords.join(', ') : (res.keywords || prev.keywords)
        }));
      }
    } catch (err) {
      setError("Error al conectar con el cerebro de IA.");
    } finally {
      setBrainstorming(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      name: form.name.trim(),
      hex_color: form.hex_color,
      description: form.description,
      objective: form.objective,
      keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
      user_id: user.id
    };
    let res;
    if (pillar?.id) {
      res = await supabase.from('pillars').update(payload).eq('id', pillar.id).select().single();
    } else {
      res = await supabase.from('pillars').insert([payload]).select().single();
    }
    if (res.error) {
      setError(`Error: ${res.error.message}`);
      setSaving(false);
    } else {
      onSave(res.data);
      onClose();
    }
  };

  return (
    <div className="cs-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 24 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.96, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="cs-modal-sheet"
      >
        {/* Header */}
        <div className="cs-modal-header">
          <div className="cs-modal-header-left">
            <div 
              className="cs-modal-icon" 
              style={{ backgroundColor: form.hex_color + '18', color: form.hex_color }}
            >
              {brainstorming 
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={22} /></motion.div> 
                : <Target size={22} strokeWidth={2.5}/>
              }
            </div>
            <div>
              <h2 className="cs-modal-title">{pillar ? 'Editar Estrategia' : 'Nueva Dimensión'}</h2>
              <div className="cs-modal-subtitle">
                <div className="cs-dot cs-dot--green" />
                <span>Cerebro Maestro</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="cs-modal-close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cs-modal-body">
          <div className="cs-modal-grid">
            {/* Left col */}
            <div className="cs-field-group">
              <div className="cs-field">
                <label className="cs-label">Nombre del Pilar Maestro</label>
                <input 
                  autoFocus type="text" value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ej: Tutoriales Pro..."
                  className="cs-input"
                />
                <div className="cs-color-palette">
                  {PILLAR_COLORS.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setForm({...form, hex_color: c})} 
                      className={`cs-color-swatch ${form.hex_color === c ? 'cs-color-swatch--active' : ''}`}
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>
              </div>
              <div className="cs-field">
                <label className="cs-label">Objetivo de Impacto</label>
                <textarea 
                  value={form.objective} 
                  onChange={e => setForm({...form, objective: e.target.value})}
                  placeholder="¿Qué transformación buscas en tu audiencia?"
                  className="cs-input cs-textarea cs-textarea--sm"
                />
              </div>
            </div>

            {/* Right col */}
            <div className="cs-field-group">
              <div className="cs-field">
                <label className="cs-label">Manifiesto / Descripción</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Define el ADN de este contenido..."
                  className="cs-input cs-textarea cs-textarea--md"
                />
              </div>
              <div className="cs-field">
                <label className="cs-label">Cerebro de Keywords</label>
                <div className="cs-input-icon-wrap">
                  <Hash size={16} className="cs-input-icon" />
                  <input 
                    type="text" value={form.keywords} 
                    onChange={e => setForm({...form, keywords: e.target.value})}
                    placeholder="ia, hacks, tutorial..."
                    className="cs-input cs-input--pl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="cs-modal-error">{error}</p>}

        {/* Footer Actions */}
        <div className="cs-modal-footer">
          <button 
            onClick={handleBrainstorm}
            disabled={brainstorming}
            className={`cs-btn cs-btn--ai ${brainstorming ? 'cs-btn--loading' : ''}`}
          >
            {brainstorming 
              ? <div className="cs-spinner" /> 
              : <Sparkles size={18} />
            }
            <span>{brainstorming ? 'Canalizando IA...' : 'Empoderar IA'}</span>
          </button>
          <button onClick={handleSave} className="cs-btn cs-btn--primary cs-btn--flex2">
            {saving 
              ? <div className="cs-spinner cs-spinner--dark" /> 
              : <ShieldCheck size={18} strokeWidth={3} />
            }
            <span>{pillar ? 'Consolidar Cambios' : 'Asegurar en Nube'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Pillar Info ───────────────────────────────────────────────────────
function PillarInfoModal({ pillar, onClose, onStartCreating, onEdit }) {
  return (
    <div className="cs-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="cs-modal-sheet cs-modal-sheet--info"
      >
        <button onClick={onClose} className="cs-modal-close cs-modal-close--abs">
          <X size={18} />
        </button>

        {/* Decorative bg icon */}
        <div className="cs-modal-deco" style={{ color: pillar.hex_color }}>
          <Target size={300} />
        </div>

        <div className="cs-modal-body cs-relative">
          {/* Pillar hero */}
          <div className="cs-pillar-hero">
            <div 
              className="cs-pillar-hero-icon" 
              style={{ backgroundColor: pillar.hex_color }}
            >
              <div className="cs-pillar-hero-glow" />
              <Zap size={36} fill="currentColor" />
            </div>
            <div>
              <h2 className="cs-pillar-hero-name">{pillar.name}</h2>
              <div className="cs-modal-subtitle">
                <div className="cs-dot cs-dot--primary cs-dot--pulse" />
                <span>ADN Estratégico</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="cs-field" style={{ marginTop: '1.5rem' }}>
            <h3 className="cs-label">Estrategia Viral</h3>
            <p 
              className="cs-quote-block" 
              style={{ borderLeftColor: pillar.hex_color }}
            >
              "{pillar.description || 'Este pilar aún no tiene una definición conceptual completa.'}"
            </p>
          </div>

          {/* 2-col info */}
          <div className="cs-info-grid">
            <div className="cs-field">
              <h3 className="cs-label">Meta Principal</h3>
              <div className="cs-info-card">
                <p className="cs-info-text">{pillar.objective || 'Sin objetivo definido.'}</p>
              </div>
            </div>
            <div className="cs-field">
              <h3 className="cs-label">Keywords Maestro</h3>
              <div className="cs-tags-wrap">
                {pillar.keywords?.length > 0 
                  ? pillar.keywords.map(k => (
                    <span key={k} className="cs-tag">#{k}</span>
                  )) 
                  : <p className="cs-empty-text">N/A</p>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cs-modal-footer">
          <button onClick={() => onEdit(pillar)} className="cs-btn cs-btn--ghost">
            <Edit size={16} /> Ajustar Estrategia
          </button>
          <button 
            onClick={() => onStartCreating(pillar.id)}
            className="cs-btn cs-btn--primary cs-btn--flex2"
          >
            <Plus size={20} strokeWidth={3} /> Desplegar Nueva Idea
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Nuevo Guión ───────────────────────────────────────────────────────
function ScriptModal({ pillars, defaultPillarId, defaultStatus, brandId, onClose, onSave }) {
  const navigate = useNavigate();
  const [title, setTitle]       = useState('');

  const [pillarId, setPillarId] = useState(defaultPillarId || pillars[0]?.id || '');
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('scripts')
      .insert([{ 
        title: title.trim(), 
        pillar_id: pillarId || null,
        status: defaultStatus || 'idea',
        brand_id: brandId,
        user_id: user.id
      }])
      .select('*, pillars(name, hex_color)')
      .single();
    if (!error) {
      onSave(data);
      navigate(`/studio/edit/${data.id}`);
    }
    onClose();

  };

  return (
    <div className="cs-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.96, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="cs-modal-sheet cs-modal-sheet--sm"
      >
        <div className="cs-modal-header">
          <div className="cs-modal-header-left">
            <div className="cs-modal-icon cs-modal-icon--primary">
              <Video size={20} />
            </div>
            <h2 className="cs-modal-title">Incubar Video</h2>
          </div>
        </div>

        <div className="cs-modal-body">
          <div className="cs-field-group">
            <div className="cs-field">
              <label className="cs-label">Título de Producción</label>
              <input 
                autoFocus type="text" value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ej: Mi Viaje con n8n..." 
                className="cs-input" 
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="cs-field">
              <label className="cs-label">Asignar a Pilar Maestro</label>
              <div className="cs-input-icon-wrap">
                <Layers2 size={16} className="cs-input-icon" />
                <select 
                  value={pillarId} 
                  onChange={e => setPillarId(e.target.value)} 
                  className="cs-input cs-input--pl cs-select"
                >
                  <option value="">🎯 Sin pilar — Contenido Huérfano</option>
                  {pillars.map(p => (
                    <option key={p.id} value={p.id}>💎 {p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="cs-modal-footer">
          <button onClick={onClose} className="cs-btn cs-btn--ghost">Abortar</button>
          <button onClick={handleSave} className="cs-btn cs-btn--primary cs-btn--flex2">
            {saving ? <div className="cs-spinner cs-spinner--dark" /> : null}
            Consolidar Idea
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CreatorStudio() {
  const navigate = useNavigate();
  const terminalScrollRef = useRef(null);

  const [activeTab, setActiveTab] = useState(COLUMN_ORDER[0]);
  const [viewMode, setViewMode]   = useState('production'); // 'production' | 'strategy'
  const [brands, setBrands]           = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [pillars, setPillars]         = useState([]);
  const [scripts, setScripts]         = useState([]);
  const [tags, setTags]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pillarToDelete, setPillarToDelete] = useState(null);

  const [showPillarModal, setShowPillarModal]   = useState(false);
  const [editingPillar, setEditingPillar]       = useState(null);
  const [viewingPillarInfo, setViewingPillarInfo] = useState(null);
  const [showHooksManager, setShowHooksManager] = useState(false);
  const [showCtasManager, setShowCtasManager] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showScriptModal, setShowScriptModal]   = useState(false);
  const [scriptModalStatus, setScriptModalStatus] = useState('idea');
  const [scriptModalPillarId, setScriptModalPillarId] = useState('');
  const [pillarSearch, setPillarSearch] = useState('');
  const [showPillarSelector, setShowPillarSelector] = useState(false);
  const [showPillarDrawer, setShowPillarDrawer] = useState(false);
  const { setSidebarHidden } = useThemeStore();

  useEffect(() => { fetchData(); }, []);


  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [pRes, sRes, tRes, bRes] = await Promise.all([
      supabase.from('pillars').select('*').order('created_at', { ascending: false }),
      supabase.from('scripts').select('*, pillars(*)').order('updated_at', { ascending: false }),
      supabase.from('tags').select('*'),
      supabase.from('brands').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    const activeBrands = bRes.data || [];
    setBrands(activeBrands);

    if (activeBrands.length > 0) {
      setSelectedBrand(activeBrands[0]);
    } else {
      const { data } = await supabase.from('brands').insert([{ name: 'Marca Personal', user_id: user.id }]).select().single();
      if (data) { setBrands([data]); setSelectedBrand(data); }
    }

    setPillars(pRes.data || []);
    setScripts(sRes.data || []);
    setTags(tRes.data || []);
    setLoading(false);
  };

  const handlePillarSave = (p) => {
    if (editingPillar) { setPillars(pillars.map(x => x.id === p.id ? p : x)); } 
    else { setPillars([p, ...pillars]); }
    setShowPillarModal(false);
    setEditingPillar(null);
  };

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    setScripts(prev => prev.map(s => s.id === draggableId ? { ...s, status: newStatus } : s));
    await supabase.from('scripts').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', draggableId);
  };

  const filteredScripts = scripts.filter(s => 
    s.brand_id === selectedBrand?.id && 
    (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.pillars?.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const container = terminalScrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const width = container.offsetWidth;
      const index = Math.round(scrollLeft / width);
      if (COLUMN_ORDER[index]) setActiveTab(COLUMN_ORDER[index]);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const getScriptsByStatus = (status) => filteredScripts.filter(s => s.status === status);


  const confirmDeletePillar = async () => {
    if (!pillarToDelete) return;
    const { error } = await supabase.from('pillars').delete().eq('id', pillarToDelete);
    if (!error) { setPillars(prev => prev.filter(p => p.id !== pillarToDelete)); setPillarToDelete(null); }
  };

  const openScriptModal = (status = 'idea', pilarId = '') => {
    setScriptModalStatus(status);
    setScriptModalPillarId(pilarId);
    setShowScriptModal(true);
  };

  const scrollToColumn = (col) => {
    setActiveTab(col);
    const container = terminalScrollRef.current;
    const el = document.getElementById(`column-${col}`);
    if (container && el) {
      container.style.scrollSnapType = 'none';
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setTimeout(() => { container.style.scrollSnapType = 'x mandatory'; }, 600);
    }
  };

  return (
    <>
      {/* ── Scoped Styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* ═══════════════════════════════════════════════════════════════
           CREATOR STUDIO — MOBILE-FIRST DESIGN SYSTEM
           All values: mobile → desktop via clamp() + @media min-width
        ═══════════════════════════════════════════════════════════════ */

        /* ── Root Layout ── */
        .cs-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          width: 100%;
          max-width: 100vw;
          background: #F8FAFC;
          overflow: hidden;
          overflow-x: hidden;
          box-sizing: border-box;
          /* iOS safe area */
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .dark .cs-root {
          background: #020617;
        }

        /* ── Top Bar ── */
        .cs-topbar {
          flex-shrink: 0;
          background: white;
          border-bottom: 1px solid #E2E8F0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        .dark .cs-topbar {
          background: #0F172A;
          border-bottom-color: #1E293B;
        }

        .cs-topbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          min-height: 64px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        .cs-topbar-row > * { min-width: 0; flex-shrink: 1; }
        @media (min-width: 1024px) {
          .cs-topbar-row { 
            padding: 16px 40px; 
          }
        }

        .cs-brand-mark {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .cs-brand-icon {
          width: 36px;
          height: 36px;
          background: #0F172A;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          flex-shrink: 0;
        }
        .dark .cs-brand-icon { background: white; }
        .cs-brand-icon svg { color: white; }
        .dark .cs-brand-icon svg { color: #0F172A; }
        
        .cs-brand-text { display: none; }
        @media (min-width: 480px) {
          .cs-brand-text { display: block; }
          .cs-brand-text h1 {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #0F172A;
            line-height: 1;
          }
          .dark .cs-brand-text h1 { color: white; }
          .cs-brand-text p {
            font-size: 11px;
            font-weight: 700;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-top: 2px;
          }
        }

        /* ── View Switcher ── */
        .cs-switcher-mobile {
          display: flex;
          padding: 0 16px 12px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cs-switcher-desktop { display: none; }
        @media (min-width: 1024px) {
          .cs-switcher-mobile { display: none; }
          .cs-switcher-desktop {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }
        }

        .cs-view-switcher {
          display: flex;
          background: #E2E8F0;
          padding: 4px;
          border-radius: 14px;
          gap: 4px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .cs-view-switcher { width: 360px; max-width: 360px; }
        }
        .dark .cs-view-switcher { background: #1E293B; }
        
        .cs-view-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .dark .cs-view-btn { color: #94A3B8; }
        .cs-view-btn--active {
          background: #6366F1;
          color: white !important;
          box-shadow: 0 4px 16px rgba(99,102,241,0.35);
        }
        .cs-view-btn svg { opacity: 0.7; }
        .cs-view-btn--active svg { opacity: 1; }


        /* ── Strategy Hub Layout (Mobile Focus) ── */
        .cs-deck-wrap {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .cs-strategy-deck {
          display: grid;
          padding: 16px;
          gap: 16px;
          flex: 1;
          grid-template-columns: 1fr;
          grid-auto-rows: min-content;
          align-content: start;
          overflow-y: auto; 
        }
        @media (min-width: 1024px) {
          .cs-strategy-deck {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            padding: 24px 40px;
            gap: 20px;
          }
        }

        /* Scroll fade indicators (left/right edges) */
        .cs-deck-wrap {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── Pillar Card ── */
        .cs-pillar-card {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          background: white;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
          text-align: left;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .cs-pillar-card {
          background: #0F172A;
          border-color: #1E293B;
        }
        .cs-pillar-card:active {
          transform: scale(0.98);
        }
        .cs-pillar-card:hover {
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }

        /* ── FAB & Searchable Selector ── */
        .cs-strategy-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: #F8FAFC;
        }
        .dark .cs-strategy-header { background: #020617; }
        
        .cs-pillar-selector-wrap {
          position: relative;
          flex: 1;
        }
        .cs-pillar-selector-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 14px;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }
        .dark .cs-pillar-selector-btn {
          background: #0F172A;
          border-color: #1E293B;
          color: #94A3B8;
        }
        .cs-pillar-selector-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 100;
          max-height: 250px;
          overflow-y: auto;
          padding: 8px;
        }
        .dark .cs-pillar-selector-dropdown {
          background: #0F172A;
          border-color: #1E293B;
        }
        .cs-pillar-search-input {
          width: 100%;
          padding: 8px 12px;
          background: #F1F5F9;
          border: none;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .dark .cs-pillar-search-input { background: #1E293B; color: white; }
        
        .cs-pillar-opt {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          text-align: left;
        }
        .cs-pillar-opt:hover { background: #F1F5F9; }
        .dark .cs-pillar-opt:hover { background: #1E293B; }

        .cs-strategy-fab {
          position: fixed;
          bottom: 24px;
          right: 20px;
          width: 56px;
          height: 56px;
          background: #6366F1;
          color: white;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
          z-index: 60;
        }
        @media (min-width: 1024px) {
          .cs-strategy-fab { display: none; }
          .cs-strategy-header {
            padding: 16px 40px 0;
            background: transparent;
          }
          .cs-pillar-selector-wrap { max-width: 300px; }
        }

        /* ── Strategy Drawer (Bottom Sheet) ── */
        .cs-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          z-index: 200;
        }
        .cs-drawer-content {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-radius: 24px 24px 0 0;
          padding: 20px 20px 40px;
          z-index: 201;
          max-height: 85vh;
          overflow-y: auto;
        }
        .dark .cs-drawer-content { background: #0F172A; border: 1px solid #1E293B; border-bottom: none; }
        
        .cs-drawer-handle {
          width: 40px;
          height: 4px;
          background: #E2E8F0;
          border-radius: 2px;
          margin: 0 auto 20px;
        }
        .dark .cs-drawer-handle { background: #334155; }
        
        .cs-drawer-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #0F172A;
        }
        .dark .cs-drawer-title { color: white; }
        @media (min-width: 640px) {
          .cs-pillar-card {
            width: 240px;
            padding: 16px;
          }
        }
        @media (min-width: 1024px) {
          .cs-pillar-card {
            /* In grid mode width is controlled by grid-template-columns */
            width: auto;
            padding: 18px;
            border-radius: 20px;
            flex-shrink: unset;
            scroll-snap-align: unset;
          }
        }

        .cs-pillar-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
        }
        .cs-pillar-card-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          flex: 1;
        }
        .cs-pillar-bar {
          width: 4px;
          height: 20px;
          border-radius: 99px;
          flex-shrink: 0;
        }
        .cs-pillar-name {
          font-size: clamp(12px, 3vw, 15px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #1E293B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s;
        }
        .dark .cs-pillar-name { color: #E2E8F0; }
        .cs-pillar-card:hover .cs-pillar-name { color: #6366F1; }

        .cs-pillar-count {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 900;
          color: #64748B;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }
        .dark .cs-pillar-count {
          background: #020617;
          border-color: #1E293B;
        }

        .cs-pillar-objective {
          font-size: 13px;
          color: #64748B;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 48px;
        }
        .dark .cs-pillar-objective { color: #475569; }
        .cs-pillar-objective--empty { color: #CBD5E1; }
        .dark .cs-pillar-objective--empty { color: #1E293B; }

        /* ── Library Hub ── */
        .cs-library-deck {
          display: grid;
          padding: 16px;
          gap: 16px;
          flex: 1;
          grid-template-columns: 1fr;
          align-content: start;
          overflow-y: auto;
        }
        @media (min-width: 1024px) {
          .cs-library-deck {
            grid-template-columns: repeat(2, 1fr);
            padding: 40px;
            gap: 24px;
            max-width: 1200px;
            margin: 0 auto;
          }
        }
        .cs-library-card {
          width: 100%;
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 24px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .dark .cs-library-card { background: #0F172A; border-color: #1E293B; }
        .cs-library-card:hover {
          border-color: #6366F1;
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(99,102,241,0.1);
        }
        .cs-library-card:active { transform: scale(0.98); }
        
        .cs-library-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cs-library-icon--hooks { background: rgba(99,102,241,0.1); color: #6366F1; }
        .cs-library-icon--ctas { background: rgba(236,72,153,0.1); color: #EC4899; }
        
        .cs-library-info { flex: 1; }
        .cs-library-info h3 {
          font-size: 18px;
          font-weight: 900;
          color: #1E293B;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }
        .dark .cs-library-info h3 { color: #F1F5F9; }
        .cs-library-info p {
          font-size: 13px;
          font-weight: 600;
          color: #94A3B8;
        }
        .cs-library-arrow {
          color: #CBD5E1;
          transition: transform 0.2s;
        }
        .cs-library-card:hover .cs-library-arrow {
          color: #6366F1;
          transform: translate(2px, -2px);
        }

        /* ── Add Pillar Button ── */
        .cs-pillar-add-btn {
          flex-shrink: 0;
          scroll-snap-align: start;
          width: clamp(100px, 36vw, 140px);
          padding: 14px;
          border-radius: 16px;
          border: 2px dashed #E2E8F0;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #94A3B8;
          -webkit-tap-highlight-color: transparent;
        }
        @media (min-width: 1024px) {
          .cs-pillar-add-btn {
            width: auto;
            min-height: 90px;
            flex-shrink: unset;
            scroll-snap-align: unset;
          }
        }
        .dark .cs-pillar-add-btn {
          border-color: #1E293B;
        }
        .cs-pillar-add-btn:hover {
          color: #6366F1;
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.04);
        }
        .cs-pillar-add-btn:hover .cs-pillar-add-icon {
          background: #6366F1;
          color: white;
          transform: scale(1.1);
        }
        .cs-pillar-add-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .dark .cs-pillar-add-icon {
          background: #1E293B;
        }
        .cs-pillar-add-label {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          text-align: center;
        }
        .cs-deck-spacer {
          width: 4px;
          flex-shrink: 0;
        }
        @media (min-width: 640px) { .cs-deck-spacer { width: 12px; } }

        /* ── Phase Navigator (Tab Bar) ── */
        .cs-phase-nav {
          flex-shrink: 0;
          padding: 8px 0 8px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #F1F5F9;
          z-index: 30;
        }
        .dark .cs-phase-nav {
          background: rgba(2,6,23,0.85);
          border-bottom-color: #1E293B;
        }
        .cs-phase-nav-inner {
          display: flex;
          align-items: center;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 0 16px;
          touch-action: pan-x;
        }
        .cs-phase-nav-inner::-webkit-scrollbar { display: none; }
        @media (min-width: 640px) {
          .cs-phase-nav-inner { padding: 0 24px; gap: 6px; }
        }
        @media (min-width: 1024px) {
          .cs-phase-nav-inner { padding: 0 40px; }
        }

        .cs-phase-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.18s;
          background: transparent;
          color: #94A3B8;
          border: none;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
          position: relative;
        }
        .cs-phase-btn:hover {
          background: #F8FAFC;
          color: #475569;
        }
        .dark .cs-phase-btn:hover {
          background: #1E293B;
          color: #94A3B8;
        }
        .cs-phase-btn--active {
          background: #0F172A;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .dark .cs-phase-btn--active {
          background: white;
          color: #0F172A;
        }
        /* Count badge inside tab */
        .cs-phase-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 900;
          line-height: 1;
          background: rgba(255,255,255,0.2);
          color: inherit;
        }
        .cs-phase-btn:not(.cs-phase-btn--active) .cs-phase-count {
          background: #F1F5F9;
          color: #64748B;
        }
        .dark .cs-phase-btn:not(.cs-phase-btn--active) .cs-phase-count {
          background: #1E293B;
          color: #64748B;
        }
        .cs-phase-nav-spacer { width: 8px; flex-shrink: 0; }

        /* ── Pagination Dots ── */
        .cs-pagination-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 0 6px;
          flex-shrink: 0;
        }
        @media (min-width: 1024px) {
          .cs-pagination-dots { display: none; }
        }
        .cs-dot-indicator {
          width: 6px;
          height: 6px;
          border-radius: 99px;
          background: #E2E8F0;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          flex-shrink: 0;
          border: none;
          padding: 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .cs-dot-indicator { background: #1E293B; }
        .cs-dot-indicator--active {
          width: 20px;
          background: #0F172A;
        }
        .dark .cs-dot-indicator--active { background: white; }

        /* ── Board Viewport (Horizontal Kanban) ── */
        .cs-board {
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .cs-board-scroll {
          flex: 1;
          display: flex;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          /* CRITICAL FIX: allow pan-x on the outer scroll container
             so that even if DragDropContext captures touch events,
             the browser still processes the horizontal swipe */
          touch-action: pan-x;
          scrollbar-width: none;
          scroll-behavior: smooth;
          overscroll-behavior-x: contain;
        }
        .cs-board-scroll::-webkit-scrollbar { display: none; }

        /* ── Kanban Column ── */
        .cs-column {
          /* Mobile: 1 column fills the viewport */
          width: 100vw;
          flex-shrink: 0;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #F1F5F9;
          height: 100%;
          /* Each column allows vertical pan only */
          touch-action: pan-y;
        }
        .dark .cs-column {
          border-right-color: rgba(30,41,59,0.5);
        }
        @media (min-width: 640px) {
          .cs-column {
            width: min(360px, 88vw);
          }
        }
        @media (min-width: 1024px) {
          .cs-board-scroll {
            scroll-snap-type: none;
            touch-action: auto;
          }
          .cs-column {
            width: 300px;
            min-width: 260px;
            flex-shrink: 0;
            touch-action: auto;
          }
        }
        @media (min-width: 1280px) {
          .cs-column { width: 320px; }
        }

        .cs-column-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #F8FAFC;
          flex-shrink: 0;
        }
        .dark .cs-column-header { border-bottom-color: rgba(15,23,42,0.5); }
        .cs-column-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cs-column-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .cs-column-title {
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #1E293B;
        }
        .dark .cs-column-title { color: #E2E8F0; }
        .cs-column-count {
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 99px;
          padding: 2px 10px;
        }
        .dark .cs-column-count {
          background: #0F172A;
          border-color: #1E293B;
        }

        .cs-column-body {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: #E2E8F0 transparent;
          /* vertical-only scroll within each column */
          touch-action: pan-y;
          overscroll-behavior-y: contain;
        }
        .dark .cs-column-body {
          scrollbar-color: #1E293B transparent;
        }
        .cs-column-body::-webkit-scrollbar { width: 4px; }
        .cs-column-body::-webkit-scrollbar-track { background: transparent; }
        .cs-column-body::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }
        .dark .cs-column-body::-webkit-scrollbar-thumb { background: #1E293B; }
        .cs-column-body--dragging-over {
          background: rgba(99,102,241,0.03);
        }

        /* ── Empty Column State ── */
        .cs-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 24px;
          text-align: center;
          opacity: 0.6;
        }
        .cs-empty-state-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
        }
        .dark .cs-empty-state-icon {
          background: #1E293B;
        }
        .cs-empty-state-text {
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
          line-height: 1.5;
        }
        .cs-empty-state-cta {
          padding: 10px 20px;
          background: #0F172A;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .cs-empty-state-cta {
          background: white;
          color: #0F172A;
        }
        .cs-empty-state-cta:active { transform: scale(0.97); opacity: 0.85; }

        /* ── Script Card ── */
        .cs-script-card {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .cs-script-card {
          background: #0F172A;
          border-color: #1E293B;
        }
        .cs-script-card:hover {
          border-color: rgba(99,102,241,0.35);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .cs-script-card:active {
          transform: scale(0.985);
        }
        .cs-script-card--dragging {
          box-shadow: 0 16px 40px rgba(0,0,0,0.18) !important;
          border-color: #6366F1 !important;
          transform: scale(1.02) !important;
          z-index: 50;
        }
        .cs-script-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          gap: 8px;
        }
        .cs-script-pillar-tag {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
        }
        .cs-script-pillar-tag--empty {
          color: #94A3B8;
          background: #F8FAFC;
          border-color: #E2E8F0;
        }
        .dark .cs-script-pillar-tag--empty {
          background: #1E293B;
          border-color: #334155;
        }
        .cs-script-date {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #94A3B8;
          flex-shrink: 0;
        }
        .cs-script-date span {
          font-size: 11px;
          font-weight: 700;
        }
        .cs-script-title {
          font-size: clamp(15px, 4vw, 18px);
          font-weight: 700;
          color: #1E293B;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dark .cs-script-title { color: #F1F5F9; }

        /* ── Add Idea Button ── */
        .cs-add-idea-btn {
          width: 100%;
          padding: 16px;
          border: 2px dashed #E2E8F0;
          border-radius: 14px;
          background: transparent;
          color: #94A3B8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 4px;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .cs-add-idea-btn {
          border-color: #1E293B;
        }
        .cs-add-idea-btn:hover {
          color: #6366F1;
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.03);
        }

        /* ── Floating Action Buttons ── */
        .cs-fab-group {
          position: fixed;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          right: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 100;
        }
        @media (min-width: 640px) {
          .cs-fab-group { bottom: 24px; right: 24px; }
        }
        /* On mobile push up above bottom nav */
        @media (max-width: 767px) {
          .cs-fab-group {
            bottom: calc(80px + env(safe-area-inset-bottom, 0px));
          }
        }

        .cs-fab {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .cs-fab:active { transform: scale(0.9); }
        .cs-fab--secondary {
          width: 46px;
          height: 46px;
          background: white;
          color: #64748B;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .dark .cs-fab--secondary {
          background: #0F172A;
          border-color: #1E293B;
          color: #94A3B8;
        }
        .cs-fab--secondary:hover { color: #6366F1; }
        .cs-fab--pink {
          color: #EC4899;
        }
        .cs-fab--pink:hover { 
          color: #EC4899 !important;
          background: rgba(236,72,153,0.05) !important;
          border-color: rgba(236,72,153,0.2) !important;
        }
        .cs-fab--primary {
          width: 56px;
          height: 56px;
          background: #0F172A;
          color: white;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        }
        .dark .cs-fab--primary {
          background: white;
          color: #0F172A;
        }
        .cs-fab--primary:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 32px rgba(0,0,0,0.3);
        }

        /* ═══════════════════════════════════════════════════════════════
           MODAL SYSTEM
        ═══════════════════════════════════════════════════════════════ */
        .cs-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(2,6,23,0.5);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .cs-modal-sheet {
          width: 100%;
          max-width: 800px;
          max-height: 92dvh;
          background: white;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.3);
        }
        .dark .cs-modal-sheet {
          background: #0F172A;
          border: 1px solid #1E293B;
        }
        @media (min-width: 640px) {
          .cs-modal-sheet {
            max-height: 88vh;
          }
        }

        /* Drag indicator on mobile */
        .cs-modal-sheet::before {
          content: '';
          display: block;
          width: 36px;
          height: 4px;
          background: #E2E8F0;
          border-radius: 99px;
          margin: 10px auto 4px;
          flex-shrink: 0;
        }
        .dark .cs-modal-sheet::before { background: #334155; }
        @media (min-width: 640px) {
          .cs-modal-sheet::before { display: none; }
        }

        .cs-modal-sheet--sm { max-width: 480px; }
        .cs-modal-sheet--info { max-width: 640px; }

        .cs-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0;
        }
        .dark .cs-modal-header { border-bottom-color: #1E293B; }
        @media (min-width: 640px) {
          .cs-modal-header { padding: 20px 28px 16px; }
        }
        .cs-modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }
        .cs-modal-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .cs-modal-icon--primary {
          background: rgba(99,102,241,0.1);
          color: #6366F1;
        }
        .cs-modal-title {
          font-size: clamp(20px, 5vw, 26px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0F172A;
          line-height: 1;
        }
        .dark .cs-modal-title { color: white; }
        .cs-modal-subtitle {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }
        .cs-modal-subtitle span {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #94A3B8;
        }
        .cs-modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #F8FAFC;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .dark .cs-modal-close {
          background: #1E293B;
          color: #94A3B8;
        }
        .cs-modal-close:hover {
          background: #EEF2FF;
          color: #6366F1;
        }
        .cs-modal-close--abs {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
        }
        @media (min-width: 640px) {
          .cs-modal-close--abs { top: 20px; right: 20px; }
        }

        .cs-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          scrollbar-width: thin;
        }
        @media (min-width: 640px) {
          .cs-modal-body { padding: 20px 28px; }
        }

        .cs-modal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .cs-modal-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
        }

        .cs-field-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .cs-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cs-label {
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #94A3B8;
          padding-left: 2px;
        }

        .cs-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: white;
          font-size: 16px;
          font-weight: 600;
          color: #1E293B;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          -webkit-appearance: none;
        }
        .dark .cs-input {
          background: #020617;
          border-color: #1E293B;
          color: #F1F5F9;
        }
        .cs-input::placeholder { color: #CBD5E1; }
        .cs-input:focus {
          border-color: #6366F1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .cs-textarea { resize: none; line-height: 1.6; }
        .cs-textarea--sm { height: 90px; }
        .cs-textarea--md { height: 110px; }
        @media (min-width: 640px) {
          .cs-textarea--sm { height: 110px; }
          .cs-textarea--md { height: 140px; }
        }
        .cs-input-icon-wrap { position: relative; }
        .cs-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
          transition: color 0.2s;
        }
        .cs-input-icon-wrap:focus-within .cs-input-icon { color: #6366F1; }
        .cs-input--pl { padding-left: 42px; }
        .cs-select { cursor: pointer; }

        .cs-color-palette {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px;
          background: #F8FAFC;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          margin-top: 4px;
        }
        .dark .cs-color-palette {
          background: #020617;
          border-color: #1E293B;
        }
        .cs-color-swatch {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.65;
        }
        .cs-color-swatch:hover { opacity: 1; transform: scale(1.05); }
        .cs-color-swatch--active {
          opacity: 1;
          box-shadow: 0 0 0 3px white, 0 0 0 5px currentColor;
          transform: scale(1.1);
        }

        .cs-modal-footer {
          display: flex;
          gap: 10px;
          padding: 14px 20px;
          padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid #F1F5F9;
          flex-shrink: 0;
        }
        .dark .cs-modal-footer { border-top-color: #1E293B; }
        @media (min-width: 640px) {
          .cs-modal-footer {
            padding: 16px 28px;
            gap: 12px;
          }
        }

        .cs-modal-error {
          margin: 0 20px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          color: #EF4444;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid rgba(239,68,68,0.15);
          flex-shrink: 0;
        }

        /* ── Buttons ── */
        .cs-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 18px;
          border-radius: 12px;
          border: none;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          -webkit-tap-highlight-color: transparent;
          flex: 1;
        }
        .cs-btn:active { transform: scale(0.97); }
        .cs-btn--primary {
          background: #0F172A;
          color: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .dark .cs-btn--primary { background: white; color: #0F172A; }
        .cs-btn--primary:hover { transform: scale(1.02); }
        .cs-btn--ai {
          background: #0F172A;
          color: white;
          box-shadow: 0 4px 16px rgba(99,102,241,0.2);
        }
        .dark .cs-btn--ai { background: #1E293B; color: white; }
        .cs-btn--ai:hover { background: #1E293B; }
        .cs-btn--ghost {
          background: transparent;
          color: #94A3B8;
          flex: 0 0 auto;
          padding: 13px 16px;
        }
        .cs-btn--ghost:hover { color: #0F172A; background: #F8FAFC; }
        .dark .cs-btn--ghost:hover { color: white; background: #1E293B; }
        .cs-btn--loading { opacity: 0.6; cursor: wait; }
        .cs-btn--flex2 { flex: 2; }

        .cs-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: cs-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        .cs-spinner--dark {
          border-color: rgba(0,0,0,0.15);
          border-top-color: #0F172A;
        }
        @keyframes cs-spin { to { transform: rotate(360deg); } }

        /* ── Dots ── */
        .cs-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .cs-dot--green { background: #10B981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
        .cs-dot--primary { background: #6366F1; }
        .cs-dot--pulse { animation: cs-pulse 2s ease infinite; }
        @keyframes cs-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── PillarInfo Modal Specifics ── */
        .cs-relative { position: relative; }
        .cs-modal-deco {
          position: absolute;
          top: -80px;
          right: -80px;
          opacity: 0.025;
          pointer-events: none;
        }
        .cs-pillar-hero {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .cs-pillar-hero-icon {
          width: 60px;
          height: 60px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        @media (min-width: 640px) {
          .cs-pillar-hero-icon { width: 72px; height: 72px; border-radius: 22px; }
        }
        .cs-pillar-hero-glow {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.2);
          border-radius: inherit;
          animation: cs-pulse 2s ease infinite;
        }
        .cs-pillar-hero-name {
          font-size: clamp(24px, 6vw, 36px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #0F172A;
          line-height: 1;
        }
        .dark .cs-pillar-hero-name { color: white; }

        .cs-quote-block {
          font-size: clamp(15px, 4vw, 18px);
          font-weight: 700;
          color: #1E293B;
          font-style: italic;
          line-height: 1.7;
          border-left: 5px solid;
          padding: 14px 16px;
          background: #F8FAFC;
          border-radius: 0 12px 12px 0;
        }
        .dark .cs-quote-block {
          background: #020617;
          color: #E2E8F0;
        }

        .cs-info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-top: 16px;
        }
        @media (min-width: 480px) {
          .cs-info-grid { grid-template-columns: 1fr 1fr; }
        }
        .cs-info-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px;
        }
        .dark .cs-info-card {
          background: #020617;
          border-color: #1E293B;
        }
        .cs-info-text {
          font-size: 12px;
          font-weight: 700;
          color: #64748B;
          line-height: 1.6;
        }
        .cs-tags-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cs-tag {
          padding: 5px 12px;
          background: rgba(99,102,241,0.06);
          color: #6366F1;
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 99px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cs-empty-text {
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
          font-style: italic;
        }
      `}</style>

      <div className="cs-root">
        {/* ─── Top Command Bar ─── */}
        <header className="cs-topbar">
          <div className="cs-topbar-row">
            <div className="cs-brand-mark">
              <div className="cs-brand-icon">
                <Zap size={18} />
              </div>
              <div className="cs-brand-text">
                <h1>Creator Flow</h1>
                <p>Hyper-Agencia Intelligence</p>
              </div>
            </div>

            {/* Desktop View Switcher — shown only on ≥1024px via CSS */}
            <div className="cs-switcher-desktop">
              <div className="cs-view-switcher">
                <button 
                  onClick={() => setViewMode('production')}
                  className={`cs-view-btn ${viewMode === 'production' ? 'cs-view-btn--active' : ''}`}
                >
                  <Zap size={16} />
                  <span>Producción</span>
                </button>
                <button 
                  onClick={() => setViewMode('strategy')}
                  className={`cs-view-btn ${viewMode === 'strategy' ? 'cs-view-btn--active' : ''}`}
                >
                  <Layers size={16} />
                  <span>Estrategia</span>
                </button>
                <button 
                  onClick={() => setViewMode('library')}
                  className={`cs-view-btn ${viewMode === 'library' ? 'cs-view-btn--active' : ''}`}
                >
                  <BookOpen size={16} />
                  <span>Biblioteca</span>
                </button>
              </div>
            </div>

            <BrandSwitcher 
              brands={brands} currentBrand={selectedBrand} 
              onBrandChange={setSelectedBrand} 
              onBrandCreated={b => { setBrands(prev => [b, ...prev]); setSelectedBrand(b); }}
              onBrandDeleted={id => { setBrands(prev => prev.filter(b => b.id !== id)); if(selectedBrand?.id === id) setSelectedBrand(brands[0]); }}
            />
          </div>

          {/* Mobile/Tablet View Switcher — shown only on <1024px via CSS */}
          <div className="cs-switcher-mobile">
            <div className="cs-view-switcher">
              <button 
                onClick={() => setViewMode('production')}
                className={`cs-view-btn ${viewMode === 'production' ? 'cs-view-btn--active' : ''}`}
              >
                <Zap size={16} />
                <span>Producción</span>
              </button>
              <button 
                onClick={() => setViewMode('strategy')}
                className={`cs-view-btn ${viewMode === 'strategy' ? 'cs-view-btn--active' : ''}`}
              >
                <Layers size={16} />
                <span>Estrategia</span>
              </button>
              <button 
                onClick={() => setViewMode('library')}
                className={`cs-view-btn ${viewMode === 'library' ? 'cs-view-btn--active' : ''}`}
              >
                <BookOpen size={16} />
                <span>Biblioteca</span>
              </button>
            </div>
          </div>
        </header>

        {/* ─── Main Content (Production vs Strategy) ─── */}
        <AnimatePresence mode="wait">
          {viewMode === 'strategy' && (
            <motion.div 
              key="strategy-hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cs-deck-wrap"
            >
              <div className="cs-strategy-header">
                <div className="cs-pillar-selector-wrap">
                  <button 
                    onClick={() => setShowPillarSelector(!showPillarSelector)}
                    className="cs-pillar-selector-btn"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Search size={16} />
                      <span>{pillarSearch ? `Filtrando: ${pillarSearch}` : 'Buscar o elegir pilar...'}</span>
                    </div>
                    <ChevronDown size={16} />
                  </button>
                  
                  <AnimatePresence>
                    {showPillarSelector && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="cs-pillar-selector-dropdown"
                      >
                        <input 
                          autoFocus
                          placeholder="Escribe para buscar..."
                          className="cs-pillar-search-input"
                          value={pillarSearch}
                          onChange={(e) => setPillarSearch(e.target.value)}
                        />
                        {pillars
                          .filter(p => !pillarSearch || p.name.toLowerCase().includes(pillarSearch.toLowerCase()))
                          .map(p => (
                            <button 
                              key={p.id}
                              className="cs-pillar-opt"
                              onClick={() => { setViewingPillarInfo(p); setShowPillarSelector(false); setPillarSearch(''); }}
                            >
                              <div className="cs-pillar-bar" style={{ backgroundColor: p.hex_color, width: '4px', height: '12px' }} />
                              {p.name}
                            </button>
                          ))
                        }
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Desktop Add Button */}
                <button 
                  onClick={() => setShowPillarModal(true)}
                  className="cs-pillar-add-btn"
                  style={{ display: window.innerWidth < 1024 ? 'none' : 'flex' }}
                >
                  <Plus size={18} />
                  <span>Nuevo Pilar</span>
                </button>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="cs-strategy-deck"
              >
                {pillars.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center' }}>
                    <div className="cs-empty-state-icon" style={{ margin: '0 auto 16px', background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
                      <Layout size={32} />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#64748B', marginBottom: '16px' }}>
                      Esta marca aún no tiene pilares estratégicos.
                    </p>
                    <button 
                      onClick={() => setShowPillarModal(true)}
                      className="cs-pillar-add-btn"
                      style={{ margin: '0 auto', background: '#6366F1', color: 'white', border: 'none' }}
                    >
                      <Plus size={18} />
                      Crear Primer Pilar
                    </button>
                  </div>
                ) : (
                  <>
                    {pillars
                      .map((pillar) => (
                        <button
                          key={pillar.id}
                          onClick={() => setViewingPillarInfo(pillar)}
                          className="cs-pillar-card"
                        >
                          <div className="cs-pillar-card-top">
                            <div className="cs-pillar-card-name-row">
                              <div className="cs-pillar-bar" style={{ backgroundColor: pillar.hex_color, width: '6px', height: '24px' }} />
                              <h4 className="cs-pillar-name" style={{ fontSize: '16px' }}>{pillar.name}</h4>
                            </div>
                            <div className="cs-pillar-count" style={{ padding: '4px 10px', fontSize: '12px' }}>
                              {scripts.filter(s => s.pillar_id === pillar.id).length} Ideas
                            </div>
                          </div>
                          
                          <div style={{ padding: '4px 0' }}>
                            <p className={`cs-pillar-objective ${!pillar.objective ? 'cs-pillar-objective--empty' : ''}`}>
                              {pillar.objective || 'Sin objetivo estratégico definido todavía...'}
                            </p>
                          </div>

                          <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Click para ver detalles</span>
                             <div style={{ height: '1px', flex: 1, background: '#F1F5F9' }} />
                          </div>
                        </button>
                      ))}
                  </>
                )}
              </motion.div>

              {/* Mobile FAB */}
              {window.innerWidth < 1024 && (
                <button 
                  onClick={() => setShowPillarModal(true)}
                  className="cs-strategy-fab"
                >
                  <Plus size={28} />
                </button>
              )}

              {/* ── Strategy Drawer (Full List) ── */}
              <AnimatePresence>
                {showPillarDrawer && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowPillarDrawer(false)}
                      className="cs-drawer-overlay"
                    />
                    <motion.div 
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="cs-drawer-content"
                    >
                      <div className="cs-drawer-handle" />
                      <h3 className="cs-drawer-title">Todos los Pilares</h3>
                      
                      <div className="cs-pillar-selector-wrap" style={{ shadow: 'none', marginBottom: '16px' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                          <input 
                            placeholder="Buscar pilar por nombre..."
                            className="cs-pillar-search-input"
                            style={{ paddingLeft: '38px', height: '48px', marginBottom: 0 }}
                            value={pillarSearch}
                            onChange={(e) => setPillarSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pillars
                          .filter(p => !pillarSearch || p.name.toLowerCase().includes(pillarSearch.toLowerCase()))
                          .map(p => (
                            <button 
                              key={p.id}
                              className="cs-pillar-opt"
                              style={{ padding: '12px', fontSize: '15px', fontWeight: 600 }}
                              onClick={() => { setViewingPillarInfo(p); setShowPillarDrawer(false); setPillarSearch(''); }}
                            >
                              <div className="cs-pillar-bar" style={{ backgroundColor: p.hex_color, width: '6px', height: '18px', borderRadius: '4px' }} />
                              {p.name}
                            </button>
                          ))
                        }
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {viewMode === 'production' && (
            <motion.main 
              key="production-board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="cs-board"
            >
          {/* Phase Navigator */}
          <div className="cs-phase-nav">
            <div className="cs-phase-nav-inner">
              {COLUMN_ORDER.map((col) => (
                <button
                  key={`nav-${col}`}
                  onClick={() => scrollToColumn(col)}
                  className={`cs-phase-btn ${activeTab === col ? 'cs-phase-btn--active' : ''}`}
                >
                  {STATUS_CONFIG[col].icon}
                  {STATUS_CONFIG[col].label}
                  <span className="cs-phase-count">{getScriptsByStatus(col).length}</span>
                </button>
              ))}
              <div className="cs-phase-nav-spacer" />
            </div>
          </div>

          {/* Pagination dots — visible on mobile only */}
          <div className="cs-pagination-dots">
            {COLUMN_ORDER.map((col) => (
              <button
                key={`dot-${col}`}
                onClick={() => scrollToColumn(col)}
                className={`cs-dot-indicator ${activeTab === col ? 'cs-dot-indicator--active' : ''}`}
                aria-label={STATUS_CONFIG[col].label}
              />
            ))}
          </div>

          {/* Kanban Board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div ref={terminalScrollRef} className="cs-board-scroll">
              {COLUMN_ORDER.map((col) => (
                <div
                  id={`column-${col}`}
                  key={col}
                  className="cs-column"
                >
                  <div className="cs-column-header">
                    <div className="cs-column-header-left">
                      <div className={`cs-column-dot ${STATUS_CONFIG[col].color}`} />
                      <h3 className="cs-column-title">{STATUS_CONFIG[col].label}</h3>
                    </div>
                    <span className="cs-column-count">{getScriptsByStatus(col).length}</span>
                  </div>

                  <Droppable droppableId={col}>
                    {(provided, snapshot) => {
                      const colScripts = getScriptsByStatus(col);
                      return (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef} 
                          className={`cs-column-body ${snapshot.isDraggingOver ? 'cs-column-body--dragging-over' : ''}`}
                        >
                          {colScripts.length === 0 && !snapshot.isDraggingOver ? (
                            /* Empty state with CTA */
                            <div className="cs-empty-state">
                              <div className="cs-empty-state-icon">
                                {STATUS_CONFIG[col].icon}
                              </div>
                              <p className="cs-empty-state-text">
                                Aún no hay ideas en<br/><strong>{STATUS_CONFIG[col].label}</strong>
                              </p>
                              <button
                                className="cs-empty-state-cta"
                                onClick={() => openScriptModal(col)}
                              >
                                <Plus size={14} strokeWidth={3} />
                                Agregar idea
                              </button>
                            </div>
                          ) : (
                            colScripts.map((script, index) => (
                              <Draggable key={script.id} draggableId={script.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => navigate(`/studio/edit/${script.id}`)}

                                    className={`cs-script-card ${snapshot.isDragging ? 'cs-script-card--dragging' : ''}`}
                                  >
                                    <div className="cs-script-card-meta">
                                      {script.pillars ? (
                                        <span 
                                          className="cs-script-pillar-tag"
                                          style={{ 
                                            color: script.pillars.hex_color, 
                                            borderColor: script.pillars.hex_color + '40', 
                                            backgroundColor: script.pillars.hex_color + '0C' 
                                          }}
                                        >
                                          {script.pillars.name}
                                        </span>
                                      ) : (
                                        <span className="cs-script-pillar-tag cs-script-pillar-tag--empty">
                                          Sin Pilar
                                        </span>
                                      )}
                                      <div className="cs-script-date">
                                        <Clock size={11} />
                                        <span>
                                          {new Date(script.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                    <h4 className="cs-script-title">{script.title}</h4>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                          
                          {colScripts.length > 0 && (
                            <button 
                              onClick={() => openScriptModal(col)}
                              className="cs-add-idea-btn"
                            >
                              <Plus size={16} />
                              Incubar Idea
                            </button>
                          )}
                        </div>
                      );
                    }}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </motion.main>
      )}

          {viewMode === 'library' && (
            <motion.div 
              key="library-hub"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="cs-library-deck"
            >
              <div className="cs-library-grid-header" style={{ gridColumn: '1 / -1', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94A3B8' }}>Catálogo de Recursos</h2>
              </div>

              <button 
                onClick={() => setShowHooksManager(true)}
                className="cs-library-card"
              >
                <div className="cs-library-icon cs-library-icon--hooks">
                  <Sparkles size={24} />
                </div>
                <div className="cs-library-info">
                  <h3>Ganchos Maestros</h3>
                  <p>Arsenal de "hooks" para detener el scroll y captar atención.</p>
                </div>
                <ArrowUpRight className="cs-library-arrow" size={20} />
              </button>

              <button 
                onClick={() => setShowCtasManager(true)}
                className="cs-library-card"
              >
                <div className="cs-library-icon cs-library-icon--ctas">
                  <Megaphone size={24} />
                </div>
                <div className="cs-library-info">
                  <h3>Cierres de Impacto</h3>
                  <p>Llamadas a la acción (CTA) diseñadas para convertir audiencia.</p>
                </div>
                <ArrowUpRight className="cs-library-arrow" size={20} />
              </button>

              <div style={{ gridColumn: '1 / -1', marginTop: '12px', padding: '20px', background: 'rgba(99,102,241,0.03)', borderRadius: '20px', border: '1px dashed rgba(99,102,241,0.2)' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6366F1', textAlign: 'center' }}>
                  💡 Tip: Usa estos recursos durante la creación de guiones para acelerar tu proceso.
                </p>
              </div>
            </motion.div>
          )}
    </AnimatePresence>

        {/* ─── Modals ─── */}
        <AnimatePresence>
          {(showPillarModal || editingPillar) && (
            <PillarModal 
              pillar={editingPillar} brand={selectedBrand}
              onClose={() => { setShowPillarModal(false); setEditingPillar(null); }} 
              onSave={handlePillarSave}
            />
          )}
          {viewingPillarInfo && (
            <PillarInfoModal 
              pillar={viewingPillarInfo} 
              onClose={() => setViewingPillarInfo(null)} 
              onEdit={(p) => { setViewingPillarInfo(null); setEditingPillar(p); }}
              onStartCreating={(pid) => { setViewingPillarInfo(null); openScriptModal('idea', pid); }}
            />
          )}
          {showHooksManager && <HooksManager onClose={() => setShowHooksManager(false)} />}
          {showCtasManager && <CtasManager onClose={() => setShowCtasManager(false)} />}
          {showBulkImport && (
            <BulkImportModal 
              onClose={() => setShowBulkImport(false)} 
              onImported={async () => { fetchData(); setShowBulkImport(false); }} 
            />
          )}
          {showScriptModal && (
            <ScriptModal 
              pillars={pillars} brandId={selectedBrand?.id} 
              defaultStatus={scriptModalStatus}
              defaultPillarId={scriptModalPillarId}
              onClose={() => setShowScriptModal(false)} 
              onSave={s => setScripts([s, ...scripts])} 
            />
          )}
          {/* Script Editor Modal Removed in favor of Full Screen Page */}

        </AnimatePresence>

        <ConfirmModal
          isOpen={pillarToDelete !== null}
          title="¿Confirmar Eliminación?"
          message="Esta acción es permanente y afectará a la estructura estratégica."
          onConfirm={confirmDeletePillar}
          onCancel={() => setPillarToDelete(null)}
        />

        {/* ─── FAB Group ─── */}
        <div className="cs-fab-group">
          <button 
            onClick={() => setShowCtasManager(true)}
            className="cs-fab cs-fab--secondary cs-fab--pink"
            title="Biblioteca de Cierres"
          >
            <Megaphone size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setShowHooksManager(true)}
            className="cs-fab cs-fab--secondary"
            title="Biblioteca de Ganchos"
          >
            <Sparkles size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => openScriptModal('idea')}
            className="cs-fab cs-fab--primary"
            title="Nueva Idea"
          >
            <Plus size={26} strokeWidth={3} />
          </button>
        </div>
      </div>
    </>
  );
}
