import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  X, Target, Sparkles, ShieldCheck, Zap, Plus, Edit, Hash, Video, Layers2 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { n8nService } from '../../services/n8nService';
import { PILLAR_COLORS, SUGGESTED_EMOJIS } from '../../utils/studioHelpers';

// ─── Modal: Pillar ────────────────────────────────────────────────────────────
export const PillarModal = ({ pillar, brand, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: pillar?.name || '',
    emoji: pillar?.emoji || '🎯',
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
      emoji: form.emoji,
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
        <div className="cs-modal-header">
          <div className="cs-modal-header-left">
            <div className="cs-modal-icon" style={{ backgroundColor: form.hex_color + '18', color: form.hex_color }}>
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
          <button onClick={onClose} className="cs-modal-close"><X size={18} /></button>
        </div>

        <div className="cs-modal-body">
          <div className="cs-modal-grid">
            <div className="cs-field-group">
              <div className="cs-field">
                <label className="cs-label">Identidad Visual (Emoji & Color)</label>
                <div className="flex gap-3 mb-4">
                  <input 
                    type="text" value={form.emoji} 
                    onChange={e => setForm({...form, emoji: e.target.value})} 
                    className="cs-input text-center w-14 text-xl" 
                    placeholder="🎯"
                  />
                  <div className="flex-1 cs-color-palette flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-24 overflow-y-auto">
                    {PILLAR_COLORS.map(c => (
                      <button key={c} onClick={() => setForm({...form, hex_color: c})} className={`cs-color-swatch ${form.hex_color === c ? 'cs-color-swatch--active' : ''}`} style={{ backgroundColor: c, width: '20px', height: '20px' }} />
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-6">
                   {SUGGESTED_EMOJIS.map(em => (
                     <button 
                        key={em} 
                        onClick={() => setForm({...form, emoji: em})}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${form.emoji === em ? 'bg-primary/10 border-primary text-lg scale-110' : 'bg-white border-slate-100 hover:bg-slate-50 text-base'}`}
                     >
                       {em}
                     </button>
                   ))}
                </div>

                <label className="cs-label">Nombre del Pilar Maestro</label>
                <input autoFocus type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Tutoriales Pro..." className="cs-input" />
              </div>
              <div className="cs-field">
                <label className="cs-label">Objetivo de Impacto</label>
                <textarea value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} placeholder="¿Qué transformación buscas en tu audiencia?" className="cs-input cs-textarea cs-textarea--sm" />
              </div>
            </div>
            <div className="cs-field-group">
              <div className="cs-field">
                <label className="cs-label">Manifiesto / Descripción</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Define el ADN de este contenido..." className="cs-input cs-textarea cs-textarea--md" />
              </div>
              <div className="cs-field">
                <label className="cs-label">Cerebro de Keywords</label>
                <div className="cs-input-icon-wrap">
                  <Hash size={16} className="cs-input-icon" />
                  <input type="text" value={form.keywords} onChange={e => setForm({...form, keywords: e.target.value})} placeholder="ia, hacks, tutorial..." className="cs-input cs-input--pl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="cs-modal-error">{error}</p>}

        <div className="cs-modal-footer">
          <button onClick={handleBrainstorm} disabled={brainstorming} className={`cs-btn cs-btn--ai ${brainstorming ? 'cs-btn--loading' : ''}`}>
            {brainstorming ? <div className="cs-spinner" /> : <Sparkles size={18} />}
            <span>{brainstorming ? 'Canalizando IA...' : 'Empoderar IA'}</span>
          </button>
          <button onClick={handleSave} className="cs-btn cs-btn--primary cs-btn--flex2">
            {saving ? <div className="cs-spinner cs-spinner--dark" /> : <ShieldCheck size={18} strokeWidth={3} />}
            <span>{pillar ? 'Consolidar Cambios' : 'Asegurar en Nube'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Modal: Pillar Info ───────────────────────────────────────────────────────
export const PillarInfoModal = ({ pillar, onClose, onStartCreating, onEdit }) => {
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
        <button onClick={onClose} className="cs-modal-close cs-modal-close--abs"><X size={18} /></button>
        <div className="cs-modal-deco" style={{ color: pillar.hex_color }}><Target size={300} /></div>
        <div className="cs-modal-body cs-relative">
          <div className="cs-pillar-hero">
            <div className="cs-pillar-hero-icon" style={{ backgroundColor: pillar.hex_color }}>
              <div className="cs-pillar-hero-glow" />
              <span className="text-3xl z-10">{pillar.emoji || '🎯'}</span>
            </div>
            <div>
              <h2 className="cs-pillar-hero-name">{pillar.name}</h2>
              <div className="cs-modal-subtitle"><div className="cs-dot cs-dot--primary cs-dot--pulse" /><span>ADN Estratégico</span></div>
            </div>
          </div>
          <div className="cs-field" style={{ marginTop: '1.5rem' }}>
            <h3 className="cs-label">Estrategia Viral</h3>
            <p className="cs-quote-block" style={{ borderLeftColor: pillar.hex_color }}>"{pillar.description || 'Este pilar aún no tiene una definición conceptual completa.'}"</p>
          </div>
          <div className="cs-info-grid">
            <div className="cs-field">
              <h3 className="cs-label">Meta Principal</h3>
              <div className="cs-info-card"><p className="cs-info-text">{pillar.objective || 'Sin objetivo definido.'}</p></div>
            </div>
            <div className="cs-field">
              <h3 className="cs-label">Keywords Maestro</h3>
              <div className="cs-tags-wrap">
                {pillar.keywords?.length > 0 ? pillar.keywords.map(k => <span key={k} className="cs-tag">#{k}</span>) : <p className="cs-empty-text">N/A</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="cs-modal-footer">
          <button onClick={() => onEdit(pillar)} className="cs-btn cs-btn--ghost"><Edit size={16} /> Ajustar Estrategia</button>
          <button onClick={() => onStartCreating(pillar.id)} className="cs-btn cs-btn--primary cs-btn--flex2"><Plus size={20} strokeWidth={3} /> Desplegar Nueva Idea</button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Modal: Nuevo Guión ───────────────────────────────────────────────────────
export const ScriptModal = ({ pillars, defaultPillarId, defaultStatus, brandId, onClose, onSave }) => {
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
            <div className="cs-modal-icon cs-modal-icon--primary"><Video size={20} /></div>
            <h2 className="cs-modal-title">Nueva Idea de Video</h2>
          </div>
        </div>
        <div className="cs-modal-body">
          <div className="cs-field-group">
            <div className="cs-field">
              <label className="cs-label">Título de Producción</label>
              <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Mi Viaje con n8n..." className="cs-input" onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="cs-field">
              <label className="cs-label">Asignar a Pilar Maestro</label>
              <div className="cs-input-icon-wrap">
                <Layers2 size={16} className="cs-input-icon" />
                <select value={pillarId} onChange={e => setPillarId(e.target.value)} className="cs-input cs-input--pl cs-select">
                  <option value="">🎯 Sin pilar — Contenido Huérfano</option>
                  {pillars.map(p => <option key={p.id} value={p.id}>{p.emoji || '🎯'} {p.name}</option>)}
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
};
