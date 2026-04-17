import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  X, Check, Save, Trash2, Edit3, Type, Hash, 
  Link as LinkIcon, Play, Layers, Clock, AlertCircle, ChevronRight,
  Plus, Share2, Sparkles, Lock, Mic, Info,
  Megaphone, Copy, Image as ImageIcon, 
  RefreshCw, MousePointerClick, MessageSquare, Zap, Share as ShareIcon,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { n8nService } from '../services/n8nService';
import ConfirmModal from '../components/ConfirmModal';
import Teleprompter from '../components/Teleprompter';

const InstagramIcon = ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = ({ size = 14 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

export default function ScriptEditorPage() {
  const { scriptId } = useParams();
  const navigate = useNavigate();
  
  const [script, setScript] = useState(null);
  const [pillars, setPillars] = useState([]);
  const [activeTab, setActiveTab] = useState('guion');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [error, setError] = useState(null);
  const isInitialized = useRef(false);
  const [hooks, setHooks] = useState([]);
  const [showDeleteScriptConfirm, setShowDeleteScriptConfirm] = useState(false);
  const [hookToDelete, setHookToDelete] = useState(null);
  const [isAddingHook, setIsAddingHook] = useState(false);
  const [newHook, setNewHook] = useState({ title: '', content: '' });
  
  // Script Architect States
  const [writingMode, setWritingMode] = useState('libre');
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [showResetTemplateConfirm, setShowResetTemplateConfirm] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  
  // AI Prompt Overlay States
  const [aiPromptTarget, setAiPromptTarget] = useState(null); // { field, blockId, label }
  const [userInstruction, setUserInstruction] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    pillar_id: '',
    status: 'idea',
    master_draft: '',
    video_copy: '',
    hashtags: '',
    platforms: [],
    reference_links: [],
    camera_setup: '',
    lighting_setup: '',
    shot_list: '',
    facebook_copy: '',
    carousel_data: [],
    hook_variations: []
  });

  const BLOCK_TYPES_MAP = {
    hook: 'Gancho 🪝',
    development: 'Cuerpo 📝',
    cta: 'Llamado a la Acción 💬',
    and: 'Contexto (Y...) 🔗',
    but: 'Conflicto (Pero...) ⚡',
    therefore: 'Solución (Por lo tanto...) ✅',
    description: 'Descripción 📖',
    problem: 'Problema 🛑',
    agitation: 'Agitación ⚡',
    solution: 'Solución 💡'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pillars
      const { data: pillarsData } = await supabase.from('strategy_pillars').select('*').order('created_at', { ascending: true });
      if (pillarsData) setPillars(pillarsData);

      // Fetch script
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();
        
      if (scriptError) throw scriptError;
      
      setScript(scriptData);
      setForm({
        title: scriptData.title || '',
        pillar_id: scriptData.pillar_id || '',
        status: scriptData.status || 'idea',
        master_draft: scriptData.master_draft || '',
        video_copy: scriptData.video_copy || '',
        hashtags: scriptData.hashtags || '',
        platforms: scriptData.platforms || [],
        reference_links: Array.isArray(scriptData.reference_links) ? scriptData.reference_links : [],
        camera_setup: scriptData.camera_setup || '',
        lighting_setup: scriptData.lighting_setup || '',
        shot_list: scriptData.shot_list || '',
        facebook_copy: scriptData.facebook_copy || '',
        carousel_data: Array.isArray(scriptData.carousel_data) ? scriptData.carousel_data : [],
        hook_variations: Array.isArray(scriptData.hook_variations) ? scriptData.hook_variations : []
      });

      // Fetch hooks and blocks
      fetchHooks();
      fetchBlocks();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHooks = async () => {
    const { data } = await supabase.from('hooks_library').select('*');
    if (data) setHooks(data);
  };

  const fetchBlocks = async () => {
    setBlocksLoading(true);
    const { data } = await supabase
      .from('script_blocks')
      .select('*')
      .eq('script_id', scriptId)
      .order('block_order', { ascending: true });
    if (data) setBlocks(data);
    setBlocksLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [scriptId]);

  // Auto-save logic
  useEffect(() => {
    if (!isInitialized.current || !script) {
      if (script) isInitialized.current = true;
      return;
    }
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [form]);

  // Auto-Tab Switching Logic
  useEffect(() => {
    if (!isInitialized.current) return;
    if (form.status === 'ready' && activeTab !== 'produccion') {
      setActiveTab('produccion');
    } else if (form.status === 'published' && activeTab !== 'metadata') {
      setActiveTab('guion');
    } else if ((form.status === 'idea' || form.status === 'drafting') && activeTab === 'produccion') {
      setActiveTab('guion');
    }
  }, [form.status]);

  const handleBlockChange = (id, content) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, text_content: content } : b));
  };

  const saveBlocks = async (currentBlocks = blocks) => {
    const updates = currentBlocks.map(b => 
      supabase.from('script_blocks').update({ text_content: b.text_content }).eq('id', b.id)
    );
    await Promise.all(updates);
  };

  const initTemplate = async (type) => {
    setBlocksLoading(true);
    await supabase.from('script_blocks').delete().eq('script_id', scriptId);
    let newBlocks = [];
    if (type === 'valor') {
      newBlocks = [
        { type: 'hook', label: 'Gancho (Estratégico)', placeholder: 'Escribe tu gancho de 3 segundos...' },
        { type: 'development', label: 'Desarrollo (Valor)', placeholder: 'Explica el concepto principal...' },
        { type: 'cta', label: 'Cierre (Llamado a la acción)', placeholder: 'Diles qué hacer ahora...' }
      ];
    } else if (type === 'abt') {
      newBlocks = [
        { type: 'hook', label: 'Gancho', placeholder: 'La promesa irresistible...' },
        { type: 'and', label: 'Y... (Contexto)', placeholder: 'Añade información de soporte...' },
        { type: 'but', label: 'PERO... (El Conflicto)', placeholder: 'Introduce la tensión o el problema...' },
        { type: 'therefore', label: 'POR LO TANTO... (Resolución)', placeholder: 'Cómo se resuelve y qué aprendieron...' },
        { type: 'cta', label: 'Cierre', placeholder: 'CTA final...' }
      ];
    } else if (type === 'pas') {
      newBlocks = [
        { type: 'problem', label: 'Problema', placeholder: 'Identifica el dolor o necesidad del usuario...' },
        { type: 'agitation', label: 'Agitación', placeholder: 'Explica por qué ese problema es grave o urgente...' },
        { type: 'solution', label: 'Solución (Tu Propuesta)', placeholder: 'Presenta cómo resuelves el problema...' },
        { type: 'cta', label: 'Cierre (CTA)', placeholder: 'Guía al usuario al siguiente paso...' }
      ];
    }
    const toInsert = newBlocks.map((b, i) => ({
      script_id: scriptId,
      block_type: b.type,
      text_content: '',
      block_order: i
    }));
    const { data } = await supabase.from('script_blocks').insert(toInsert).select();
    if (data) setBlocks(data);
    setBlocksLoading(false);
  };

  const handleResetBlocks = async () => {
    setBlocksLoading(true);
    const { error } = await supabase.from('script_blocks').delete().eq('script_id', scriptId);
    if (!error) {
      setBlocks([]);
    }
    setBlocksLoading(false);
    setShowResetTemplateConfirm(false);
  };

  const compileDraft = () => {
    const combined = blocks.map(b => b.text_content).filter(Boolean).join('\n\n');
    setForm(f => ({ ...f, master_draft: combined }));
    setWritingMode('libre');
  };

  const handleSave = async (isSilent = false) => {
    if (!script) return;
    if (!isSilent) setLoading(true);
    setIsSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('scripts')
      .update({
        title: form.title,
        pillar_id: form.pillar_id || null,
        status: form.status,
        master_draft: form.master_draft,
        video_copy: form.video_copy,
        hashtags: form.hashtags,
        platforms: form.platforms,
        reference_links: form.reference_links,
        camera_setup: form.camera_setup,
        lighting_setup: form.lighting_setup,
        shot_list: form.shot_list,
        facebook_copy: form.facebook_copy,
        carousel_data: form.carousel_data,
        hook_variations: form.hook_variations,
        updated_at: new Date().toISOString()
      })
      .eq('id', scriptId);
    if (err) {
      setError(err.message);
    } else {
      setLastSaved(new Date());
    }
    if (!isSilent) setLoading(false);
    setIsSaving(false);
  };

  const getTabStatus = (tabId) => {
    const s = form.status;
    const mapping = {
      guion: ['idea', 'writing', 'ready', 'recorded', 'published'],
      marketing: ['idea', 'writing', 'ready', 'recorded', 'published'],
      produccion: ['ready', 'recorded', 'published'],
      distribucion: ['writing', 'ready', 'recorded', 'published'], // Distribución ya puede ver escritura refinada
      references: ['idea', 'writing', 'ready', 'recorded', 'published']
    };
    return mapping[tabId]?.includes(s) || false;
  };

  const addReference = () => {
    setForm(f => ({ ...f, reference_links: [...f.reference_links, ''] }));
  };

  const updateReference = (index, val) => {
    const newList = [...form.reference_links];
    newList[index] = val;
    setForm(f => ({ ...f, reference_links: newList }));
  };

  const togglePlatform = (p) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) 
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p]
    }));
  };

  const insertHook = (hText) => {
    setForm(f => ({ ...f, master_draft: f.master_draft + '\n' + hText }));
  };

  const confirmDeleteScript = async () => {
    const { error } = await supabase.from('scripts').delete().eq('id', scriptId);
    if (!error) {
      navigate('/creator-flow');
    }
    setShowDeleteScriptConfirm(false);
  };

  const handleAIAssist = async () => {
    if (!aiPromptTarget) return;
    
    const { field, blockId } = aiPromptTarget;
    const targetField = blockId ? `block_${blockId}` : field;
    const currentContent = blockId 
      ? blocks.find(b => b.id === blockId)?.text_content 
      : form[field];

    const pilar = pillars.find(p => p.id === form.pillar_id);
    const { data: { user } } = await supabase.auth.getUser();

    const context = {
      script_id: scriptId,
      title: form.title,
      current_content: currentContent,
      field_target: targetField,
      block_id: blockId,
      pillar_id: form.pillar_id,
      pillar_name: pilar?.name,
      pillar_description: pilar?.description,
      pillar_objective: pilar?.objective,
      pillar_keywords: pilar?.keywords,
      user_id: user?.id,
      master_draft: form.master_draft,
      video_copy: form.video_copy,
      shot_list: form.shot_list,
      lighting_setup: form.lighting_setup,
      camera_setup: form.camera_setup,
      hashtags: form.hashtags,
      full_blocks: blocks 
    };

    try {
      setLoading(true);
      const response = await n8nService.triggerScriptAi('assist', context, userInstruction);
      
      const newText = response?.generated_text || 
                      response?.text || 
                      response?.output || 
                      response?.content?.parts?.[0]?.text || 
                      (typeof response === 'string' ? response : null);
      
      if (newText) {
         if (blockId) {
            handleBlockChange(blockId, newText);
            saveBlocks(blocks.map(b => b.id === blockId ? { ...b, text_content: newText } : b));
         } else {
            setForm(f => ({ ...f, [field]: (f[field] ? f[field] + '\n\n' : '') + newText }));
         }
         setAiPromptTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setUserInstruction('');
    }
  };

  const openAIPrompt = (field, label, blockId = null) => {
    setAiPromptTarget({ field, label, blockId });
    setUserInstruction('');
  };

  if (loading && !script) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden overscroll-none">
      <AnimatePresence>
        {aiPromptTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAiPromptTarget(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 m-2"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles size={18} sm:size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 italic truncate">Arquitecto IA</h4>
                    <p className="text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-wider truncate">{aiPromptTarget.label}</p>
                  </div>
                </div>
                <button onClick={() => setAiPromptTarget(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-all shrink-0">
                  <X size={18} sm:size={20}/>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-black tracking-widest text-slate-400 uppercase">Instrucciones</label>
                  <textarea 
                    autoFocus
                    value={userInstruction}
                    onChange={e => setUserInstruction(e.target.value)}
                    placeholder='Ej: "Hazlo más sarcástico y directo"...'
                    className="w-full h-32 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button onClick={handleAIAssist} disabled={loading} className="flex-1 btn-primary py-4 gap-2 text-white">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'Procesando...' : 'Empoderar con IA'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={showResetTemplateConfirm}
        onClose={() => setShowResetTemplateConfirm(false)}
        onConfirm={handleResetBlocks}
        title="¿Cambiar de plantilla?"
        message="Se borrarán los bloques actuales para elegir una nueva estructura. Esta acción no se puede deshacer."
        confirmText="Reiniciar"
        variant="danger"
      />

      {/* Header Nativo */}
      {!isZenMode && (
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-card shrink-0 z-50">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
            <button 
              onClick={() => navigate('/creator-flow')}
              className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors hidden sm:flex shrink-0"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 hidden sm:flex">
                <Edit3 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="Nombre del Guión..."
                  className="text-base sm:text-xl font-black bg-transparent border-none focus:ring-0 text-foreground p-0 w-full placeholder:text-muted-foreground/30 truncate min-w-0"
                />
                <div className="flex items-center gap-1.5 -mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground truncate">
                    {isSaving ? 'Sincronizando' : 'Autoguardado On'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0 px-2 sm:px-0">
            <button
              onClick={() => setShowTeleprompter(true)}
              className="h-11 w-11 sm:h-10 sm:w-auto sm:px-5 bg-foreground text-background rounded-xl flex items-center justify-center sm:justify-start gap-2 hover:opacity-90 transition-all font-black text-[10px] uppercase tracking-tighter shadow-lg shadow-foreground/20 active:scale-95"
              title="Teleprompter"
            >
              <Play size={28} strokeWidth={3} fill="currentColor" className="shrink-0" /> 
              <span className="hidden sm:inline">Grabar</span>
            </button>
            
            <button
              onClick={() => handleSave()}
              disabled={loading}
              className="h-11 w-11 sm:h-12 sm:w-auto sm:px-6 btn-primary text-sm font-black gap-2 text-white border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-xl shadow-primary/30 active:scale-95"
              title="Guardar"
            >
              {loading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Save size={28} strokeWidth={3} className="shrink-0" />
              )}
              <span className="hidden sm:inline">Guardar</span>
            </button>

            <button 
              onClick={() => navigate('/creator-flow')}
              className="h-10 w-10 flex items-center justify-center hover:bg-muted rounded-xl transition-colors shrink-0 text-muted-foreground"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Navigation - Sidebar on Desktop */}
        {!isZenMode && (
          <nav className="shrink-0 lg:w-64 border-r border-border bg-card lg:flex flex-col hidden overflow-y-auto p-4 space-y-1">
            {[
              { id: 'guion', label: 'Estructura', icon: <Type size={18} /> },
              { id: 'marketing', label: 'Viralidad', icon: <Zap size={18} /> },
              { id: 'produccion', label: 'Técnico', icon: <ImageIcon size={18} /> },
              { id: 'distribucion', label: 'Plataformas', icon: <ShareIcon size={18} /> },
              { id: 'references', label: 'Referencias', icon: <LinkIcon size={18} /> },
            ].map(tab => {
              const isAllowed = getTabStatus(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => isAllowed && setActiveTab(tab.id)}
                  disabled={!isAllowed}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-bold transition-all uppercase tracking-widest
                    ${isActive 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : isAllowed 
                        ? 'text-muted-foreground hover:bg-muted/80 hover:text-foreground' 
                        : 'opacity-30 grayscale cursor-not-allowed'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                  {!isAllowed && <Lock size={12} className="ml-auto" />}
                </button>
              );
            })}

            <div className="pt-8 mt-auto border-t border-border/50">
              <button
                onClick={() => setShowDeleteScriptConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 transition-all"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </nav>
        )}

        {/* Scrollable Viewport */}
        <main id="editor-main" className={`flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/10 dark:bg-transparent custom-scrollbar pb-32 lg:pb-20 transition-all duration-500 ${isZenMode ? 'p-0' : 'p-4 sm:p-12 lg:p-20'}`}>
            <div className={`mx-auto min-h-full transition-all duration-500 ${isZenMode ? 'max-w-none w-full' : 'max-w-4xl w-full'}`}>
                {/* TAB CONTENT: GUION */}
                {activeTab === 'guion' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {!isZenMode && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-card rounded-[40px] border border-border shadow-sm">
                          <div className="space-y-2">
                              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Pilar de Estrategia</span>
                              <select
                                  value={form.pillar_id}
                                  onChange={e => setForm({...form, pillar_id: e.target.value})}
                                  className="w-full bg-muted/30 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                              >
                                  <option value="">🎯 Sin pilar asignado</option>
                                  {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest px-1">Estado de Maduración</span>
                              <select
                                  value={form.status}
                                  onChange={e => setForm({...form, status: e.target.value})}
                                  className="w-full bg-muted/30 border-none rounded-2xl px-6 py-4 text-sm font-black text-primary uppercase tracking-tight focus:ring-2 focus:ring-primary/20 shadow-inner transition-all"
                              >
                                  <option value="idea">Fase Incubación</option>
                                  <option value="writing">Guionización</option>
                                  <option value="ready">Listo p/ Grabar 🎥</option>
                                  <option value="recorded">Grabado</option>
                                  <option value="published">Publicado</option>
                              </select>
                          </div>
                      </div>
                    )}

                    <div className="space-y-6">
                        {!isZenMode && (
                          <div className="flex items-center gap-3 mb-2">
                               <div className="bg-primary/10 p-2 rounded-xl">
                                  <Type size={16} className="text-primary" />
                               </div>
                               <span className="text-[12px] font-black text-foreground uppercase tracking-widest">Workflow de Escritura</span>
                          </div>
                        )}
                        
                        {!isZenMode && (
                          <div className="bg-muted/20 p-1.5 rounded-2xl border border-border flex items-center shadow-inner group overflow-hidden">
                              <button
                                  onClick={() => setWritingMode('libre')}
                                  className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
                                      writingMode === 'libre' ? 'bg-card text-primary shadow-lg scale-[1.02]' : 'text-muted-foreground opacity-60'
                                  }`}
                              >
                                  <span className="text-xs font-black tracking-widest uppercase">Libre</span>
                                  <span className="text-[10px] font-bold opacity-60">Flujo de pensamiento</span>
                              </button>
                              <button
                                  onClick={() => setWritingMode('arquitecto')}
                                  className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
                                      writingMode === 'arquitecto' ? 'bg-card text-primary shadow-lg scale-[1.02]' : 'text-muted-foreground opacity-60'
                                  }`}
                              >
                                  <span className="text-xs font-black tracking-widest uppercase">Arquitecto</span>
                                  <span className="text-[10px] font-bold opacity-60">Bloques Narrativos</span>
                              </button>
                          </div>
                        )}

                        {writingMode === 'libre' ? (
                            <div className="flex flex-col gap-4">
                                <div className="relative">
                                    <textarea
                                        value={form.master_draft}
                                        onChange={e => setForm({...form, master_draft: e.target.value})}
                                        placeholder="Escribe tu idea aquí. Sin filtros, solo flujo..."
                                        className={`w-full bg-card border border-border transition-all resize-none custom-scrollbar shadow-2xl ${
                                          isZenMode 
                                            ? 'min-h-[100dvh] border-none shadow-none bg-transparent p-6 sm:p-24 text-xl sm:text-[32px] font-medium rounded-none' 
                                            : 'min-h-[500px] sm:min-h-[650px] p-8 sm:p-14 text-base sm:text-xl font-medium rounded-[40px]'
                                        }`}
                                    />
                                    <div className="absolute top-8 right-8 flex flex-col gap-3">
                                        <button 
                                          onClick={() => setIsZenMode(!isZenMode)}
                                          className={`px-5 py-2.5 backdrop-blur-xl border border-border rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-110 active:scale-95 ${isZenMode ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-background/80 text-foreground'}`}
                                        >
                                            {isZenMode ? 'Salir' : 'Zen Mode'}
                                        </button>
                                    </div>
                                </div>
                                {!isZenMode && (
                                  <div className="flex items-center justify-between px-8 py-6 bg-muted/20 rounded-[32px] border border-border">
                                      <span className="text-[12px] sm:text-sm font-bold text-muted-foreground italic">
                                          {form.master_draft.length.toLocaleString()} caracteres
                                      </span>
                                      <button
                                          onClick={() => openAIPrompt('master_draft', 'Módulo Guión')}
                                          className="h-12 px-8 bg-foreground text-background rounded-2xl text-[12px] sm:text-sm font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
                                      >
                                          <Sparkles size={16} /> Refinar con IA
                                      </button>
                                  </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {blocks.length === 0 ? (
                                    <div className="py-24 text-center bg-muted/20 rounded-[50px] border-2 border-dashed border-border">
                                        <Layers size={48} className="mx-auto text-primary mb-6 opacity-40" />
                                        <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Cimentación Narrativa</h3>
                                        <p className="text-sm text-muted-foreground mb-12">Elige un esquema validado para comenzar.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 text-center">
                                            <button 
                                                onClick={() => initTemplate('valor')}
                                                className="bg-card px-6 py-6 rounded-3xl border border-border hover:border-primary transition-all shadow-sm flex flex-col items-center gap-2 group"
                                            >
                                                <Layers size={20} className="text-primary/40 group-hover:text-primary transition-colors mb-1" />
                                                <span className="text-xs font-black uppercase tracking-widest leading-none">Estructura de Valor</span>
                                                <p className="text-[10px] opacity-60 leading-tight">Gancho + Valor + CTA<br/>(Uso general)</p>
                                            </button>
                                            <button 
                                                onClick={() => initTemplate('abt')}
                                                className="bg-card px-6 py-6 rounded-3xl border border-border hover:border-primary transition-all shadow-sm flex flex-col items-center gap-2 group"
                                            >
                                                <Sparkles size={20} className="text-primary/40 group-hover:text-primary transition-colors mb-1" />
                                                <span className="text-xs font-black uppercase tracking-widest leading-none">Fórmula Hollywood</span>
                                                <p className="text-[10px] opacity-60 leading-tight">ABT: Tensión y drama<br/>(Para Storytelling)</p>
                                            </button>
                                            <button 
                                                onClick={() => initTemplate('pas')}
                                                className="bg-card px-6 py-6 rounded-3xl border border-border hover:border-primary transition-all shadow-sm flex flex-col items-center gap-2 group"
                                            >
                                                <AlertCircle size={20} className="text-primary/40 group-hover:text-primary transition-colors mb-1" />
                                                <span className="text-xs font-black uppercase tracking-widest leading-none">Estructura PAS</span>
                                                <p className="text-[10px] opacity-60 leading-tight">Problema + Agitación + Solución<br/>(Para Ventas/Ads)</p>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center px-4">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Secuencias del Reel</span>
                                                <button 
                                                    onClick={() => setShowResetTemplateConfirm(true)}
                                                    className="text-[11px] font-bold text-primary/60 hover:text-primary transition-colors flex items-center gap-1"
                                                >
                                                    <RefreshCw size={10} /> Cambiar Plantilla
                                                </button>
                                            </div>
                                            <button 
                                                onClick={compileDraft}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline bg-primary/5 px-4 py-2 rounded-full transition-all"
                                            >
                                                <Zap size={14} /> Unificar Guión
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {blocks.map((block, idx) => (
                                                <div layoutId={block.id} key={block.id} className="bg-card border border-border p-6 rounded-[32px] shadow-sm relative group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-primary bg-primary/5 px-4 py-1.5 rounded-full">
                                                                {BLOCK_TYPES_MAP[block.block_type] || block.block_type}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openAIPrompt('block', `Bloque ${idx+1}`, block.id)} className="p-2 text-primary bg-primary/10 rounded-lg"><Sparkles size={16} /></button>
                                                            <button 
                                                                onClick={async () => {
                                                                    await supabase.from('script_blocks').delete().eq('id', block.id);
                                                                    fetchBlocks();
                                                                }}
                                                                className="p-2 text-muted-foreground hover:text-destructive"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <textarea 
                                                        value={block.text_content}
                                                        onChange={(e) => handleBlockChange(block.id, e.target.value)}
                                                        onBlur={() => saveBlocks()}
                                                        rows={3}
                                                        className="w-full bg-transparent border-none p-0 text-base font-medium placeholder:text-muted-foreground/30 focus:ring-0 resize-none"
                                                        placeholder="Vaciado de contenido..."
                                                    />
                                                </div>
                                            ))}
                                            <button 
                                                onClick={async () => {
                                                    await supabase.from('script_blocks').insert([{ script_id: scriptId, block_type: 'custom', block_order: blocks.length, text_content: '' }]);
                                                    fetchBlocks();
                                                }}
                                                className="w-full h-16 border-2 border-dashed border-border rounded-[32px] flex items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all text-xs font-black uppercase tracking-widest"
                                            >
                                                <Plus size={20} /> Añadir Bloque
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PRODUCCION */}
                {activeTab === 'produccion' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-card border border-border p-8 rounded-[40px] flex items-start gap-6">
                        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                            <ImageIcon size={28} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase tracking-tight">Storyboard & Estética</h3>
                            <p className="text-sm text-muted-foreground font-medium italic">Instrucciones visuales para el operador de cámara y editor.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Lista de Planos</span>
                                <button 
                                    onClick={() => openAIPrompt('shot_list', 'Lista de Planos')}
                                    className="p-2 bg-muted rounded-lg text-primary hover:scale-110 transition-transform"
                                ><Sparkles size={16} /></button>
                            </div>
                            <textarea
                                className="w-full h-64 bg-card border border-border rounded-[32px] p-8 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
                                placeholder="- Close-up: Expresión inicial\n- Plano medio: Gesticulación\n- Detalle: Insertos de producto..."
                                value={form.shot_list}
                                onChange={e => setForm({...form, shot_list: e.target.value})}
                            />
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Iluminación & Mood</span>
                                <button 
                                    onClick={() => openAIPrompt('lighting_setup', 'Esquema de Iluminación')}
                                    className="p-2 bg-muted rounded-lg text-primary hover:scale-110 transition-transform"
                                ><Sparkles size={16} /></button>
                            </div>
                            <textarea
                                className="w-full h-64 bg-card border border-border rounded-[32px] p-8 text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
                                placeholder="Luz cálida lateral, rim light sutil, atmósfera profesional..."
                                value={form.lighting_setup}
                                onChange={e => setForm({...form, lighting_setup: e.target.value})}
                            />
                        </section>
                    </div>

                    <section className="bg-card border border-border p-8 rounded-[32px] space-y-4">
                        <div className="flex items-center gap-3">
                            <Mic size={18} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Especificaciones Técnicas</span>
                        </div>
                        <input
                            type="text"
                            className="w-full h-14 bg-muted/20 border-none rounded-2xl px-8 text-sm font-bold placeholder:text-muted-foreground/40"
                            placeholder="Sony A7IV • Lente 35mm • 4K HDR..."
                            value={form.camera_setup}
                            onChange={e => setForm({...form, camera_setup: e.target.value})}
                        />
                    </section>
                  </div>
                )}

                {activeTab === 'marketing' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[40px] flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <Zap className="text-rose-500" fill="currentColor" size={32} />
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tight">Viral Machine</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Optimizando retención</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => openAIPrompt('hook_variations', 'Viralidad')}
                                className="h-12 px-8 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 transition-all"
                            >Generar Hooks con IA</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {form.hook_variations.length > 0 ? form.hook_variations.map((v, i) => (
                                <div key={i} className={`p-8 rounded-[32px] border transition-all cursor-pointer ${v.selected ? 'bg-rose-50/10 border-rose-500/40 shadow-xl' : 'bg-card border-border'}`} onClick={() => {
                                    const newVars = form.hook_variations.map((h, idx) => ({ ...h, selected: idx === i }));
                                    setForm({ ...form, hook_variations: newVars });
                                }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-[10px] font-black">{i+1}</div>
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Variación Hook</span>
                                    </div>
                                    <p className="text-sm font-bold leading-relaxed">{v.content}</p>
                                </div>
                            )) : (
                                <div className="col-span-2 py-20 text-center bg-card rounded-[40px] border-2 border-dashed border-border flex flex-col items-center">
                                    <Zap size={40} className="text-muted-foreground mb-4 opacity-20" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Sin variaciones generadas aún</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>

        {/* Floating Mobile Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-2xl border-t border-border flex items-center justify-around px-2 lg:hidden z-50">
          {[
            { id: 'guion', icon: <Type size={20} />, label: 'Guión' },
            { id: 'marketing', icon: <Zap size={20} />, label: 'Viral' },
            { id: 'produccion', icon: <ImageIcon size={20} />, label: 'Docs' },
            { id: 'distribucion', icon: <ShareIcon size={20} />, label: 'Post' },
            { id: 'references', icon: <LinkIcon size={20} />, label: 'Ref' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const isAllowed = getTabStatus(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => isAllowed && setActiveTab(tab.id)}
                disabled={!isAllowed}
                className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-all ${
                  isActive ? 'text-primary scale-110' : isAllowed ? 'text-muted-foreground' : 'opacity-20 grayscale'
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-black uppercase tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {showDeleteScriptConfirm && (
        <ConfirmModal 
          title="¿Destruir Guión?"
          message="Esta acción borrará permanentemente el guión y todo su material."
          confirmLabel="¡Sí, borrar!"
          onConfirm={confirmDeleteScript}
          onCancel={() => setShowDeleteScriptConfirm(false)}
          destructive
        />
      )}

      {showTeleprompter && (
        <Teleprompter 
          text={form.master_draft} 
          onClose={() => setShowTeleprompter(false)} 
        />
      )}
    </div>
  );
}
